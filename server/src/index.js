const express = require('express')
const app = express();
require('dotenv').config();
const connectWithMongoDb =  require('./config/db')
const redisClient = require('./config/redis');
const cookieParser =  require('cookie-parser');
const authRouter = require('./routes/userAuth')
const problemRouter = require('./routes/problemCreater');
const submitRouter = require('./routes/submit')
const aiRouter = require('./routes/aiChatting')
const videoRouter = require('./routes/videoCreater'); 
const compilerRouter = require('./routes/compiler');

const cors = require('cors');

// backend app.js
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(cookieParser());
app.use('/user',authRouter);
app.use('/problem',problemRouter);
app.use('/submission',submitRouter);
app.use('/ai' , aiRouter);
app.use('/video',videoRouter);
app.use('/compiler',compilerRouter)

const initializeConnections = async()=>{
    try {
      // better approach [ time batch rha hai kyonki dono parallely connect ho rhe hai yaha]
      await Promise.all([redisClient.connect() , connectWithMongoDb()])
      console.log('Database Connected Successfully...🚀')
      app.listen(process.env.PORT, ()=>{
                  console.log(`Server is Running on ${process.env.PORT}...🎉`)
             })
    } catch (error) {
     console.error("❌ Error during initialization:", error.message);
    process.exit(1); // Exit the application with failure
    }
  }
  
  initializeConnections()
