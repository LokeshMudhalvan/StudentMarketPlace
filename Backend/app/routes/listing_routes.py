from flask import Blueprint, request, jsonify, url_for
from app import db
from app.models import Listings
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
from werkzeug.utils import secure_filename

listing_bp = Blueprint('listing', __name__)

ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg']
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

        return jsonify({"message": "Listing created successfully"}), 201
    
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
        return jsonify({"error":"An error occured while trying to show listing"}), 500