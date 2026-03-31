const redisClient = require('../config/redis')
const submitCodeRateLimiter = async(req,res , next)=>{
      const userId = req.user._id
      const redisKey = `submit_coolDown:${userId}`
      try {
          // check kya user ne abhi abhi submission kiya hai
          const exists = await redisClient.exists(redisKey)
          if(exists){
                    return res.status(429).json({
                              error:'Please wait 10sec before submitting'
                    })
          }
          // set kr lo cooldown period
          await redisClient.set(redisKey, 'cooldown_active' , {
                    EX : 10, // expire after 10sec
                    NX:true  // only set if not exist
          })
          next()

      } catch (error) {
          console.error('Submit Rate limiter error :  ', error)
          res.status(500).send("Internal Server Error")
      }
}
module.exports = submitCodeRateLimiter