PRAGMA foreign_keys = ON;

-- ============================================================
-- IsokoHub — FINAL D1 SCHEMA
-- Matches src/index.js
-- ============================================================

-- ============================================================
-- USERS
-- ============================================================

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
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================================
-- SESSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'buyer',
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_token
ON sessions(token_hash);

CREATE INDEX IF NOT EXISTS idx_sessions_user
ON sessions(user_id);

-- ============================================================
-- CATEGORIES
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================================
-- PRODUCTS / SERVICES
-- ============================================================

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
    city TEXT,

    storage TEXT,
    ram TEXT,

    image_url TEXT,
    specs TEXT,

    negotiable INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',

    views INTEGER NOT NULL DEFAULT 0,

    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),

    FOREIGN KEY (seller_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_products_seller
ON products(seller_id);

CREATE INDEX IF NOT EXISTS idx_products_category
ON products(category);

CREATE INDEX IF NOT EXISTS idx_products_country
ON products(country);

CREATE INDEX IF NOT EXISTS idx_products_city
ON products(city);

CREATE INDEX IF NOT EXISTS idx_products_status
ON products(status);

-- ============================================================
-- ORDERS
-- ============================================================

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    buyer_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    seller_id INTEGER,

    quantity INTEGER NOT NULL DEFAULT 1,

    unit_price REAL NOT NULL DEFAULT 0,
    total_price REAL NOT NULL DEFAULT 0,

    -- IsokoHub commission
    commission REAL NOT NULL DEFAULT 0,

    currency TEXT NOT NULL DEFAULT 'RWF',

    status TEXT NOT NULL DEFAULT 'pending',
    payment_status TEXT NOT NULL DEFAULT 'unpaid',

    delivery_address TEXT,
    delivery_country TEXT,
    delivery_district TEXT,
    delivery_phone TEXT,

    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),

    FOREIGN KEY (buyer_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

    FOREIGN KEY (seller_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer
ON orders(buyer_id);

CREATE INDEX IF NOT EXISTS idx_orders_seller
ON orders(seller_id);

CREATE INDEX IF NOT EXISTS idx_orders_product
ON orders(product_id);

CREATE INDEX IF NOT EXISTS idx_orders_payment
ON orders(payment_status);

CREATE INDEX IF NOT EXISTS idx_orders_status
ON orders(status);

-- ============================================================
-- MESSAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,

    product_id INTEGER,

    -- JS uses "body"
    body TEXT NOT NULL,

    is_read INTEGER NOT NULL DEFAULT 0,

    created_at INTEGER NOT NULL DEFAULT (unixepoch()),

    FOREIGN KEY (sender_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (receiver_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_sender
ON messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_messages_receiver
ON messages(receiver_id);

CREATE INDEX IF NOT EXISTS idx_messages_product
ON messages(product_id);

-- ============================================================
-- SAVED
-- JS uses table: saved
-- ============================================================

CREATE TABLE IF NOT EXISTS saved (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,

    created_at INTEGER NOT NULL DEFAULT (unixepoch()),

    UNIQUE(user_id, product_id),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_saved_user
ON saved(user_id);

CREATE INDEX IF NOT EXISTS idx_saved_product
ON saved(product_id);

-- ============================================================
-- RATE LIMITING
-- JS creates this dynamically too, but having it here is safe.
-- ============================================================

CREATE TABLE IF NOT EXISTS rate_limits (
    rate_key TEXT PRIMARY KEY,
    window_start INTEGER NOT NULL,
    count INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- DEFAULT CATEGORIES
-- ============================================================

INSERT OR IGNORE INTO categories (name, description, is_active)
VALUES
('Electronics', 'Phones, computers, electronics and devices', 1),
('Fashion', 'Clothing, shoes, accessories and fashion', 1),
('Home', 'Home products and decoration', 1),
('Education', 'Courses, training and education products', 1),
('Art & Creative', 'Art, design and creative products', 1),
('Film & Entertainment', 'Film, video and entertainment services', 1),
('Services', 'General services', 1),
('Digital Products', 'Digital products and downloadable resources', 1),
('Real Estate', 'Property, houses and land', 1),
('Transport & Delivery', 'Transport, delivery and courier services', 1),
('Technology & IT', 'Technology and IT products/services', 1),
('Marketing & Advertising', 'Marketing, advertising and communication', 1),
('Business & Professional', 'Business and professional services', 1),
('Construction & Home Services', 'Construction, repair and home services', 1),
('Beauty & Personal Care', 'Beauty and personal care services', 1),
('Food & Catering', 'Food, catering and hospitality', 1),
('Events', 'Events, planning and decoration', 1),
('Jobs & Freelance', 'Jobs, freelance and professional opportunities', 1);

-- ============================================================
-- OPTIONAL SERVICE CATEGORIES
-- These match the JS service category list.
-- ============================================================

INSERT OR IGNORE INTO categories (name, description, is_active)
VALUES
('Engineering', 'Engineering and technical services', 1),
('IT & Technology', 'Software, IT and technology services', 1),
('Construction & Property', 'Construction and property services', 1),
('Education & Teachers', 'Teachers, tutoring and education services', 1),
('Marketing & Communication', 'Marketing and communication services', 1),
('Automotive & Transport', 'Automotive and transportation services', 1),
('Agriculture & Environment', 'Agriculture and environmental services', 1),
('Home Services', 'Home maintenance and household services', 1),
('Legal & Finance', 'Legal, accounting and financial services', 1),
('Health & Wellness', 'Health and wellness services', 1),
('Beauty & Personal Care', 'Beauty and personal care services', 1),
('Food & Hospitality', 'Food and hospitality services', 1),
('Logistics', 'Logistics and supply services', 1),
('Travel & Tourism', 'Travel and tourism services', 1),
('Industrial & Manufacturing', 'Industrial and manufacturing services', 1),
('Other Services', 'Other professional and local services', 1);
