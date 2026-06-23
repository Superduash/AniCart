require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');

const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/AniCartAi';

async function run() {
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    const email = 'admin@anicart.com';
    const password = 'Admin@1234';

    let user = await User.findOne({ email });
    if (user) {
      console.log('Admin user already exists. Updating role and verification status.');
      user.role = 'admin';
      user.isVerified = true;
      // Set plaintext password and let Mongoose pre-save hash it
      user.password = password;
      await user.save();
      console.log('Admin user updated:', user.email);
    } else {
      console.log('Creating admin user');

      // Create user with plaintext password so pre-save middleware hashes it
      user = await User.create({
        name: 'Admin',
        email,
        password: password,
        role: 'admin',
        isVerified: true,
        avatar: 'A',
      });

      console.log('Admin user created:', user.email);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin user:', err);
    try {
      await mongoose.connection.close();
    } catch (e) {}
    process.exit(1);
  }
}

run();
