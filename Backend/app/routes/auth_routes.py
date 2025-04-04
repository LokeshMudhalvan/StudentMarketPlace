from flask import Blueprint, request, jsonify
from app import db
from app.models import Users
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=["POST"])
def register():
    try:
        print('Entering register')
        data = request.get_json()
        hashed_password = generate_password_hash(data["password"], method='pbkdf2:sha256')
        if Users.query.filter_by(email=data['email']).first():
            return jsonify({"error":"User exists already"}), 400
        user = Users(name=data['username'], email=data['email'], password_hash=hashed_password, university=data['university'])
        db.session.add(user)
        db.session.commit()

        return jsonify({"message": "User registered successfully"}), 201
    
    except Exception as e:
        print(f'An error occured while trying to register:{e}')
        return jsonify({"error":"An error occured while trying to register"}), 400

@auth_bp.route('/login', methods=["POST"])
def login():
    try:
        print('Entering Login')
        data = request.get_json()
        user = Users.query.filter_by(email=data['email']).first()

        if user and check_password_hash(user.password_hash, data['password']):
            access_token = create_access_token(user.user_id)
            return jsonify(access_token=access_token), 200

        return jsonify({"error": "Invalid credentials"}), 401
    
    except Exception as e:
        print(f'An error occured while trying to login:{e}')
        return jsonify({"error":"An error occured while trying to login"}), 400