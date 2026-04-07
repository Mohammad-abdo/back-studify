const chatbotService = require('../services/chatbot.service');
const { sendSuccess } = require('../utils/response');
const { ValidationError } = require('../utils/errors');
const config = require('../config/env');

const isKeyConfigured = () =>
  config.openaiApiKey && config.openaiApiKey !== 'sk-your-openai-api-key-here';

const sendMessage = async (req, res, next) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      throw new ValidationError('Message is required');
    }

    if (message.length > 2000) {
      throw new ValidationError('Message too long (max 2000 characters)');
    }

    if (!isKeyConfigured()) {
      return res.status(503).json({
        success: false,
        error: {
          message: 'AI service is not configured. Please contact the administrator.',
          code: 'AI_NOT_CONFIGURED',
        },
      });
    }

    const userType = req.user?.type || 'STUDENT';

    const result = await chatbotService.chat({
      message: message.trim(),
      conversationId: conversationId || null,
      userType,
    });

    sendSuccess(res, result, 'Message processed');
  } catch (error) {
    if (error.message?.includes('OPENAI_API_KEY') || error.message?.includes('API key')) {
      return res.status(503).json({
        success: false,
        error: {
          message: 'AI service is not configured. Please contact the administrator.',
          code: 'AI_NOT_CONFIGURED',
        },
      });
    }

    if (error.status === 429 || error.code === 'insufficient_quota') {
      return res.status(429).json({
        success: false,
        error: {
          message: 'AI service quota exceeded. Please check your OpenAI billing at platform.openai.com',
          code: 'AI_QUOTA_EXCEEDED',
        },
      });
    }

    if (error.status === 401 || error.code === 'invalid_api_key') {
      return res.status(503).json({
        success: false,
        error: {
          message: 'Invalid OpenAI API key. Please check your configuration.',
          code: 'AI_INVALID_KEY',
        },
      });
    }

    console.error('Chatbot error:', error.message || error);
    next(error);
  }
};

const getSuggestions = async (req, res, next) => {
  try {
    const userType = req.user?.type || 'STUDENT';
    const suggestions = await chatbotService.getSuggestions(userType);
    sendSuccess(res, suggestions, 'Suggestions retrieved');
  } catch (error) {
    next(error);
  }
};

const getStatus = async (req, res) => {
  sendSuccess(res, {
    configured: isKeyConfigured(),
    model: 'gpt-4o-mini',
  }, 'Chatbot status');
};

module.exports = { sendMessage, getSuggestions, getStatus };
