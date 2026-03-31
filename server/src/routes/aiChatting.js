// backend/routes/aiChatting.js
const express = require('express')
const aiRouter = express.Router();
const userAuthMiddleware = require('../middleware/userAuth');

const { solveDoubt, getAvailableModels } = require('../controller/aiChatting')

aiRouter.post('/chat', userAuthMiddleware, solveDoubt)
aiRouter.get('/models', userAuthMiddleware, getAvailableModels)  // Optional

module.exports = aiRouter;