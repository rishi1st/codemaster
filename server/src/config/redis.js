const redis = require('redis');
require('dotenv').config();
const redisClient = redis.createClient({
  username: 'default',
  password: process.env.REDIS_PASS,  
  socket: {
    host: process.env.REDIS_HOST_ID,
    port: parseInt(process.env.REDIS_PORT)
  }
});

// Add error handling
redisClient.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});


module.exports = redisClient;