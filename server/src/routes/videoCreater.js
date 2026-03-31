const express = require('express')
const adminAuth = require('../middleware/adminAuth');
const videoRouter = express.Router();

const {generateUploadSignature , saveVideoMetaData , deleteVideo } = require('../controller/videoSection')
videoRouter.get('/create/:problemId',adminAuth,generateUploadSignature)
videoRouter.post('/save',adminAuth,saveVideoMetaData)
videoRouter.delete('/delete/:problemId',adminAuth,deleteVideo)
module.exports = videoRouter;