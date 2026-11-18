const db = require('../config/db');
const { DATE_REGEX } = require('../utils/validation');

const getServices = async (req, res, next) => {
  try {
    const { category, search, featured, popular, includeInactive } = req.query;

    let sql = includeInactive === 'true'
      ? 'SELECT * FROM services WHERE 1=1'
      : 'SELECT * FROM services WHERE is_active = TRUE';
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

const getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service id',
      });
    }
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

const getServiceAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date || !DATE_REGEX.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Date query parameter is required (format: YYYY-MM-DD)',
      });
    }

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service id',
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

const createService = async (req, res, next) => {
  try {
    const {
      name,
      description,
      category,
      price,
      duration,
      image,
      isFeatured,
      isPopular,
      highlights,
      availableSlots,
    } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, and category are required',
      });
    }

    const defaultImage =
      image && image.trim() !== ''
        ? image.trim()
        : 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800';

    const defaultSlots =
      availableSlots && availableSlots.length > 0
        ? availableSlots
        : ['09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM', '08:00 PM'];

    const defaultHighlights =
      highlights && highlights.length > 0
        ? highlights
        : ['Experienced Staff', 'Quality Guaranteed', '100% Satisfaction'];

    const insertRes = await db.query(
      `INSERT INTO services 
       (name, description, category, price, duration, image, rating, reviews_count, is_featured, is_popular, highlights, available_slots, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, 4.8, 0, $7, $8, $9, $10, TRUE)
       RETURNING *`,
      [
        name.trim(),
        description || 'Professional service by certified specialists.',
        category,
        parseFloat(price),
        duration || '1.5 hrs',
        defaultImage,
        isFeatured === true,
        isPopular === true,
        defaultHighlights,
        defaultSlots,
      ]
    );

    const row = insertRes.rows[0];

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: {
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
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      price,
      duration,
      image,
      isFeatured,
      isPopular,
      isActive,
    } = req.body;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service id',
      });
    }

    const findRes = await db.query('SELECT * FROM services WHERE id = $1', [id]);
    if (findRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    const s = findRes.rows[0];
    const updatedName = name !== undefined ? name.trim() : s.name;
    const updatedDesc = description !== undefined ? description : s.description;
    const updatedCat = category !== undefined ? category : s.category;
    const updatedPrice = price !== undefined ? parseFloat(price) : parseFloat(s.price);
    const updatedDur = duration !== undefined ? duration : s.duration;
    const updatedImg = image !== undefined ? image : s.image;
    const updatedFeatured = isFeatured !== undefined ? isFeatured : s.is_featured;
    const updatedPopular = isPopular !== undefined ? isPopular : s.is_popular;
    const updatedActive = isActive !== undefined ? isActive : s.is_active;

    const updateRes = await db.query(
      `UPDATE services 
       SET name = $1, description = $2, category = $3, price = $4, duration = $5, image = $6, is_featured = $7, is_popular = $8, is_active = $9
       WHERE id = $10
       RETURNING *`,
      [
        updatedName,
        updatedDesc,
        updatedCat,
        updatedPrice,
        updatedDur,
        updatedImg,
        updatedFeatured,
        updatedPopular,
        updatedActive,
        id,
      ]
    );

    const row = updateRes.rows[0];

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: {
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
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service id',
      });
    }

    const result = await db.query(
      'UPDATE services SET is_active = FALSE WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    res.json({
      success: true,
      message: 'Service deleted successfully',
      data: { id },
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
  createService,
  updateService,
  deleteService,
};
