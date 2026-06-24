# Backend_Finish.md — AniCart Complete Audit & Production Roadmap

---

## Current Backend Status: ~52% Complete

The infrastructure skeleton is genuinely solid — auth, uploads, queues, and security middleware are production-grade. But two fatal gaps block any real usage: **Stripe is configured but never called** (checkout creates "completed" orders without touching payment), and **the frontend is 100% disconnected from the backend** (hardcoded demo credentials, hardcoded products, no API calls whatsoever). Nothing can be shipped or tested end-to-end until both are resolved.

---

## What Is Fully Implemented

| System | File(s) | Status |
|---|---|---|
| JWT Auth (register, login, logout, refresh) | authController, authService, authRoutes | ✅ Complete |
| Email verification & resend | authService, emailService | ✅ Complete |
| Forgot/reset password | authService, emailService | ✅ Complete |
| Login brute-force protection | loginProtectionService (Redis + memory fallback) | ✅ Complete |
| Token blacklist on logout | tokenBlacklistService (Redis + memory fallback) | ✅ Complete |
| Cart CRUD + sync | cartController, cartService, cartRoutes | ✅ Complete |
| Product catalog + filtering + pagination | productController, productService, productRoutes | ✅ Complete |
| Product soft-delete + restore | productService | ✅ Complete |
| File upload pipeline | uploadController + Sharp + BullMQ + R2 | ✅ Complete |
| Image processing (4K/2K/1080p/preview/thumb) | imageProcessor.js | ✅ Complete |
| Watermarking on preview variants | uploadController | ✅ Complete |
| Duplicate detection (SHA-256 hash) | uploadController | ✅ Complete |
| Creator application + auto-approve | creatorController, creatorRoutes | ✅ Complete |
| Creator approve/reject (admin) | creatorController | ✅ Complete |
| Creator upload limits + level system | creatorController | ✅ Complete |
| Monthly creator reset job | creatorMonthlyResetJob | ✅ Complete |
| Orphaned R2 file cleanup | cleanupOrphanedFiles.js | ✅ Complete |
| Bull Board queue dashboard | workerRoutes | ✅ Complete |
| Security middleware (Helmet, HPP, mongo-sanitize) | app.js | ✅ Complete |
| Rate limiting (auth, api, strict) | rateLimiter.js | ✅ Complete |
| Input validation (express-validator) | validateRequest.js | ✅ Complete |
| User profile + password change | userController, userService | ✅ Complete |
| Sentry error tracking (optional) | app.js | ✅ Complete |
| Structured logging (Winston) | utils/logger.js | ✅ Complete |
| Centralized error handling | middleware/errorHandler.js | ✅ Complete |
| ApiError / ApiResponse / catchAsync utilities | utils/ | ✅ Complete |
| Upstash Redis config + fallback | config/redis.js | ✅ Complete |
| Cloudflare R2 config | config/r2.js | ✅ Complete |

---

## What Is Partially Implemented

| System | Problem |
|---|---|
| Orders / checkout | Route and controller exist. Stripe key is required in config — but checkout() creates orders as "completed" with zero Stripe calls. No payment at all. |
| User library | `User.library` gets populated by checkout. But `userService.getLibrary()` queries the **License** collection, which is **never written to anywhere**. Library always returns empty. |
| Product search | Works via `$regex` (unindexed) — slow on large catalogs. `meilisearch` is installed but never used. |
| Email on purchase | `sendOrderReceiptEmail()` exists in emailService but is never called from orderService.checkout(). |
| Admin product moderation | Products uploaded by creators land in `status: 'pending'` — no route to approve or reject them. They never go live without manual DB edits. |
| Review system | `Review` model is complete with indexes. No controller, no service, no routes. `Product.rating` and `Product.reviews` are manually-set numbers with no connection to real reviews. |

---

## What Is Completely Missing

### Business-Critical (app doesn't work without these)
- **Stripe payment flow** — `POST /api/v1/orders/create-payment-intent`, `POST /api/v1/orders/confirm-payment`, Stripe webhook handler
- **Signed download URL endpoint** — `GET /api/v1/products/:id/download?resolution=4k` — generates a time-limited presigned R2 URL for paid variants. Users own the product but have no way to get the file.
- **Frontend ↔ Backend integration** — LoginPage uses hardcoded demo array, never hits `/api/v1/auth/login`. SignupPage does `login(newUser)` locally. App.js serves `PRODUCTS_DATA` constant. No `axios` instance, no `.env` for API URL, no token storage, no interceptors.
- **License document creation** — `orderService.checkout()` does `$addToSet` on `User.library` but never calls `License.create()`. `userService.getLibrary()` queries License — always empty.

### Features / Routes
- `GET /api/v1/products/:id/download` — presigned URL for purchased products
- `POST /api/v1/reviews` — submit review (requires verified purchase)
- `GET /api/v1/products/:id/reviews` — list reviews
- `DELETE /api/v1/reviews/:id` — delete own review
- `GET /api/v1/users/wishlist` — get wishlist
- `POST /api/v1/users/wishlist/:productId` — add to wishlist
- `DELETE /api/v1/users/wishlist/:productId` — remove from wishlist
- `GET /api/v1/admin/products/pending` — list creator-uploaded products awaiting approval
- `PUT /api/v1/admin/products/:id/approve` — publish creator product
- `PUT /api/v1/admin/products/:id/reject` — reject creator product
- `GET /api/v1/admin/users` — user management
- `GET /api/v1/admin/orders` — all orders
- `GET /api/v1/admin/stats` — platform analytics
- `GET /api/v1/creator/products` — creator's own uploaded products
- `GET /api/v1/creator/stats` — creator earnings/sales dashboard
- Stripe webhook endpoint (`POST /api/v1/webhooks/stripe`)

### Infrastructure / Security
- Bull Board has no authentication — `/admin/queues` is publicly accessible
- Test/crash routes exposed in production (`/test/crash`, `/test/rejection`, `/api/v1/test`, `/api/v1/debug`)
- Missing `Wishlist` field on User model (or separate Wishlist model)
- No `STRIPE_WEBHOOK_SECRET` rotation / signature verification for webhook

---

## API Audit

### Complete routes (backend verified)

```
POST   /api/v1/auth/register
GET    /api/v1/auth/verify-email/:token
POST   /api/v1/auth/resend-verification
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
POST   /api/v1/auth/refresh
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password/:token

GET    /api/v1/products
GET    /api/v1/products/series/list
GET    /api/v1/products/:id
POST   /api/v1/products             [admin]
PUT    /api/v1/products/:id         [admin]
DELETE /api/v1/products/:id         [admin]
PUT    /api/v1/products/:id/restore [admin]

GET    /api/v1/cart
POST   /api/v1/cart/add
PUT    /api/v1/cart/update
DELETE /api/v1/cart/remove/:productId
DELETE /api/v1/cart/clear
POST   /api/v1/cart/sync

POST   /api/v1/orders/checkout      ⚠ no payment
GET    /api/v1/orders
GET    /api/v1/orders/stats/summary
GET    /api/v1/orders/:id
PUT    /api/v1/orders/:id/cancel

GET    /api/v1/users/profile
PUT    /api/v1/users/profile
PUT    /api/v1/users/password
GET    /api/v1/users/library        ⚠ always empty (License bug)

POST   /api/v1/creator/apply
GET    /api/v1/admin/creator-requests          [admin]
PUT    /api/v1/admin/creator-requests/:id/approve [admin]
PUT    /api/v1/admin/creator-requests/:id/reject  [admin]

POST   /api/v1/upload/wallpaper     [admin|creator]
GET    /api/v1/upload/status/:productId
GET    /api/v1/worker/health
```

### Frontend expectations vs backend reality

| Frontend action | Expected route | Actual state |
|---|---|---|
| Login form submit | `POST /api/v1/auth/login` | ❌ Hardcoded demo array, no fetch |
| Signup form submit | `POST /api/v1/auth/register` | ❌ Local `login()` call, no fetch |
| Forgot password button | `POST /api/v1/auth/forgot-password` | ❌ Shows fake toast, no fetch |
| Product grid render | `GET /api/v1/products` | ❌ Static `PRODUCTS_DATA` constant |
| Add to cart | `POST /api/v1/cart/add` | ❌ Local state only |
| Checkout | `POST /api/v1/orders/checkout` | ❌ Local state, shows toast |
| Download wallpaper | `GET /api/v1/products/:id/download` | ❌ Route doesn't exist |

---

## Database Audit

### Models: status

| Model | Schema | Indexes | Used in service | Notes |
|---|---|---|---|---|
| User | ✅ | email unique | ✅ | Missing `wishlist` array |
| Product | ✅ | status, anime, tags, price, createdAt, fileHash | ✅ | `rightsConfirmed`, `termsAcceptedAt`, `licenseType` are `required:true` but `createProduct()` in productService never sets them → admin product creation will throw |
| Cart | ✅ | user unique | ✅ | No qty on cartItem — digital products, intentional |
| Order | ✅ | user+createdAt, stripePaymentIntentId | ✅ | `stripePaymentIntentId` always null (no Stripe) |
| License | ✅ | user+product unique | ❌ Never written to | `getLibrary()` queries this, always returns empty |
| Review | ✅ | productId | ❌ No controller, no routes | |

### Missing indexes worth adding

```js
// productService.getProducts() filters on status + series + name regex
productSchema.index({ status: 1, series: 1 });

// For review count queries when reviews are implemented
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

// For creator product listing
productSchema.index({ creatorId: 1, status: 1 });
```

---

## Security Audit

### Already solid
- ✅ Helmet (all headers including CSP)
- ✅ HPP (HTTP parameter pollution prevention)
- ✅ express-mongo-sanitize (NoSQL injection prevention)
- ✅ bcrypt with 12 rounds
- ✅ JWT with separate access (15m) + refresh (7d) tokens with rotation
- ✅ Token blacklist on logout (Redis-backed)
- ✅ Login brute-force protection (5 attempts → 10 min lock, Redis-backed)
- ✅ MIME type validation (file-type magic bytes, not just extension)
- ✅ SHA-256 duplicate detection for uploads
- ✅ Input validation on every route (express-validator)
- ✅ Trust proxy 1 (correct for Render)

### Vulnerabilities to fix

**CRITICAL**

1. **Bull Board is unauthenticated.** `/admin/queues` is mounted with no middleware. Anyone can view your queues, jobs, and Redis keys.

```js
// app.js — add before the bull board mount
const { protect, adminOnly } = require('./middleware/authMiddleware');
app.use('/admin/queues', protect, adminOnly, bullBoardAdapter.getRouter());
```

2. **Test/debug routes are live in production.** `app.js` has `/test/crash`, `/test/rejection`, `/test/async-crash` with no NODE_ENV guard. `routes/index.js` mounts `/api/v1/test` and `/api/v1/debug` with no guard.

```js
// app.js — wrap test routes
if (config.isDevelopment) {
  app.get('/test/crash', ...);
  app.get('/test/rejection', ...);
  app.get('/test/async-crash', ...);
}

// routes/index.js — wrap test and debug routes
if (process.env.NODE_ENV !== 'production') {
  router.use('/test', testRoutes);
  router.use('/debug', debugRoutes);
}
```

3. **Stripe config throws on startup even though Stripe is unused.** `config/index.js` requires `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in the required-configs array. You cannot start the app without setting them, even for local development without Stripe.

Either remove them from `requiredConfigs` (and add a runtime check in the payment controller), or use soft warnings:
```js
// Soft-warn instead of hard throw for payment keys until Stripe is wired
if (!config.STRIPE_SECRET_KEY) {
  logger.warn('STRIPE_SECRET_KEY not set — payments disabled');
}
```

**MEDIUM**

4. **Product.createProduct() will throw a validation error.** `rightsConfirmed`, `termsAcceptedAt`, and `licenseType` are `required: true` in the Product schema but `productService.createProduct()` never sets them. Admin-created products will fail with a Mongoose validation error.

Fix:
```js
// productService.createProduct — add required fields
return Product.create({
  ...fields,
  rightsConfirmed: body.rightsConfirmed ?? false,
  termsAcceptedAt: body.termsAcceptedAt ?? new Date(),
  licenseType: body.licenseType ?? 'original',
});
```

5. **Regex search is injection-adjacent and O(n).** `$regex` with `$options: 'i'` on `name` has no index and the regex pattern comes directly from `req.query.search` without escaping. An attacker can send a catastrophic regex.

Fix:
```js
// Escape regex special chars before use
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
if (search) {
  filter.name = { $regex: escapeRegex(search), $options: 'i' };
}
```

6. **Duplicate `connectDB` functions.** `config/db.js` and `db/database.js` both define `connectDB`. Only `db/database.js` is used in `server.js`. `config/db.js` is dead code that will confuse contributors.

---

## Deployment Audit

### Environment variables required

```bash
# Currently throws on missing — required by config/index.js
MONGODB_URI=
JWT_SECRET=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
STRIPE_SECRET_KEY=        # Blocks startup even though Stripe isn't wired yet
STRIPE_WEBHOOK_SECRET=    # Same

# Optional but needed for full function
UPSTASH_REDIS_REST_URL=   # Falls back to in-memory (login protection + token blacklist)
UPSTASH_REDIS_REST_TOKEN=
EMAIL_USER=               # Gmail SMTP
EMAIL_PASS=               # Gmail App Password
CLIENT_URL=               # e.g. https://anicartweb.netlify.app
SENTRY_DSN=               # Optional, app runs without it
NODE_ENV=production
PORT=5000
```

### Missing from config
- `R2_PUBLIC_URL` — `config/r2.js` references `publicUrl` but there's no config key for it; `uploadService.buildPublicUrl()` will produce wrong URLs
- `R2_BUCKET_NAME` — `config/r2.js` uses it but it's not in `config/index.js`

### Render-specific
- `worker.js` is referenced in `package.json` scripts (`dev:worker`, `worker`) but the file isn't in the export — it may not exist. BullMQ jobs need a separate worker process.
- `assets/watermark.png` must exist in the deployed build — it's hardcoded at `path.join(__dirname, '..', 'assets', 'watermark.png')`. Add to deployment checklist.

---

## Critical Bugs

**Bug 1 — Library always empty**
`orderService.checkout()` adds products to `User.library` via `$addToSet`, but `userService.getLibrary()` queries the `License` collection which no code ever writes to. Every user's library will be empty no matter how many purchases they make.

Fix in `orderService.checkout()`, after `User.findByIdAndUpdate()`:
```js
const licenseOps = purchasedProductIds.map((productId) => ({
  updateOne: {
    filter: { user: userId, product: productId },
    update: { $setOnInsert: { user: userId, product: productId, isActive: true, downloadCount: 0, maxDownloads: 10 } },
    upsert: true,
  },
}));
await License.bulkWrite(licenseOps);
```

**Bug 2 — Checkout has no payment**
`orderService.checkout()` calls `Order.createFromCart()` which sets `status: 'completed'` unconditionally. This gives users free access to all wallpapers with zero payment. Must be gated behind Stripe payment confirmation before order is marked completed and library is populated.

**Bug 3 — Admin product creation fails validation**
`productService.createProduct()` doesn't pass `rightsConfirmed`, `termsAcceptedAt`, or `licenseType` to `Product.create()`. These are all `required: true` in the schema. Every `POST /api/v1/products` by admin will return a Mongoose validation error.

**Bug 4 — R2 public URL is undefined**
`config/r2.js` sets `publicUrl` from an env variable but that variable doesn't exist in `config/index.js`. Preview and thumbnail URLs stored in Product.assets will be built with `undefined/previews/...`.

---

## High Priority Tasks

These block all end-to-end testing and production use.

### Task 1 — Fix the Library bug (1 hour)
Add `License.bulkWrite()` to `orderService.checkout()` as shown in Bug 1 above. Also update `userService.getLibrary()` to optionally fall back to `User.library` if no License documents exist (for backward compatibility with existing data).

### Task 2 — Fix admin product creation (30 minutes)
Add `rightsConfirmed`, `termsAcceptedAt`, `licenseType` to `productService.createProduct()` and add those fields to `createProductValidation` in `validateRequest.js`.

### Task 3 — Lock down Bull Board and remove test routes (1 hour)
Add `protect, adminOnly` to `/admin/queues` mount. Wrap test/debug routes in `NODE_ENV !== 'production'` guard. Both are live unauthenticated endpoints right now.

### Task 4 — Add R2 public URL and bucket name to config (15 minutes)
```js
// config/index.js — add
R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
```
Then reference `config.R2_PUBLIC_URL` and `config.R2_BUCKET_NAME` in `config/r2.js`.

### Task 5 — Implement presigned download route (2–3 hours)
This is the core product promise — users pay for high-res wallpapers, they need a way to get them.

```
GET /api/v1/products/:id/download?resolution=4k
```

Logic:
1. `protect` middleware — must be logged in
2. Check `License.findOne({ user: req.user.id, product: req.params.id, isActive: true })`
3. If no license → 403 Forbidden
4. Get product, check `product.assets[resolution].key` exists
5. Increment `License.downloadCount`, check `< maxDownloads`
6. Use `@aws-sdk/s3-request-presigner` to generate a signed URL (15 min expiry)
7. Return `{ downloadUrl, expiresIn: 900 }`

### Task 6 — Integrate Stripe payment (4–6 hours)
Replace the free checkout with a real payment flow:

**New routes:**
```
POST /api/v1/orders/create-payment-intent   → Stripe PaymentIntent → returns client_secret
POST /api/v1/webhooks/stripe                → handle payment_intent.succeeded
```

**Flow:**
1. User hits checkout → backend creates Stripe PaymentIntent with cart total
2. Frontend uses Stripe.js to confirm payment with the `client_secret`
3. On `payment_intent.succeeded` webhook: mark order completed, create licenses, add to library, send receipt email
4. Stripe webhook must use raw body (add `express.raw({ type: 'application/json' })` before JSON parser for this route)

### Task 7 — Wire the frontend to the backend (8–12 hours)
This is the biggest task. Currently the entire frontend uses hardcoded data and localStorage auth.

**Minimum integration steps:**

1. Create `client/src/api/client.js` — axios instance with baseURL from `REACT_APP_API_URL`, request interceptor to attach `Authorization: Bearer <token>`, response interceptor to handle 401 → refresh token → retry.

2. Auth flows: replace demo credential check in `LoginPage.jsx` with `POST /api/v1/auth/login`, store access token in memory (not localStorage — XSS risk), store refresh token in httpOnly cookie (server already sets it).

3. Product loading: replace `PRODUCTS_DATA` constant with `GET /api/v1/products` call in a `useEffect` inside `App.js` or `Dashboard.jsx`.

4. Cart: replace `setCart` state calls with API calls to cart routes; fall back to local state on network error.

5. Add `axios` interceptor for token refresh on 401 using `POST /api/v1/auth/refresh`.

---

## Medium Priority Tasks

### Review System (4 hours)

Create `services/reviewService.js`:
- `createReview(userId, productId, rating, comment)` — validate user has purchased (License check), enforce one-review-per-product (unique index already on model), update `Product.rating` and `Product.reviews` via aggregation after write
- `getProductReviews(productId, query)` — paginated
- `deleteReview(userId, reviewId)` — own review only

Create `controllers/reviewController.js` and `routers/reviewRoutes.js`, mount at `/api/v1/reviews`.

### Wishlist (2 hours)

Add to User schema:
```js
wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
```

Add routes to `userRoutes.js`:
- `GET /api/v1/users/wishlist`
- `POST /api/v1/users/wishlist/:productId`
- `DELETE /api/v1/users/wishlist/:productId`

### Admin product moderation (3 hours)

Creators upload wallpapers → `product.status = 'pending'`. Admins need to approve or reject before products go live.

Add to `productRoutes.js`:
```
GET  /api/v1/admin/products/pending        [admin]
PUT  /api/v1/admin/products/:id/approve    [admin]
PUT  /api/v1/admin/products/:id/reject     [admin] + reason field
```

On approve: set `status: 'active'`, send notification email to creator.
On reject: set `status: 'rejected'`, store `rejectionReason`, email creator.

### Order receipt email (30 minutes)

In `orderService.checkout()`, after the order is created and library is populated, add:
```js
const user = await User.findById(userId).select('name email');
await sendOrderReceiptEmail(user, populatedOrder).catch((err) => logger.error('Receipt email failed', err));
```

(Email failure must never block order completion — already using `.catch`.)

### Creator dashboard routes (2 hours)

```
GET /api/v1/creator/products    — creator's own uploads, with processing status
GET /api/v1/creator/stats       — sales count, revenue, upload limit, level
```

These only need to read from existing models — no new schema.

### Fix regex search + add Meilisearch (3 hours)

Short term: escape the regex input (see Security section, Bug fix above).

Long term: `meilisearch` is already installed. Sync products to Meilisearch index on create/update, use Meilisearch for search queries. Faster and typo-tolerant.

### Escape regex in search (15 minutes — do this immediately)

See security audit item 5. One line change.

---

## Low Priority Tasks

### Cleanup
- Delete `config/db.js` — dead code, `db/database.js` is the one used
- Remove `paginatedResponse`'s `meta` field from `meta` parameter in `paginatedResponse()` — the function signature accepts `meta` but the destructuring doesn't use it (always uses `page/limit/total`)
- Move the `resolveCreatorLevel` function from `creatorController.js` to a shared utility — it's also needed when listing creator stats

### Notifications
- Creator notified when their product is approved/rejected (email)
- Creator notified when someone buys their product (optional, track in creatorStats)

### Analytics endpoint

```
GET /api/v1/admin/stats
```
Returns: total users, total products, total orders, total revenue, new users this week, top-selling products.

### Google OAuth (optional)

Register a Google OAuth app, add `passport-google-oauth20` or use a simple token exchange. Significantly increases signup conversion.

### API versioning header

Add `X-API-Version: 1.0` to all responses via middleware — helps clients handle future breaking changes.

### Performance: MongoDB indexes

```js
// Compound index for the most common product query (status + series + price sort)
productSchema.index({ status: 1, series: 1, price: 1 });

// For creator's own product listing
productSchema.index({ creatorId: 1, status: 1, createdAt: -1 });
```

### Response caching for public product catalog

Public product listing and series list don't change frequently. Add a 60-second Redis cache:
```js
// In productService.getProducts()
const cacheKey = `products:${JSON.stringify(query)}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
// ... fetch ...
await redis.set(cacheKey, JSON.stringify(result), { ex: 60 });
```

---

## Step-by-Step Completion Plan

### Phase 1 — Stop the bleeding (Day 1, ~4 hours)
1. Fix admin product creation validation bug (Task 2)
2. Fix R2 config missing env vars (Task 4)
3. Lock down Bull Board and remove test routes (Task 3)
4. Escape regex in search
5. Soft-warn instead of throw for missing Stripe config so app starts locally without it

**At end of Phase 1:** App starts cleanly in all environments. No production security holes. No server-startup crashes.

---

### Phase 2 — Core eCommerce flow (Days 2–4, ~10 hours)
1. Fix Library bug — add License.bulkWrite to checkout (Task 1)
2. Implement download route with presigned URLs (Task 5)
3. Integrate Stripe: PaymentIntent creation + webhook handler (Task 6)
4. Wire order receipt email

**At end of Phase 2:** Real money can be accepted. Users who buy products can download the files they paid for. Receipts are emailed.

---

### Phase 3 — Frontend integration (Days 5–7, ~12 hours)
1. Create `client/src/api/client.js` (axios instance + token interceptors)
2. Wire LoginPage → `POST /api/v1/auth/login`
3. Wire SignupPage → `POST /api/v1/auth/register`
4. Wire Dashboard/product grid → `GET /api/v1/products`
5. Wire cart actions → cart API routes
6. Wire checkout → Stripe frontend + backend
7. Wire library → `GET /api/v1/users/library`
8. Wire forgot password → `POST /api/v1/auth/forgot-password`

**At end of Phase 3:** End-to-end user flow works: register → verify email → login → browse → cart → pay → download.

---

### Phase 4 — Content & Creator features (Days 8–10, ~9 hours)
1. Review system (model → service → controller → routes)
2. Wishlist (User schema field + routes)
3. Admin product moderation (pending queue + approve/reject)
4. Creator dashboard routes (own products + stats)

**At end of Phase 4:** Creator-uploaded content can be moderated and published. Users can review purchases and maintain wishlists.

---

### Phase 5 — Polish & production hardening (Days 11–12, ~5 hours)
1. Delete `config/db.js` dead code
2. Add compound MongoDB indexes
3. Add Redis response caching for product catalog
4. Wire Meilisearch for full-text search (replace regex)
5. Add admin stats endpoint
6. Creator email notifications (product approved/rejected, product sold)
7. Final security pass: `npm audit`, review all env vars, test rate limits

**At end of Phase 5:** Backend is production-ready — secure, fast, fully featured, no dead code, all flows tested.

---

## Required `.env.example` (create this file)

```bash
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/anicart

# Auth
JWT_SECRET=your-very-strong-secret-here
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
BCRYPT_SALT_ROUNDS=12

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=anicart-assets
R2_PUBLIC_URL=https://your-r2-public-bucket-url.r2.dev

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Upstash Redis (optional — falls back to memory if not set)
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# Email (Gmail SMTP)
EMAIL_USER=your@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM="AniCart <your@gmail.com>"

# Frontend URL
CLIENT_URL=http://localhost:3000

# Sentry (optional)
SENTRY_DSN=https://...sentry.io/...
```

---

## Summary

| Category | Status |
|---|---|
| Auth system | ✅ Production-ready |
| Upload pipeline | ✅ Production-ready |
| Cart system | ✅ Production-ready |
| Security middleware | ✅ Production-ready (2 fixes needed) |
| Background jobs | ✅ Production-ready |
| Order / Payment | ❌ No Stripe, free checkout |
| Download delivery | ❌ Missing entirely |
| Frontend integration | ❌ Zero API calls |
| Library (user purchases) | ❌ Bug — always empty |
| Review system | ❌ Model only |
| Wishlist | ❌ Not started |
| Admin moderation | ❌ Partial (only creator approval) |
| Creator dashboard | ❌ Not started |
