from flask import Blueprint, request, jsonify, url_for
from app import db
from app.models import Listings
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
from werkzeug.utils import secure_filename

listing_bp = Blueprint('listing', __name__)

ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'mp4', 'avi', 'mov']
UPLOADS_DIR = './app/static/listing-images'

os.makedirs(UPLOADS_DIR, exist_ok=True)

def is_valid_filename(filename):
    if '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS :
        return True 
    else: 
        return False 

@listing_bp.route('/create', methods=['POST'])
@jwt_required()
def create_listing():
    try:
        data = request.form.to_dict()
        user_id = get_jwt_identity()

        images = []

        if 'images' in request.files:
            uploaded_images = request.files.getlist('images')
            for image in uploaded_images:
                if image and is_valid_filename(image.filename):
                    filename = secure_filename(image.filename)
                    file_path = os.path.join(UPLOADS_DIR, filename)
                    image.save(file_path)
                    images.append(file_path)
                else:
                    return jsonify ({"error": "Image file path is not valid"}), 400

        listing = Listings(
            user_id = user_id,
            item_name = data["item"],
            description = data['description'],
            price = data["price"],
            condition = data['condition'],
            category = data['category'],
            university = data['university'],
            images = images, 
        )

        db.session.add(listing)
        db.session.commit()

        return jsonify({"message": "Listing created successfully"}), 200
    
    except Exception as e:
        print(f'An error occured while trying to register listing: {e}')
        return jsonify({"error":"An error occured while trying to register listing"}), 500

@listing_bp.route('/show-all', methods=["GET"])
@jwt_required()
def show_listings():
    try:
        listings = Listings.query.all()
        listing_display = []

        for listing in listings:
            listing_info = {
                'listing_id': listing.listing_id,
                'item_name': listing.item_name,
                'description': listing.description,
                'price': listing.price,
                'created_at': listing.created_at,
                'condition': listing.condition,
                'category': listing.category,
                'university': listing.university,
                'user_id': listing.user_id
            }

            if listing.images:
                image_urls = []
                number_of_images = len(listing.images)
                for i in range(number_of_images):
                    image_url = url_for('static', filename=f'listing-images/{listing.images[i].rsplit('/', 1)[1]}')
                    image_urls.append(image_url) 
            
                listing_info['image_urls'] = image_urls
            listing_display.append(listing_info)
        
        return jsonify(listing_display), 200
    
    except Exception as e:
        print(f'An error occured while trying to show listings:{e}')
        return jsonify({"error":"An error occured while trying to show listings"}), 500
    
@listing_bp.route('/show-individual-listings', methods=["GET"])
@jwt_required()
def show_individual_listings():
    try:
        user_id = get_jwt_identity()
        listings = Listings.query.filter_by(user_id=user_id).all()
        listing_display = []

        for listing in listings:
            listing_info = {
                'listing_id': listing.listing_id,
                'item_name': listing.item_name,
                'description': listing.description,
                'price': listing.price,
                'created_at': listing.created_at,
                'condition': listing.condition,
                'category': listing.category,
                'university': listing.university,
                'user_id': listing.user_id
            }

            if listing.images:
                image_urls = []
                number_of_images = len(listing.images)
                for i in range(number_of_images):
                    image_url = url_for('static', filename=f'listing-images/{listing.images[i].rsplit('/', 1)[1]}')
                    image_urls.append(image_url) 
            
                listing_info['image_urls'] = image_urls
            listing_display.append(listing_info)
        
        return jsonify(listing_display), 200
    
    except Exception as e:
        print(f'An error occured while trying to show user listings:{e}')
        return jsonify({"error":"An error occured while trying to show user listings"}), 500
    
@listing_bp.route('/show/<int:listing_id>', methods=['GET'])
@jwt_required()
def show_listing(listing_id):
    try:
        listing = Listings.query.get_or_404(listing_id)

        listing_info = {
            'listing_id': listing.listing_id,
            'item_name': listing.item_name,
            'description': listing.description,
            'price': listing.price,
            'created_at': listing.created_at,
            'condition': listing.condition,
            'category': listing.category,
            'university': listing.university,
            'user_id': listing.user_id
        }

        if listing.images:
            image_urls = []
            number_of_images = len(listing.images)
            for i in range(number_of_images):
                image_url = url_for('static', filename=f'listing-images/{listing.images[i].rsplit('/', 1)[1]}')
                image_urls.append(image_url) 
            
            listing_info['image_urls'] = image_urls
        
        return jsonify(listing_info), 200
    
    except Exception as e:
        print(f'An error occured while trying to show listing:{e}')
        return jsonify({"error":"An error occured while trying to show listing"}), 500
    
@listing_bp.route('/update-info/<int:listing_id>', methods=['PUT'])
@jwt_required()
def update_listing(listing_id):
    try:
        data = request.get_json()

        listing = Listings.query.get_or_404(listing_id)

        user_id = get_jwt_identity()
        if listing.user_id != user_id:
            return jsonify({"error": "You do not have permission to update this listing"}), 403

        listing.item_name = data.get('item_name',listing.item_name)
        listing.description = data.get('description',listing.description)
        listing.price = data.get('price',listing.price)
        listing.condition = data.get('condition',listing.condition)
        listing.category = data.get('category',listing.category)
        listing.university = data.get('university',listing.university)

        db.session.commit()

        return jsonify({"message": "Listing updated successfully"}), 200
    
    except Exception as e:
        print(f'An error occured while trying to update listing:{e}')
        return jsonify({"error":"An error occured while trying to update listing"}), 500

@listing_bp.route('/delete/<int:listing_id>', methods=["DELETE"])
@jwt_required()
def delete_listing(listing_id):
    try:
        listing = Listings.query.get_or_404(listing_id)

        user_id = get_jwt_identity()
        if listing.user_id != user_id:
            return jsonify({"error": "You do not have permission to delete this listing"}), 403
        
        db.session.delete(listing)
        db.session.commit()

        listings = Listings.query.all()
        listing_display = []

        for listing in listings:
            listing_info = {
                'listing_id': listing.listing_id,
                'item_name': listing.item_name,
                'description': listing.description,
                'price': listing.price,
                'created_at': listing.created_at,
                'condition': listing.condition,
                'category': listing.category,
                'university': listing.university,
                'user_id': listing.user_id
            }

            if listing.images:
                image_urls = []
                number_of_images = len(listing.images)
                for i in range(number_of_images):
                    image_url = url_for('static', filename=f'listing-images/{listing.images[i].rsplit('/', 1)[1]}')
                    image_urls.append(image_url) 
            
                listing_info['image_urls'] = image_urls
            listing_display.append(listing_info)

        return jsonify(
            {
                "message": "Listing deleted successfully",
                "listings": listing_display
            }
        ), 200

    except Exception as e:
        print(f'An error occured while trying to delete listing: {e}')
        return jsonify({"error":"An error occured while trying to delete listing"}), 500

@listing_bp.route('/add-images/<int:listing_id>', methods=["PUT"])
@jwt_required()
def add_images(listing_id):
    try: 
        data = request.form.to_dict()

        listing = Listings.query.get_or_404(listing_id)
        existing_images = listing.images

        user_id = get_jwt_identity()
        if listing.user_id != user_id:
            return jsonify({"error": "You do not have permission to add images to this listing"}), 403
        
        new_images = []
        
        if 'images' in request.files:
            uploaded_images = request.files.getlist('images')
            for image in uploaded_images:
                if image and is_valid_filename(image.filename):
                    filename = secure_filename(image.filename)
                    file_path = os.path.join(UPLOADS_DIR, filename)
                    image.save(file_path)
                    new_images.append(file_path)
                else:
                    return jsonify({"error": "Image file path is not valid"}), 400            
        else:
            return jsonify({"error": "No images uploaded"}), 400
        
        updated_images = existing_images + new_images
        listing.images = updated_images

        db.session.commit()
        
        return jsonify({"message": "Images added successfully"}), 200

    except Exception as e:
        print(f'An error occured while trying to add images: {e}')
        return jsonify({"error":"An error occured while trying to add images"}), 500
    
@listing_bp.route('/delete-images/<int:listing_id>', methods=["DELETE"])
@jwt_required()
def delete_images(listing_id):
    try:
        data = request.get_json()
        delete_images = data["images"]
        delete_request = []

        for img in delete_images:
            file_path = os.path.join(UPLOADS_DIR, img)
            delete_request.append(file_path)

        listing = Listings.query.get_or_404(listing_id)
        existing_images = listing.images

        upated_images = []

        for image in existing_images:
            if image not in delete_request:
                upated_images.append(image)

        listing.images = upated_images

        db.session.commit()

        return jsonify({"message": "Images deleted successfully"}), 200

    except Exception as e:
        print(f'An error occured while trying to delete images: {e}')
        return jsonify({"error":"An error occured while trying to delete images"}), 500
        