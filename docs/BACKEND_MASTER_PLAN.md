# ANICART — BACKEND MASTER DEVELOPMENT PLAN

> **Version:** 2.0 — March 2026
> **Developer:** Solo (you)
> **Timeline:** 14 days
> **Monthly Cost:** ₹0 (all free-tier / student pack)

---

## TABLE OF CONTENTS

1. [Stack & Infrastructure](#stack--infrastructure)
2. [Existing Code Inventory](#existing-code-inventory)
3. [Critical Bugs to Fix](#critical-bugs-to-fix)
4. [Final Folder Structure](#final-folder-structure)
5. [Final Database Schema List](#final-database-schema-list)
6. [Final API Route List](#final-api-route-list)
7. [Final Environment Variables](#final-environment-variables)
8. [Day 1 — Service Layer + Repository Pattern](#day-1--service-layer--repository-pattern)
9. [Day 2 — Cloudflare R2 Storage + Upload System](#day-2--cloudflare-r2-storage--upload-system)
10. [Day 3 — Image Processing Pipeline (Sharp)](#day-3--image-processing-pipeline-sharp)
11. [Day 4 — BullMQ Background Jobs + Worker Process](#day-4--bullmq-background-jobs--worker-process)
12. [Day 5 — License System + Secure Downloads](#day-5--license-system--secure-downloads)
13. [Day 6 — Stripe Payments (Checkout Sessions)](#day-6--stripe-payments-checkout-sessions)
14. [Day 7 — Stripe Webhooks + Order Fulfillment](#day-7--stripe-webhooks--order-fulfillment)
15. [Day 8 — Email System (Resend)](#day-8--email-system-resend)
16. [Day 9 — Redis Caching + Rate Limiting Upgrade](#day-9--redis-caching--rate-limiting-upgrade)
17. [Day 10 — Search (Meilisearch)](#day-10--search-meilisearch)
18. [Day 11 — Creator Accounts + User Uploads](#day-11--creator-accounts--user-uploads)
19. [Day 12 — Admin Panel API + Moderation Queue](#day-12--admin-panel-api--moderation-queue)
20. [Day 13 — Notifications + Wishlist + Socket.IO](#day-13--notifications--wishlist--socketio)
21. [Day 14 — Logging, Sentry, Security Hardening, Deploy](#day-14--logging-sentry-security-hardening-deploy)
22. [Deployment Steps](#deployment-steps)

---

## STACK & INFRASTRUCTURE

### Services (All Free)

| Layer | Service | Free Tier | Source |
|-------|---------|-----------|--------|
| Backend Hosting | DigitalOcean Droplet | $200 credit (~1 year) | Student Pack |
| Frontend Hosting | Netlify | 100GB bandwidth, unlimited deploys | Free tier |
| Database | MongoDB Atlas M0 | 512MB + $50 credit + Atlas Search | Free + Pack |
| Cache / Rate Limit | Upstash Redis | 500K commands/mo, 256MB | Free tier |
| Object Storage | Cloudflare R2 | 10GB storage, 0 egress fees | Free tier |
| CDN | Cloudflare | Unlimited bandwidth | Free tier |
| Payments | Stripe | First $1,000 zero fees | Student Pack |
| Email | Resend | 3,000 emails/month | Free tier |
| Search | Meilisearch | Self-hosted on Droplet | Open source |
| Error Tracking | Sentry | 50K errors, 5M spans/mo | Student Pack (1yr) |
| Monitoring | Datadog | Pro, 10 servers | Student Pack (2yr) |
| Secrets | Doppler | Team plan | Student Pack |
| Domain | Namecheap | 1 free .me domain + SSL | Student Pack |
| AI Code | GitHub Copilot | Unlimited | Student Pack |

### npm Packages (Final `package.json`)

```bash
# Core
npm install express mongoose bcrypt jsonwebtoken cookie-parser cors dotenv

# Security & Middleware
npm install helmet morgan express-validator express-async-errors express-mongo-sanitize hpp

# File Handling & Images
npm install multer sharp

# Cloudflare R2 (S3-compatible)
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Redis (Upstash — HTTP + TCP)
npm install @upstash/redis @upstash/ratelimit ioredis

# Background Jobs
npm install bullmq

# Payments
npm install stripe

# Email
npm install resend

# Search
npm install meilisearch

# Logging & Errors
npm install winston http-status-codes @sentry/node

# Real-time
npm install socket.io

# Dev Dependencies
npm install -D nodemon concurrently
```

---

## EXISTING CODE INVENTORY

These files already exist and work. The plan preserves them and refactors incrementally.

| File | Status | Day Modified |
|------|--------|--------------|
| `controllers/authController.js` | ✅ Working | Day 1 (refactor to use service) |
| `controllers/cartController.js` | ✅ Working | Day 1 (refactor to use service) |
| `controllers/orderController.js` | ✅ Working | Day 6-7 (add Stripe) |
| `controllers/productController.js` | ✅ Working | Day 1 (refactor to use service) |
| `controllers/userController.js` | ✅ Working | Day 1 (refactor to use service) |
| `models/Cart.js` | ✅ Working | Day 1 (remove qty, make set-based) |
| `models/Order.js` | ✅ Working | Day 6 (add payment fields) |
| `models/Product.js` | ✅ Working | Day 3 (add assets sub-doc) |
| `models/User.js` | ✅ Working | Day 5 (remove library[]) |
| `routers/authRoutes.js` | ✅ Working | Day 9 (upgrade rate limiter) |
| `routers/cartRoutes.js` | ✅ Working | Minor updates |
| `routers/orderRoutes.js` | ✅ Working | Day 7 (add webhook route) |
| `routers/productRoutes.js` | ✅ Working | Day 2 (add upload route) |
| `routers/userRoutes.js` | ✅ Working | Day 5 (add library route) |
| `middleware/authMiddleware.js` | ✅ Working | Day 11 (add creator role) |
| `middleware/rateLimiter.js` | ✅ Working | Day 9 (switch to Upstash) |
| `middleware/validateRequest.js` | ✅ Working | Add new validators as needed |
| `utils/apiError.js` | ✅ Working | Keep as-is |
| `utils/apiResponse.js` | ✅ Working | Keep as-is |
| `utils/catchAsync.js` | ✅ Working | Keep as-is |
| `utils/constants.js` | ✅ Working | Add new constants |
| `utils/generateToken.js` | ✅ Working | Keep as-is |

---

## CRITICAL BUGS TO FIX

These bugs exist in the current code and MUST be fixed during the 14 days:

| Bug | File | Fix | Day |
|-----|------|-----|-----|
| Orders auto-complete without payment | `Order.createFromCart()` sets `status: 'completed'` | Change default to `'pending'`. Only set `'completed'` after Stripe webhook confirms payment. | Day 6 |
| `User.library[]` will hit 16MB doc limit | `User.js` has `library: [ObjectId]` embedded | Replace with separate `License` collection. Remove `library` from User schema. | Day 5 |
| Cart has `qty` field for digital goods | `Cart.js` `cartItemSchema` has `qty` | Digital wallpapers are always qty=1. Remove qty, treat cart as a Set of product IDs. | Day 1 |
| No checkout idempotency | `orderController.checkout()` | Add `idempotencyKey` field to Order. Check Redis for duplicate within 60s window. | Day 7 |
| `getProducts` calls `getDistinctSeries()` on every request | `productController.js` line ~40 | Cache series list in Redis with 5-min TTL. | Day 9 |
| No file upload — `img` is just a URL string | `Product.js` `img: String` | Replace with `assets` sub-document after building upload pipeline. | Day 3 |

---

## FINAL FOLDER STRUCTURE

```
server/
├── src/
│   ├── config/
│   │   ├── index.js              # Central config (existing, expand)
│   │   ├── database.js           # MongoDB connection
│   │   ├── redis.js              # Upstash Redis client
│   │   ├── r2.js                 # Cloudflare R2 S3 client
│   │   ├── stripe.js             # Stripe instance
│   │   ├── meilisearch.js        # Meilisearch client
│   │   ├── email.js              # Resend client
│   │   ├── socket.js             # Socket.IO setup
│   │   └── sentry.js             # Sentry init
│   │
│   ├── models/
│   │   ├── User.js               # (existing — remove library[])
│   │   ├── Product.js            # (existing — add assets sub-doc)
│   │   ├── Cart.js               # (existing — remove qty)
│   │   ├── Order.js              # (existing — add payment fields)
│   │   ├── License.js            # NEW: who owns which wallpaper
│   │   ├── Creator.js            # NEW: artist profile + payout info
│   │   ├── Review.js             # NEW: ratings & reviews
│   │   ├── Wishlist.js           # NEW: saved items
│   │   ├── Notification.js       # NEW: in-app notifications
│   │   ├── ModerationLog.js      # NEW: content moderation audit
│   │   └── Banner.js             # NEW: homepage banners
│   │
│   ├── services/
│   │   ├── authService.js
│   │   ├── userService.js
│   │   ├── productService.js
│   │   ├── cartService.js
│   │   ├── orderService.js
│   │   ├── paymentService.js      # Stripe checkout + webhook logic
│   │   ├── licenseService.js      # Grant, revoke, verify licenses
│   │   ├── uploadService.js       # Multer + R2 upload orchestration
│   │   ├── imageService.js        # Sharp resize, watermark, thumbnails
│   │   ├── downloadService.js     # Signed URL generation
│   │   ├── searchService.js       # Meilisearch index + query
│   │   ├── emailService.js        # Resend templates
│   │   ├── creatorService.js      # Creator CRUD + analytics
│   │   ├── moderationService.js   # Content review queue
│   │   ├── notificationService.js # In-app + Socket.IO push
│   │   ├── wishlistService.js
│   │   ├── reviewService.js
│   │   ├── adminService.js        # Admin dashboard stats
│   │   └── cacheService.js        # Redis get/set/invalidate helpers
│   │
│   ├── controllers/
│   │   ├── authController.js      # (existing — thin: call service)
│   │   ├── userController.js      # (existing — thin: call service)
│   │   ├── productController.js   # (existing — thin: call service)
│   │   ├── cartController.js      # (existing — thin: call service)
│   │   ├── orderController.js     # (existing — thin: call service)
│   │   ├── uploadController.js    # NEW
│   │   ├── downloadController.js  # NEW
│   │   ├── paymentController.js   # NEW: webhook handler
│   │   ├── searchController.js    # NEW
│   │   ├── creatorController.js   # NEW
│   │   ├── adminController.js     # NEW
│   │   ├── wishlistController.js  # NEW
│   │   ├── reviewController.js    # NEW
│   │   └── notificationController.js # NEW
│   │
│   ├── routes/
│   │   ├── index.js               # Route aggregator: /api/v1/*
│   │   ├── authRoutes.js          # (existing)
│   │   ├── userRoutes.js          # (existing)
│   │   ├── productRoutes.js       # (existing — add upload sub-routes)
│   │   ├── cartRoutes.js          # (existing)
│   │   ├── orderRoutes.js         # (existing)
│   │   ├── uploadRoutes.js        # NEW
│   │   ├── downloadRoutes.js      # NEW
│   │   ├── webhookRoutes.js       # NEW: Stripe webhook (raw body!)
│   │   ├── searchRoutes.js        # NEW
│   │   ├── creatorRoutes.js       # NEW
│   │   ├── adminRoutes.js         # NEW
│   │   ├── wishlistRoutes.js      # NEW
│   │   ├── reviewRoutes.js        # NEW
│   │   └── notificationRoutes.js  # NEW
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js      # (existing — add creator role check)
│   │   ├── rateLimiter.js         # (existing — upgrade to Upstash)
│   │   ├── validateRequest.js     # (existing — add new validators)
│   │   ├── multerUpload.js        # NEW: file upload config
│   │   ├── errorHandler.js        # (existing or new centralized)
│   │   └── requestLogger.js       # NEW: Winston request logging
│   │
│   ├── jobs/
│   │   ├── queues.js              # BullMQ queue definitions
│   │   ├── imageProcessor.js      # Worker: resize, watermark, thumbnail
│   │   ├── emailSender.js         # Worker: send transactional emails
│   │   └── searchIndexer.js       # Worker: sync product to Meilisearch
│   │
│   ├── utils/
│   │   ├── apiError.js            # (existing)
│   │   ├── apiResponse.js         # (existing)
│   │   ├── catchAsync.js          # (existing)
│   │   ├── constants.js           # (existing — expand)
│   │   ├── generateToken.js       # (existing)
│   │   └── logger.js              # NEW: Winston logger instance
│   │
│   └── app.js                     # Express app setup
│
├── worker.js                      # Separate process for BullMQ workers
├── server.js                      # Main entry: start app + socket.io
├── package.json
├── .env.example
├── Dockerfile
├── docker-compose.yml             # Local dev: MongoDB + Redis + Meilisearch
└── ecosystem.config.js            # PM2 config for production
```

---

## FINAL DATABASE SCHEMA LIST

### 1. User (evolve existing)

```
{
  name:           String (required, 2-50 chars)
  email:          String (required, unique, lowercase)
  password:       String (required, min 8, select: false)
  avatar:         String (default: first letter of name)
  role:           String (enum: 'user', 'creator', 'admin', default: 'user')
  points:         Number (default: 150)
  streakDays:     Number (default: 1)
  purchasesCount: Number (default: 0)
  // REMOVED: library[] — replaced by License model
  timestamps:     true
}
Indexes: email (unique)
```

### 2. Product (evolve existing)

```
{
  name:        String (required, max 100)
  series:      String (required, indexed)
  creator:     ObjectId → User (NEW — ref to uploader)
  price:       Number (required, min 0)
  badge:       String (enum: HOT, NEW, BESTSELLER, CLASSIC, PREMIUM, '')
  badgeType:   String (enum: neon, pink, '')
  rating:      Number (0-5, default 0)
  reviewCount: Number (default 0)
  resolution:  String (default: '4K Ultra HD')
  tags:        [String]
  isActive:    Boolean (default: true)
  isFeatured:  Boolean (default: false)  // NEW

  // NEW — replaces single `img` string
  assets: {
    original:  { url: String, key: String, size: Number, format: String }
    variants: {
      '4k':    { url: String, key: String, width: Number, height: Number }
      '2k':    { url: String, key: String, width: Number, height: Number }
      'fhd':   { url: String, key: String, width: Number, height: Number }
      'mobile':{ url: String, key: String, width: Number, height: Number }
    }
    thumbnail: { url: String, key: String }
    preview:   { url: String, key: String }    // watermarked
    status:    String (enum: processing, ready, flagged, rejected)
  }

  downloadCount:  Number (default: 0)  // NEW
  viewCount:      Number (default: 0)  // NEW
  timestamps:     true
}
Indexes: series, tags, isActive, creator, isFeatured
```

### 3. Cart (evolve existing)

```
{
  user:   ObjectId → User (required, unique)
  items:  [{ product: ObjectId → Product }]   // NO qty — digital = always 1
  timestamps: true
}
Indexes: user (unique)
```

### 4. Order (evolve existing)

```
{
  user:              ObjectId → User (required)
  items: [{
    product:         ObjectId → Product
    name:            String
    price:           Number
    img:             String  // thumbnail URL at time of purchase
  }]
  subtotal:          Number
  tax:               Number
  total:             Number
  status:            String (enum: pending, payment_processing, completed, failed, refunded)
  paymentIntentId:   String  // NEW — Stripe payment intent ID
  checkoutSessionId: String  // NEW — Stripe checkout session ID
  gateway:           String  // NEW — 'stripe' (future: 'razorpay')
  idempotencyKey:    String  // NEW — prevent duplicate orders
  timestamps:        true
}
Indexes: { user: 1, createdAt: -1 }, status, paymentIntentId, idempotencyKey
```

### 5. License (NEW)

```
{
  user:      ObjectId → User (required)
  product:   ObjectId → Product (required)
  order:     ObjectId → Order (required)
  grantedAt: Date (default: now)
  revokedAt: Date (default: null)
  isActive:  Boolean (default: true)
}
Indexes: { user: 1, product: 1 } (compound unique), order
```

### 6. Creator (NEW)

```
{
  user:           ObjectId → User (required, unique)
  displayName:    String (required)
  bio:            String (max 500)
  portfolioUrl:   String
  socialLinks: {
    twitter:      String
    instagram:    String
    pixiv:        String
  }
  totalUploads:   Number (default: 0)
  totalDownloads: Number (default: 0)
  totalEarnings:  Number (default: 0)
  isVerified:     Boolean (default: false)
  isApproved:     Boolean (default: false)  // admin must approve
  timestamps:     true
}
Indexes: user (unique), isApproved
```

### 7. Review (NEW)

```
{
  user:    ObjectId → User (required)
  product: ObjectId → Product (required)
  rating:  Number (1-5, required)
  comment: String (max 500)
  timestamps: true
}
Indexes: { user: 1, product: 1 } (compound unique), product
```

### 8. Wishlist (NEW)

```
{
  user:     ObjectId → User (required, unique)
  products: [ObjectId → Product]
  timestamps: true
}
Indexes: user (unique)
```

### 9. Notification (NEW)

```
{
  user:    ObjectId → User (required)
  type:    String (enum: order_complete, upload_ready, upload_rejected, welcome, admin)
  title:   String (required)
  message: String (required)
  link:    String
  isRead:  Boolean (default: false)
  timestamps: true
}
Indexes: { user: 1, isRead: 1, createdAt: -1 }
```

### 10. ModerationLog (NEW)

```
{
  product:     ObjectId → Product (required)
  submittedBy: ObjectId → User (required)
  status:      String (enum: pending, approved, rejected)
  reason:      String
  reviewedBy:  ObjectId → User
  reviewedAt:  Date
  timestamps:  true
}
Indexes: status, submittedBy
```

### 11. Banner (NEW)

```
{
  title:       String (required)
  subtitle:    String
  imageUrl:    String (required)
  linkUrl:     String
  position:    Number (for ordering)
  isActive:    Boolean (default: true)
  timestamps:  true
}
Indexes: isActive, position
```

---

## FINAL API ROUTE LIST

All routes prefixed with `/api/v1`

### Auth (`/api/v1/auth`)
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/register` | Public | Register new user |
| POST | `/login` | Public | Login user |
| POST | `/logout` | Private | Logout + clear cookie |
| POST | `/refresh` | Public | Refresh access token |
| GET | `/me` | Private | Get current user |
| POST | `/forgot-password` | Public | Send reset email |
| POST | `/reset-password/:token` | Public | Reset password |

### Users (`/api/v1/users`)
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/profile` | Private | Get profile |
| PUT | `/profile` | Private | Update profile |
| PUT | `/password` | Private | Change password |
| GET | `/library` | Private | Get purchased wallpapers (from License model) |
| GET | `/stats` | Private | Get user stats (purchases, points) |

### Products (`/api/v1/products`)
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/` | Public | List products (paginated, filtered) |
| GET | `/featured` | Public | Get featured wallpapers |
| GET | `/series/list` | Public | Get distinct series |
| GET | `/:id` | Public | Get single product |
| POST | `/` | Admin | Create product |
| PUT | `/:id` | Admin | Update product |
| DELETE | `/:id` | Admin | Soft delete product |
| PUT | `/:id/restore` | Admin | Restore product |

### Upload (`/api/v1/upload`)
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/wallpaper` | Admin/Creator | Upload wallpaper image |
| GET | `/status/:productId` | Admin/Creator | Check processing status |

### Download (`/api/v1/download`)
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/:productId/:resolution` | Private | Get signed download URL (license required) |

### Cart (`/api/v1/cart`)
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/` | Private | Get cart |
| POST | `/add` | Private | Add product to cart |
| DELETE | `/remove/:productId` | Private | Remove from cart |
| DELETE | `/clear` | Private | Clear cart |
| POST | `/sync` | Private | Sync client cart |

### Orders (`/api/v1/orders`)
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/checkout` | Private | Create Stripe checkout session |
| GET | `/` | Private | Get order history |
| GET | `/stats/summary` | Private | Get order stats |
| GET | `/:id` | Private | Get single order |

### Payments (`/api/v1/payments`)
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/webhook` | Public (Stripe) | Stripe webhook (raw body) |
| GET | `/success` | Private | Post-payment success redirect |
| GET | `/cancel` | Private | Post-payment cancel redirect |

### Search (`/api/v1/search`)
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/` | Public | Search wallpapers (Meilisearch) |
| GET | `/suggestions` | Public | Search autocomplete |

### Creators (`/api/v1/creators`)
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/apply` | Private | Apply for creator account |
| GET | `/profile` | Creator | Get creator profile |
| PUT | `/profile` | Creator | Update creator profile |
| GET | `/uploads` | Creator | List my uploads |
| GET | `/stats` | Creator | Creator analytics |

### Wishlist (`/api/v1/wishlist`)
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/` | Private | Get wishlist |
| POST | `/:productId` | Private | Add to wishlist |
| DELETE | `/:productId` | Private | Remove from wishlist |

### Reviews (`/api/v1/reviews`)
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/product/:productId` | Public | Get reviews for product |
| POST | `/product/:productId` | Private | Add review (must own) |
| DELETE | `/:reviewId` | Private | Delete own review |

### Notifications (`/api/v1/notifications`)
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/` | Private | Get notifications |
| PUT | `/:id/read` | Private | Mark as read |
| PUT | `/read-all` | Private | Mark all as read |

### Admin (`/api/v1/admin`)
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/dashboard` | Admin | Dashboard stats (users, revenue, orders) |
| GET | `/users` | Admin | List all users |
| PUT | `/users/:id/role` | Admin | Change user role |
| GET | `/orders` | Admin | List all orders |
| GET | `/moderation` | Admin | Get moderation queue |
| PUT | `/moderation/:productId/approve` | Admin | Approve upload |
| PUT | `/moderation/:productId/reject` | Admin | Reject upload |
| GET | `/creators` | Admin | List creator applications |
| PUT | `/creators/:id/approve` | Admin | Approve creator |
| POST | `/banners` | Admin | Create banner |
| PUT | `/banners/:id` | Admin | Update banner |
| DELETE | `/banners/:id` | Admin | Delete banner |
| PUT | `/products/:id/feature` | Admin | Toggle featured |
| POST | `/notifications/broadcast` | Admin | Send notification to all/group |

---

## FINAL ENVIRONMENT VARIABLES

```env
# Server
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/anicart

# JWT
JWT_ACCESS_SECRET=your-access-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Bcrypt
BCRYPT_SALT_ROUNDS=12

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-rest-token
REDIS_URL=rediss://default:your-token@your-instance.upstash.io:6379

# Cloudflare R2
R2_ACCOUNT_ID=your-cf-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=anicart-images
R2_PUBLIC_URL=https://pub-xxx.r2.dev

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_SUCCESS_URL=http://localhost:3000/payment/success
STRIPE_CANCEL_URL=http://localhost:3000/payment/cancel

# Resend
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@anicart.me

# Meilisearch
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=your-master-key

# Sentry
SENTRY_DSN=https://xxx@sentry.io/xxx

# Doppler (manages all above in production)
DOPPLER_TOKEN=dp.st.xxx
```

---

---

# 14-DAY DEVELOPMENT PLAN

---

## DAY 1 — Service Layer + Repository Pattern

### Goal
Refactor existing controllers to use a Service Layer. Controllers become thin HTTP handlers. All business logic moves to services. Fix the Cart qty bug.

### Database Schema Changes
- **Cart.js**: Remove `qty` from `cartItemSchema`. Cart items become a simple set of product refs.

### Files to Create
| File | Purpose |
|------|---------|
| `src/services/authService.js` | Register, login, token logic extracted from authController |
| `src/services/userService.js` | Profile CRUD extracted from userController |
| `src/services/productService.js` | Product CRUD + listing logic extracted from productController |
| `src/services/cartService.js` | Cart operations extracted from cartController |
| `src/services/orderService.js` | Checkout + order retrieval extracted from orderController |
| `src/services/cacheService.js` | Stub (placeholder for Day 9 Redis integration) |

### Files to Modify
| File | Change |
|------|--------|
| `controllers/authController.js` | Replace all business logic with calls to `authService` |
| `controllers/userController.js` | Replace with calls to `userService` |
| `controllers/productController.js` | Replace with calls to `productService` |
| `controllers/cartController.js` | Replace with calls to `cartService` |
| `controllers/orderController.js` | Replace with calls to `orderService` |
| `models/Cart.js` | Remove `qty` from schema. Remove `addItem` qty parameter. Update methods. |
| `routes/index.js` | Create route aggregator with `/api/v1` prefix |

### API Routes
No new routes. Existing routes stay identical — only internals change.

### Testing Checklist
- [ ] All existing API endpoints still return same responses
- [ ] POST `/api/v1/cart/add` no longer accepts `quantity` param
- [ ] Cart items are unique (adding same product twice = no duplicate)
- [ ] Order checkout still works (will be refactored on Day 6-7)

### Deployment Checklist
- [ ] No external services needed yet
- [ ] `npm test` passes
- [ ] Server starts without errors

### Codex Prompt

```
You are a senior Node.js backend engineer.

PROJECT: AniCart — a production-grade anime wallpaper marketplace.
STACK: Node.js, Express, MongoDB (Mongoose), JWT auth.
ARCHITECTURE: MVC + Service Layer pattern.

EXISTING CODE: I will provide my current controllers, models, and routes.

TASK: Refactor the backend to add a Service Layer.

RULES:
1. Controllers must ONLY handle HTTP concerns: parse req, call service, send res.
2. Services contain ALL business logic. Services never touch req/res.
3. Services receive plain JS objects (DTOs) and return plain data.
4. Services throw ApiError for error cases (the existing error class).
5. Keep all existing Mongoose models — do NOT rewrite schemas (except Cart: remove qty).
6. Keep all existing routes — do NOT change URL paths or HTTP methods.
7. Keep the existing middleware stack (authMiddleware, rateLimiter, validateRequest).

SPECIFIC CHANGES:
- Create: services/authService.js (register, login, refreshToken, getMe)
- Create: services/userService.js (getProfile, updateProfile, changePassword, getLibrary)
- Create: services/productService.js (getProducts, getProduct, createProduct, updateProduct, deleteProduct, getSeries, restoreProduct)
- Create: services/cartService.js (getCart, addToCart, removeFromCart, clearCart, syncCart)
- Create: services/orderService.js (checkout, getOrders, getOrder, cancelOrder, getOrderStats)
- Create: services/cacheService.js (stub with get/set/del methods that are no-ops for now)
- Modify: Cart model — remove qty field from cartItemSchema. Update addItem to not accept quantity. Cart is a SET (no duplicates, no qty).
- Modify: Each controller to call its corresponding service.
- Create: routes/index.js that aggregates all route files under /api/v1 prefix.

CART FIX DETAILS:
The current cart has qty per item. Wallpapers are digital goods — always qty=1.
- Remove qty from cartItemSchema
- addItem should just push productId if not already in items
- updateItemQuantity method should be removed entirely
- totalPrice virtual should just sum product prices (no qty multiplication)
- removeItem and clearCart stay the same

OUTPUT: Generate all service files and modified controller files.
For each file, provide the COMPLETE file contents (not diffs).
Include JSDoc comments on all public methods.
```

---

## DAY 2 — Cloudflare R2 Storage + Upload System

### Goal
Set up Cloudflare R2 as your S3-compatible object storage. Build the file upload pipeline using Multer (memory storage) → R2.

### External Services to Set Up
1. **Cloudflare R2**: Create bucket `anicart-images` in Cloudflare dashboard. Generate R2 API token with read/write permissions. Note the Account ID, Access Key, Secret Key, and public URL.

### Files to Create
| File | Purpose |
|------|---------|
| `src/config/r2.js` | S3Client configured for Cloudflare R2 endpoint |
| `src/middleware/multerUpload.js` | Multer memory storage config (25MB limit, PNG/JPEG/WebP only) |
| `src/services/uploadService.js` | Upload buffer to R2, generate key paths, delete from R2 |
| `src/controllers/uploadController.js` | Handle POST upload request |
| `src/routes/uploadRoutes.js` | POST `/api/v1/upload/wallpaper` |

### Files to Modify
| File | Change |
|------|--------|
| `routes/index.js` | Add upload routes |
| `.env` | Add R2 credentials |

### API Routes Added
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/v1/upload/wallpaper` | Admin | Upload a wallpaper image file |

### Testing Checklist
- [ ] Cloudflare R2 bucket created and accessible via API
- [ ] Upload a PNG file → appears in R2 bucket under `/originals/{productId}/{filename}`
- [ ] Reject files > 25MB
- [ ] Reject non-image files (e.g., .txt, .pdf)
- [ ] R2 public URL returns the uploaded image
- [ ] Delete endpoint removes file from R2

### Deployment Checklist
- [ ] R2 API token saved in Doppler
- [ ] R2 bucket CORS configured to allow your frontend origin
- [ ] `.env.example` updated with R2 vars

### Codex Prompt

```
You are a senior Node.js backend engineer.

PROJECT: AniCart — anime wallpaper marketplace.
STACK: Node.js, Express, Mongoose, Cloudflare R2 (S3-compatible).

TASK: Build the Cloudflare R2 file upload system.

EXISTING: I have a working Express app with auth middleware (protect, adminOnly) and ApiError for errors.

CREATE THESE FILES:

1. src/config/r2.js
   - Export an S3Client from @aws-sdk/client-s3 configured for Cloudflare R2
   - R2 endpoint format: https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com
   - Use env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL
   - Also export the bucket name and public URL

2. src/middleware/multerUpload.js
   - Use multer with memoryStorage (we process in-memory before uploading to R2)
   - File size limit: 25MB
   - File filter: only allow image/png, image/jpeg, image/webp
   - Export as middleware: upload.single('wallpaper')
   - On rejection, throw ApiError.badRequest with descriptive message

3. src/services/uploadService.js
   Methods:
   - uploadToR2(buffer, key, contentType): Upload buffer to R2 using PutObjectCommand. Return { url, key }.
     Key format: originals/{productId}/{uuid}.{ext}
   - deleteFromR2(key): Delete object using DeleteObjectCommand.
   - getPublicUrl(key): Return R2_PUBLIC_URL + '/' + key
   - generateKey(productId, originalName): Generate a unique storage key using uuid.

4. src/controllers/uploadController.js
   - uploadWallpaper: Receives multer file from req.file
     - Validate file exists
     - Generate storage key
     - Upload to R2 via uploadService
     - Return { url, key, size, format } in response
   - Uses catchAsync and ApiError from existing utils.

5. src/routes/uploadRoutes.js
   - POST /wallpaper → protect → adminOnly → multerUpload → uploadController.uploadWallpaper
   - Wire into main route aggregator under /api/v1/upload

IMPORTANT:
- Do NOT process/resize images here — that comes on Day 3.
- This is raw upload only: file → memory → R2 original storage.
- Use crypto.randomUUID() for unique filenames.
- Content-Type must be set correctly on R2 upload.
- Include proper error handling if R2 upload fails.

OUTPUT: Complete file contents for all 5 files.
```

---

## DAY 3 — Image Processing Pipeline (Sharp)

### Goal
After a wallpaper is uploaded to R2, generate all required variants: 4K, 2K, FHD, Mobile, Thumbnail, and Watermarked Preview using Sharp. Store all variants in R2. Update Product schema with `assets` sub-document.

### Database Schema Changes
- **Product.js**: Add `assets` sub-document (see schema above). Keep old `img` field temporarily for backward compatibility.

### Files to Create
| File | Purpose |
|------|---------|
| `src/services/imageService.js` | Sharp-based resize, watermark, thumbnail generation |

### Files to Modify
| File | Change |
|------|--------|
| `models/Product.js` | Add `assets` sub-document schema |
| `services/uploadService.js` | After R2 upload, call imageService to generate all variants |
| `controllers/uploadController.js` | Return full asset URLs after processing |

### Image Processing Specs

| Variant | Resolution | Format | Quality | Path in R2 |
|---------|-----------|--------|---------|------------|
| 4K | 3840×2160 | WebP | 90 | `variants/{id}/4k.webp` |
| 2K | 2560×1440 | WebP | 90 | `variants/{id}/2k.webp` |
| FHD | 1920×1080 | WebP | 85 | `variants/{id}/fhd.webp` |
| Mobile | 1080×1920 | WebP | 85 | `variants/{id}/mobile.webp` |
| Thumbnail | 400×225 | WebP | 80 | `thumbnails/{id}/thumb.webp` |
| Preview | 1200×675 | JPEG | 70 | `previews/{id}/preview.jpg` |

Preview = Watermarked (semi-transparent "AniCart" text overlay using Sharp composite).

### Testing Checklist
- [ ] Upload a 4K PNG → 6 variants + original stored in R2
- [ ] Product document updated with all asset URLs
- [ ] `assets.status` is `'ready'` after processing completes
- [ ] Thumbnail is visually correct (check via R2 public URL)
- [ ] Watermark is visible on preview but not on paid variants
- [ ] Upload of image smaller than 1920px wide → rejected with helpful error

### Codex Prompt

```
You are a senior Node.js backend engineer specializing in image processing.

PROJECT: AniCart — anime wallpaper marketplace.
STACK: Node.js, Express, Mongoose, Sharp, Cloudflare R2.

TASK: Build the image processing pipeline that generates multiple resolution variants from an uploaded wallpaper.

CONTEXT: I already have:
- uploadService.js that uploads buffers to R2 and returns { url, key }
- r2.js config with S3Client
- Product model in Mongoose

CREATE/MODIFY THESE FILES:

1. src/services/imageService.js
   Methods:
   - validateImage(buffer): Use sharp(buffer).metadata() to check:
     - Width must be >= 1920px
     - Format must be png, jpeg, or webp
     - Throw ApiError.badRequest if invalid
     - Return { width, height, format, size }

   - generateVariants(buffer, productId): Generate all 6 variants:
     a) 4K (3840x2160) — sharp.resize(3840, 2160, { fit: 'cover' }).webp({ quality: 90 })
     b) 2K (2560x1440) — sharp.resize(2560, 1440, { fit: 'cover' }).webp({ quality: 90 })
     c) FHD (1920x1080) — sharp.resize(1920, 1080, { fit: 'cover' }).webp({ quality: 85 })
     d) Mobile (1080x1920) — sharp.resize(1080, 1920, { fit: 'cover' }).webp({ quality: 85 })
     e) Thumbnail (400x225) — sharp.resize(400, 225, { fit: 'cover' }).webp({ quality: 80 })
     f) Preview (1200x675) — resize then composite watermark overlay, output JPEG quality 70

     For each variant: resize → convert → get buffer → upload to R2 via uploadService
     Return object with all URLs and keys matching the Product.assets schema.

   - generateWatermark(buffer, width, height): Create a semi-transparent watermark.
     Use Sharp to:
     - Create an SVG text overlay with "AniCart" repeated diagonally
     - Composite the SVG over the resized image at 30% opacity
     - Return watermarked buffer

   - processUpload(buffer, productId): Orchestrator method:
     1. validateImage(buffer)
     2. Upload original to R2
     3. generateVariants(buffer, productId)
     4. Return complete assets object for Product schema

2. MODIFY: models/Product.js
   Add assets sub-document:
   assets: {
     original:  { url: String, key: String, size: Number, format: String },
     variants: {
       '4k':    { url: String, key: String, width: Number, height: Number },
       '2k':    { url: String, key: String, width: Number, height: Number },
       fhd:     { url: String, key: String, width: Number, height: Number },
       mobile:  { url: String, key: String, width: Number, height: Number },
     },
     thumbnail: { url: String, key: String },
     preview:   { url: String, key: String },
     status:    { type: String, enum: ['processing', 'ready', 'flagged', 'rejected'], default: 'processing' }
   }
   Keep the old `img` field for backward compatibility (set it to thumbnail URL).

3. MODIFY: controllers/uploadController.js
   - After uploading, call imageService.processUpload(buffer, productId)
   - Create or update the Product document with the returned assets
   - Set assets.status = 'ready'
   - Set img = assets.thumbnail.url (backward compat)
   - Return the complete product with assets in response

IMPORTANT:
- Process ALL variants in parallel using Promise.all for speed.
- This is synchronous processing for now (Day 4 moves it to BullMQ background jobs).
- Sharp must be imported fresh for each operation (don't reuse Sharp instances).
- Log processing time for each variant.
- If any variant fails, set assets.status = 'flagged' and continue with successful ones.

OUTPUT: Complete file contents for imageService.js, updated Product.js, updated uploadController.js.
```

---

## DAY 4 — BullMQ Background Jobs + Worker Process

### Goal
Move image processing from synchronous (blocking the upload request) to async background jobs using BullMQ. Upload endpoint returns immediately with `assets.status: 'processing'`. A separate worker process picks up jobs and processes images.

### External Services to Set Up
1. **Upstash Redis**: Create a free database. Get both the REST credentials AND the `rediss://` connection URL (BullMQ needs TCP/TLS, not HTTP).

### Files to Create
| File | Purpose |
|------|---------|
| `src/config/redis.js` | Upstash Redis client (HTTP for caching, TCP for BullMQ) |
| `src/jobs/queues.js` | BullMQ queue definitions |
| `src/jobs/imageProcessor.js` | Worker that processes image resize jobs |
| `worker.js` | Separate entry point that runs BullMQ workers |

### Files to Modify
| File | Change |
|------|--------|
| `controllers/uploadController.js` | Upload original to R2 → enqueue BullMQ job → return immediately |
| `services/uploadService.js` | Add method to enqueue processing job |
| `routes/uploadRoutes.js` | Add GET `/status/:productId` to check processing status |
| `package.json` | Add `"worker"` script |

### Testing Checklist
- [ ] Upload returns immediately with `assets.status: 'processing'`
- [ ] Worker process picks up job within 2 seconds
- [ ] After worker completes, Product.assets.status = 'ready'
- [ ] GET `/upload/status/:productId` returns current processing status
- [ ] If worker fails, job retries up to 3 times
- [ ] Worker and API server can run as separate processes

### Codex Prompt

```
You are a senior Node.js backend engineer.

PROJECT: AniCart — anime wallpaper marketplace.
STACK: Node.js, Express, Mongoose, BullMQ, Upstash Redis (TLS), Sharp, Cloudflare R2.

TASK: Move image processing to BullMQ background jobs.

CONTEXT: I already have:
- imageService.js with processUpload(buffer, productId) that does sync processing
- uploadService.js that uploads to R2
- Product model with assets sub-document
- Working upload endpoint

PROBLEM: Image processing (6 variants) takes 5-15 seconds. This blocks the HTTP request. Move it to a background job.

CREATE THESE FILES:

1. src/config/redis.js
   - For BullMQ: Create and export an IORedis connection using REDIS_URL env var
     (Upstash provides a rediss:// URL with TLS)
     Connection options: { maxRetriesPerRequest: null, tls: {} }
   - For caching: Create and export Upstash REST client using @upstash/redis
     with UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
   - Export both: { redisConnection, upstashRedis }

2. src/jobs/queues.js
   - Create and export BullMQ Queue named 'image-processing'
   - Use the IORedis connection from config/redis.js
   - Default job options: { attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
   - Export helper: enqueueImageProcessing(productId, r2OriginalKey) → adds job to queue

3. src/jobs/imageProcessor.js
   - BullMQ Worker that listens on 'image-processing' queue
   - Job data: { productId, r2OriginalKey }
   - Worker steps:
     a) Download original from R2 using GetObjectCommand
     b) Call imageService.generateVariants(buffer, productId)
     c) Update Product.assets with all variant URLs
     d) Set Product.assets.status = 'ready'
     e) Set Product.img = thumbnail URL
     f) Log completion time
   - On failure: Set Product.assets.status = 'flagged', log error
   - Report progress: 0% → downloading, 30% → resizing, 90% → uploading, 100% → done

4. worker.js (project root)
   - Connects to MongoDB
   - Imports and starts the imageProcessor worker
   - Logs "Worker started" on ready
   - Handles graceful shutdown (SIGTERM → worker.close())

MODIFY THESE FILES:

5. controllers/uploadController.js
   - Upload original to R2 (keep this sync — it's fast, ~1 sec)
   - Create Product document with assets.status = 'processing'
   - Enqueue BullMQ job via queues.enqueueImageProcessing(productId, key)
   - Return immediately: { productId, status: 'processing', originalUrl }

6. controllers/uploadController.js — add getUploadStatus method
   - GET /upload/status/:productId
   - Return Product.assets.status and available variant URLs

7. routes/uploadRoutes.js
   - Add GET /status/:productId → uploadController.getUploadStatus

8. package.json
   - Add script: "worker": "node worker.js"
   - Add script: "dev:worker": "nodemon worker.js"
   - Add script: "dev:all": "concurrently \"npm run dev\" \"npm run dev:worker\""

IMPORTANT:
- BullMQ needs IORedis (TCP connection), NOT the @upstash/redis HTTP client.
- Upstash free tier supports TLS connections — use the rediss:// URL.
- The worker runs as a SEPARATE process from the API server.
- Use concurrently to run both in development.
- If the original image is > 50MB in R2, skip variant generation and flag.

OUTPUT: Complete file contents for all files listed above.
```

---

## DAY 5 — License System + Secure Downloads

### Goal
Replace `User.library[]` with a proper `License` collection. Build signed URL downloads that verify license ownership before generating a time-limited R2 download link.

### Database Schema Changes
- **Remove**: `library` field from User model
- **Create**: License model (see schema above)

### Files to Create
| File | Purpose |
|------|---------|
| `src/models/License.js` | License schema |
| `src/services/licenseService.js` | Grant, revoke, verify, list licenses |
| `src/services/downloadService.js` | Generate signed R2 download URLs |
| `src/controllers/downloadController.js` | Handle download requests |
| `src/routes/downloadRoutes.js` | GET `/api/v1/download/:productId/:resolution` |

### Files to Modify
| File | Change |
|------|--------|
| `models/User.js` | Remove `library` array field |
| `controllers/userController.js` | `getLibrary` now queries License model instead of User.library |
| `services/userService.js` | Update getLibrary to use licenseService |
| `routes/index.js` | Add download routes |

### Testing Checklist
- [ ] License.create() works with user, product, order refs
- [ ] User who owns license can get signed URL for any resolution
- [ ] User who does NOT own license gets 403 Forbidden
- [ ] Signed URL expires after 15 minutes
- [ ] Signed URL actually downloads the correct file from R2
- [ ] GET `/users/library` returns products from License collection
- [ ] Revoking a license prevents future downloads

### Codex Prompt

```
You are a senior Node.js backend engineer.

PROJECT: AniCart — anime wallpaper marketplace.
STACK: Node.js, Express, Mongoose, Cloudflare R2, @aws-sdk/s3-request-presigner.

TASK: Build the License system and Secure Download system.

CONTEXT: I have:
- User model (currently has library[] embedded array — REMOVE THIS)
- Product model with assets.variants.{4k,2k,fhd,mobile} each having { url, key }
- R2 config with S3Client
- Auth middleware (protect) that sets req.user.id

CREATE THESE FILES:

1. src/models/License.js
   Schema:
   - user: ObjectId ref User (required)
   - product: ObjectId ref Product (required)
   - order: ObjectId ref Order (required)
   - grantedAt: Date (default: Date.now)
   - revokedAt: Date (default: null)
   - isActive: Boolean (default: true)
   Indexes:
   - { user: 1, product: 1 } compound unique index
   - { order: 1 }
   - { user: 1, isActive: 1 }

2. src/services/licenseService.js
   Methods:
   - grantLicenses(userId, productIds, orderId): Create License docs for each product. Use insertMany with ordered:false to skip duplicates gracefully.
   - revokeLicenses(orderId): Set isActive=false, revokedAt=now for all licenses from this order.
   - hasLicense(userId, productId): Return boolean — does active license exist?
   - getUserLicenses(userId, page, limit): Paginated list of user's active licenses with populated product data.
   - getLicenseByProduct(userId, productId): Get single license with product.

3. src/services/downloadService.js
   Methods:
   - getSignedDownloadUrl(userId, productId, resolution):
     a) Call licenseService.hasLicense(userId, productId) — throw 403 if false
     b) Get Product, find the correct variant key from assets.variants[resolution]
     c) If resolution = 'original', use assets.original.key
     d) Generate presigned URL using GetObjectCommand + getSignedUrl with expiresIn: 900 (15 min)
     e) Increment Product.downloadCount
     f) Return { url, expiresIn: 900, resolution, filename }
   - Allowed resolutions: '4k', '2k', 'fhd', 'mobile', 'original'

4. src/controllers/downloadController.js
   - getDownload: Extract productId and resolution from req.params
     Call downloadService.getSignedDownloadUrl(req.user.id, productId, resolution)
     Return the signed URL and metadata

5. src/routes/downloadRoutes.js
   - GET /:productId/:resolution → protect → downloadController.getDownload
   - Validate resolution is one of: 4k, 2k, fhd, mobile, original

MODIFY THESE FILES:

6. models/User.js — Remove the library field entirely.

7. services/userService.js — Update getLibrary method:
   Instead of User.findById().populate('library'),
   Call licenseService.getUserLicenses(userId, page, limit)

IMPORTANT:
- Signed URLs must use @aws-sdk/s3-request-presigner's getSignedUrl function.
- The presigned URL signs a GetObjectCommand against the R2 bucket.
- NEVER expose R2 keys or direct storage URLs to the client.
- The download endpoint returns a JSON response with the signed URL — the frontend then opens it.
- If Product.assets.status !== 'ready', return 400 "Wallpaper is still processing."

OUTPUT: Complete file contents for all files.
```

---

## DAY 6 — Stripe Payments (Checkout Sessions)

### Goal
Integrate Stripe Checkout Sessions. When a user clicks "Checkout", create a Stripe session with their cart items. Redirect them to Stripe's hosted payment page. Orders start as `pending` — NOT `completed`.

### External Services to Set Up
1. **Stripe**: Create account (claim student pack for $0 fees on first $1K). Get test API keys. Install Stripe CLI for local webhook testing.

### Database Schema Changes
- **Order.js**: Add `paymentIntentId`, `checkoutSessionId`, `gateway`, `idempotencyKey` fields. Change default status to `'pending'`.

### Files to Create
| File | Purpose |
|------|---------|
| `src/config/stripe.js` | Stripe instance |
| `src/services/paymentService.js` | Create checkout session, handle payment logic |
| `src/controllers/paymentController.js` | Payment-related endpoints |
| `src/routes/paymentRoutes.js` | Stub for webhook (Day 7) |

### Files to Modify
| File | Change |
|------|--------|
| `models/Order.js` | Add payment fields, change default status to `'pending'` |
| `services/orderService.js` | Checkout now creates Stripe session, not auto-complete |
| `controllers/orderController.js` | Checkout returns Stripe session URL |

### Testing Checklist
- [ ] POST `/orders/checkout` returns `{ checkoutUrl: 'https://checkout.stripe.com/...' }`
- [ ] Order created with status `'pending'`, `checkoutSessionId` populated
- [ ] Stripe test checkout page loads with correct items and prices
- [ ] Order does NOT auto-complete (no licenses granted yet)
- [ ] Completing Stripe test payment triggers redirect to success URL

### Codex Prompt

```
You are a senior Node.js backend engineer.

PROJECT: AniCart — anime wallpaper marketplace.
STACK: Node.js, Express, Mongoose, Stripe.

TASK: Integrate Stripe Checkout Sessions for payment.

CONTEXT: I have:
- Working cart system (cartService.getCart returns populated items)
- Order model (currently auto-completes — this is a BUG we're fixing)
- User auth middleware

THE CRITICAL FIX: Orders must NOT auto-complete. The flow is:
1. User clicks Checkout → API creates Order (status: 'pending') + Stripe session
2. User pays on Stripe → Stripe sends webhook (Day 7)
3. Webhook confirms payment → Order set to 'completed' + licenses granted
This is the ONLY correct flow for real money.

CREATE THESE FILES:

1. src/config/stripe.js
   - Export initialized Stripe instance using STRIPE_SECRET_KEY
   - Export STRIPE_WEBHOOK_SECRET for later use

2. src/services/paymentService.js
   Methods:
   - createCheckoutSession(userId, orderId, items):
     a) Build Stripe line_items array from order items:
        Each item: { price_data: { currency: 'usd', product_data: { name, images: [thumbnail] }, unit_amount: price*100 }, quantity: 1 }
     b) Create Stripe checkout.sessions.create({
          mode: 'payment',
          line_items,
          metadata: { orderId: orderId.toString(), userId: userId.toString() },
          success_url: STRIPE_SUCCESS_URL + '?session_id={CHECKOUT_SESSION_ID}',
          cancel_url: STRIPE_CANCEL_URL,
          expires_after: 1800 (30 min)
        })
     c) Return { sessionId, checkoutUrl: session.url }

   - verifySession(sessionId): Retrieve session from Stripe API and return it (used on Day 7)

3. src/controllers/paymentController.js
   - Stub for now — webhook handler comes Day 7
   - successRedirect: GET endpoint that frontend hits after payment
     Verify session via paymentService.verifySession, return order status

MODIFY THESE FILES:

4. models/Order.js
   Add fields:
   - paymentIntentId: { type: String, index: true }
   - checkoutSessionId: { type: String, index: true }
   - gateway: { type: String, enum: ['stripe', 'razorpay'], default: 'stripe' }
   - idempotencyKey: { type: String, unique: true, sparse: true }
   Change: status default from 'pending' (keep) but add new enum values: 'payment_processing', 'failed', 'refunded'
   CRITICAL: Remove status: 'completed' from createFromCart method. Set to 'pending' instead.
   Remove the auto-library-update from the checkout controller.

5. services/orderService.js — rewrite checkout method:
   - Get cart items (validate not empty)
   - Generate idempotencyKey = `${userId}_${Date.now()}`
   - Create Order with status: 'pending'
   - Call paymentService.createCheckoutSession(userId, order._id, order.items)
   - Save checkoutSessionId to order
   - Return { order, checkoutUrl }
   - Do NOT clear cart yet (clear after payment confirmed)
   - Do NOT grant licenses yet

6. controllers/orderController.js — update checkout:
   - Call orderService.checkout(req.user.id)
   - Return { checkoutUrl } so frontend can redirect

OUTPUT: Complete file contents for all files.
```

---

## DAY 7 — Stripe Webhooks + Order Fulfillment

### Goal
Handle Stripe webhooks to confirm payment. On `checkout.session.completed`, mark order as completed, grant licenses, clear cart, send confirmation email (stub), and emit notification.

### Files to Create
| File | Purpose |
|------|---------|
| `src/routes/webhookRoutes.js` | Stripe webhook route with RAW body parsing |
| `src/controllers/paymentController.js` | Webhook handler (expand from Day 6) |

### Files to Modify
| File | Change |
|------|--------|
| `services/paymentService.js` | Add handleWebhookEvent(), fulfillOrder() |
| `services/orderService.js` | Add completeOrder(), failOrder() methods |
| `app.js` | Webhook route MUST be registered BEFORE express.json() middleware |
| `routes/index.js` | Add webhook routes (with raw body) |

### Critical Architecture Note
```
⚠️ Stripe webhooks require the RAW request body for signature verification.
The webhook route MUST use express.raw({ type: 'application/json' }) 
and MUST be registered BEFORE the global express.json() middleware.
```

### Testing Checklist
- [ ] Install Stripe CLI: `stripe listen --forward-to localhost:5000/api/v1/payments/webhook`
- [ ] Complete a test payment → webhook fires → order status = `'completed'`
- [ ] License records created for each product in the order
- [ ] Cart cleared after successful payment
- [ ] User.purchasesCount and User.points incremented
- [ ] Duplicate webhook delivery → idempotent (no double licenses)
- [ ] Failed payment → order status = `'failed'`, no licenses granted

### Codex Prompt

```
You are a senior Node.js backend engineer.

PROJECT: AniCart — anime wallpaper marketplace.
STACK: Node.js, Express, Mongoose, Stripe, BullMQ.

TASK: Build the Stripe webhook handler for order fulfillment.

CONTEXT: I have:
- paymentService.js with createCheckoutSession()
- orderService.js that creates orders with status 'pending'
- licenseService.js with grantLicenses(userId, productIds, orderId)
- cartService.js with clearCart(userId)
- Upstash Redis for idempotency checks

CRITICAL ARCHITECTURE:

The webhook route MUST use express.raw() for body parsing — NOT express.json().
In app.js, register the webhook route BEFORE the global express.json() middleware:

  // Stripe webhook needs raw body — MUST be before express.json()
  app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }));
  // Then global JSON parsing for all other routes
  app.use(express.json());

CREATE/MODIFY THESE FILES:

1. src/services/paymentService.js — ADD methods:
   - handleWebhookEvent(rawBody, signature):
     a) Verify signature using stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET)
     b) Switch on event.type:
        - 'checkout.session.completed' → call fulfillOrder(session)
        - 'checkout.session.expired' → call expireOrder(session)
     c) Return { received: true }

   - fulfillOrder(session):
     a) Extract orderId from session.metadata.orderId
     b) Idempotency check: Redis SET `webhook:${session.id}` NX EX 86400
        If key already exists → return (already processed)
     c) Update Order: status = 'completed', paymentIntentId = session.payment_intent
     d) Get order items → extract product IDs
     e) Call licenseService.grantLicenses(userId, productIds, orderId)
     f) Call cartService.clearCart(userId)
     g) Update User: increment purchasesCount and points
     h) TODO: Enqueue email job (Day 8)
     i) TODO: Create notification (Day 13)

   - expireOrder(session):
     a) Update Order: status = 'failed'

2. src/controllers/paymentController.js — ADD webhook handler:
   - handleWebhook:
     a) Get raw body from req.body (it's a Buffer because of express.raw)
     b) Get signature from req.headers['stripe-signature']
     c) Call paymentService.handleWebhookEvent(req.body, signature)
     d) Return 200 { received: true }
     e) If signature verification fails → return 400

3. src/routes/webhookRoutes.js
   - POST / → paymentController.handleWebhook
   - NO auth middleware (Stripe calls this, not users)
   - NO rate limiting (Stripe may send retries)
   - NO validation middleware

4. MODIFY: app.js
   - Import webhookRoutes
   - Register BEFORE express.json():
     app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }), webhookRoutes);
   - Then: app.use(express.json());

5. MODIFY: services/orderService.js
   - Add completeOrder(orderId, paymentIntentId): Set status='completed', save paymentIntentId
   - Add failOrder(orderId): Set status='failed'

TESTING INSTRUCTIONS (include as comments):
// Local testing with Stripe CLI:
// 1. stripe login
// 2. stripe listen --forward-to localhost:5000/api/v1/payments/webhook
// 3. Copy the webhook signing secret to .env as STRIPE_WEBHOOK_SECRET
// 4. Trigger test: stripe trigger checkout.session.completed

OUTPUT: Complete file contents for all modified/created files.
```

---

## DAY 8 — Email System (Resend)

### Goal
Send transactional emails for: welcome, order confirmation, password reset, upload status. Use Resend (3,000 emails/month free).

### External Services to Set Up
1. **Resend**: Create account, verify domain (or use onboarding@resend.dev for testing). Get API key.

### Files to Create
| File | Purpose |
|------|---------|
| `src/config/email.js` | Resend client |
| `src/services/emailService.js` | Email templates and send methods |
| `src/jobs/emailSender.js` | BullMQ worker for async email dispatch |

### Files to Modify
| File | Change |
|------|--------|
| `services/authService.js` | Send welcome email on register |
| `services/paymentService.js` | Enqueue order confirmation email in fulfillOrder |
| `jobs/queues.js` | Add 'email' queue |

### Email Templates
| Email | Trigger | Subject |
|-------|---------|---------|
| Welcome | User registers | "Welcome to AniCart!" |
| Order Confirmation | Payment webhook success | "Your AniCart order #{orderId}" |
| Password Reset | User requests reset | "Reset your AniCart password" |
| Upload Ready | Image processing complete | "Your wallpaper is live!" |
| Upload Rejected | Admin rejects upload | "Update needed on your submission" |

### Testing Checklist
- [ ] Register a user → welcome email sent
- [ ] Complete a purchase → order confirmation email sent
- [ ] Emails are sent async via BullMQ (not blocking the API response)
- [ ] If Resend API fails, job retries 3 times

### Codex Prompt

```
You are a senior Node.js backend engineer.

PROJECT: AniCart — anime wallpaper marketplace.
STACK: Node.js, Express, Resend, BullMQ.

TASK: Build the transactional email system using Resend.

CONTEXT: I have BullMQ queues set up with Redis connection. I need email to be async (sent via background job, not blocking HTTP responses).

CREATE THESE FILES:

1. src/config/email.js
   - Export initialized Resend client using RESEND_API_KEY
   - Export EMAIL_FROM from env

2. src/services/emailService.js
   Methods:
   - sendWelcomeEmail(to, name): Send HTML welcome email
   - sendOrderConfirmation(to, name, order): Send with order details (items, total)
   - sendPasswordReset(to, name, resetUrl): Send reset link (expiry 1 hour)
   - sendUploadReady(to, name, productName): Notify creator upload is live
   - sendUploadRejected(to, name, productName, reason): Notify creator with reason

   Each method:
   a) Build HTML email using template strings (clean, inline-styled HTML)
   b) Call resend.emails.send({ from: EMAIL_FROM, to, subject, html })
   c) Return { success: true, messageId }

   Email template style: Clean, minimal, white background, blue accent color (#1A56DB), AniCart branding at top.

3. src/jobs/emailSender.js
   - BullMQ Worker on 'email' queue
   - Job data: { type: 'welcome'|'order_confirmation'|'password_reset'|'upload_ready'|'upload_rejected', payload: {...} }
   - Switch on type, call corresponding emailService method
   - Retry 3 times with exponential backoff

4. MODIFY: src/jobs/queues.js
   - Add 'email' queue
   - Export: enqueueEmail(type, payload) helper

5. MODIFY: src/services/authService.js
   - After successful registration, enqueue welcome email: enqueueEmail('welcome', { to: user.email, name: user.name })

6. MODIFY: src/services/paymentService.js
   - In fulfillOrder, after granting licenses: enqueueEmail('order_confirmation', { to: user.email, name: user.name, order })

7. MODIFY: worker.js
   - Import and start emailSender worker alongside imageProcessor worker

OUTPUT: Complete file contents for all files. Include clean, professional email HTML templates.
```

---

## DAY 9 — Redis Caching + Rate Limiting Upgrade

### Goal
Add Upstash Redis caching for hot data (product listings, series filters, product details). Upgrade rate limiting from in-memory to Upstash. This dramatically reduces MongoDB load.

### Files to Create / Modify
| File | Purpose |
|------|---------|
| `src/services/cacheService.js` | Upgrade from stub to real Redis implementation |

### Files to Modify
| File | Change |
|------|--------|
| `middleware/rateLimiter.js` | Switch from express-rate-limit (in-memory) to @upstash/ratelimit |
| `services/productService.js` | Cache product listings and series list in Redis |
| `services/cacheService.js` | Implement get/set/del/invalidatePattern using Upstash HTTP client |

### Cache Strategy
| Key Pattern | TTL | Invalidation |
|-------------|-----|--------------|
| `products:page:{page}:limit:{limit}:series:{series}` | 5 min | On product create/update/delete |
| `product:{id}` | 10 min | On product update |
| `series:list` | 30 min | On product create (new series) |
| `user:{id}:licenses` | 5 min | On license grant/revoke |

### Testing Checklist
- [ ] First product listing request → hits MongoDB, stores in Redis
- [ ] Second identical request → served from Redis (check response time < 5ms)
- [ ] Creating a product → cache invalidated → next request hits fresh data
- [ ] Rate limiter works with Upstash (test with rapid requests)
- [ ] Redis commands stay under 500K/month budget

### Codex Prompt

```
You are a senior Node.js backend engineer.

PROJECT: AniCart — anime wallpaper marketplace.
STACK: Node.js, Express, Mongoose, @upstash/redis, @upstash/ratelimit.

TASK: Implement Redis caching and upgrade rate limiting.

CONTEXT: I have @upstash/redis configured in config/redis.js exporting upstashRedis (REST client). I have a cacheService.js that is currently a stub with no-op methods.

CREATE/MODIFY THESE FILES:

1. MODIFY: src/services/cacheService.js — implement real caching:
   Using @upstash/redis (HTTP client, NOT ioredis):

   Methods:
   - get(key): Get value from Redis, parse JSON. Return null if not found.
   - set(key, value, ttlSeconds): JSON.stringify and SET with EX.
   - del(key): Delete single key.
   - invalidatePattern(pattern): Use scan to find matching keys, delete them.
     NOTE: Upstash supports SCAN. Loop with cursor until 0.
     Pattern example: 'products:*' to invalidate all product cache.
   - getOrSet(key, ttlSeconds, fetchFn): Cache-aside pattern:
     a) Try get(key)
     b) If found → return cached
     c) If not → call fetchFn(), cache result, return it

2. MODIFY: src/services/productService.js — add caching:
   - getProducts: Use cacheService.getOrSet with key based on query params.
     Key: `products:p${page}:l${limit}:s${series||'all'}:q${search||'none'}`
     TTL: 300 (5 min)
   - getProduct: Cache individual product. Key: `product:${id}`, TTL: 600
   - getSeries: Cache series list. Key: `series:list`, TTL: 1800
   - createProduct/updateProduct/deleteProduct: After DB write, call
     cacheService.invalidatePattern('products:*') and del specific product cache.

3. MODIFY: src/middleware/rateLimiter.js — switch to Upstash:
   Using @upstash/ratelimit:
   - authLimiter: Ratelimit.slidingWindow(10, '15 m') — 10 requests per 15 min
   - apiLimiter: Ratelimit.slidingWindow(100, '1 m') — 100 requests per minute
   - strictLimiter: Ratelimit.slidingWindow(5, '15 m') — 5 requests per 15 min

   Middleware pattern:
   async (req, res, next) => {
     const identifier = req.user?.id || req.ip;
     const { success, limit, remaining, reset } = await limiter.limit(identifier);
     res.set('X-RateLimit-Limit', limit);
     res.set('X-RateLimit-Remaining', remaining);
     if (!success) throw ApiError.tooManyRequests('Rate limit exceeded');
     next();
   }

IMPORTANT:
- Upstash free tier = 500K commands/month. Be efficient.
- Cache-aside means stale data is possible for up to TTL duration — acceptable for a marketplace.
- DO NOT cache user-specific data aggressively (licenses, cart) — these change too often.
- Always invalidate on write operations.

OUTPUT: Complete file contents for all modified files.
```

---

## DAY 10 — Search (Meilisearch)

### Goal
Deploy Meilisearch on your DigitalOcean Droplet. Index all products. Replace the current `$regex` search with instant, typo-tolerant Meilisearch queries with faceted filtering.

### External Services to Set Up
1. **Meilisearch**: Install on DigitalOcean Droplet via Docker or binary. Set a master key.

### Files to Create
| File | Purpose |
|------|---------|
| `src/config/meilisearch.js` | Meilisearch client |
| `src/services/searchService.js` | Index management, search queries |
| `src/controllers/searchController.js` | Search endpoints |
| `src/routes/searchRoutes.js` | GET `/api/v1/search` |
| `src/jobs/searchIndexer.js` | BullMQ worker for index sync |
| `scripts/indexProducts.js` | One-time bulk indexing script |

### Testing Checklist
- [ ] Run `scripts/indexProducts.js` → all products indexed in Meilisearch
- [ ] Search "narutto" → returns Naruto wallpapers (typo tolerance)
- [ ] Filter by series, price range, tags → correct results
- [ ] New product created → auto-indexed via BullMQ job
- [ ] Product deleted → removed from index
- [ ] Search responds in < 50ms

### Codex Prompt

```
You are a senior Node.js backend engineer.

PROJECT: AniCart — anime wallpaper marketplace.
STACK: Node.js, Express, Mongoose, Meilisearch.

TASK: Integrate Meilisearch for instant search with typo tolerance and faceted filtering.

CREATE THESE FILES:

1. src/config/meilisearch.js
   - Initialize and export MeiliSearch client using MEILISEARCH_HOST and MEILISEARCH_API_KEY
   - Index name: 'products'

2. src/services/searchService.js
   Methods:
   - initializeIndex(): Create 'products' index if not exists. Configure:
     * searchableAttributes: ['name', 'series', 'tags']
     * filterableAttributes: ['series', 'tags', 'price', 'rating', 'resolution', 'badge', 'isActive']
     * sortableAttributes: ['price', 'rating', 'createdAt', 'downloadCount']
     * rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness']

   - indexProduct(product): Add/update single product document in Meilisearch.
     Transform Mongoose doc to plain object. Use product._id.toString() as document id.
     Include: id, name, series, price, rating, reviewCount, tags, resolution, badge,
     thumbnail (assets.thumbnail.url), createdAt (as timestamp), downloadCount, isActive.

   - removeProduct(productId): Delete document from index.

   - search(query, options): Execute search with:
     * q: query string
     * filter: build from options.series, options.minPrice, options.maxPrice, options.tags, options.resolution
     * sort: options.sortBy (e.g., ['price:asc'], ['rating:desc'], ['createdAt:desc'])
     * limit: options.limit || 20
     * offset: options.offset || 0
     * facets: ['series', 'tags', 'resolution', 'badge']
     Return { hits, totalHits, facets, processingTimeMs }

   - getSuggestions(query): Search with limit=5, only return names for autocomplete.

   - bulkIndex(products): Add multiple documents at once.

3. src/controllers/searchController.js
   - search: Parse query params (q, series, minPrice, maxPrice, tags, sort, page, limit)
     Call searchService.search() → return results
   - suggestions: Parse q → call searchService.getSuggestions() → return names

4. src/routes/searchRoutes.js
   - GET / → searchController.search (public, rate limited)
   - GET /suggestions → searchController.suggestions (public, rate limited)

5. src/jobs/searchIndexer.js
   - BullMQ Worker on 'search-index' queue
   - Job types: 'index' (add/update product), 'remove' (delete from index)
   - Called when products are created/updated/deleted

6. MODIFY: src/jobs/queues.js
   - Add 'search-index' queue
   - Export: enqueueSearchIndex(type, productData)

7. MODIFY: src/services/productService.js
   - After createProduct: enqueue search index job
   - After updateProduct: enqueue search index job
   - After deleteProduct: enqueue search remove job

8. scripts/indexProducts.js
   - Connect to MongoDB
   - Fetch all active products
   - Call searchService.bulkIndex()
   - Log count indexed
   - Exit

IMPORTANT:
- Meilisearch runs on the same DigitalOcean Droplet as the API (port 7700).
- In docker-compose.yml for local dev, add meilisearch service.
- The search endpoint is public (no auth required) but rate-limited.
- Always filter by isActive: true in search.

OUTPUT: Complete file contents for all files.
```

---

## DAY 11 — Creator Accounts + User Uploads

### Goal
Allow users to apply for "creator" status. Approved creators can upload wallpapers. Uploads go through the existing image pipeline + enter a moderation queue.

### Database Schema Changes
- **Create**: Creator model, ModerationLog model

### Files to Create
| File | Purpose |
|------|---------|
| `src/models/Creator.js` | Creator profile schema |
| `src/models/ModerationLog.js` | Moderation audit trail |
| `src/services/creatorService.js` | Creator application, profile, upload management |
| `src/controllers/creatorController.js` | Creator endpoints |
| `src/routes/creatorRoutes.js` | `/api/v1/creators/*` |

### Files to Modify
| File | Change |
|------|--------|
| `middleware/authMiddleware.js` | Add `creatorOnly` middleware |
| `routes/uploadRoutes.js` | Allow creators (not just admins) to upload |
| `services/uploadService.js` | Creator uploads → status 'pending' (not 'ready') |

### Testing Checklist
- [ ] User applies for creator → Creator doc created with `isApproved: false`
- [ ] Admin approves creator → User.role changes to 'creator'
- [ ] Creator uploads wallpaper → enters moderation queue (not immediately public)
- [ ] Creator can see their upload history and status
- [ ] Non-creator user cannot access upload endpoint

### Codex Prompt

```
You are a senior Node.js backend engineer.

PROJECT: AniCart — anime wallpaper marketplace.
STACK: Node.js, Express, Mongoose.

TASK: Build Creator account system and user upload flow with moderation.

CONTEXT: I have:
- User model with role: enum['user', 'creator', 'admin']
- authMiddleware with protect and adminOnly
- Working upload pipeline (Multer → R2 → BullMQ image processing)
- Product model

CREATE THESE FILES:

1. src/models/Creator.js (see schema from plan)
2. src/models/ModerationLog.js (see schema from plan)

3. src/services/creatorService.js
   Methods:
   - applyForCreator(userId, { displayName, bio, portfolioUrl, socialLinks }):
     a) Check user doesn't already have a Creator profile
     b) Create Creator doc with isApproved: false
     c) Return creator profile

   - approveCreator(creatorId, adminId):
     a) Set Creator.isApproved = true, Creator.isVerified = true
     b) Update User.role = 'creator'
     c) Send notification (stub)
     d) Return updated creator

   - rejectCreator(creatorId, reason):
     a) Delete Creator doc or mark rejected
     b) Keep User.role as 'user'

   - getCreatorProfile(userId): Get creator by user ref
   - updateCreatorProfile(userId, updates): Update display name, bio, links
   - getCreatorUploads(userId, page, limit): Products where creator = userId
   - getCreatorStats(userId): Aggregate total uploads, downloads, earnings

4. src/controllers/creatorController.js
   - apply, getProfile, updateProfile, getUploads, getStats

5. src/routes/creatorRoutes.js
   - POST /apply → protect → creatorController.apply
   - GET /profile → protect → creatorOnly → getProfile
   - PUT /profile → protect → creatorOnly → updateProfile
   - GET /uploads → protect → creatorOnly → getUploads
   - GET /stats → protect → creatorOnly → getStats

6. src/middleware/authMiddleware.js — ADD:
   - creatorOnly: Check req.user.role === 'creator' || req.user.role === 'admin'
   - creatorOrAdmin: Same as above (alias for clarity)

7. MODIFY: src/routes/uploadRoutes.js
   - Change POST /wallpaper access from adminOnly to creatorOrAdmin
   - Creator uploads: Product.creator = req.user.id, assets.status = 'pending' (needs admin approval)
   - Admin uploads: assets.status = 'processing' → 'ready' (auto-approved)

8. MODIFY: src/services/uploadService.js or productService.js
   - When creator uploads: create ModerationLog with status 'pending'
   - Product.isActive = false until approved

OUTPUT: Complete file contents.
```

---

## DAY 12 — Admin Panel API + Moderation Queue

### Goal
Build all admin-only API endpoints: dashboard stats, user management, content moderation (approve/reject uploads), banner management, and featured wallpaper management.

### Database Schema Changes
- **Create**: Banner model

### Files to Create
| File | Purpose |
|------|---------|
| `src/models/Banner.js` | Homepage banner schema |
| `src/services/adminService.js` | Dashboard stats, user management |
| `src/services/moderationService.js` | Moderation queue logic |
| `src/controllers/adminController.js` | All admin endpoints |
| `src/routes/adminRoutes.js` | `/api/v1/admin/*` |

### Testing Checklist
- [ ] GET `/admin/dashboard` returns user count, revenue, order count, pending moderation count
- [ ] GET `/admin/moderation` returns list of pending uploads with creator info
- [ ] PUT `/admin/moderation/:productId/approve` → product goes live, creator notified
- [ ] PUT `/admin/moderation/:productId/reject` → product stays inactive, creator notified with reason
- [ ] Banner CRUD works
- [ ] Feature toggle works on products
- [ ] Non-admin users get 403 on all admin routes

### Codex Prompt

```
You are a senior Node.js backend engineer.

PROJECT: AniCart — anime wallpaper marketplace.
STACK: Node.js, Express, Mongoose.

TASK: Build the Admin Panel API — dashboard stats, moderation queue, user management, banner management.

CONTEXT: I have:
- User, Product, Order, License, Creator, ModerationLog, Banner models
- authMiddleware with protect and adminOnly
- emailService with sendUploadReady() and sendUploadRejected()
- notificationService (stub — will be built Day 13)
- searchService with indexProduct() and removeProduct()

CREATE THESE FILES:

1. src/services/adminService.js
   Methods:
   - getDashboardStats(): MongoDB aggregation returning:
     { totalUsers, totalCreators, totalProducts, totalOrders, totalRevenue,
       pendingModeration, ordersThisMonth, revenueThisMonth, newUsersThisMonth }
   - getUsers(page, limit, role): Paginated user list with optional role filter
   - updateUserRole(userId, newRole): Change user role (admin action)
   - getOrders(page, limit, status): All orders (not just one user's)

2. src/services/moderationService.js
   Methods:
   - getModerationQueue(page, limit):
     Get ModerationLogs where status = 'pending', populate product and submittedBy
   - approveUpload(productId, adminId):
     a) Set Product.isActive = true, Product.assets.status = 'ready'
     b) Update ModerationLog: status = 'approved', reviewedBy, reviewedAt
     c) Index product in Meilisearch
     d) Enqueue email: sendUploadReady to creator
     e) Return approved product
   - rejectUpload(productId, adminId, reason):
     a) Keep Product.isActive = false, set assets.status = 'rejected'
     b) Update ModerationLog: status = 'rejected', reason, reviewedBy, reviewedAt
     c) Enqueue email: sendUploadRejected to creator with reason
     d) Return rejected product

3. src/controllers/adminController.js
   Endpoints for: dashboard, getUsers, updateUserRole, getOrders,
   getModerationQueue, approveUpload, rejectUpload,
   createBanner, updateBanner, deleteBanner, getBanners,
   toggleFeatured (set Product.isFeatured)

4. src/routes/adminRoutes.js
   All routes require: protect → adminOnly
   Wire up all endpoints as listed in the Final API Route List.

OUTPUT: Complete file contents. Include proper error handling and pagination.
```

---

## DAY 13 — Notifications + Wishlist + Socket.IO

### Goal
Build the notification system (in-app + real-time via Socket.IO), wishlist/saved items, and review system.

### Database Schema Changes
- **Create**: Notification model, Wishlist model, Review model

### Files to Create
| File | Purpose |
|------|---------|
| `src/models/Notification.js` | Notification schema |
| `src/models/Wishlist.js` | Wishlist schema |
| `src/models/Review.js` | Review schema |
| `src/config/socket.js` | Socket.IO setup |
| `src/services/notificationService.js` | Create + push notifications |
| `src/services/wishlistService.js` | Add/remove/get wishlist |
| `src/services/reviewService.js` | CRUD reviews |
| `src/controllers/notificationController.js` | Notification endpoints |
| `src/controllers/wishlistController.js` | Wishlist endpoints |
| `src/controllers/reviewController.js` | Review endpoints |
| `src/routes/notificationRoutes.js` | Notification routes |
| `src/routes/wishlistRoutes.js` | Wishlist routes |
| `src/routes/reviewRoutes.js` | Review routes |

### Files to Modify
| File | Change |
|------|--------|
| `server.js` | Attach Socket.IO to HTTP server |
| `services/paymentService.js` | Push notification on order complete |
| `services/moderationService.js` | Push notification on approve/reject |

### Testing Checklist
- [ ] Socket.IO connects when authenticated user opens frontend
- [ ] Order completion → real-time notification pushed to buyer
- [ ] Upload approved → real-time notification to creator
- [ ] GET `/notifications` returns paginated notification list
- [ ] Mark as read / mark all as read works
- [ ] Wishlist add/remove/get works
- [ ] Reviews: can only review products you own (license check)
- [ ] Product.rating and reviewCount auto-update after review

### Codex Prompt

```
You are a senior Node.js backend engineer.

PROJECT: AniCart — anime wallpaper marketplace.
STACK: Node.js, Express, Mongoose, Socket.IO, JWT.

TASK: Build Notifications (in-app + real-time), Wishlist, and Reviews.

CREATE THESE FILES:

1. Models: Notification.js, Wishlist.js, Review.js (schemas from plan above)

2. src/config/socket.js
   - Export a function initializeSocket(httpServer):
     a) Create Socket.IO server with cors config
     b) Authentication middleware: verify JWT from handshake auth.token
     c) On connection: join user to room `user:${userId}`
     d) On disconnect: log
   - Export emitToUser(userId, event, data) helper:
     io.to(`user:${userId}`).emit(event, data)

3. src/services/notificationService.js
   Methods:
   - create(userId, { type, title, message, link }):
     a) Create Notification doc
     b) Call emitToUser(userId, 'notification:new', notification)
     c) Return notification
   - getNotifications(userId, page, limit): Paginated, newest first
   - markAsRead(notificationId, userId): Set isRead = true
   - markAllAsRead(userId): Update all unread for user
   - getUnreadCount(userId): Count where isRead = false

4. src/services/wishlistService.js
   Methods:
   - getWishlist(userId): Get or create wishlist, populate products
   - addToWishlist(userId, productId): $addToSet product
   - removeFromWishlist(userId, productId): $pull product
   - isInWishlist(userId, productId): Boolean check

5. src/services/reviewService.js
   Methods:
   - createReview(userId, productId, { rating, comment }):
     a) Verify user has license for this product (call licenseService.hasLicense)
     b) Create Review (compound unique index prevents duplicates)
     c) Recalculate Product.rating (average of all reviews) and Product.reviewCount
     d) Return review
   - getProductReviews(productId, page, limit): Paginated, populate user name/avatar
   - deleteReview(reviewId, userId): Only own reviews

6. Controllers and routes for all three (notifications, wishlist, reviews).

7. MODIFY: server.js — attach Socket.IO:
   const httpServer = require('http').createServer(app);
   initializeSocket(httpServer);
   httpServer.listen(PORT);

8. MODIFY: services/paymentService.js — in fulfillOrder:
   notificationService.create(userId, { type: 'order_complete', title: 'Purchase Complete', message: `Your order #${orderId} is ready. Download your wallpapers now!`, link: '/library' })

OUTPUT: Complete file contents.
```

---

## DAY 14 — Logging, Sentry, Security Hardening, Deploy

### Goal
Production-ready: structured logging, error tracking, security headers, environment config, Docker, and deploy to DigitalOcean.

### Files to Create
| File | Purpose |
|------|---------|
| `src/utils/logger.js` | Winston logger |
| `src/config/sentry.js` | Sentry init |
| `src/middleware/requestLogger.js` | Log every request with Winston |
| `Dockerfile` | Production container |
| `docker-compose.yml` | Local dev environment |
| `ecosystem.config.js` | PM2 config |
| `.env.example` | All env vars documented |

### Files to Modify
| File | Change |
|------|--------|
| `app.js` | Add Sentry, Helmet, CORS lock, morgan→winston, mongo-sanitize, hpp |
| All services | Replace `console.log` with `logger.info` / `logger.error` |

### Security Hardening
| Measure | Package/Method |
|---------|---------------|
| HTTP security headers | `helmet()` |
| CORS origin lock | `cors({ origin: [CLIENT_URL], credentials: true })` |
| NoSQL injection prevention | `express-mongo-sanitize()` |
| HTTP parameter pollution | `hpp()` |
| Request logging | Winston (structured JSON, request ID) |
| Error tracking | Sentry |
| File upload limits | Already done (Multer, Day 2) |

### Testing Checklist
- [ ] `docker-compose up` starts MongoDB, Redis, Meilisearch locally
- [ ] Winston logs appear in console (dev) and file (production)
- [ ] Sentry captures unhandled errors with stack traces
- [ ] Helmet headers present in API responses
- [ ] CORS blocks requests from non-allowed origins
- [ ] All `.env` vars documented in `.env.example`
- [ ] `npm run build` (if using TypeScript later) works
- [ ] PM2 starts API + worker processes

### Codex Prompt

```
You are a senior Node.js DevOps engineer.

PROJECT: AniCart — anime wallpaper marketplace.
STACK: Node.js, Express, Docker, PM2, Winston, Sentry, Helmet.

TASK: Production-ready the entire backend: logging, error tracking, security, Docker, deployment config.

CREATE THESE FILES:

1. src/utils/logger.js
   - Winston logger with:
     a) Console transport (colorized, simple format in dev)
     b) File transport (JSON format in production): error.log + combined.log
     c) Log levels: error, warn, info, http, debug
     d) Include timestamp and request ID (if available)
   - Export logger instance

2. src/config/sentry.js
   - Initialize @sentry/node with SENTRY_DSN
   - Export Sentry handlers: requestHandler, errorHandler
   - Configure: environment, tracesSampleRate: 0.1 (10% of requests)

3. src/middleware/requestLogger.js
   - Log every request: method, url, status, response time, user ID (if authed)
   - Use winston 'http' level
   - Attach unique requestId (crypto.randomUUID) to req for tracing

4. Dockerfile
   - FROM node:20-alpine
   - WORKDIR /app
   - COPY package*.json → npm ci --only=production
   - COPY src/ server.js worker.js
   - EXPOSE 5000
   - CMD ["node", "server.js"]

5. docker-compose.yml (LOCAL DEV ONLY)
   services:
   - mongodb: mongo:7, port 27017, volume for persistence
   - redis: redis:7-alpine, port 6379
   - meilisearch: getmeili/meilisearch:latest, port 7700, MEILI_MASTER_KEY env
   Note: Node.js app runs natively (not in Docker) for hot-reload

6. ecosystem.config.js (PM2 for production)
   - App: name 'anicart-api', script 'server.js', instances 2, exec_mode 'cluster'
   - Worker: name 'anicart-worker', script 'worker.js', instances 1

7. .env.example — document ALL environment variables with descriptions

8. MODIFY: app.js — add security stack:
   a) Sentry request handler (FIRST middleware)
   b) helmet()
   c) cors({ origin: [process.env.CLIENT_URL], credentials: true })
   d) express-mongo-sanitize()
   e) hpp()
   f) requestLogger middleware
   g) [existing routes]
   h) Sentry error handler (BEFORE custom error handler)
   i) Custom error handler (existing)

9. MODIFY: Replace ALL console.log across the project with logger calls.

OUTPUT: Complete file contents for all files. Include inline comments explaining each security measure.
```

---

## DEPLOYMENT STEPS

### 1. DigitalOcean Setup (Backend)

```bash
# Create Droplet: Ubuntu 24.04, $6/month (Basic, 1 vCPU, 1GB RAM)
# Use SSH key auth (generate with ssh-keygen if needed)

# SSH into Droplet
ssh root@your-droplet-ip

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
npm install -g pm2

# Install Docker (for Meilisearch)
curl -fsSL https://get.docker.com | sh

# Start Meilisearch in Docker
docker run -d --restart always -p 7700:7700 \
  -e MEILI_MASTER_KEY=your-master-key \
  -v /opt/meilisearch/data:/meili_data \
  getmeili/meilisearch:latest

# Clone repo
git clone https://github.com/your-username/anicart-server.git
cd anicart-server

# Install dependencies
npm ci --only=production

# Set up Doppler (or copy .env manually)
npx doppler run -- pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save
pm2 startup
```

### 2. MongoDB Atlas (Database)

```
1. Login to MongoDB Atlas
2. Use existing M0 free cluster (or create one)
3. Whitelist your Droplet IP in Network Access
4. Get connection string → add to .env as MONGODB_URI
```

### 3. Upstash Redis (Cache)

```
1. Create free database at console.upstash.com
2. Copy REST URL + REST Token → UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
3. Copy TLS connection URL → REDIS_URL (for BullMQ)
```

### 4. Cloudflare R2 (Storage)

```
1. Create R2 bucket "anicart-images" in Cloudflare dashboard
2. Create R2 API token (Object Read & Write)
3. Enable public access (or use custom domain)
4. Copy credentials → R2_* env vars
5. Set CORS policy to allow your frontend origin
```

### 5. Stripe (Payments)

```
1. Create Stripe account (claim student pack)
2. Get test keys → STRIPE_SECRET_KEY
3. Set up webhook endpoint: https://api.anicart.me/api/v1/payments/webhook
4. Copy webhook secret → STRIPE_WEBHOOK_SECRET
5. Switch to live keys when ready to accept real payments
```

### 6. Resend (Email)

```
1. Create account at resend.com
2. Add and verify your domain (anicart.me)
3. Get API key → RESEND_API_KEY
```

### 7. Sentry (Errors)

```
1. Create account (claim student pack)
2. Create Node.js project
3. Copy DSN → SENTRY_DSN
```

### 8. Netlify (Frontend)

```
1. Connect GitHub repo (client folder)
2. Build command: npm run build
3. Publish directory: build (or dist)
4. Environment variable: REACT_APP_API_URL=https://api.anicart.me
5. Custom domain: anicart.me (if using Namecheap .me)
```

### 9. Cloudflare DNS

```
1. Point Namecheap domain to Cloudflare nameservers
2. A record: api.anicart.me → Droplet IP (proxied)
3. CNAME record: anicart.me → Netlify site (proxied)
4. SSL: Full (strict)
```

### 10. Doppler (Secrets)

```
1. Create project "anicart" in Doppler
2. Add all env vars for each environment (dev, staging, production)
3. Install Doppler CLI on Droplet
4. Run app via: doppler run -- pm2 start ecosystem.config.js
```

---

## POST-DEPLOY CHECKLIST

- [ ] API responds at `https://api.anicart.me/api/v1/products`
- [ ] Frontend loads at `https://anicart.me`
- [ ] Registration + login works
- [ ] Product listing + search works
- [ ] Upload → processing → variants generated
- [ ] Stripe checkout → payment → order completed → licenses granted
- [ ] Download signed URL works for licensed users
- [ ] Emails sending (check Resend dashboard)
- [ ] Errors appearing in Sentry
- [ ] Logs visible via `pm2 logs`
- [ ] SSL certificate valid (green padlock)
- [ ] Rate limiting works (test with rapid requests)

---

## APPENDIX: HOW TO USE THIS PLAN WITH CODEX

### Step 1
Open your IDE (VS Code + Copilot or similar).

### Step 2
For each day, copy the **Codex Prompt** section.

### Step 3
Before pasting the prompt, prepend your current relevant code. Example:
```
Here is my current authController.js:
[paste file contents]

Here is my current User model:
[paste file contents]

[Then paste the Day 1 Codex prompt]
```

### Step 4
Review the generated code. Run tests. Commit.

### Step 5
Move to the next day.

### Key Rule
**Never skip a day.** Each day builds on the previous day's output. The dependency chain is:

```
Day 1 (Service Layer) 
  → Day 2 (R2 Upload) 
    → Day 3 (Image Processing) 
      → Day 4 (BullMQ) 
        → Day 5 (License + Download)
          → Day 6 (Stripe Checkout) 
            → Day 7 (Webhooks + Fulfillment)
              → Day 8 (Email)
Day 9 (Redis) — can run parallel with Day 8
Day 10 (Search) — can run parallel with Day 9
Day 11 (Creators) — depends on Day 4 + Day 12
Day 12 (Admin) — depends on Day 11
Day 13 (Notifications + Wishlist + Reviews) — depends on Day 5
Day 14 (Deploy) — depends on everything
```

---

*End of Master Plan. Build it one day at a time. Ship it in 14 days.*
