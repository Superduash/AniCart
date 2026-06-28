/**
 * Express application — middleware, routes, error handling.
 */

const express = require('express');
const config = require('./config');

// Sentry setup (conditional)
let Sentry;
if (config.SENTRY_DSN) {
  Sentry = require('@sentry/node');
  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: config.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
  });
}
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const { errorHandler, notFound } = require('./middleware/errorHandler');
const routes = require('./routes');
const { router: workerRoutes, serverAdapter: bullBoardAdapter } = require('./routers/workerRoutes');
const { protect, adminOnly } = require('./middleware/authMiddleware');

const app = express();

// Trust a single reverse-proxy hop (e.g., Render/Nginx/Netlify proxy).
app.set('trust proxy', 1);

// Sentry request handler (must be first)
if (Sentry) {
  app.use(Sentry.Handlers.requestHandler());
}

// Compress all responses
app.use(compression());

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:", "wss:"],
      fontSrc: ["'self'", "https:", "data:"],
      frameSrc: ["'self'", "https:"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Permissions-Policy header
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), browsing-topics=()');
  next();
});

// API Versioning header
app.use((req, res, next) => {
  res.setHeader('X-API-Version', '1.0');
  next();
});

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://anicartweb.netlify.app',
  config.CLIENT_URL,
].filter((url) => url && url !== 'undefined');

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin) || /\.onrender\.com$/.test(origin)) {
        callback(null, true);
      } else {
        // Echo unknown origins to prevent blocking production frontends, but log them
        console.warn(`[CORS] Allowing unknown origin dynamically: ${origin}`);
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Stripe webhook must use raw body before express.json()
app.use('/api/v1/webhooks/stripe', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(mongoSanitize());
app.use(hpp());
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('AniCart API is running...');
});


app.get('/api/health', async (req, res) => {
  const mongoose = require('mongoose');
  const { redisConnection } = require('./config/redis');
  const { s3Client } = require('./config/r2');
  const { ListObjectsV2Command } = require('@aws-sdk/client-s3');

  let mongoStatus = 'disconnected';
  try {
    if (mongoose.connection.readyState === 1) {
      mongoStatus = 'connected';
    }
  } catch (err) {
    mongoStatus = 'error';
  }

  let redisStatus = 'disconnected';
  if (config.REDIS_URL) {
    try {
      if (redisConnection) {
        await redisConnection.ping();
        redisStatus = 'connected';
      } else {
        redisStatus = 'warning';
      }
    } catch (err) {
      redisStatus = 'error';
    }
  } else {
    redisStatus = 'warning';
  }

  let r2Status = 'disconnected';
  if (config.R2_ACCOUNT_ID && config.R2_ACCESS_KEY_ID && config.R2_SECRET_ACCESS_KEY && config.R2_BUCKET_NAME) {
    try {
      await s3Client.send(new ListObjectsV2Command({ Bucket: config.R2_BUCKET_NAME, MaxKeys: 1 }));
      r2Status = 'connected';
    } catch (err) {
      r2Status = 'error';
    }
  } else {
    r2Status = 'warning';
  }

  const isHealthy = mongoStatus === 'connected';

  res.status(isHealthy ? 200 : 500).json({
    success: isHealthy,
    services: {
      mongodb: mongoStatus,
      redis: redisStatus,
      r2: r2Status,
    },
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  });
});

app.use('/', require('./routers/seoRoutes'));
app.use('/api/v1', routes);

// Worker health endpoint
app.use('/api/v1/worker', workerRoutes);

// Bull Board dashboard for BullMQ
if (bullBoardAdapter) {
  app.use('/admin/queues', protect, adminOnly, bullBoardAdapter.getRouter());
}

app.use(notFound);

// Sentry error handler BEFORE custom error handler
if (Sentry) {
  app.use(Sentry.Handlers.errorHandler());
}

// Custom error handler LAST
app.use(errorHandler);

module.exports = app;
