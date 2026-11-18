const { Pool } = require('pg');

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl:
          process.env.NODE_ENV === 'production' ||
          (!process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('127.0.0.1'))
            ? { rejectUnauthorized: false }
            : false,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'servicehub_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {}),
      }
);

const query = (text, params) => pool.query(text, params);

const initializeDatabase = async () => {
  try {
    
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(50) DEFAULT '+880 1712-345678',
        address TEXT DEFAULT 'House 14, Road 7, Dhanmondi, Dhaka',
        avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        role VARCHAR(50) DEFAULT 'user',
        is_verified BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT DEFAULT 'House 14, Road 7, Dhanmondi, Dhaka';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT TRUE;
    `);

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
        available_slots TEXT[] DEFAULT ARRAY['09:00 AM', '10:00 AM', '11:00 AM', '11:30 AM', '02:00 PM', '03:00 PM', '04:00 PM', '04:30 PM', '08:00 PM'],
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

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

    await query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        service_id INT REFERENCES services(id) ON DELETE CASCADE,
        rating NUMERIC(2, 1) DEFAULT 5.0,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS saved_addresses (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        label VARCHAR(100) NOT NULL,
        address TEXT NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS ai_chat_messages (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        sender VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        recommended_service_id INT REFERENCES services(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS platform_settings (
        id SERIAL PRIMARY KEY,
        platform_name VARCHAR(100) DEFAULT 'ServiceHub',
        commission_rate VARCHAR(20) DEFAULT '15%',
        support_email VARCHAR(255) DEFAULT 'support@servicehub.app',
        auto_confirm_bookings BOOLEAN DEFAULT TRUE,
        slot_buffer_time VARCHAR(50) DEFAULT '30 mins',
        free_cancellation_window VARCHAR(50) DEFAULT '2 hours before',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
      CREATE INDEX IF NOT EXISTS idx_services_popular ON services(is_popular);
      CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_service_slot ON bookings(service_id, date, time_slot, status);
    `);

    await ensureBookingSlotIndex();

    console.log('PostgreSQL Database & Schema Tables Initialized Successfully');
  } catch (err) {
    console.error('PostgreSQL Connection/Initialization Note:', err.message);
    console.log('Make sure PostgreSQL is running on port 5432 and database exists.');
  }
};

const ensureBookingSlotIndex = async () => {
  try {
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_booking_slot
      ON bookings(service_id, date, time_slot)
      WHERE status IN ('Pending', 'Confirmed');
    `);
    return true;
  } catch (err) {
    console.warn('Could not create unique booking slot index (duplicate active bookings exist):', err.message);
    return false;
  }
};

module.exports = {
  pool,
  query,
  initializeDatabase,
  ensureBookingSlotIndex,
};
