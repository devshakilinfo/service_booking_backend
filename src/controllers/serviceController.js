const db = require('../config/db');

// @desc    Get all services with optional search & filter
// @route   GET /api/services
// @access  Public
const getServices = async (req, res, next) => {
  try {
    const { category, search, featured, popular } = req.query;

    let sql = 'SELECT * FROM services WHERE is_active = TRUE';
    const params = [];
    let paramIndex = 1;

    if (category && category !== 'All') {
      sql += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (featured === 'true') {
      sql += ` AND is_featured = TRUE`;
    }

    if (popular === 'true') {
      sql += ` AND is_popular = TRUE`;
    }

    if (search && search.trim() !== '') {
      sql += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR category ILIKE $${paramIndex})`;
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    sql += ' ORDER BY rating DESC, created_at DESC';

    const result = await db.query(sql, params);

    // Format fields to match Flutter camelCase expectations
    const services = result.rows.map((row) => ({
      _id: row.id.toString(),
      id: row.id.toString(),
      name: row.name,
      description: row.description,
      category: row.category,
      price: parseFloat(row.price),
      duration: row.duration,
      image: row.image,
      rating: parseFloat(row.rating),
      reviewsCount: row.reviews_count,
      isFeatured: row.is_featured,
      isPopular: row.is_popular,
      highlights: row.highlights || [],
      availableSlots: row.available_slots || [],
      isActive: row.is_active,
    }));

    res.json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single service details by ID
// @route   GET /api/services/:id
// @access  Public
const getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM services WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    const row = result.rows[0];
    const service = {
      _id: row.id.toString(),
      id: row.id.toString(),
      name: row.name,
      description: row.description,
      category: row.category,
      price: parseFloat(row.price),
      duration: row.duration,
      image: row.image,
      rating: parseFloat(row.rating),
      reviewsCount: row.reviews_count,
      isFeatured: row.is_featured,
      isPopular: row.is_popular,
      highlights: row.highlights || [],
      availableSlots: row.available_slots || [],
      isActive: row.is_active,
    };

    res.json({
      success: true,
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get available time slots for a service on a specific date
// @route   GET /api/services/:id/availability?date=YYYY-MM-DD
// @access  Public
const getServiceAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date query parameter is required (format: YYYY-MM-DD)',
      });
    }

    const serviceResult = await db.query('SELECT available_slots FROM services WHERE id = $1', [id]);
    if (serviceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    const allSlots = serviceResult.rows[0].available_slots || [];

    // Query active bookings for this service on this date
    const bookedResult = await db.query(
      `SELECT time_slot FROM bookings 
       WHERE service_id = $1 AND date = $2 AND status IN ('Pending', 'Confirmed')`,
      [id, date]
    );

    const bookedSlots = bookedResult.rows.map((r) => r.time_slot);

    const slots = allSlots.map((slot) => ({
      time: slot,
      isAvailable: !bookedSlots.includes(slot),
    }));

    res.json({
      success: true,
      date,
      totalSlots: allSlots.length,
      availableSlotsCount: slots.filter((s) => s.isAvailable).length,
      slots,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all categories
// @route   GET /api/services/categories
// @access  Public
const getCategories = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, name, icon, description FROM categories WHERE is_active = TRUE ORDER BY id ASC'
    );
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getServices,
  getServiceById,
  getServiceAvailability,
  getCategories,
};
