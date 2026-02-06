/**
 * One-time script: drop the old non-sparse unique index on User.email
 * so Mongoose can use the new sparse unique index (allowing multiple MRs with no email).
 * Run from project root: node scripts/fix-user-email-index.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('Set MONGODB_URI in .env');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const coll = db.collection('users');
  try {
    const indexes = await coll.indexes();
    const emailIndex = indexes.find((i) => i.key && i.key.email === 1);
    if (emailIndex && !emailIndex.sparse) {
      await coll.dropIndex(emailIndex.name);
      console.log('Dropped old email index:', emailIndex.name);
      console.log('Restart your server so Mongoose can create the new sparse index.');
    } else if (emailIndex && emailIndex.sparse) {
      console.log('Email index is already sparse. No change needed.');
    } else {
      console.log('No non-sparse email index found. No change needed.');
    }
  } catch (e) {
    if (e.codeName === 'IndexNotFound') {
      console.log('Email index not found. No change needed.');
    } else {
      throw e;
    }
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
