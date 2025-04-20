from flask import Blueprint, request, jsonify
from sqlalchemy import or_, and_
from app import db, socketio
from app.models import Chats, Users, Listings
from sqlalchemy.orm import joinedload
from sqlalchemy import or_, and_, func
from flask_jwt_extended import jwt_required, get_jwt_identity, decode_token
import os
from werkzeug.utils import secure_filename
from flask_socketio import send, join_room, leave_room, disconnect
from .listing_routes import is_valid_filename

chat_bp = Blueprint('chat', __name__)
CHATS_DIR = './app/static/chat-media'

os.makedirs(CHATS_DIR, exist_ok=True)

@chat_bp.route('/send-message', methods=['POST'])
@jwt_required()
def send_message():
    try:
        data = request.form.to_dict()

        sender_id = get_jwt_identity()
        listing_id = data["listing_id"]
        receiver_id = data["receiver_id"]
        message = data["message"]

        # Initialize as empty array
        media_urls = []

        if 'media' in request.files:
            uploaded_media = request.files.getlist('media')
            for media in uploaded_media:
                if media and is_valid_filename(media):
                    filename = secure_filename(media.filename)
                    media_path = os.path.join(CHATS_DIR, filename)
                    media.save(media_path)
                    # Add relative path to array
                    media_urls.append(f"/static/chat-media/{filename}")

        new_message = Chats(
            message=message,
            sender_id=sender_id,
            receiver_id=receiver_id,
            listing_id=listing_id,
            media_url=media_urls  # Store as array consistently
        )

        db.session.add(new_message)
        db.session.commit()

        socketio.emit('new_message', {
            'message': message,
            'sender_id': int(sender_id),  # Ensure consistent typing
            'receiver_id': int(receiver_id),
            'listing_id': int(listing_id),
            'media_url': media_urls,  # Always an array
            'timestamp': new_message.timestamp.isoformat(),
            'status': 'sent',
            'deleted': False,
            'chat_id': new_message.chat_id  # Include ID for updates
        }, room=str(receiver_id))  # Ensure room is string

        return jsonify({"message": "Message sent successfully"}), 200
    
    except Exception as e:
        print(f'An error occurred while trying to send message: {e}')
        return jsonify({"error":"An error occurred while trying to send message"}), 500

@chat_bp.route('/update-message-status', methods=['PUT'])
@jwt_required()
def update_message_status():
    try:
        data = request.get_json()
        chat_id = data['chat_id']
        new_status = data['status'] 

        message = Chats.query.get_or_404(chat_id)
        message.status = new_status
        db.session.commit()

        return jsonify({"message": "Message status updated successfully"}), 200
    
    except Exception as e:
        print(f'An error occured while trying to update message status: {e}')
        return jsonify({"error":"An error occured while trying to update message status"}), 500

@chat_bp.route('/delete-message/<int:message_id>', methods=['DELETE'])
@jwt_required()
def delete_message(message_id):
    try:
        message = Chats.query.get_or_404(message_id)

        user_id = get_jwt_identity()
        if message.sender_id != user_id:
            return jsonify({"error": "You cannot delete someone else's message"}), 403
        
        message.deleted = True

        db.session.commit()

        return jsonify({"message": "Message deleted successfully"}), 200

    except Exception as e:
        print(f'An error occured while trying to delete message: {e}')
        return jsonify({"error":"An error occured while trying to delete message"}), 500
    
@chat_bp.route('/get-messages/<int:listing_id>', methods=['GET'])
@jwt_required()
def get_messages(listing_id):
    try:
        user_id = get_jwt_identity()
        other_user_id = int(request.args.get('other_user_id'))  
        
        if not other_user_id:
            return jsonify({"error": "Other user ID is required"}), 400
        
        messages = Chats.query.filter(
            and_(
                Chats.listing_id == listing_id,
                or_(
                    and_(Chats.sender_id == user_id, Chats.receiver_id == other_user_id),
                    and_(Chats.sender_id == other_user_id, Chats.receiver_id == user_id)
                )
            )
        ).all()

        all_messages = []

        for message in messages:
            formatted_message = {
                'message': message.message,
                'timestamp': message.timestamp,
                'status': message.status,
                'media_url': message.media_url,
                'sender_id': message.sender_id,
                'receiver_id': message.receiver_id,
                'deleted': message.deleted
            }

            all_messages.append(formatted_message)

        return jsonify({"messages": all_messages}), 200
    except Exception as e:
        print(f'An error occured while trying to fetch messages: {e}')
        return jsonify({"error":"An error occured while trying to fetch messages"}), 500
    
@chat_bp.route('/show-all', methods=["GET"])
@jwt_required()
def get_all_chats():
    try:
        user_id = get_jwt_identity()

        subquery = (
            db.session.query(
                func.max(Chats.chat_id).label("latest_chat_id")
            )
            .filter(
                or_(
                    Chats.sender_id == user_id,
                    Chats.receiver_id == user_id
                )
            )
            .group_by(
                Chats.listing_id,
                func.least(Chats.sender_id, Chats.receiver_id),
                func.greatest(Chats.sender_id, Chats.receiver_id)
            )
            .subquery()
        )

        latest_chats = (
            db.session.query(Chats)
            .join(subquery, Chats.chat_id == subquery.c.latest_chat_id)
            .options(
                joinedload(Chats.listing),
                joinedload(Chats.sender),
                joinedload(Chats.receiver)
            )
            .all()
        )

        results = []
        for chat in latest_chats:
            other_user = chat.receiver if chat.sender_id == user_id else chat.sender
            listing = chat.listing

            results.append({
                "chat_id": chat.chat_id,
                "listing_id": listing.listing_id,
                "item_name": listing.item_name,
                "seller_id": listing.user_id,
                "buyer_id": other_user.user_id,
                "user_name": other_user.name,
            })

        return jsonify(results), 200

    except Exception as e:
        print(f"An error occurred while showing all messages: {e}")
        return jsonify({"error": "An error occurred while showing all messages"}), 500
    
@socketio.on('connect')
def handle_connect():
    token = request.args.get('token')
    if not token:
        disconnect()
        return False
    
    try:
        decoded_token = decode_token(token)
        user_id = decoded_token['sub'] 
        
        request.sid 
        socketio.server.save_session(request.sid, {'user_id': user_id})
        
        join_room(str(user_id))
        print(f"User {user_id} connected and joined room {user_id}")
        return True
    except Exception as e:
        print(f"Authentication failed: {e}")
        disconnect()
        return False

@socketio.on('disconnect')
def handle_disconnect():
    try:
        user_id = socketio.server.get_session(request.sid).get('user_id')
        if user_id:
            leave_room(str(user_id))
            print(f"User {user_id} disconnected")
    except Exception as e:
        print(f"Error during disconnect: {e}")

@socketio.on('new_message')
def handle_new_message(data):
    try:
        session = socketio.server.get_session(request.sid)
        user_id = session.get('user_id')
        
        if not user_id:
            return
        
        data['sender_id'] = user_id 
        print(f"New message from {user_id}: {data['message']}")

        receiver_id = data.get('receiver_id')
        if receiver_id:
            socketio.emit('new_message', data, room=str(receiver_id))
    except Exception as e:
        print(f"Error handling new message: {e}")