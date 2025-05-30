from flask import Blueprint, request, jsonify, url_for
from app import db
from app.models import SavedListings, Listings
from flask_jwt_extended import jwt_required, get_jwt_identity

saved_bp = Blueprint('saved', __name__)

@saved_bp.route('/save-listing/<int:listing_id>', methods=["POST"])
@jwt_required()
def save_listing(listing_id):
    try:
        user_id = get_jwt_identity()    

        existing = SavedListings.query.filter_by(user_id=user_id, listing_id=listing_id).first()
        if existing:
            db.session.delete(existing)
            db.session.commit()

            return jsonify({"message": "Listing unsaved successfully"}), 200
        
        saved_listing = SavedListings (
            listing_id = listing_id,
            user_id = user_id
        )

        db.session.add(saved_listing)
        db.session.commit()

        return jsonify({"message": "Listing saved successfully"}), 200
    
    except Exception as e: 
        print(f'An error occured while trying to save/unsave a listing: {e}')
        return jsonify({"error":"An error occured while trying to save/unsave a listing"}), 500
    
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
    
@saved_bp.route('/show-saved-listings', methods=["GET"])
@jwt_required()
def show_saved_listings():
    try: 
        user_id = get_jwt_identity()
        """total_listings = SavedListings.query.filter_by(user_id=user_id).count()
        limit = 12
        offset = (current_page - 1) * 12 

        listing_query = SavedListings.query.filter_by(user_id=user_id).offset(offset).limit(limit)"""
        save_listings = SavedListings.query.join(Listings).filter(SavedListings.user_id == user_id).order_by(Listings.created_at.desc()).all()

        saved_listings = []
        for listing in save_listings:
            listing_info = Listings.query.get_or_404(listing.listing_id)
            listing_data = {
                'listing_id': listing_info.listing_id,
                'item_name': listing_info.item_name,
                'description': listing_info.description,
                'price': listing_info.price,
                'created_at': listing_info.created_at,
                'condition': listing_info.condition,
                'category': listing_info.category,
                'university': listing_info.university,
                'user_id': listing_info.user_id
                }

            if listing_info.images:
                image_urls = []
                number_of_images = len(listing_info.images)
                for i in range(number_of_images):
                    image_url = url_for('static', filename=f'listing-images/{listing_info.images[i].rsplit('/', 1)[1]}')
                    image_urls.append(image_url) 
                    
                listing_data['image_urls'] = image_urls

            saved_listings.append(listing_data)

        return jsonify({
            "saved_listings": saved_listings
            }), 200

    except Exception as e: 
        print(f'An error occured while trying to show all saved listing: {e}')
        return jsonify({"error":"An error occured while trying to show all saved listing"}), 500
    
@saved_bp.route('/show-saved-listings/<int:current_page>', methods=["GET"])
@jwt_required()
def fetch_saved_listings(current_page):
    try: 
        user_id = get_jwt_identity()
        total_listings = SavedListings.query.filter_by(user_id=user_id).count()
        limit = 12
        offset = (current_page - 1) * 12 

        listing_query = SavedListings.query.join(Listings).filter(SavedListings.user_id == user_id).order_by(Listings.created_at.desc()).offset(offset).limit(limit)
        save_listings = listing_query.all()

        saved_listings = []
        for listing in save_listings:
            listing_info = Listings.query.get_or_404(listing.listing_id)
            listing_data = {
                'listing_id': listing_info.listing_id,
                'item_name': listing_info.item_name,
                'description': listing_info.description,
                'price': listing_info.price,
                'created_at': listing_info.created_at,
                'condition': listing_info.condition,
                'category': listing_info.category,
                'university': listing_info.university,
                'user_id': listing_info.user_id
                }

            if listing_info.images:
                image_urls = []
                number_of_images = len(listing_info.images)
                for i in range(number_of_images):
                    image_url = url_for('static', filename=f'listing-images/{listing_info.images[i].rsplit('/', 1)[1]}')
                    image_urls.append(image_url) 
                    
                listing_data['image_urls'] = image_urls

            saved_listings.append(listing_data)

        return jsonify({
            "saved_listings": saved_listings,
            "total_listings": total_listings
            }), 200

    except Exception as e: 
        print(f'An error occured while trying to show all saved listing: {e}')
        return jsonify({"error":"An error occured while trying to show all saved listing"}), 500