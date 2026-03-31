const cloudinary = require('cloudinary').v2
const Problem = require('../models/problem')
const User = require('../models/user')
const SolutionVideo = require('../models/solutionVideo')

cloudinary.config({
       cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
       api_key: process.env.CLOUDINARY_API_KEY,
       api_secret: process.env.CLOUDINARY_API_SECRET
})

const generateUploadSignature = async (req, res) => {
       try {
              const { problemId } = req.params
              const userId = req.user._id
              const problem = await Problem.findById(problemId)
              //          verify problem exist or
              if (!problem) return res.status(400).json({ error: "Problem not found" });
              //          generate unique public_id for the video
              const timestamp = Math.round(Date.now() / 1000);
              const publicId = `leetcode-solutions/${problemId}/${userId}_${timestamp}`;

              // uplaod prarameter
              const uploadParams = {
                     timestamp: timestamp,
                     public_id: publicId
              }
              // generate signature
              const signature = cloudinary.utils.api_sign_request(
                     uploadParams,
                     process.env.CLOUDINARY_API_SECRET
              );

              res.json({
                     signature,
                     timestamp,
                     public_id: publicId,
                     api_key: process.env.CLOUDINARY_API_KEY,
                     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                     upload_url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload`
              })
       } catch (error) {
              console.log("Error while generating upload signature", error);
              res.status(500).json({ error: 'failed to generate upload credentials' })

       }
}
const saveVideoMetaData = async (req, res) => {
       try {
              const {
                     problemId,
                     cloudinaryPublicId,
                     secureUrl,
                     duration
              } = req.body

              const userId = req.user._id
              // verify the upload with cloudinary
              const cloudinaryResource = await cloudinary.api.resource(
                     cloudinaryPublicId,
                     { resource_type: 'video' }
              );

              if (!cloudinaryResource) return res.status(400).json({ error: "Video not found on cloudinary." })
              // check if video is alredy exists for this problem and user
              const existingVideo = await SolutionVideo.findOne({
                     problemId,
                     userId,
                     cloudinaryPublicId
              })
              if (existingVideo) return res.status(400).json({ error: "Video alredy exists" })
              const thumbnailUrl = cloudinary.url(cloudinaryResource.public_id, {
                     resource_type: 'video',
                     transformation: [
                            { width: 400, height: 225, crop: 'fill' },
                            { quality: "auto" },
                            { start_offset: "auto" }
                     ],
                     format: 'jpg'
              });

              // creating video solution record
              const videoSolution = await SolutionVideo.create({
                     problemId,
                     userId,
                     cloudinaryPublicId,
                     secureUrl,
                     duration: cloudinaryResource.duration || duration,
                     thumbnailUrl
              })

              res.status(201).json({
                     message: "video solution saved successfully",
                     videoSolution: {
                            id: videoSolution._id,
                            thumbnailUrl: videoSolution.thumbnailUrl,
                            duration: videoSolution.duration,
                            uploadedAt: videoSolution.createdAt
                     }
              })
       } catch (error) {
              console.error('Error saving video metadata ', error)
              res.status(500).json({ error: "Failed to save video metadata" })

       }
}
const deleteVideo = async (req, res) => {
       try {
              const { problemId } = req.params
              const userId = req.user._id
              const video = await SolutionVideo.findOneAndDelete({ problemId: problemId })
              if (!video) return res.status(404).json({ error: "Video not found" })
              await cloudinary.uploader.destroy(video.cloudinaryPublicId, { resource_type: 'video', invalidate: true })
              res.json({ message: "video deleted successfully" });
       } catch (error) {
              console.error('Error deleting video  ', error)
              res.status(500).json({ error: "Failed to delete video " })
       }
}

module.exports = { generateUploadSignature, saveVideoMetaData, deleteVideo };