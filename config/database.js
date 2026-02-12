const mongoose = require('mongoose');

const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;



const connectDB = async () => {
  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    await mongoose.connect(uri);
    console.log('MongoDB Memory Server connected!');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;