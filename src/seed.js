require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query, initializeDatabase } = require('./config/db');

const sampleCategories = [
  {
    name: 'Cleaning',
    icon: 'cleaning_services',
    description: 'Professional home, deep kitchen, sofa, and eco-sanitization services',
  },
  {
    name: 'Repair',
    icon: 'handyman',
    description: 'Expert AC diagnostics, plumbing, and home appliance repair',
  },
  {
    name: 'Beauty',
    icon: 'content_cut',
    description: 'At-home parlour, salon, facial, and personal grooming',
  },
  {
    name: 'Health',
    icon: 'favorite',
    description: 'Physiotherapy, elderly care, and home nursing checkups',
  },
  {
    name: 'Electric',
    icon: 'bolt',
    description: 'Certified electrical wiring, smart home installation, and inspection',
  },
  {
    name: 'Painting',
    icon: 'format_paint',
    description: 'Interior and exterior premium waterproof wall painting',
  },
];

const defaultSlots = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '11:30 AM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '04:30 PM',
  '08:00 PM',
];

const sampleServices = [
  {
    name: 'Home Cleaning',
    description:
        'Complete top-to-bottom eco-friendly residential cleaning by background-checked specialists using non-toxic botanical disinfectants.',
    category: 'Cleaning',
    price: 25.0,
    duration: '2 hrs',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800',
    rating: 4.8,
    reviews_count: 2540,
    is_featured: true,
    is_popular: true,
    highlights: [
      'Eco-friendly & pet-safe cleaning supplies',
      'Kitchen countertops, sink & appliance wipe',
      'Bathroom deep scrub & floor sanitization',
      'Living area dusting, vacuuming & mopping',
    ],
    available_slots: defaultSlots,
  },
  {
    name: 'AC Repair & Diagnostics',
    description:
        'Expert AC repair service including deep coil cleaning, refrigerant gas level check, fan bearing inspection, and filter replacement.',
    category: 'Repair',
    price: 40.0,
    duration: '1.5 hrs',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800',
    rating: 4.7,
    reviews_count: 1200,
    is_featured: true,
    is_popular: true,
    highlights: ['Certified Technicians', 'Genuine Spare Parts', '30-Day Service Warranty'],
    available_slots: defaultSlots,
  },
  {
    name: 'Plumbing Service',
    description:
        'Quick plumbing solution for pipe leakage, faucet installation, drain unblocking, toilet repair, and water pressure optimization.',
    category: 'Repair',
    price: 30.0,
    duration: '1 hr',
    image: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800',
    rating: 4.7,
    reviews_count: 1200,
    is_featured: true,
    is_popular: true,
    highlights: ['Rapid Response', 'No Mess Guarantee', 'Transparent Pricing'],
    available_slots: defaultSlots,
  },
  {
    name: 'Beauty Parlour',
    description:
        'Luxury self-care & beauty service at home. Hair styling, organic facial, manicure & pedicure delivered by vetted beauticians.',
    category: 'Beauty',
    price: 35.0,
    duration: '1.5 hrs',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
    rating: 4.7,
    reviews_count: 856,
    is_featured: false,
    is_popular: true,
    highlights: ['Branded Organic Cosmetics', 'Sterilized Equipment', 'Personalized Styling'],
    available_slots: defaultSlots,
  },
  {
    name: 'Home Physiotherapy & Care',
    description:
        'Licensed physiotherapist home visits for back pain relief, posture therapy, post-surgery rehabilitation, and mobility training.',
    category: 'Health',
    price: 50.0,
    duration: '1 hr',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
    rating: 4.9,
    reviews_count: 640,
    is_featured: true,
    is_popular: true,
    highlights: ['Certified Physiotherapist', 'Custom Exercise Plan', 'In-Home Care'],
    available_slots: defaultSlots,
  },
  {
    name: 'Deep Sofa & Carpet Cleaning',
    description:
        'Intensive upholstery steam extraction, anti-bacterial sanitization, and deep stain removal for fabric sofas, leather couches, and carpets.',
    category: 'Cleaning',
    price: 35.0,
    duration: '2 hrs',
    image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800',
    rating: 4.8,
    reviews_count: 890,
    is_featured: false,
    is_popular: true,
    highlights: ['Deep Steam Extraction', 'Zero Odor Residue', 'Fabric Protection'],
    available_slots: defaultSlots,
  },
  {
    name: 'Electrical Maintenance',
    description:
        'Safe and certified electrical solutions including circuit breaker fixes, full house wiring inspections, switchboard upgrades, and ceiling fans.',
    category: 'Electric',
    price: 35.0,
    duration: '1.5 hrs',
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800',
    rating: 4.9,
    reviews_count: 880,
    is_featured: true,
    is_popular: false,
    highlights: ['Licensed Electricians', 'Safety-First Protocol', 'Accurate Troubleshooting'],
    available_slots: defaultSlots,
  },
  {
    name: 'Home Painting',
    description:
        'Complete interior and exterior wall painting service with laser measurement, putty smoothing, primer coat, and odorless washable paint.',
    category: 'Painting',
    price: 80.0,
    duration: '5 hrs',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800',
    rating: 4.8,
    reviews_count: 520,
    is_featured: true,
    is_popular: false,
    highlights: ['Color Consultation', 'Dustless Sanding', '3-Year Durability'],
    available_slots: defaultSlots,
  },
  {
    name: 'Kitchen & Chimney Deep Clean',
    description:
        'Heavy-duty degreasing for kitchen tiles, exhaust hood, stove burners, cabinets, and sink sanitization with food-safe steam cleaners.',
    category: 'Cleaning',
    price: 30.0,
    duration: '2 hrs',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800',
    rating: 4.8,
    reviews_count: 730,
    is_featured: false,
    is_popular: false,
    highlights: ['Oil & Grease Removal', 'Food-Safe Steam', 'Cabinet Polishing'],
    available_slots: defaultSlots,
  },
  {
    name: 'Refrigerator & Washer Repair',
    description:
        'On-site diagnostics and repair for smart refrigerators, washing machines, and microwave ovens using genuine manufacturer parts.',
    category: 'Repair',
    price: 45.0,
    duration: '1.5 hrs',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800',
    rating: 4.7,
    reviews_count: 615,
    is_featured: false,
    is_popular: false,
    highlights: ['All Major Brands', 'Original Parts', '60-Day Warranty'],
    available_slots: defaultSlots,
  },
  {
    name: 'Spa & Aromatherapy Facial',
    description:
        'Relaxing herbal aromatherapy facial, head & shoulder massage, and detox skin treatment for radiant, glowing skin.',
    category: 'Beauty',
    price: 45.0,
    duration: '1.5 hrs',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
    rating: 4.9,
    reviews_count: 980,
    is_featured: true,
    is_popular: true,
    highlights: ['Essential Oils', 'Soothing Ambience', 'Certified Estheticians'],
    available_slots: defaultSlots,
  },
  {
    name: 'Home Nursing & Vital Checkup',
    description:
        'Registered nurse home visit for blood pressure, blood sugar, ECG monitoring, wound dressing, and post-hospitalization care.',
    category: 'Health',
    price: 40.0,
    duration: '1 hr',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800',
    rating: 4.9,
    reviews_count: 510,
    is_featured: false,
    is_popular: false,
    highlights: ['Registered Nurses', 'Digital Health Report', 'Compassionate Care'],
    available_slots: defaultSlots,
  },
  {
    name: 'Smart Home & CCTV Setup',
    description:
        'Installation and configuration of Wi-Fi security cameras, smart door locks, video doorbells, and automated lighting switches.',
    category: 'Electric',
    price: 55.0,
    duration: '2 hrs',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800',
    rating: 4.8,
    reviews_count: 430,
    is_featured: false,
    is_popular: true,
    highlights: ['Mobile App Setup', 'Clean Cable Routing', '1-Year Support'],
    available_slots: defaultSlots,
  },
  {
    name: 'Texture & Accent Wall Art',
    description:
        'Designer metallic, marble, and geometric accent wall painting to transform your living room or master bedroom.',
    category: 'Painting',
    price: 65.0,
    duration: '3 hrs',
    image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800',
    rating: 4.9,
    reviews_count: 340,
    is_featured: false,
    is_popular: false,
    highlights: ['Custom Stencils', 'Zero VOC Paint', 'Same-Day Finish'],
    available_slots: defaultSlots,
  },
];

const seedDatabase = async () => {
  try {
    console.log('Connecting to PostgreSQL and initializing schema...');
    await initializeDatabase();

    // 1. Clear existing seed data cleanly
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
    console.log(`Inserted ${sampleServices.length} services across all 6 categories.`);

    // 4. Create Users (Primary Customer accounts + Admin + Mock Customers)
    const userPassword = await bcrypt.hash('password123', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);

    // Primary Customer 1: shakil@example.com
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

    // Primary Customer 2: shakil.dev@servicehub.app
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

    // Admin User: admin@servicehub.com
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

    // Extra Customers for Admin Bookings & Reviews
    const extraUsersData = [
      {
        name: 'Tanvir Hasan',
        email: 'tanvir@example.com',
        phone: '+880 1811-223344',
        address: 'Apartment 4B, Road 11, Banani, Dhaka',
      },
      {
        name: 'Nusrat Jahan',
        email: 'nusrat@example.com',
        phone: '+880 1612-998877',
        address: 'House 22, Sector 7, Uttara, Dhaka',
      },
      {
        name: 'Mahmudul Karim',
        email: 'mahmud@example.com',
        phone: '+880 1515-445566',
        address: 'Plot 19, Block C, Bashundhara R/A, Dhaka',
      },
    ];

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

    // 5. Insert Bookings (All 4 statuses: Confirmed, Pending, Completed, Cancelled)
    const shakilBookings = [
      // Confirmed (Upcoming)
      {
        serviceIndex: 0, // Home Cleaning ($25)
        date: '2026-11-19',
        timeSlot: '11:30 AM',
        status: 'Confirmed',
        price: 25.0,
        notes: 'Please bring eco-friendly kitchen & bathroom supplies',
      },
      {
        serviceIndex: 4, // Home Physiotherapy ($50)
        date: '2026-11-22',
        timeSlot: '10:00 AM',
        status: 'Confirmed',
        price: 50.0,
        notes: 'Posture and shoulder mobility therapy session',
      },
      {
        serviceIndex: 12, // Smart Home & CCTV Setup ($55)
        date: '2026-11-25',
        timeSlot: '04:30 PM',
        status: 'Confirmed',
        price: 55.0,
        notes: 'Front door smart lock and 2 balcony camera installations',
      },
      // Pending (Upcoming)
      {
        serviceIndex: 1, // AC Repair & Diagnostics ($40)
        date: '2026-11-21',
        timeSlot: '02:00 PM',
        status: 'Pending',
        price: 40.0,
        notes: 'Master bedroom AC blowing warm air and making fan noise',
      },
      {
        serviceIndex: 5, // Deep Sofa & Carpet Cleaning ($35)
        date: '2026-11-26',
        timeSlot: '09:00 AM',
        status: 'Pending',
        price: 35.0,
        notes: '5-seater fabric L-shape sofa steam cleaning',
      },
      // Completed (Past)
      {
        serviceIndex: 2, // Plumbing Service ($30)
        date: '2026-11-14',
        timeSlot: '11:00 AM',
        status: 'Completed',
        price: 30.0,
        notes: 'Kitchen sink mixer faucet replacement',
      },
      {
        serviceIndex: 3, // Beauty Parlour ($35)
        date: '2026-11-10',
        timeSlot: '04:00 PM',
        status: 'Completed',
        price: 35.0,
        notes: 'Herbal facial and hair spa package',
      },
      {
        serviceIndex: 6, // Electrical Maintenance ($35)
        date: '2026-11-05',
        timeSlot: '03:00 PM',
        status: 'Completed',
        price: 35.0,
        notes: 'Living room dimmer switchboard upgrade',
      },
      {
        serviceIndex: 8, // Kitchen & Chimney Deep Clean ($30)
        date: '2026-11-02',
        timeSlot: '10:00 AM',
        status: 'Completed',
        price: 30.0,
        notes: 'Full kitchen hood degreasing and tile scrub',
      },
      // Cancelled
      {
        serviceIndex: 7, // Home Painting ($80)
        date: '2026-11-08',
        timeSlot: '09:00 AM',
        status: 'Cancelled',
        price: 80.0,
        notes: 'Guest room wall painting',
        cancellationReason: 'Rescheduled due to family travel',
      },
    ];

    // Seed bookings for both Shakil accounts + Admin so any logged-in account sees rich bookings
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

    // 6. Insert Saved Addresses for Shakil
    const addresses = [
      { label: 'Home (Default)', address: 'House 14, Road 7, Dhanmondi, Dhaka', isDefault: true },
      { label: 'Office', address: 'Level 8, Tower 52, Gulshan-2, Dhaka', isDefault: false },
      { label: 'Family Home', address: 'Sector 4, Road 12, Uttara, Dhaka', isDefault: false },
    ];
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

    // 7. Insert Customer Reviews for Services
    const sampleReviews = [
      {
        userId: shakilId1,
        serviceIndex: 0,
        rating: 5.0,
        comment: 'GreenClean Pro team arrived right on time and made our apartment spotless!',
      },
      {
        userId: extraUserIds[0],
        serviceIndex: 1,
        rating: 4.8,
        comment: 'Fixed my split AC cooling issue in 1 hour. Very knowledgeable technician.',
      },
      {
        userId: extraUserIds[1],
        serviceIndex: 3,
        rating: 4.9,
        comment: 'Wonderful home salon experience, used authentic organic products.',
      },
      {
        userId: extraUserIds[2],
        serviceIndex: 2,
        rating: 4.7,
        comment: 'Quick leak repair with zero mess left behind. Highly recommended!',
      },
      {
        userId: shakilId1,
        serviceIndex: 4,
        rating: 5.0,
        comment: 'Physiotherapist was super professional and helped relieve my back pain.',
      },
    ];
    for (const rev of sampleReviews) {
      await query(
        `INSERT INTO reviews (user_id, service_id, rating, comment)
         VALUES ($1, $2, $3, $4)`,
        [rev.userId, serviceIds[rev.serviceIndex], rev.rating, rev.comment]
      );
    }
    console.log(`Inserted ${sampleReviews.length} verified service reviews.`);

    // 8. Insert AI Chat Conversation History
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

    // 9. Insert Admin Platform Settings
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
