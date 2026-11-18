const bcrypt = require('bcryptjs');
const db = require('../config/db');

const getUserProfile = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, phone, address, avatar, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone || '+880 1712-345678',
        address: user.address || 'House 14, Road 7, Dhanmondi, Dhaka',
        avatar: user.avatar,
        role: user.role,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateUserProfile = async (req, res, next) => {
  try {
    const { name, phone, address, avatar, currentPassword, newPassword } = req.body;

    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = userResult.rows[0];
    let updatedName = name || user.name;
    let updatedPhone = phone !== undefined ? phone : user.phone;
    let updatedAddress = address !== undefined ? address : user.address;
    let updatedAvatar = avatar || user.avatar;
    let updatedPassword = user.password;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password',
        });
      }
      const isMatch = await bcrypt.compare(String(currentPassword), user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }
      if (String(newPassword).length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters',
        });
      }
      const salt = await bcrypt.genSalt(10);
      updatedPassword = await bcrypt.hash(newPassword, salt);
    }

    const updateRes = await db.query(
      `UPDATE users 
       SET name = $1, phone = $2, address = $3, avatar = $4, password = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, name, email, phone, address, avatar, role`,
      [updatedName, updatedPhone, updatedAddress, updatedAvatar, updatedPassword, req.user.id]
    );

    const updatedUser = updateRes.rows[0];

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser.id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        avatar: updatedUser.avatar,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
};
