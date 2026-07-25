const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/walletwise';
  
  try {
    const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2500 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Primary MongoDB Connection failed (${error.message}). Attempting in-memory database fallback...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`In-Memory MongoDB Connected: ${conn.connection.host} (${uri})`);
    } catch (fallbackError) {
      console.error(`MongoDB Connection Error: ${fallbackError.message}`);
      console.error('Please configure MONGO_URI in backend/.env to connect to your MongoDB Atlas or local MongoDB instance.');
      process.exit(1);
    }
  }
};

module.exports = connectDB;
