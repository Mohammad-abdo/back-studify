const chatbotService = require('../services/chatbot.service');
const { sendSuccess } = require('../utils/response');
const { ValidationError } = require('../utils/errors');
const config = require('../config/env');

const isKeyConfigured = () =>
  !!(config.geminiApiKey && config.geminiApiKey.trim().length > 0);

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
    // Always log the real error so we can debug via server logs
    console.error('[Chatbot] Error status=%s message=%s', error.status ?? 'N/A', error.message);

    // Not configured
    if (error.message?.includes('GEMINI_API_KEY')) {
      return res.status(503).json({
        success: false,
        error: { message: 'AI service is not configured. Please contact the administrator.', code: 'AI_NOT_CONFIGURED' },
      });
    }

    // Invalid / revoked key (401, 403, or explicit Gemini code)
    if (
      error.status === 401 ||
      error.status === 403 ||
      error.message?.includes('API_KEY_INVALID') ||
      error.message?.includes('PERMISSION_DENIED') ||
      error.message?.includes('invalid_api_key')
    ) {
      return res.status(503).json({
        success: false,
        error: { message: 'Invalid Gemini API key. Please check your configuration.', code: 'AI_INVALID_KEY' },
      });
    }

    // Quota / rate-limit — ONLY match the specific Gemini error codes, not loose keywords
    if (error.status === 429 || error.message?.includes('RESOURCE_EXHAUSTED')) {
      return res.status(503).json({
        success: false,
        error: { message: 'AI rate limit reached. Please try again in a few seconds.', code: 'AI_QUOTA_EXCEEDED' },
      });
    }

    // Model not found / bad request
    if (error.status === 400 || error.status === 404 || error.message?.includes('MODEL_NOT_FOUND') || error.message?.includes('not found')) {
      return res.status(503).json({
        success: false,
        error: { message: 'AI model unavailable. Please contact the administrator.', code: 'AI_MODEL_ERROR' },
      });
    }

    // Unknown — pass the real Gemini message to the client so the admin can see it
    return res.status(503).json({
      success: false,
      error: {
        message: error.message || 'AI service error. Please try again.',
        code: 'AI_ERROR',
      },
    });
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
    model: 'gemini-1.5-flash',
    provider: 'Google Gemini',
  }, 'Chatbot status');
};

module.exports = { sendMessage, getSuggestions, getStatus };
