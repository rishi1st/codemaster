const express = require('express')
const submitRouter = express.Router();
const submitCodeRateLimiter = require('../middleware/submitCodeLimiter')
const userAuthMiddleware = require('../middleware/userAuth');
const { submitCode , runCode} = require('../controller/userSubmission');


submitRouter.post('/submit/:id',userAuthMiddleware , submitCodeRateLimiter,submitCode);
submitRouter.post('/run/:id',userAuthMiddleware,runCode);
module.exports = submitRouter;