from flask import Blueprint, request, jsonify
from app import db
from app.models import Users
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=["POST"])
def register():
    try:
        data = request.get_json()
        if not data['username'] or not data['email'] or not data['password']:
            return jsonify({"error":"Fill in the required fields (Name, Email and Password)"}), 401
        
        hashed_password = generate_password_hash(data["password"], method='pbkdf2:sha256')

        if Users.query.filter_by(email=data['email']).first():
            return jsonify({"error":"User exists already"}), 400
        
        user = Users(
            name=data['username'], 
            email=data['email'], 
            password_hash=hashed_password, 
            university=data['university'] if data['university'] else 'None'
        )
        
        db.session.add(user)
        db.session.commit()

        return jsonify({"message": "User registered successfully"}), 200
    
    except Exception as e:
        print(f'An error occured while trying to register:{e}')
        return jsonify({"error":"An error occured while trying to register"}), 500

@auth_bp.route('/login', methods=["POST"])
def login():
    try:
        data = request.get_json()
        if not data['email'] or not data['password']:
            return jsonify({"error": "Email and Password are required fields"}), 401
        
        user = Users.query.filter_by(email=data['email']).first()

        if user and check_password_hash(user.password_hash, data['password']):
            access_token = create_access_token(user.user_id)
            return jsonify(
                {"access_token": access_token,
                  "message": "Login successfull"
                }
            ), 200

        return jsonify({"error": "Invalid credentials"}), 401
    
    except Exception as e:
        print(f'An error occured while trying to login:{e}')
        return jsonify({"error":"An error occured while trying to login"}), 500
    
@auth_bp.route('/verify', methods=["GET"])
@jwt_required()
def verify_token():
    try:
        user = get_jwt_identity()
        return jsonify({'valid': True, 'user': user}), 200
    except Exception as e:
        return jsonify({'valid': False, 'error': str(e)}), 401