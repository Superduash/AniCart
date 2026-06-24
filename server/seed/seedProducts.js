/**
 * Seed Script
 * 
 * Seeds the database with initial products and a default admin user.
 * Run with: npm run seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');

// Import models
const Product = require('../models/Product');
const User = require('../models/User');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/AniCartAi';

// Sample products data matching the frontend
const productsData = [
  {
    name: 'Itadori Yuji — Cursed Pulse',
    series: 'Jujutsu Kaisen',
    price: 4.99,
    badge: 'HOT',
    badgeType: 'neon',
    rating: 4.9,
    reviews: 234,
    img: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&h=600&fit=crop',
    resolution: '4K Ultra HD',
    tags: ['Action', 'Dark Fantasy'],
    rightsConfirmed: true,
    termsAcceptedAt: new Date(),
    licenseType: 'original',
  },
  {
    name: "Mikasa Ackerman — Titan's Edge",
    series: 'Attack on Titan',
    price: 3.99,
    badge: 'NEW',
    badgeType: 'pink',
    rating: 4.8,
    reviews: 189,
    img: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&h=600&fit=crop',
    resolution: '4K Ultra HD',
    tags: ['Action', 'Post-Apocalyptic'],
    rightsConfirmed: true,
    termsAcceptedAt: new Date(),
    licenseType: 'original',
  },
  {
    name: 'Nezuko — Bamboo Blossom',
    series: 'Demon Slayer',
    price: 5.99,
    badge: 'BESTSELLER',
    badgeType: 'neon',
    rating: 5.0,
    reviews: 412,
    img: 'https://images.unsplash.com/photo-1492576540313-31ad3a64ba5e?w=800&h=600&fit=crop',
    resolution: '4K Ultra HD',
    tags: ['Fantasy', 'Adventure'],
    rightsConfirmed: true,
    termsAcceptedAt: new Date(),
    licenseType: 'original',
  },
  {
    name: 'Naruto — Nine-Tails Awakening',
    series: 'Naruto Shippuden',
    price: 3.49,
    badge: 'CLASSIC',
    badgeType: 'neon',
    rating: 4.7,
    reviews: 567,
    img: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=800&h=600&fit=crop',
    resolution: '2K HD',
    tags: ['Action', 'Ninja'],
    rightsConfirmed: true,
    termsAcceptedAt: new Date(),
    licenseType: 'original',
  },
  {
    name: 'Gojo Satoru — Infinity Veil',
    series: 'Jujutsu Kaisen',
    price: 6.99,
    badge: 'PREMIUM',
    badgeType: 'pink',
    rating: 4.9,
    reviews: 321,
    img: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=600&fit=crop',
    resolution: '4K Ultra HD',
    tags: ['Action', 'Supernatural'],
    rightsConfirmed: true,
    termsAcceptedAt: new Date(),
    licenseType: 'original',
  },
  {
    name: 'Levi Ackerman — Thunder Spear',
    series: 'Attack on Titan',
    price: 4.49,
    badge: 'NEW',
    badgeType: 'neon',
    rating: 4.8,
    reviews: 276,
    img: 'https://images.unsplash.com/photo-1547636780-9b865e394b50?w=800&h=600&fit=crop',
    resolution: '4K Ultra HD',
    tags: ['Action', 'Drama'],
    rightsConfirmed: true,
    termsAcceptedAt: new Date(),
    licenseType: 'original',
  },
  {
    name: 'Luffy — Gear Fifth',
    series: 'One Piece',
    price: 5.49,
    badge: 'HOT',
    badgeType: 'pink',
    rating: 4.9,
    reviews: 398,
    img: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=600&fit=crop',
    resolution: '4K Ultra HD',
    tags: ['Adventure', 'Comedy'],
    rightsConfirmed: true,
    termsAcceptedAt: new Date(),
    licenseType: 'original',
  },
  {
    name: 'Zoro — Asura Phantom',
    series: 'One Piece',
    price: 4.99,
    badge: 'CLASSIC',
    badgeType: 'neon',
    rating: 4.7,
    reviews: 245,
    img: 'https://images.unsplash.com/photo-1580130732478-4e339fb33746?w=800&h=600&fit=crop',
    resolution: '2K HD',
    tags: ['Action', 'Adventure'],
    rightsConfirmed: true,
    termsAcceptedAt: new Date(),
    licenseType: 'original',
  },
  {
    name: 'Kaneki Ken — Red Spider Lily',
    series: 'Tokyo Ghoul',
    price: 5.99,
    badge: 'HOT',
    badgeType: 'pink',
    rating: 4.8,
    reviews: 312,
    img: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&h=600&fit=crop',
    resolution: '4K Ultra HD',
    tags: ['Dark Fantasy', 'Horror'],
    rightsConfirmed: true,
    termsAcceptedAt: new Date(),
    licenseType: 'original',
  },
  {
    name: 'Tanjiro Kamado — Hinokami Kagura',
    series: 'Demon Slayer',
    price: 6.49,
    badge: 'BESTSELLER',
    badgeType: 'neon',
    rating: 4.9,
    reviews: 420,
    img: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=800&h=600&fit=crop',
    resolution: '4K Ultra HD',
    tags: ['Action', 'Historical'],
    rightsConfirmed: true,
    termsAcceptedAt: new Date(),
    licenseType: 'original',
  },
  {
    name: 'Zenitsu Agatsuma — Thunder Flash',
    series: 'Demon Slayer',
    price: 4.99,
    badge: 'NEW',
    badgeType: 'pink',
    rating: 4.7,
    reviews: 198,
    img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=600&fit=crop',
    resolution: '2K HD',
    tags: ['Action', 'Comedy'],
    rightsConfirmed: true,
    termsAcceptedAt: new Date(),
    licenseType: 'original',
  },
  {
    name: 'Kyojuro Rengoku — Set Your Heart Ablaze',
    series: 'Demon Slayer',
    price: 7.99,
    badge: 'PREMIUM',
    badgeType: 'neon',
    rating: 5.0,
    reviews: 612,
    img: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&h=600&fit=crop',
    resolution: '4K Ultra HD',
    tags: ['Action', 'Drama'],
    rightsConfirmed: true,
    termsAcceptedAt: new Date(),
    licenseType: 'original',
  },
  {
    name: 'Killua Zoldyck — Godspeed',
    series: 'Hunter x Hunter',
    price: 5.99,
    badge: 'BESTSELLER',
    badgeType: 'pink',
    rating: 4.9,
    reviews: 295,
    img: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&h=600&fit=crop',
    resolution: '4K Ultra HD',
    tags: ['Action', 'Supernatural'],
    rightsConfirmed: true,
    termsAcceptedAt: new Date(),
    licenseType: 'original',
  },
  {
    name: 'Edward Elric — Equivalent Exchange',
    series: 'Fullmetal Alchemist',
    price: 4.49,
    badge: 'CLASSIC',
    badgeType: 'neon',
    rating: 4.8,
    reviews: 384,
    img: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&h=600&fit=crop',
    resolution: '2K HD',
    tags: ['Adventure', 'Drama'],
    rightsConfirmed: true,
    termsAcceptedAt: new Date(),
    licenseType: 'original',
  },
  {
    name: 'Eren Yeager — Rumble Vanguard',
    series: 'Attack on Titan',
    price: 6.99,
    badge: 'HOT',
    badgeType: 'pink',
    rating: 4.9,
    reviews: 504,
    img: 'https://images.unsplash.com/photo-1533158326339-7f3cf2404354?w=800&h=600&fit=crop',
    resolution: '4K Ultra HD',
    tags: ['Action', 'Military'],
    rightsConfirmed: true,
    termsAcceptedAt: new Date(),
    licenseType: 'original',
  },
  {
    name: 'Sasuke Uchiha — Rinnegan Chidori',
    series: 'Naruto Shippuden',
    price: 5.49,
    badge: 'BESTSELLER',
    badgeType: 'neon',
    rating: 4.8,
    reviews: 442,
    img: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&h=600&fit=crop',
    resolution: '4K Ultra HD',
    tags: ['Action', 'Supernatural'],
    rightsConfirmed: true,
    termsAcceptedAt: new Date(),
    licenseType: 'original',
  },
  {
    name: 'Kakashi Hatake — Lightning Blade',
    series: 'Naruto Shippuden',
    price: 4.99,
    badge: 'CLASSIC',
    badgeType: 'pink',
    rating: 4.9,
    reviews: 371,
    img: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=600&fit=crop',
    resolution: '2K HD',
    tags: ['Action', 'Ninja'],
    rightsConfirmed: true,
    termsAcceptedAt: new Date(),
    licenseType: 'original',
  },
  {
    name: 'Vegeta — Royal Blue Ego',
    series: 'Dragon Ball Super',
    price: 5.99,
    badge: 'HOT',
    badgeType: 'neon',
    rating: 4.8,
    reviews: 290,
    img: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&h=600&fit=crop',
    resolution: '4K Ultra HD',
    tags: ['Action', 'Martial Arts'],
    rightsConfirmed: true,
    termsAcceptedAt: new Date(),
    licenseType: 'original',
  },
  {
    name: 'Son Goku — Mastered Ultra Instinct',
    series: 'Dragon Ball Super',
    price: 6.99,
    badge: 'PREMIUM',
    badgeType: 'pink',
    rating: 4.9,
    reviews: 588,
    img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&h=600&fit=crop',
    resolution: '4K Ultra HD',
    tags: ['Action', 'Martial Arts'],
    rightsConfirmed: true,
    termsAcceptedAt: new Date(),
    licenseType: 'original',
  },
  {
    name: 'David Martinez — Cyber Sandevistan',
    series: 'Cyberpunk Edgerunners',
    price: 6.49,
    badge: 'NEW',
    badgeType: 'neon',
    rating: 4.9,
    reviews: 211,
    img: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&h=600&fit=crop',
    resolution: '4K Ultra HD',
    tags: ['Cyberpunk', 'Sci-Fi'],
    rightsConfirmed: true,
    termsAcceptedAt: new Date(),
    licenseType: 'original',
  },
  {
    name: 'Ryomen Sukuna — Malevolent Shrine',
    series: 'Jujutsu Kaisen',
    price: 7.49,
    badge: 'PREMIUM',
    badgeType: 'pink',
    rating: 5.0,
    reviews: 430,
    img: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&h=600&fit=crop',
    resolution: '4K Ultra HD',
    tags: ['Action', 'Dark Fantasy'],
    rightsConfirmed: true,
    termsAcceptedAt: new Date(),
    licenseType: 'original',
  },
  {
    name: 'Megumi Fushiguro — Shadow Chimera',
    series: 'Jujutsu Kaisen',
    price: 4.99,
    badge: 'NEW',
    badgeType: 'neon',
    rating: 4.7,
    reviews: 172,
    img: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&h=600&fit=crop',
    resolution: '2K HD',
    tags: ['Action', 'Supernatural'],
    rightsConfirmed: true,
    termsAcceptedAt: new Date(),
    licenseType: 'original',
  },
  {
    name: 'Kurosaki Ichigo — Final Getsuga',
    series: 'Bleach',
    price: 5.49,
    badge: 'CLASSIC',
    badgeType: 'pink',
    rating: 4.8,
    reviews: 320,
    img: 'https://images.unsplash.com/photo-1561715276-a2d087060f1d?w=800&h=600&fit=crop',
    resolution: '4K Ultra HD',
    tags: ['Action', 'Swordplay'],
    rightsConfirmed: true,
    termsAcceptedAt: new Date(),
    licenseType: 'original',
  },
  {
    name: 'Makima — Control Devil',
    series: 'Chainsaw Man',
    price: 6.99,
    badge: 'HOT',
    badgeType: 'neon',
    rating: 4.9,
    reviews: 512,
    img: 'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=800&h=600&fit=crop',
    resolution: '4K Ultra HD',
    tags: ['Dark Fantasy', 'Thriller'],
    rightsConfirmed: true,
    termsAcceptedAt: new Date(),
    licenseType: 'original',
  },
  {
    name: 'Denji — Chainsaw Slash',
    series: 'Chainsaw Man',
    price: 5.99,
    badge: 'NEW',
    badgeType: 'pink',
    rating: 4.8,
    reviews: 284,
    img: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&h=600&fit=crop',
    resolution: '4K Ultra HD',
    tags: ['Action', 'Gore'],
    rightsConfirmed: true,
    termsAcceptedAt: new Date(),
    licenseType: 'original',
  },
  {
    name: 'Lelouch Lamperouge — Rebellion',
    series: 'Code Geass',
    price: 6.49,
    badge: 'CLASSIC',
    badgeType: 'neon',
    rating: 4.9,
    reviews: 489,
    img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop',
    resolution: '4K Ultra HD',
    tags: ['Sci-Fi', 'Mecha'],
    rightsConfirmed: true,
    termsAcceptedAt: new Date(),
    licenseType: 'original',
  },
];

// Default admin user
const adminUser = {
  name: 'Admin',
  email: 'admin@anicart.com',
  password: 'Admin@1234',
  role: 'admin',
};

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info('MongoDB connected', { host: conn.connection.host });
    logger.info('Database selected', { name: conn.connection.name });
  } catch (error) {
    logger.error('Error connecting to MongoDB', { error: error.message });
    process.exit(1);
  }
};

/**
 * Seed products to database
 */
const seedProducts = async () => {
  try {
    logger.info('Seeding products started');
    
    // Delete existing products
    await Product.deleteMany({});
    logger.info('Cleared existing products');

    // Insert new products
    const createdProducts = await Product.insertMany(productsData);
    logger.info('Created products', { count: createdProducts.length });

    // Log created products
    createdProducts.forEach((product) => {
      logger.info('Created product', {
        name: product.name,
        series: product.series,
        price: product.price,
      });
    });

    return createdProducts;
  } catch (error) {
    logger.error('Error seeding products', { error: error.message });
    throw error;
  }
};

/**
 * Seed admin user to database
 */
const seedAdminUser = async () => {
  try {
    logger.info('Seeding admin user started');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminUser.email });
    if (existingAdmin) {
      logger.info('Admin user already exists, skipping');
      return existingAdmin;
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
    const hashedPassword = await bcrypt.hash(adminUser.password, saltRounds);

    // Create admin user
    const createdAdmin = await User.create({
      ...adminUser,
      password: hashedPassword,
      avatar: adminUser.name.charAt(0).toUpperCase(),
    });

    logger.info('Admin user created successfully', {
      name: createdAdmin.name,
      email: createdAdmin.email,
      role: createdAdmin.role,
    });

    return createdAdmin;
  } catch (error) {
    logger.error('Error seeding admin user', { error: error.message });
    throw error;
  }
};

/**
 * Main seed function
 */
const seedDatabase = async () => {
  try {
    logger.info('AniCart database seeder started');

    // Connect to database
    await connectDB();

    // Seed products
    await seedProducts();

    // Seed admin user
    await seedAdminUser();

    logger.info('Seeding completed successfully');

    // Close connection
    await mongoose.connection.close();
    logger.info('Database connection closed');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed', { error: error.message });

    // Close connection if open
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

// Run seeder
seedDatabase();
