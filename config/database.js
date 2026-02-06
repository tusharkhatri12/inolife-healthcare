const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri || !uri.trim()) {
    console.error(
      'MONGODB_URI is not set. Set it in .env (local) or in your host (e.g. Render/Atlas). Example: mongodb+srv://user:pass@cluster.mongodb.net/inolife-healthcare'
    );
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri.trim(), {
      // Recommended for MongoDB Atlas and modern drivers
      retryWrites: true,
      w: 'majority',
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
