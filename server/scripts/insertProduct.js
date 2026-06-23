require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/AniCartAi';

async function run() {
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    const doc = {
      name: 'Test Wallpaper',
      series: 'Test',
      price: 10,
      img: 'https://via.placeholder.com/400x300.png',
      rightsConfirmed: true,
      termsAcceptedAt: new Date(),
      licenseType: 'original',
      status: 'active',
      assets: { status: 'ready' },
      tags: ['test'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await mongoose.connection.collection('products').insertOne(doc);
    console.log('Inserted productId:', result.insertedId.toString());

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error inserting product:', err);
    try { await mongoose.connection.close(); } catch (e) {}
    process.exit(1);
  }
}

run();
