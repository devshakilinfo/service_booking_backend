const express = require('express');
const router = express.Router();
const {
  getServices,
  getServiceById,
  getServiceAvailability,
  getCategories,
  createService,
  updateService,
  deleteService,
} = require('../controllers/serviceController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getServices);
router.get('/categories', getCategories);
router.get('/:id', getServiceById);
router.get('/:id/availability', getServiceAvailability);

router.post('/', protect, createService);
router.put('/:id', protect, updateService);
router.delete('/:id', protect, deleteService);

module.exports = router;
