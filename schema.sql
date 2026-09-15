PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'buyer',
    phone TEXT,
    country TEXT DEFAULT 'Rwanda',
    district TEXT,
    avatar_url TEXT,
    bio TEXT,
    is_verified INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'RWF',
    stock INTEGER NOT NULL DEFAULT 1,
    brand TEXT,
    model TEXT,
    condition TEXT,
    country TEXT DEFAULT 'Rwanda',
    district TEXT,
    storage TEXT,
    ram TEXT,
    image_url TEXT,
    specs TEXT,
    negotiable INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    views INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    buyer_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    seller_id INTEGER,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL DEFAULT 0,
    total_price REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'RWF',
    status TEXT NOT NULL DEFAULT 'pending',
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    delivery_address TEXT,
    delivery_country TEXT,
    delivery_district TEXT,
    delivery_phone TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    product_id INTEGER,
    message TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS saved_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- =========================================================
-- ISOKOHUB MARKETPLACE CATEGORIES
-- =========================================================

INSERT OR IGNORE INTO categories (name, description, icon) VALUES
('Electronics', 'Phones, laptops and electronic devices', '📱'),
('Fashion', 'Clothes, shoes and fashion products', '👕'),
('Home', 'Home decoration and household products', '🏠'),
('Education', 'Courses, teachers and educational services', '📚'),
('Art & Creative', 'Artists, designers, photographers and creatives', '🎨'),
('Film & Entertainment', 'Filmmakers, actors, producers and entertainment', '🎬'),
('Services', 'Professional and local services', '🛠️'),
('Digital Products', 'Digital files, software, templates and online products', '💻'),
('Real Estate', 'Property, houses, apartments, land and rentals', '🏘️'),
('Transport & Delivery', 'Transport, courier, moving and delivery services', '🚗'),
('Technology & IT', 'Websites, applications, software and IT support', '🖥️'),
('Marketing & Advertising', 'Marketing, branding, social media and advertising', '📣'),
('Business & Professional', 'Business consulting and professional services', '👨‍💼'),
('Construction & Home Services', 'Construction, plumbing, electrical and home improvement', '🏗️'),
('Beauty & Personal Care', 'Hair, barber, makeup, nails and personal care', '💄'),
('Food & Catering', 'Food, catering, cakes and food businesses', '🍔'),
('Events', 'Event planning, decoration, DJs and entertainment', '🎉'),
('Jobs & Freelance', 'Jobs, freelance work and professional opportunities', '💼');

-- =========================================================
-- SEED SELLERS
-- =========================================================

INSERT OR IGNORE INTO users
(name, email, password_hash, role, phone, country, district, is_verified, is_active)
VALUES
(
    'IsokoHub Tech Seller',
    'tech@isokohub.com',
    'seed_account_no_login',
    'seller',
    '+250780000001',
    'Rwanda',
    'Gasabo',
    1,
    1
),
(
    'IsokoHub Fashion Designer',
    'fashion@isokohub.com',
    'seed_account_no_login',
    'seller',
    '+250780000002',
    'Rwanda',
    'Nyarugenge',
    1,
    1
),
(
    'IsokoHub Home Seller',
    'home@isokohub.com',
    'seed_account_no_login',
    'seller',
    '+250780000003',
    'Rwanda',
    'Kicukiro',
    1,
    1
),
(
    'IsokoHub Education Teacher',
    'education@isokohub.com',
    'seed_account_no_login',
    'seller',
    '+250780000004',
    'Rwanda',
    'Gasabo',
    1,
    1
),
(
    'IsokoHub African Artist',
    'artist@isokohub.com',
    'seed_account_no_login',
    'seller',
    '+250780000005',
    'Rwanda',
    'Nyarugenge',
    1,
    1
),
(
    'IsokoHub Creative Studio',
    'creative@isokohub.com',
    'seed_account_no_login',
    'seller',
    '+250780000006',
    'Rwanda',
    'Gasabo',
    1,
    1
),
(
    'IsokoHub Film Creator',
    'film@isokohub.com',
    'seed_account_no_login',
    'seller',
    '+250780000007',
    'Rwanda',
    'Kicukiro',
    1,
    1
),
(
    'IsokoHub Professional Services',
    'services@isokohub.com',
    'seed_account_no_login',
    'seller',
    '+250780000008',
    'Rwanda',
    'Kicukiro',
    1,
    1
);

-- =========================================================
-- SEED MARKETPLACE PRODUCTS & SERVICES
-- =========================================================

INSERT OR IGNORE INTO products
(seller_id, title, category, description, price, currency, stock, brand, model, condition, country, district, storage, ram, image_url, specs, negotiable, status)
SELECT
    u.id,
    'iPhone 15 Pro Max',
    'Electronics',
    'Premium smartphone available through IsokoHub.',
    1200000,
    'RWF',
    5,
    'Apple',
    'iPhone 15 Pro Max',
    'new',
    'Rwanda',
    'Gasabo',
    '256GB',
    '8GB',
    NULL,
    'Premium smartphone with advanced camera and performance.',
    0,
    'active'
FROM users u
WHERE u.email = 'tech@isokohub.com'
AND NOT EXISTS (
    SELECT 1 FROM products p WHERE p.title = 'iPhone 15 Pro Max'
);

INSERT OR IGNORE INTO products
(seller_id, title, category, description, price, currency, stock, condition, country, district, specs, negotiable, status)
SELECT
    u.id,
    'HP ProBook Laptop',
    'Electronics',
    'Professional laptop for work, school and business.',
    550000,
    'RWF',
    5,
    'new',
    'Rwanda',
    'Gasabo',
    'Business laptop suitable for office, education and professional use.',
    1,
    'active'
FROM users u
WHERE u.email = 'tech@isokohub.com'
AND NOT EXISTS (
    SELECT 1 FROM products p WHERE p.title = 'HP ProBook Laptop'
);

INSERT OR IGNORE INTO products
(seller_id, title, category, description, price, currency, stock, condition, country, district, specs, negotiable, status)
SELECT
    u.id,
    'African Fashion Outfit',
    'Fashion',
    'Beautiful African fashion outfit made for special occasions.',
    85000,
    'RWF',
    10,
    'new',
    'Rwanda',
    'Nyarugenge',
    'African-inspired fashion design and custom styling available.',
    1,
    'active'
FROM users u
WHERE u.email = 'fashion@isokohub.com'
AND NOT EXISTS (
    SELECT 1 FROM products p WHERE p.title = 'African Fashion Outfit'
);

INSERT OR IGNORE INTO products
(seller_id, title, category, description, price, currency, stock, condition, country, district, specs, negotiable, status)
SELECT
    u.id,
    'Home Decoration Set',
    'Home',
    'Decorative items for modern homes and offices.',
    60000,
    'RWF',
    20,
    'new',
    'Rwanda',
    'Kicukiro',
    'Home decoration set for living rooms, bedrooms and offices.',
    1,
    'active'
FROM users u
WHERE u.email = 'home@isokohub.com'
AND NOT EXISTS (
    SELECT 1 FROM products p WHERE p.title = 'Home Decoration Set'
);

INSERT OR IGNORE INTO products
(seller_id, title, category, description, price, currency, stock, country, district, specs, negotiable, status)
SELECT
    u.id,
    'Online English Course',
    'Education',
    'Online English learning course for beginners and intermediate learners.',
    30000,
    'RWF',
    100,
    'Rwanda',
    'Gasabo',
    'Online lessons with teacher support.',
    0,
    'active'
FROM users u
WHERE u.email = 'education@isokohub.com'
AND NOT EXISTS (
    SELECT 1 FROM products p WHERE p.title = 'Online English Course'
);

INSERT OR IGNORE INTO products
(seller_id, title, category, description, price, currency, stock, condition, country, district, specs, negotiable, status)
SELECT
    u.id,
    'Handmade African Art',
    'Art & Creative',
    'Handmade African artwork created by a local artist.',
    75000,
    'RWF',
    10,
    'new',
    'Rwanda',
    'Nyarugenge',
    'Handmade artwork suitable for homes, offices and gifts.',
    1,
    'active'
FROM users u
WHERE u.email = 'artist@isokohub.com'
AND NOT EXISTS (
    SELECT 1 FROM products p WHERE p.title = 'Handmade African Art'
);

INSERT OR IGNORE INTO products
(seller_id, title, category, description, price, currency, stock, country, district, specs, negotiable, status)
SELECT
    u.id,
    'Professional Photography Service',
    'Art & Creative',
    'Professional photography for weddings, events, portraits and businesses.',
    100000,
    'RWF',
    100,
    'Rwanda',
    'Gasabo',
    'Professional photography service with edited digital photos.',
    1,
    'active'
FROM users u
WHERE u.email = 'creative@isokohub.com'
AND NOT EXISTS (
    SELECT 1 FROM products p WHERE p.title = 'Professional Photography Service'
);

INSERT OR IGNORE INTO products
(seller_id, title, category, description, price, currency, stock, country, district, specs, negotiable, status)
SELECT
    u.id,
    'Film Production Service',
    'Film & Entertainment',
    'Film production services for businesses, artists, events and organizations.',
    250000,
    'RWF',
    100,
    'Rwanda',
    'Kicukiro',
    'Filming, editing, production planning and creative direction.',
    1,
    'active'
FROM users u
WHERE u.email = 'film@isokohub.com'
AND NOT EXISTS (
    SELECT 1 FROM products p WHERE p.title = 'Film Production Service'
);

INSERT OR IGNORE INTO products
(seller_id, title, category, description, price, currency, stock, country, district, specs, negotiable, status)
SELECT
    u.id,
    'Graphic Design Service',
    'Services',
    'Professional logo, poster, flyer and social media graphic design.',
    25000,
    'RWF',
    100,
    'Rwanda',
    'Kicukiro',
    'Brand identity, posters, flyers and digital graphics.',
    1,
    'active'
FROM users u
WHERE u.email = 'services@isokohub.com'
AND NOT EXISTS (
    SELECT 1 FROM products p WHERE p.title = 'Graphic Design Service'
);

INSERT OR IGNORE INTO products
(seller_id, title, category, description, price, currency, stock, country, district, specs, negotiable, status)
SELECT
    u.id,
    'Website Development Service',
    'Technology & IT',
    'Professional website development for businesses and organizations.',
    250000,
    'RWF',
    100,
    'Rwanda',
    'Gasabo',
    'Business websites, landing pages and web applications.',
    1,
    'active'
FROM users u
WHERE u.email = 'services@isokohub.com'
AND NOT EXISTS (
    SELECT 1 FROM products p WHERE p.title = 'Website Development Service'
);

INSERT OR IGNORE INTO products
(seller_id, title, category, description, price, currency, stock, country, district, specs, negotiable, status)
SELECT
    u.id,
    'Social Media Marketing Service',
    'Marketing & Advertising',
    'Social media management and digital marketing for businesses.',
    75000,
    'RWF',
    100,
    'Rwanda',
    'Kigali',
    'Social media strategy, content planning and advertising support.',
    1,
    'active'
FROM users u
WHERE u.email = 'services@isokohub.com'
AND NOT EXISTS (
    SELECT 1 FROM products p WHERE p.title = 'Social Media Marketing Service'
);

INSERT OR IGNORE INTO products
(seller_id, title, category, description, price, currency, stock, country, district, specs, negotiable, status)
SELECT
    u.id,
    'House Rental Service',
    'Real Estate',
    'Residential property rental listing.',
    250000,
    'RWF',
    1,
    'Rwanda',
    'Kicukiro',
    'Residential rental property. Contact seller for viewing and details.',
    1,
    'active'
FROM users u
WHERE u.email = 'services@isokohub.com'
AND NOT EXISTS (
    SELECT 1 FROM products p WHERE p.title = 'House Rental Service'
);

INSERT OR IGNORE INTO products
(seller_id, title, category, description, price, currency, stock, country, district, specs, negotiable, status)
SELECT
    u.id,
    'Delivery & Courier Service',
    'Transport & Delivery',
    'Local delivery and courier service for businesses and individuals.',
    5000,
    'RWF',
    1000,
    'Rwanda',
    'Kigali',
    'Local package delivery and courier service.',
    1,
    'active'
FROM users u
WHERE u.email = 'services@isokohub.com'
AND NOT EXISTS (
    SELECT 1 FROM products p WHERE p.title = 'Delivery & Courier Service'
);

INSERT OR IGNORE INTO products
(seller_id, title, category, description, price, currency, stock, country, district, specs, negotiable, status)
SELECT
    u.id,
    'Event Planning & Decoration',
    'Events',
    'Professional event planning and decoration services.',
    150000,
    'RWF',
    100,
    'Rwanda',
    'Kigali',
    'Weddings, birthdays, corporate events and celebrations.',
    1,
    'active'
FROM users u
WHERE u.email = 'creative@isokohub.com'
AND NOT EXISTS (
    SELECT 1 FROM products p WHERE p.title = 'Event Planning & Decoration'
);

INSERT OR IGNORE INTO products
(seller_id, title, category, description, price, currency, stock, country, district, specs, negotiable, status)
SELECT
    u.id,
    'Professional Beauty Service',
    'Beauty & Personal Care',
    'Hair, makeup and beauty services for events and everyday use.',
    30000,
    'RWF',
    100,
    'Rwanda',
    'Kigali',
    'Hair styling, makeup and personal beauty services.',
    1,
    'active'
FROM users u
WHERE u.email = 'services@isokohub.com'
AND NOT EXISTS (
    SELECT 1 FROM products p WHERE p.title = 'Professional Beauty Service'
);

INSERT OR IGNORE INTO products
(seller_id, title, category, description, price, currency, stock, country, district, specs, negotiable, status)
SELECT
    u.id,
    'Catering Service',
    'Food & Catering',
    'Food and catering service for events and private functions.',
    100000,
    'RWF',
    100,
    'Rwanda',
    'Kigali',
    'Event catering and food preparation services.',
    1,
    'active'
FROM users u
WHERE u.email = 'services@isokohub.com'
AND NOT EXISTS (
    SELECT 1 FROM products p WHERE p.title = 'Catering Service'
);

INSERT OR IGNORE INTO products
(seller_id, title, category, description, price, currency, stock, country, district, specs, negotiable, status)
SELECT
    u.id,
    'Freelance Business Assistant',
    'Jobs & Freelance',
    'Freelance administrative and business support service.',
    50000,
    'RWF',
    100,
    'Rwanda',
    'Kigali',
    'Remote and local freelance business support.',
    1,
    'active'
FROM users u
WHERE u.email = 'services@isokohub.com'
AND NOT EXISTS (
    SELECT 1 FROM products p WHERE p.title = 'Freelance Business Assistant'
);

INSERT OR IGNORE INTO products
(seller_id, title, category, description, price, currency, stock, country, district, specs, negotiable, status)
SELECT
    u.id,
    'Business Consulting Service',
    'Business & Professional',
    'Business planning and professional consulting service.',
    100000,
    'RWF',
    100,
    'Rwanda',
    'Gasabo',
    'Business strategy, planning and professional advisory.',
    1,
    'active'
FROM users u
WHERE u.email = 'services@isokohub.com'
AND NOT EXISTS (
    SELECT 1 FROM products p WHERE p.title = 'Business Consulting Service'
);

INSERT OR IGNORE INTO products
(seller_id, title, category, description, price, currency, stock, country, district, specs, negotiable, status)
SELECT
    u.id,
    'Construction & Home Improvement',
    'Construction & Home Services',
    'Construction, repair and home improvement services.',
    150000,
    'RWF',
    100,
    'Rwanda',
    'Kigali',
    'Construction, painting, electrical, plumbing and renovation services.',
    1,
    'active'
FROM users u
WHERE u.email = 'services@isokohub.com'
AND NOT EXISTS (
    SELECT 1 FROM products p WHERE p.title = 'Construction & Home Improvement'
);

INSERT OR IGNORE INTO products
(seller_id, title, category, description, price, currency, stock, country, district, specs, negotiable, status)
SELECT
    u.id,
    'Digital Business Template Pack',
    'Digital Products',
    'Ready-to-use digital templates for businesses and creators.',
    15000,
    'RWF',
    1000,
    'Rwanda',
    'Kigali',
    'Digital templates for business documents and marketing.',
    0,
    'active'
FROM users u
WHERE u.email = 'creative@isokohub.com'
AND NOT EXISTS (
    SELECT 1 FROM products p WHERE p.title = 'Digital Business Template Pack'
);
