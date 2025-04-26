from flask import Blueprint, jsonify
from app import db
from app.models import Users
from flask_jwt_extended import jwt_required, get_jwt_identity

user_bp = Blueprint('user', __name__)

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