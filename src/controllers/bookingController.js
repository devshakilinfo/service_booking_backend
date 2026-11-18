const db = require('../config/db');

const createBooking = async (req, res, next) => {
  try {
    const { serviceId, date, timeSlot, notes } = req.body;

    if (!serviceId || !date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Please provide serviceId, date, and timeSlot',
      });
    }

    const serviceRes = await db.query('SELECT * FROM services WHERE id = $1', [serviceId]);
    if (serviceRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Selected service does not exist',
      });
    }

    const service = serviceRes.rows[0];

    if (!service.available_slots.includes(timeSlot)) {
      return res.status(400).json({
        success: false,
        message: `Time slot ${timeSlot} is not offered for this service`,
      });
    }

    const conflictRes = await db.query(
      `SELECT id FROM bookings 
       WHERE service_id = $1 AND date = $2 AND time_slot = $3 AND status IN ('Pending', 'Confirmed')`,
      [serviceId, date, timeSlot]
    );

    if (conflictRes.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked. Please choose another time slot.',
      });
    }

    const insertRes = await db.query(
      `INSERT INTO bookings (user_id, service_id, date, time_slot, status, total_price, notes)
       VALUES ($1, $2, $3, $4, 'Pending', $5, $6)
       RETURNING *`,
      [req.user.id, serviceId, date, timeSlot, service.price, notes || '']
    );

    const booking = insertRes.rows[0];

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: {
        _id: booking.id.toString(),
        id: booking.id.toString(),
        date: booking.date,
        timeSlot: booking.time_slot,
        status: booking.status,
        totalPrice: parseFloat(booking.total_price),
        notes: booking.notes,
        service: {
          _id: service.id.toString(),
          id: service.id.toString(),
          name: service.name,
          category: service.category,
          price: parseFloat(service.price),
          duration: service.duration,
          image: service.image,
          rating: parseFloat(service.rating),
        },
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const { type, status } = req.query;
    const todayStr = new Date().toISOString().split('T')[0];

    let sql = `
      SELECT 
        b.id, b.date, b.time_slot, b.status, b.total_price, b.notes, b.created_at,
        s.id AS service_id, s.name AS service_name, s.category AS service_category,
        s.price AS service_price, s.duration AS service_duration, s.image AS service_image,
        s.rating AS service_rating, s.highlights AS service_highlights
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      WHERE b.user_id = $1
    `;

    const params = [req.user.id];

    if (status) {
      params.push(status);
      sql += ` AND b.status = $${params.length}`;
    }

    if (type === 'upcoming') {
      sql += ` AND b.status IN ('Pending', 'Confirmed')`;
    } else if (type === 'past') {
      sql += ` AND b.status IN ('Completed', 'Cancelled')`;
    }

    sql += ' ORDER BY b.date DESC, b.created_at DESC';

    const result = await db.query(sql, params);

    const bookings = result.rows.map((row) => ({
      _id: row.id.toString(),
      id: row.id.toString(),
      date: row.date,
      timeSlot: row.time_slot,
      status: row.status,
      totalPrice: parseFloat(row.total_price),
      notes: row.notes,
      createdAt: row.created_at,
      service: {
        _id: row.service_id.toString(),
        id: row.service_id.toString(),
        name: row.service_name,
        category: row.service_category,
        price: parseFloat(row.service_price),
        duration: row.service_duration,
        image: row.service_image,
        rating: parseFloat(row.service_rating),
        highlights: row.service_highlights || [],
      },
    }));

    res.json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        b.id, b.user_id, b.date, b.time_slot, b.status, b.total_price, b.notes, b.created_at,
        s.id AS service_id, s.name AS service_name, s.category AS service_category,
        s.price AS service_price, s.duration AS service_duration, s.image AS service_image,
        s.rating AS service_rating,
        u.name AS user_name, u.email AS user_email, u.phone AS user_phone, u.avatar AS user_avatar
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.user_id = u.id
      WHERE b.id = $1
    `;

    const result = await db.query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    const row = result.rows[0];

    if (row.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this booking',
      });
    }

    res.json({
      success: true,
      data: {
        _id: row.id.toString(),
        id: row.id.toString(),
        date: row.date,
        timeSlot: row.time_slot,
        status: row.status,
        totalPrice: parseFloat(row.total_price),
        notes: row.notes,
        createdAt: row.created_at,
        service: {
          _id: row.service_id.toString(),
          id: row.service_id.toString(),
          name: row.service_name,
          category: row.service_category,
          price: parseFloat(row.service_price),
          duration: row.service_duration,
          image: row.service_image,
          rating: parseFloat(row.service_rating),
        },
        user: {
          name: row.user_name,
          email: row.user_email,
          phone: row.user_phone,
          avatar: row.user_avatar,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    const findRes = await db.query('SELECT * FROM bookings WHERE id = $1', [id]);
    if (findRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    const booking = findRes.rows[0];

    if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking',
      });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled',
      });
    }

    if (booking.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel an already completed booking',
      });
    }

    const updateRes = await db.query(
      `UPDATE bookings 
       SET status = 'Cancelled', cancellation_reason = $1 
       WHERE id = $2 
       RETURNING *`,
      [cancellationReason || '', id]
    );

    res.json({
      success: true,
      message: 'Booking successfully cancelled',
      data: updateRes.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
};
