-- =============================================================================
--  Chap.ci — Schéma MySQL (référence)
--  Les tables se créent AUTOMATIQUEMENT au premier appel de l'API. Ce fichier
--  n'est utile que si vous préférez les créer à la main dans phpMyAdmin.
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(190) UNIQUE,
  password_hash TEXT,
  created_at VARCHAR(32)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(36) PRIMARY KEY,
  full_name TEXT, first_name TEXT, last_name TEXT, gender TEXT,
  birth_date TEXT, phone TEXT, bio TEXT, avatar_url TEXT,
  region_id TEXT, city_id TEXT, commune TEXT, address TEXT,
  lat DOUBLE, lng DOUBLE, created_at VARCHAR(32)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS listings (
  id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36),
  title TEXT, description TEXT, price INTEGER, negotiable INTEGER,
  category_id TEXT, subcategory TEXT, condition_v TEXT, images TEXT,
  region_id TEXT, city_id TEXT, commune TEXT, lat DOUBLE, lng DOUBLE,
  seller_name TEXT, seller_phone TEXT, delivery INTEGER, featured INTEGER,
  promo_price INTEGER, promo_until VARCHAR(32), created_at VARCHAR(32),
  INDEX (user_id), INDEX (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(36) PRIMARY KEY, listing_id VARCHAR(36),
  buyer_id VARCHAR(36), seller_id VARCHAR(36), created_at VARCHAR(32),
  INDEX (buyer_id), INDEX (seller_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(36) PRIMARY KEY, conversation_id VARCHAR(36),
  sender_id VARCHAR(36), body TEXT, created_at VARCHAR(32),
  INDEX (conversation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(36) PRIMARY KEY, buyer_id VARCHAR(36), seller_id VARCHAR(36),
  conversation_id VARCHAR(36), status TEXT, created_at VARCHAR(32),
  INDEX (buyer_id), INDEX (seller_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(36) PRIMARY KEY, order_id VARCHAR(36),
  listing_id VARCHAR(36), title TEXT, price INTEGER, image TEXT,
  INDEX (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(36) PRIMARY KEY, listing_id VARCHAR(36), seller_id VARCHAR(36),
  reviewer_id VARCHAR(36), rating INTEGER, comment TEXT, created_at VARCHAR(32),
  INDEX (seller_id), INDEX (listing_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS newsletter (
  id VARCHAR(36) PRIMARY KEY, email VARCHAR(190) UNIQUE, created_at VARCHAR(32)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
