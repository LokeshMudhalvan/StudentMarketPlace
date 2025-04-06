-- Table for user creation 

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,  
    university VARCHAR(100),  
    profile_picture VARCHAR(255),  
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for furniture/book listings 

CREATE TABLE listings (
    listing_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id),
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    condition VARCHAR(50),  
    category VARCHAR(100), 
    university VARCHAR(100), 
    images JSONB, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for chats between users 

CREATE TABLE chats (
    chat_id SERIAL PRIMARY KEY,
    listing_id INT NOT NULL REFERENCES listings(listing_id),
    sender_id INT NOT NULL REFERENCES users(user_id),
    receiver_id INT NOT NULL REFERENCES users(user_id),
    status VARCHAR(20) DEFAULT 'sent',
    media_url VARCHAR(200),
    deleted BOOLEAN DEFAULT FALSE,
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for all the placed bids 

CREATE TABLE bids (
    bid_id SERIAL PRIMARY KEY,
    listing_id INT NOT NULL REFERENCES listings(listing_id),
    user_id INT NOT NULL REFERENCES users(user_id),
    bid_amount DECIMAL(10, 2) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for all the saved listings 

CREATE TABLE saved_listings (
    saved_listing_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id),
    listing_id INT NOT NULL REFERENCES listings(listing_id),
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to store notifications 

CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id),
    message TEXT NOT NULL,
    read_status BOOLEAN DEFAULT FALSE, 
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


