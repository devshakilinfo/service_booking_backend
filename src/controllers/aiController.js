const aiService = require('../services/aiService');

const MAX_MESSAGE_LENGTH = 500;

const askAIAssistant = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Message must be at most ${MAX_MESSAGE_LENGTH} characters`,
      });
    }

    const result = await aiService.processQuery(message.trim());

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
