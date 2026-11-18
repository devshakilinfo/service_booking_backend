require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query, initializeDatabase } = require('./config/db');
const {
  sampleCategories,
  sampleServices,
  extraUsersData,
  shakilBookings,
  addresses,
} = require('./data/seedData');

const sampleReviews = [
  { serviceIndex: 0, rating: 5.0, comment: 'GreenClean Pro team arrived right on time and made our apartment spotless!' },
  { serviceIndex: 1, rating: 4.8, comment: 'Fixed my split AC cooling issue in 1 hour. Very knowledgeable technician.' },
  { serviceIndex: 3, rating: 4.9, comment: 'Wonderful home salon experience, used authentic organic products.' },
  { serviceIndex: 2, rating: 4.7, comment: 'Quick leak repair with zero mess left behind. Highly recommended!' },
  { serviceIndex: 4, rating: 5.0, comment: 'Physiotherapist was super professional and helped relieve my back pain.' },
];

const seedDatabase = async () => {
  try {
    console.log('Connecting to PostgreSQL and initializing schema...');
    await initializeDatabase();

    await query('DELETE FROM ai_chat_messages');
    await query('DELETE FROM saved_addresses');
    await query('DELETE FROM reviews');
    await query('DELETE FROM bookings');
    await query('DELETE FROM services');
    await query('DELETE FROM categories');
    await query('DELETE FROM platform_settings');
    await query(
      `DELETE FROM users WHERE email IN ($1, $2, $3, $4, $5, $6)`,
      [
        'shakil@example.com',
        'shakil.dev@servicehub.app',
        'admin@servicehub.com',
        'tanvir@example.com',
        'nusrat@example.com',
        'mahmud@example.com',
      ]
    );
    console.log('Cleared old seed records.');

    for (const c of sampleCategories) {
      await query(
        `INSERT INTO categories (name, icon, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO UPDATE SET icon = EXCLUDED.icon, description = EXCLUDED.description`,
        [c.name, c.icon, c.description]
      );
    }
    console.log(`Inserted ${sampleCategories.length} categories.`);

    const serviceIds = [];
    for (const s of sampleServices) {
      const res = await query(
        `INSERT INTO services (name, description, category, price, duration, image, rating, reviews_count, is_featured, is_popular, highlights, available_slots)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id`,
        [
          s.name,
          s.description,
          s.category,
          s.price,
          s.duration,
          s.image,
          s.rating,
          s.reviews_count,
          s.is_featured,
          s.is_popular,
          s.highlights,
          s.available_slots,
        ]
      );
      serviceIds.push(res.rows[0].id);
    }
    console.log(`Inserted ${sampleServices.length} services across all 6 categories.`);

    const userPassword = await bcrypt.hash('password123', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);

    const shakilRes1 = await query(
      `INSERT INTO users (name, email, password, phone, address, avatar, role, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
       RETURNING id`,
      [
        'Shakil Ahamed',
        'shakil@example.com',
        userPassword,
        '+880 1712-345678',
        'House 14, Road 7, Dhanmondi, Dhaka',
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        'user',
      ]
    );
    const shakilId1 = shakilRes1.rows[0].id;

    const shakilRes2 = await query(
      `INSERT INTO users (name, email, password, phone, address, avatar, role, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
       RETURNING id`,
      [
        'Shakil Ahamed',
        'shakil.dev@servicehub.app',
        userPassword,
        '+880 1712-345678',
        'House 14, Road 7, Dhanmondi, Dhaka',
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        'user',
      ]
    );
    const shakilId2 = shakilRes2.rows[0].id;

    const adminRes = await query(
      `INSERT INTO users (name, email, password, phone, address, avatar, role, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
       RETURNING id`,
      [
        'Admin Manager',
        'admin@servicehub.com',
        adminPassword,
        '+880 1900-654321',
        'ServiceHub HQ, Gulshan-2, Dhaka',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        'admin',
      ]
    );
    const adminId = adminRes.rows[0].id;

    const extraUserIds = [];
    for (const u of extraUsersData) {
      const r = await query(
        `INSERT INTO users (name, email, password, phone, address, role, is_verified)
         VALUES ($1, $2, $3, $4, $5, 'user', TRUE)
         RETURNING id`,
        [u.name, u.email, userPassword, u.phone, u.address]
      );
      extraUserIds.push(r.rows[0].id);
    }
    console.log('Inserted 6 users (Shakil primary & dev accounts, Admin, and 3 customers).');

    for (const targetUserId of [shakilId1, shakilId2, adminId]) {
      for (const b of shakilBookings) {
        await query(
          `INSERT INTO bookings (user_id, service_id, date, time_slot, status, total_price, notes, cancellation_reason)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            targetUserId,
            serviceIds[b.serviceIndex],
            b.date,
            b.timeSlot,
            b.status,
            b.price,
            b.notes || '',
            b.cancellationReason || '',
          ]
        );
      }
    }
    console.log(`Inserted ${shakilBookings.length} mock bookings per primary user across all 4 tabs.`);

    for (const targetUserId of [shakilId1, shakilId2]) {
      for (const addr of addresses) {
        await query(
          `INSERT INTO saved_addresses (user_id, label, address, is_default)
           VALUES ($1, $2, $3, $4)`,
          [targetUserId, addr.label, addr.address, addr.isDefault]
        );
      }
    }
    console.log('Inserted saved addresses.');

    for (let i = 0; i < sampleReviews.length; i++) {
      const rev = sampleReviews[i];
      const authorId = i % 2 === 0 ? shakilId1 : extraUserIds[i % extraUserIds.length];
      await query(
        `INSERT INTO reviews (user_id, service_id, rating, comment)
         VALUES ($1, $2, $3, $4)`,
        [authorId, serviceIds[rev.serviceIndex], rev.rating, rev.comment]
      );
    }
    console.log(`Inserted ${sampleReviews.length} verified service reviews.`);

    for (const targetUserId of [shakilId1, shakilId2]) {
      await query(
        `INSERT INTO ai_chat_messages (user_id, sender, message, recommended_service_id)
         VALUES
         ($1, 'bot', 'Hi Shakil! I''m your ServiceHub AI Assistant. Need help finding the right service or checking prices?', NULL),
         ($1, 'user', 'My AC is blowing warm air and making noise. What should I book?', NULL),
         ($1, 'bot', 'Based on those symptoms, I recommend our AC Repair & Diagnostics service. A certified technician can inspect refrigerant levels and fan bearings today.', $2)`,
        [targetUserId, serviceIds[1]]
      );
    }
    console.log('Inserted AI Assistant chat history.');

    await query(
      `INSERT INTO platform_settings (platform_name, commission_rate, support_email, auto_confirm_bookings, slot_buffer_time, free_cancellation_window)
       VALUES ('ServiceHub', '15%', 'support@servicehub.app', TRUE, '30 mins', '2 hours before')`
    );
    console.log('Inserted platform settings.');

    console.log('\n✅ PostgreSQL Database Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedDatabase();
