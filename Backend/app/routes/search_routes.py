from flask import Blueprint, request, jsonify, url_for
from app import db
from app.models import Listings
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import and_, or_

search_bp = Blueprint('search', __name__)

@search_bp.route('/', methods=["GET"])
@jwt_required()
def search_listing():
    user_id = get_jwt_identity()

    try:
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        university = request.args.get('university', type=str)
        item_name = request.args.get('item_name', type=str)
        categories = request.args.getlist('category') 
        condition = request.args.get('condition', type=str)

        query = Listings.query

        filters = []

        if min_price is not None and max_price is not None:
            filters.append(Listings.price.between(min_price, max_price))
        elif min_price is not None:
            filters.append(Listings.price >= min_price)
        elif max_price is not None:
            filters.append(Listings.price <= max_price)

        if university:
            filters.append(Listings.university.ilike(f"%{university}%"))

        if item_name:
            filters.append(Listings.item_name.ilike(f"%{item_name}%"))

        if condition:
            filters.append(Listings.condition.ilike(f"%{condition}%"))

        if categories:
            filters.append(or_(*[Listings.category.ilike(category) for category in categories]))

        results = query.filter(and_(*filters)).order_by(Listings.created_at.desc()).all()

        listings_data = []
        for listing in results:
            if user_id != listing.user_id:
                listing_info = {
                    "listing_id": listing.listing_id,
                    "user_id": listing.user_id,
                    "item_name": listing.item_name,
                    "description": listing.description,
                    "price": listing.price,
                    "condition": listing.condition,
                    "category": listing.category,
                    "university": listing.university,
                    "created_at": listing.created_at,
                }
                
                if listing.images:
                    image_urls = []
                    number_of_images = len(listing.images)
                    for i in range(number_of_images):
                        image_url = url_for('static', filename=f'listing-images/{listing.images[i].rsplit('/', 1)[1]}')
                        image_urls.append(image_url) 
            
                    listing_info['image_urls'] = image_urls
                listings_data.append(listing_info)
            else: 
                pass

        return jsonify({"results": listings_data}), 200

    except Exception as e:
        print(f'An error occurred while trying to search listing: {e}')
        return jsonify({"error": "An error occurred while trying to search listing"}), 500
