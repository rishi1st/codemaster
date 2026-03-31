const express = require('express');
const compilerRouter = express.Router();
const { compilerCode } = require('../controller/compiler');
const userAuthMiddleware = require('../middleware/userAuth');
const submitCodeRateLimiter = require('../middleware/submitCodeLimiter');

compilerRouter.post('/', userAuthMiddleware, submitCodeRateLimiter, compilerCode);

module.exports = compilerRouter;
