from app import db 
from datetime import datetime 

class User(db.Model):
    user_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False) 
    password_hash = db.Column(db.String(255), nullable=False)  
    university = db.Column(db.String(100))  
    profile_picture = db.Column(db.String(255))  
    created_at = db.Column(db.DateTime, default=datetime.utcnow) 
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Listing(db.Model):
    listing_id = db.Column(db.Integer, primary_key=True) 
    item_name = db.Column(db.String(255), nullable=False)  
    description = db.Column(db.Text)  
    price = db.Column(db.Float, nullable=False)  
    condition = db.Column(db.String(50))  
    category = db.Column(db.String(100))  
    university = db.Column(db.String(100))  
    images = db.Column(db.JSON) 
    created_at = db.Column(db.DateTime, default=datetime.utcnow)  
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow) 

    user_id = db.Column(db.Integer, db.ForeignKey('user.user_id'), nullable=False)

class ChatMessage(db.Model):
    chat_id = db.Column(db.Integer, primary_key=True)  
    message = db.Column(db.Text, nullable=False) 
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)  

    sender_id = db.Column(db.Integer, db.ForeignKey('user.user_id'), nullable=False)  
    receiver_id = db.Column(db.Integer, db.ForeignKey('user.user_id'), nullable=False)  
    listing_id = db.Column(db.Integer, db.ForeignKey('listing.listing_id'), nullable=False)

class Bid(db.Model):
    bid_id = db.Column(db.Integer, primary_key=True)  
    bid_amount = db.Column(db.Float, nullable=False)  
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)  

    user_id = db.Column(db.Integer, db.ForeignKey('user.user_id'), nullable=False)  
    listing_id = db.Column(db.Integer, db.ForeignKey('listing.listing_id'), nullable=False)  

class SavedListing(db.Model):
    saved_listing_id = db.Column(db.Integer, primary_key=True)  
    saved_at = db.Column(db.DateTime, default=datetime.utcnow) 

    user_id = db.Column(db.Integer, db.ForeignKey('user.user_id'), nullable=False)  
    listing_id = db.Column(db.Integer, db.ForeignKey('listing.listing_id'), nullable=False)

class Notification(db.Model):
    notification_id = db.Column(db.Integer, primary_key=True)  
    message = db.Column(db.Text, nullable=False) 
    read_status = db.Column(db.Boolean, default=False)  
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)  

    user_id = db.Column(db.Integer, db.ForeignKey('user.user_id'), nullable=False) 

