const express = require('express');
const router = express.Router();
const { askAIAssistant } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/ask', protect, askAIAssistant);

module.exports = router;
