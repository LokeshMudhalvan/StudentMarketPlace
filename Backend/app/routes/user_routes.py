from flask import Blueprint, jsonify, request, url_for
from app import db
from app.models import Users
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
from werkzeug.utils import secure_filename
from app.routes.listing_routes import is_valid_filename

user_bp = Blueprint('user', __name__)

USER_DIR = './app/static/profile-pics'

os.makedirs(USER_DIR, exist_ok=True)

@user_bp.route('/university-name', methods=["GET"])
@jwt_required()
def get_user_university():
    try:
        user_id = get_jwt_identity()

        user = Users.query.filter_by(user_id=user_id).first()
        if user.university:
            university = user.university
        else:
            university = "Unknown"

        return jsonify({"university": university}), 200
    
    except Exception as e:
        print(f'An error occured while trying to fetch user university:{e}')
        return jsonify({"error":"An error occured while trying to fetch user university"}), 500
    
@user_bp.route('/user-id', methods=["GET"])
@jwt_required()
def get_user_id():
    try:
        user_id = get_jwt_identity()

        return jsonify(user_id), 200

    except Exception as e:
        print(f'An error occured while trying to fetch user id:{e}')
        return jsonify({"error":"An error occured while trying to fetch user id"}), 500
    
@user_bp.route('/update-user', methods=["PUT"])
@jwt_required()
def update_user():
    try:
        user_id = get_jwt_identity()
        user = Users.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        name = request.form.get('name')
        email = request.form.get('email')
        profile_pic = request.files.get('profile_pic')

        if name:
            user.name = name
        if email:
            user.email = email
        if profile_pic and is_valid_filename(profile_pic.filename):
            filename = secure_filename(profile_pic.filename)
            pic_path = os.path.join(USER_DIR, filename)
            profile_pic.save(pic_path)
            user.profile_picture = pic_path 

        db.session.commit()

        return jsonify({"message": "User updated successfully"}), 200

    except Exception as e:
        print(f"An error occurred while trying to update user: {e}")
        return jsonify({"error":"An error occurred while trying to update user"}), 500
    
@user_bp.route('/profile-picture', methods=["GET"])
@jwt_required()
def get_profile_picture():
    try:
        user_id = get_jwt_identity()
        user = Users.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        if user.profile_picture and os.path.exists(user.profile_picture):
            filename = os.path.basename(user.profile_picture)
            profile_pic_url = url_for('static', filename=f'profile-pics/{filename}')
            return jsonify({"profile_picture_url": profile_pic_url}), 200
        else:
            return jsonify({"error": "No profile picture found"}), 404

    except Exception as e:
        print(f"Error while getting profile picture: {e}")
        return jsonify({"error": "An error occurred while fetching the profile picture"}), 500

