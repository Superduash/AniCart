const mongoose = require('mongoose');
const slugify = require('slugify');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Product = require('../models/Product');

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const products = await Product.find({ slug: { $exists: false } });
    console.log(`Found ${products.length} products without slugs.`);

    for (const product of products) {
      let baseSlug = slugify(product.name, { lower: true, strict: true, trim: true });
      let slug = baseSlug;
      let counter = 1;
      
      let slugExists = await Product.findOne({ slug, _id: { $ne: product._id } });
      while (slugExists) {
        slug = `${baseSlug}-${counter}`;
        counter++;
        slugExists = await Product.findOne({ slug, _id: { $ne: product._id } });
      }

      product.slug = slug;
      await product.save({ validateBeforeSave: false }); // Bypass full validation if necessary
      console.log(`Updated product: ${product.name} -> ${slug}`);
    }

    console.log('Migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
