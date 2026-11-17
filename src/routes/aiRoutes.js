const express = require('express');
const router = express.Router();
const { askAIAssistant } = require('../controllers/aiController');

router.post('/ask', askAIAssistant);

module.exports = router;
