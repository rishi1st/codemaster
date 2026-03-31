const mongoose = require('mongoose');

async function connectWithMongoDb() {
    await mongoose.connect(process.env.DB_CONNECT_STRING) 
}

module.exports = connectWithMongoDb;


