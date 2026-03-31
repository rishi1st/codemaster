const jwt = require('jsonwebtoken')
const User = require('../models/user');
const redisClient = require('../config/redis');
const adminAuthMiddleware = async(req, res, next) => {
          try {
              const { token } = req.cookies;
              if (!token) throw new Error("Token doesn't exist");
      
              const payload =  jwt.verify(token, process.env.JWT_KEY);
              console.log(payload.role)
              const { _id } = payload;
      
              if (!_id) throw new Error("User id missing");
      
              const user = await User.findById(_id);
              if(payload.role != 'admin') throw new Error("Invalid Token")
              if (!user) throw new Error("User doesn't exist");
            
            //   token verification
            const isBlocked = await redisClient.exists(`token:${token}`);
            if(isBlocked) throw new Error("Invalid token...")
              req.user = user;
              next();
          } catch (error) {
            console.log("Admin not verifed")
              res.status(401).send("Error: " + error.message);
          }
      }
      
module.exports = adminAuthMiddleware;