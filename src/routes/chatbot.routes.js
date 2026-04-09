const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const { chatbotLimiter } = require('../middleware/rateLimit.middleware');
const chatbotController = require('../controllers/chatbot.controller');

router.get('/status', authenticate, chatbotController.getStatus);

router.post('/message', authenticate, chatbotLimiter, chatbotController.sendMessage);

router.get('/suggestions', authenticate, chatbotController.getSuggestions);

module.exports = router;
