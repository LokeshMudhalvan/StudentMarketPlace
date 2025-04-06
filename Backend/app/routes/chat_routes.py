from flask import Blueprint, request, jsonify
from app import db, socketio
from app.models import Chats
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
from werkzeug.utils import secure_filename
from flask_socketio import send, join_room, leave_room
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

        media_url = []

        if 'media' in request.files:
            uploaded_media = request.files.getlist('media')
            for media in uploaded_media:
                if media and is_valid_filename(media):
                    filename = secure_filename(media.filename)
                    media_url = os.path.join(CHATS_DIR, filename)
                    media.save(media_url)

        new_message = Chats(
            message=message,
            sender_id=sender_id,
            receiver_id=receiver_id,
            listing_id=listing_id,
            media_url=media_url 
        )

        db.session.add(new_message)
        db.session.commit()

        socketio.emit('new_message', {'message': message, 'sender_id': sender_id, 'media_url': media_url}, room=receiver_id)

        return jsonify({"message": "Message sent successfully"}), 200
    
    except Exception as e:
        print(f'An error occured while trying to send message: {e}')
        return jsonify({"error":"An error occured while trying to send message"}), 500

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
            (Chats.listing_id == listing_id) and
            (
                (Chats.sender_id == user_id and Chats.receiver_id == other_user_id) or 
                (Chats.sender_id == other_user_id and Chats.receiver_id == user_id)
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
    

@socketio.on('connect')
def handle_connect():
    try:
        user_id = get_jwt_identity()
        join_room(str(user_id))
        print(f"User {user_id} connected and joined room {user_id}")
    except Exception as e:
        print(f"Anonymous connection established: {e}")

@socketio.on('disconnect')
def handle_disconnect():
    try:
        user_id = get_jwt_identity()
        leave_room(str(user_id))
        print(f"User {user_id} disconnected")
    except Exception as e:
        print(f"Anonymous user disconnected: {e}")

@socketio.on('new_message')
def handle_new_message(data):
    print(f"New message from {data['sender_id']}: {data['message']}")

