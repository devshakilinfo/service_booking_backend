const db = require('../config/db');

const getDashboardMetrics = async (req, res, next) => {
  try {
    const [
      usersRes,
      bookingsRes,
      servicesRes,
      activeServicesRes,
      revenueRes,
      settingsRes,
      statusRes,
    ] = await Promise.all([
      db.query('SELECT COUNT(*) FROM users'),
      db.query('SELECT COUNT(*) FROM bookings'),
      db.query('SELECT COUNT(*) FROM services'),
      db.query('SELECT COUNT(*) FROM services WHERE is_active = TRUE'),
      db.query("SELECT COALESCE(SUM(total_price), 0) AS total FROM bookings WHERE status != 'Cancelled'"),
      db.query('SELECT * FROM platform_settings ORDER BY id DESC LIMIT 1'),
      db.query('SELECT status, COUNT(*) AS count FROM bookings GROUP BY status'),
    ]);

    const statusCounts = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    };

    statusRes.rows.forEach((r) => {
      const key = (r.status || '').toLowerCase();
      if (statusCounts[key] !== undefined) {
        statusCounts[key] = parseInt(r.count, 10);
      }
    });

    const totalUsers = parseInt(usersRes.rows[0].count, 10);
    const totalBookings = parseInt(bookingsRes.rows[0].count, 10);
    const totalServices = parseInt(servicesRes.rows[0].count, 10);
    const activeServices = parseInt(activeServicesRes.rows[0].count, 10);
    const totalRevenue = parseFloat(revenueRes.rows[0].total || 0);

    const platformSettings = settingsRes.rows[0] || {
      platform_name: 'ServiceHub',
      commission_rate: '15%',
      support_email: 'support@servicehub.app',
      auto_confirm_bookings: true,
      slot_buffer_time: '30 mins',
      free_cancellation_window: '2 hours before',
    };

    res.json({
      success: true,
      data: {
        totalUsers,
        totalBookings,
        totalServices,
        activeServices,
        totalRevenue,
        statusCounts,
        platformSettings: {
          platformName: platformSettings.platform_name,
          commissionRate: platformSettings.commission_rate,
          supportEmail: platformSettings.support_email,
          autoConfirmBookings: platformSettings.auto_confirm_bookings,
          slotBufferTime: platformSettings.slot_buffer_time,
          freeCancellationWindow: platformSettings.free_cancellation_window,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const updatePlatformSettings = async (req, res, next) => {
  try {
    const {
      platformName,
      commissionRate,
      supportEmail,
      autoConfirmBookings,
      slotBufferTime,
      freeCancellationWindow,
    } = req.body;

    const findRes = await db.query('SELECT * FROM platform_settings ORDER BY id DESC LIMIT 1');
    const cur = findRes.rows[0] || {};

    const updated = await db.query(
      `UPDATE platform_settings 
       SET platform_name = $1, commission_rate = $2, support_email = $3, auto_confirm_bookings = $4, slot_buffer_time = $5, free_cancellation_window = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [
        platformName || cur.platform_name || 'ServiceHub',
        commissionRate || cur.commission_rate || '15%',
        supportEmail || cur.support_email || 'support@servicehub.app',
        autoConfirmBookings !== undefined ? autoConfirmBookings : cur.auto_confirm_bookings,
        slotBufferTime || cur.slot_buffer_time || '30 mins',
        freeCancellationWindow || cur.free_cancellation_window || '2 hours before',
        cur.id,
      ]
    );

    res.json({
      success: true,
      message: 'Platform settings updated successfully',
      data: updated.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
  updatePlatformSettings,
};
