from flask import Blueprint, request, jsonify
from app import db
from app.models import SavedListings
from flask_jwt_extended import jwt_required, get_jwt_identity

saved_bp = Blueprint('saved', __name__)

@saved_bp.route('/save-listing/<int:listing_id>', methods=["POST"])
@jwt_required()
def save_listing(listing_id):
    try:
        user_id = get_jwt_identity()    

        existing = SavedListings.query.filter_by(user_id=user_id, listing_id=listing_id).first()
        if existing:
            return jsonify({"error": "Listing already exists"}), 400
        
        saved_listing = SavedListings (
            listing_id = listing_id,
            user_id = user_id
        )

        db.session.add(saved_listing)
        db.session.commit()

        return jsonify({"message": "Listing saved successfully"}), 200
    
    except Exception as e: 
        print(f'An error occured while trying to save a listing: {e}')
        return jsonify({"error":"An error occured while trying to save a listing"}), 500
    
@saved_bp.route('/unsave-listing/<int:listing_id>', methods=["DELETE"])
@jwt_required()
def unsave_listing(listing_id):
    try:
        user_id = get_jwt_identity()    

        existing = SavedListings.query.filter_by(user_id=user_id, listing_id=listing_id).first()
        if not existing:
            return jsonify({"error": "Listing does not exist"}), 400
        
        db.session.delete(existing)
        db.session.commit()

        return jsonify({"message": "Listing unsaved successfully"}), 200
    
    except Exception as e: 
        print(f'An error occured while trying to unsave a listing: {e}')
        return jsonify({"error":"An error occured while trying to unsave a listing"}), 500
    