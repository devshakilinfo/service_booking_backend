const { Pool } = require('pg');

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'servicehub_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
      }
);

// Helper function to execute SQL queries
const query = (text, params) => pool.query(text, params);

// Auto-initialize schema tables
const initializeDatabase = async () => {
  try {
    // 1. Users Table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(50) DEFAULT '',
        avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Categories Table
    await query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        icon VARCHAR(100) DEFAULT '',
        description TEXT DEFAULT '',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Services Table
    await query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        duration VARCHAR(100) DEFAULT '1 hr',
        image TEXT NOT NULL,
        rating NUMERIC(2, 1) DEFAULT 4.8,
        reviews_count INT DEFAULT 120,
        is_featured BOOLEAN DEFAULT FALSE,
        is_popular BOOLEAN DEFAULT FALSE,
        highlights TEXT[] DEFAULT ARRAY['Experienced Staff', 'Quality Guaranteed', '100% Satisfaction'],
        available_slots TEXT[] DEFAULT ARRAY['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'],
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Bookings Table
    await query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        service_id INT REFERENCES services(id) ON DELETE CASCADE,
        date VARCHAR(20) NOT NULL,
        time_slot VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        total_price NUMERIC(10, 2) NOT NULL,
        notes TEXT DEFAULT '',
        cancellation_reason TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Indexes
    await query(`
      CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
      CREATE INDEX IF NOT EXISTS idx_services_popular ON services(is_popular);
      CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_service_slot ON bookings(service_id, date, time_slot, status);
    `);

    console.log('PostgreSQL Database & Schema Tables Initialized Successfully');
  } catch (err) {
    console.error('PostgreSQL Connection/Initialization Note:', err.message);
    console.log('Make sure PostgreSQL is running on port 5432 and database exists.');
  }
};

module.exports = {
  pool,
  query,
  initializeDatabase,
};
