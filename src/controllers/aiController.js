const aiService = require('../services/aiService');

// @desc    Process AI Assistant query
// @route   POST /api/ai/ask
// @access  Public
const askAIAssistant = async (req, res, next) => {
  try {
    const { message, history } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    const result = await aiService.processQuery(message, history || []);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  askAIAssistant,
};
