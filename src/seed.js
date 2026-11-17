require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, query, initializeDatabase } = require('./config/db');

const sampleServices = [
  {
    name: 'Home Cleaning',
    description: 'Professional home cleaning service for a fresh and healthy home. Comprehensive dusting, vacuuming, floor washing, and surface sanitation.',
    category: 'Cleaning',
    price: 25.0,
    duration: '1 hr',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800',
    rating: 4.8,
    reviews_count: 2500,
    is_featured: true,
    is_popular: true,
    highlights: ['Experienced Staff', 'Eco-Friendly Products', '100% Satisfaction'],
    available_slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'],
  },
  {
    name: 'AC Repair',
    description: 'Expert AC repair service including deep coil cleaning, refrigerant gas level check, thermostat inspection, and filter replacement.',
    category: 'Repair',
    price: 40.0,
    duration: '1-2 hrs',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800',
    rating: 4.7,
    reviews_count: 1840,
    is_featured: true,
    is_popular: true,
    highlights: ['Certified Technicians', 'Genuine Spare Parts', '30-Day Warranty'],
    available_slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'],
  },
  {
    name: 'Plumbing Service',
    description: 'Quick plumbing solution for pipe leakage, faucet repair, toilet blockages, drain cleaning, and water pressure optimization.',
    category: 'Repair',
    price: 30.0,
    duration: '1 hr',
    image: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800',
    rating: 4.6,
    reviews_count: 960,
    is_featured: false,
    is_popular: true,
    highlights: ['Rapid Response', 'No Mess Guarantee', 'Transparent Pricing'],
    available_slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'],
  },
  {
    name: 'Beauty Parlour',
    description: 'Self-care & beauty service at home. Hair styling, rejuvenating facial, manicure & pedicure delivered by vetted beauticians.',
    category: 'Beauty',
    price: 35.0,
    duration: '1 hr',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
    rating: 4.8,
    reviews_count: 1420,
    is_featured: true,
    is_popular: true,
    highlights: ['Branded Organic Cosmetics', 'Sterilized Equipment', 'Personalized Styling'],
    available_slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'],
  },
  {
    name: 'Electrical Maintenance',
    description: 'Safe and certified electrical solutions including short circuit fixes, wiring inspections, switchboard upgrades, and light fixtures.',
    category: 'Electric',
    price: 35.0,
    duration: '1-2 hrs',
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800',
    rating: 4.9,
    reviews_count: 880,
    is_featured: false,
    is_popular: false,
    highlights: ['Licensed Electricians', 'Safety-First Protocol', 'Accurate Troubleshooting'],
    available_slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'],
  },
  {
    name: 'Home Painting',
    description: 'Complete interior and exterior painting service with wall putty preparation, primer application, and premium waterproof colors.',
    category: 'Painting',
    price: 80.0,
    duration: '4-6 hrs',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800',
    rating: 4.7,
    reviews_count: 520,
    is_featured: false,
    is_popular: false,
    highlights: ['Color Consultation', 'Dustless Sanding', '3-Year Durability'],
    available_slots: ['09:00 AM', '11:00 AM', '02:00 PM'],
  },
];

const seedDatabase = async () => {
  try {
    console.log('Connecting to PostgreSQL and initializing schema...');
    await initializeDatabase();

    // 1. Clear existing seed data
    await query('DELETE FROM bookings');
    await query('DELETE FROM services');
    await query('DELETE FROM users WHERE email = $1', ['shakil@example.com']);
    console.log('Cleared existing tables.');

    // 2. Insert sample services
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
    console.log(`Inserted ${sampleServices.length} services into PostgreSQL.`);

    // 3. Create demo user ("Shakil Ahamed")
    const hashedPassword = await bcrypt.hash('password123', 10);
    const userRes = await query(
      `INSERT INTO users (name, email, password, phone, avatar)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        'Shakil Ahamed',
        'shakil@example.com',
        hashedPassword,
        '+1 234 567 8900',
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      ]
    );
    const userId = userRes.rows[0].id;
    console.log('Demo user created: shakil@example.com / password123');

    // 4. Create sample bookings for user
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    await query(
      `INSERT INTO bookings (user_id, service_id, date, time_slot, status, total_price, notes)
       VALUES 
       ($1, $2, $3, '10:00 AM', 'Confirmed', 25.00, 'Please bring eco-friendly solutions'),
       ($1, $4, $3, '02:00 PM', 'Pending', 40.00, 'Master bedroom AC repair'),
       ($1, $5, '2026-11-10', '11:00 AM', 'Completed', 30.00, 'Kitchen sink pipe repair')`,
      [userId, serviceIds[0], tomorrowStr, serviceIds[1], serviceIds[2]]
    );
    console.log('Sample bookings created in PostgreSQL.');

    console.log('\n PostgreSQL Database Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedDatabase();
