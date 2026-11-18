const express = require('express');
const router = express.Router();
const {
  getServices,
  getServiceById,
  getServiceAvailability,
  getCategories,
} = require('../controllers/serviceController');

router.get('/', getServices);
router.get('/categories', getCategories);
router.get('/:id', getServiceById);
router.get('/:id/availability', getServiceAvailability);

module.exports = router;
