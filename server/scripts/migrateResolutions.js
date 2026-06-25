/**
 * Resolution Migration Script
 * 
 * Automatically repairs old wallpapers whose resolution metadata is incorrect.
 * 
 * This script:
 * - Infers resolution from variant filenames and R2 metadata
 * - Updates MongoDB metadata only (does not modify R2 objects)
 * - Validates and fixes availableResolutions arrays
 * - Corrects the resolution display field
 * 
 * Usage: node scripts/migrateResolutions.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { getAvailableVariants, computeResolutionMetadata, validateResolutionMetadata } = require('../services/resolutionService');
const config = require('../config');

const BATCH_SIZE = 100;
const DRY_RUN = process.argv.includes('--dry-run');

async function connectDB() {
  try {
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
  } catch (error) {
    console.error('Error disconnecting:', error);
  }
}

async function migrateResolutions() {
  console.log('\n=== Resolution Migration Script ===\n');
  
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  }

  // Get total count
  const totalProducts = await Product.countDocuments({});
  console.log(`Total products in database: ${totalProducts}`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;
  let processed = 0;

  // Process in batches
  let skip = 0;
  
  while (true) {
    const products = await Product.find({})
      .select('_id name slug resolution availableResolutions assets')
      .skip(skip)
      .limit(BATCH_SIZE);

    if (products.length === 0) break;

    for (const product of products) {
      processed++;
      
      try {
        // Validate current state
        const validation = validateResolutionMetadata(product);
        
        if (validation.isValid) {
          skipped++;
          continue;
        }

        // Get computed correct metadata
        const computedMetadata = computeResolutionMetadata(product);
        
        console.log(`\n[${processed}/${totalProducts}] Product: "${product.name}"`);
        console.log(`  Current displayResolution: "${product.displayResolution}"`);
        console.log(`  Current defaultDownload: "${product.defaultDownload}"`);
        console.log(`  Current availableResolutions: ${JSON.stringify(product.availableResolutions)}`);
        console.log(`  Actual variants (from R2 keys): ${JSON.stringify(computedMetadata.availableVariants)}`);
        
        if (validation.issues.length > 0) {
          console.log('  Issues found:');
          validation.issues.forEach(issue => console.log(`    - ${issue}`));
        }

        console.log(`  Fixing displayResolution to: "${computedMetadata.displayResolutionLabel}"`);
        console.log(`  Fixing defaultDownload to: "${computedMetadata.defaultDownload}"`);

        if (!DRY_RUN) {
          // Apply fixes
          const updateData = {};
          
          if (validation.fixes.displayResolution) {
            updateData.displayResolution = validation.fixes.displayResolution;
          }
          
          if (validation.fixes.defaultDownload) {
            updateData.defaultDownload = validation.fixes.defaultDownload;
          }
          
          if (validation.fixes.availableResolutions) {
            updateData.availableResolutions = validation.fixes.availableResolutions;
          }

          await Product.findByIdAndUpdate(product._id, {
            $set: updateData,
          });

          migrated++;
          console.log('  ✓ Migrated');
        } else {
          console.log('  ⚠️  Would migrate (dry run)');
        }

      } catch (error) {
        errors++;
        console.error(`  ✗ Error processing "${product.name}":`, error.message);
      }
    }

    skip += BATCH_SIZE;
    
    // Progress indicator
    if (processed % 10 === 0) {
      console.log(`\nProgress: ${processed}/${totalProducts} processed...`);
    }
  }

  console.log('\n=== Migration Summary ===');
  console.log(`Total processed: ${processed}`);
  console.log(`Migrated: ${migrated}`);
  console.log(`Skipped (already valid): ${skipped}`);
  console.log(`Errors: ${errors}`);
  
  if (DRY_RUN) {
    console.log('\n⚠️  This was a DRY RUN. Run without --dry-run to apply changes.');
  }
}

async function main() {
  await connectDB();
  
  try {
    await migrateResolutions();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

main();