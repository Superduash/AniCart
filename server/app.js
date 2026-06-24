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
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

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

app.use(helmet());

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
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(morgan(config.isDevelopment ? 'dev' : 'combined'));

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


app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  });
});

app.use('/api/v1', routes);

// Worker health endpoint
app.use('/api/v1/worker', workerRoutes);

// Bull Board dashboard for BullMQ
app.use('/admin/queues', protect, adminOnly, bullBoardAdapter.getRouter());

app.use(notFound);

// Sentry error handler BEFORE custom error handler
if (Sentry) {
  app.use(Sentry.Handlers.errorHandler());
}

// Custom error handler LAST
app.use(errorHandler);

module.exports = app;
