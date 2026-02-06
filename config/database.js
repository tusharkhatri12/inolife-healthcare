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

    // Fix: drop old non-sparse unique index on users.email so MRs without email can be created
    try {
      const db = conn.connection.db;
      const users = db.collection('users');
      const indexes = await users.indexes();
      const emailIndex = indexes.find((i) => i.key && i.key.email === 1);
      if (emailIndex && !emailIndex.sparse) {
        await users.dropIndex(emailIndex.name);
        console.log('[DB] Dropped old non-sparse email index; will use sparse index.');
      }
    } catch (e) {
      if (e.codeName !== 'IndexNotFound' && e.code !== 27) {
        console.warn('[DB] Email index fix skipped:', e.message);
      }
    }

    // Ensure User schema indexes (including new sparse email) exist
    const User = require('../models/User');
    await User.syncIndexes();

    return conn;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
