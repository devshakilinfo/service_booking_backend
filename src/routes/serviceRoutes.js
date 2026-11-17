const express = require('express');
const router = express.Router();
const {
  getServices,
  getServiceById,
  getServiceAvailability,
} = require('../controllers/serviceController');

router.get('/', getServices);
router.get('/:id', getServiceById);
router.get('/:id/availability', getServiceAvailability);

module.exports = router;
