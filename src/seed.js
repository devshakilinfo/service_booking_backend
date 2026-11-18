require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, query, initializeDatabase } = require('./config/db');

const sampleCategories = [
  {
    name: 'Cleaning',
    icon: 'cleaning_services',
    description: 'Professional home, sofa, and sanitization services',
  },
  {
    name: 'Repair',
    icon: 'handyman',
    description: 'Expert AC, plumbing, and home equipment repair',
  },
  {
    name: 'Beauty',
    icon: 'content_cut',
    description: 'At-home parlour, salon, facial, and personal grooming',
  },
  {
    name: 'Health',
    icon: 'favorite',
    description: 'Physiotherapy, elderly care, and nurse checkups',
  },
  {
    name: 'Electric',
    icon: 'bolt',
    description: 'Certified electrical wiring, installation, and inspection',
  },
  {
    name: 'Painting',
    icon: 'format_paint',
    description: 'Interior and exterior premium wall painting',
  },
];

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
    name: 'Home Physiotherapy & Care',
    description: 'Licensed physiotherapist home visits for pain relief, posture therapy, rehabilitation, and elderly mobility training.',
    category: 'Health',
    price: 50.0,
    duration: '1 hr',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
    rating: 4.9,
    reviews_count: 640,
    is_featured: true,
    is_popular: true,
    highlights: ['Certified Physiotherapist', 'Custom Exercise Plan', 'In-Home Care'],
    available_slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'],
  },
  {
    name: 'Deep Sofa & Carpet Cleaning',
    description: 'Intensive upholstery steam extraction, anti-bacterial sanitization, and deep stain removal for carpets, couches, and rugs.',
    category: 'Cleaning',
    price: 35.0,
    duration: '2 hrs',
    image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800',
    rating: 4.7,
    reviews_count: 850,
    is_featured: false,
    is_popular: false,
    highlights: ['Deep Steam Extraction', 'Zero Residue', 'Fabric Protection'],
    available_slots: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'],
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
    await query('DELETE FROM categories');
    await query('DELETE FROM users WHERE email IN ($1, $2)', ['shakil@example.com', 'admin@servicehub.com']);
    console.log('Cleared existing database tables.');

    // 2. Insert Categories
    for (const c of sampleCategories) {
      await query(
        `INSERT INTO categories (name, icon, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO UPDATE SET icon = EXCLUDED.icon, description = EXCLUDED.description`,
        [c.name, c.icon, c.description]
      );
    }
    console.log(`Inserted ${sampleCategories.length} categories.`);

    // 3. Insert Services
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
    console.log(`Inserted ${sampleServices.length} services across categories.`);

    // 4. Create Demo Regular User ("Shakil Ahamed")
    const userPassword = await bcrypt.hash('password123', 10);
    const userRes = await query(
      `INSERT INTO users (name, email, password, phone, avatar, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        'Shakil Ahamed',
        'shakil@example.com',
        userPassword,
        '+880 1700 123456',
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        'user',
      ]
    );
    const userId = userRes.rows[0].id;
    console.log('Demo user created: shakil@example.com / password123 (role: user)');

    // 5. Create Demo Admin User
    const adminPassword = await bcrypt.hash('admin123', 10);
    await query(
      `INSERT INTO users (name, email, password, phone, avatar, role)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'Admin Manager',
        'admin@servicehub.com',
        adminPassword,
        '+880 1900 654321',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        'admin',
      ]
    );
    console.log('Demo admin created: admin@servicehub.com / admin123 (role: admin)');

    // 6. Create Demo Orders / Bookings (Upcoming, Past, Confirmed, Pending, Completed, Cancelled)
    const bookingsData = [
      {
        serviceIndex: 0, // Home Cleaning
        date: '2026-11-19',
        timeSlot: '10:00 AM',
        status: 'Confirmed',
        price: 25.00,
        notes: 'Please bring eco-friendly cleaning detergents',
      },
      {
        serviceIndex: 1, // AC Repair
        date: '2026-11-21',
        timeSlot: '02:00 PM',
        status: 'Pending',
        price: 40.00,
        notes: 'Master bedroom AC cooling check and filter replacement',
      },
      {
        serviceIndex: 2, // Plumbing Service
        date: '2026-11-24',
        timeSlot: '11:00 AM',
        status: 'Completed',
        price: 30.00,
        notes: 'Kitchen sink pipe repair',
      },
      {
        serviceIndex: 3, // Beauty Parlour
        date: '2026-11-15',
        timeSlot: '04:00 PM',
        status: 'Completed',
        price: 35.00,
        notes: 'Rejuvenating facial & hair styling',
      },
      {
        serviceIndex: 4, // Home Physiotherapy
        date: '2026-11-28',
        timeSlot: '09:00 AM',
        status: 'Pending',
        price: 50.00,
        notes: 'Lower back mobility therapy session',
      },
      {
        serviceIndex: 6, // Electrical Maintenance
        date: '2026-11-08',
        timeSlot: '03:00 PM',
        status: 'Cancelled',
        price: 35.00,
        notes: 'Living room light fixture setup',
        cancellationReason: 'Rescheduled by customer',
      },
    ];

    for (const b of bookingsData) {
      await query(
        `INSERT INTO bookings (user_id, service_id, date, time_slot, status, total_price, notes, cancellation_reason)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userId,
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
    console.log(`Inserted ${bookingsData.length} demo bookings/orders matching mockup statuses.`);

    console.log('\n PostgreSQL Database Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedDatabase();
