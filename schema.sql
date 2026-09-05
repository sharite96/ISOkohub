-- ============================================================
-- IsokoHub Production Database Schema
-- Cloudflare D1 / SQLite
-- ============================================================

PRAGMA foreign_keys = ON;

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,

  role TEXT NOT NULL DEFAULT 'buyer'
    CHECK (role IN ('buyer','seller','provider','admin')),

  password_hash TEXT,
  session_token_hash TEXT,

  country TEXT,
  district TEXT,

  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','suspended','pending')),

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PRODUCTS
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,

  seller_id TEXT NOT NULL,

  title TEXT NOT NULL,
  description TEXT,

  category TEXT NOT NULL,

  price INTEGER NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'RWF',

  location TEXT,
  brand TEXT,
  condition TEXT,

  storage TEXT,
  ram TEXT,

  negotiable INTEGER NOT NULL DEFAULT 0
    CHECK (negotiable IN (0,1)),

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','sold')),

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (seller_id)
    REFERENCES users(id)
);

-- ============================================================
-- PRODUCT IMAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS product_images (
  id TEXT PRIMARY KEY,

  product_id TEXT NOT NULL,

  object_key TEXT NOT NULL,

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE
);

-- ============================================================
-- SERVICES
-- ============================================================

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,

  provider_id TEXT NOT NULL,

  name TEXT NOT NULL,
  category TEXT NOT NULL,

  skill TEXT,
  description TEXT,

  price INTEGER CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'RWF',

  location TEXT,
  availability TEXT,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected')),

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (provider_id)
    REFERENCES users(id)
);

-- ============================================================
-- ORDERS
-- ============================================================

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,

  buyer_id TEXT NOT NULL,

  total INTEGER NOT NULL CHECK (total >= 0),
  currency TEXT NOT NULL DEFAULT 'RWF',

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','completed','cancelled')),

  payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid','pending','paid','failed','refunded')),

  delivery_status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (delivery_status IN ('not_started','processing','shipped','delivered','cancelled')),

  delivery_address TEXT,

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (buyer_id)
    REFERENCES users(id)
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,

  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,

  quantity INTEGER NOT NULL DEFAULT 1
    CHECK (quantity > 0),

  unit_price INTEGER NOT NULL
    CHECK (unit_price >= 0),

  FOREIGN KEY (order_id)
    REFERENCES orders(id)
    ON DELETE CASCADE,

  FOREIGN KEY (product_id)
    REFERENCES products(id),

  FOREIGN KEY (seller_id)
    REFERENCES users(id)
);

-- ============================================================
-- MESSAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,

  sender_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,

  body TEXT NOT NULL,

  read_at TEXT,

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (sender_id)
    REFERENCES users(id),

  FOREIGN KEY (recipient_id)
    REFERENCES users(id)
);

-- ============================================================
-- REVIEWS
-- ============================================================

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,

  reviewer_id TEXT NOT NULL,

  product_id TEXT,
  service_id TEXT,

  rating INTEGER NOT NULL
    CHECK (rating BETWEEN 1 AND 5),

  body TEXT,

  status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('published','hidden','pending')),

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (reviewer_id)
    REFERENCES users(id),

  FOREIGN KEY (product_id)
    REFERENCES products(id),

  FOREIGN KEY (service_id)
    REFERENCES services(id)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,

  user_id TEXT NOT NULL,

  type TEXT NOT NULL,
  body TEXT NOT NULL,

  read_at TEXT,

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- ============================================================
-- COMMISSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS commissions (
  id TEXT PRIMARY KEY,

  order_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,

  rate REAL NOT NULL
    CHECK (rate >= 0),

  amount INTEGER NOT NULL
    CHECK (amount >= 0),

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (order_id)
    REFERENCES orders(id),

  FOREIGN KEY (seller_id)
    REFERENCES users(id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_email
ON users(email);

CREATE INDEX IF NOT EXISTS idx_users_role
ON users(role);

CREATE INDEX IF NOT EXISTS idx_products_seller
ON products(seller_id);

CREATE INDEX IF NOT EXISTS idx_products_category
ON products(category);

CREATE INDEX IF NOT EXISTS idx_products_status
ON products(status);

CREATE INDEX IF NOT EXISTS idx_services_provider
ON services(provider_id);

CREATE INDEX IF NOT EXISTS idx_services_category
ON services(category);

CREATE INDEX IF NOT EXISTS idx_services_status
ON services(status);

CREATE INDEX IF NOT EXISTS idx_orders_buyer
ON orders(buyer_id);

CREATE INDEX IF NOT EXISTS idx_orders_status
ON orders(status);

CREATE INDEX IF NOT EXISTS idx_order_items_order
ON order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender
ON messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_messages_recipient
ON messages(recipient_id);

CREATE INDEX IF NOT EXISTS idx_reviews_product
ON reviews(product_id);

CREATE INDEX IF NOT EXISTS idx_reviews_service
ON reviews(service_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user
ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_commissions_order
ON commissions(order_id);

-- ============================================================
-- END OF ISOKOHUB SCHEMA
-- ============================================================
