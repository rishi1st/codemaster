const jwt = require('jsonwebtoken')
const User = require('../models/user');
const redisClient = require('../config/redis');
const userAuthMiddleware = async(req, res, next) => {
          try {
              const { token } = req.cookies;
              if (!token) throw new Error("Token doesn't exist");
      
              const payload =  jwt.verify(token, process.env.JWT_KEY);
              const { _id } = payload;
      
              if (!_id) throw new Error("User id missing");
      
              const user = await User.findById(_id);
              if (!user) throw new Error("User doesn't exist");
            
            //   token verification
            const isBlocked = await redisClient.exists(`token:${token}`);
            if(isBlocked) throw new Error("Invalid token...")
              req.user = user;
              next();
          } catch (error) {
              res.status(401).send("Error: " + error.message);
          }
      }
      
module.exports = userAuthMiddleware;