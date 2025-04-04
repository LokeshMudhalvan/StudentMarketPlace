from flask import Flask 
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS 
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from app.routes.auth_routes import auth_bp
from app.routes.user_routes import user_bp
from app.routes.listing_routes import listing_bp
from app.routes.bid_routes import bid_bp
from app.routes.chat_routes import chat_bp
from app.routes.saved_routes import saved_bp
from app.routes.notify_routes import notify_bp
from config import Config

db = SQLAlchemy()
jwt = JWTManager()
socketio = SocketIO(cors_allowed_origins="*")

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)
    db.init_app(app)
    jwt.init_app(app)
    socketio.init_app(app)

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(user_bp, url_prefix='/users')
    app.register_blueprint(listing_bp, url_prefix='/listings')
    app.register_blueprint(bid_bp, url_prefix='/bids')
    app.register_blueprint(chat_bp, url_prefix='/chat')
    app.register_blueprint(saved_bp, url_prefix='/saved')
    app.register_blueprint(notify_bp, url_prefix='/notifications')

    return app 