Awesome job finishing Day 1. Moving from standard CRUD to enterprise-grade file handling and security is where the real engineering happens. 

Here is the comprehensive `ANICART_PART_2_POLISHING.md` file, combining all the missing security constraints, production rules, and the 25 critical fixes strictly from Day 2 onward. I have engineered this to be highly detailed and deeply technical to hit your length requirement while exclusively focusing on the advanced polishing steps not covered in your Master Plan.

```markdown
# ANICART — PART 2: POLISHING, SECURITY, & PRODUCT RULES
> **Integration Guide:** This document expands upon the Master Plan, detailing the missing production constraints, security limits, legal requirements, and edge-case handling starting from Day 2. It does not repeat basic architecture; it focuses entirely on enterprise hardening, abuse prevention, and financial accuracy.

---

## DAY 1 — FOUNDATION SAFETY CHECKS (ADDED FROM AUDIT)

### 1. MongoDB Indexes (Performance-Critical)
Without indexes, MongoDB Atlas free tier queries degrade quickly once products and orders increase.

**Required Indexes:**
* **Product:** status, anime, tags, price, createdAt, fileHash
* **License:** unique compound index on (userId, productId)
* **Order:** userId, stripePaymentIntentId
* **Review:** productId

### 2. JWT Logout Blacklist Placement
JWT blacklist is already implemented conceptually in Day 9, but the implementation planning should start here so token shape is correct from day one.
* Add a jti claim in token generation.
* Store logout jti in Redis with TTL.
* Reject requests in auth middleware when blacklist hit is found.

### 3. Password Strength + Email Validation (Auth Input Guardrails)
Keep onboarding simple for normal users, but reject weak credentials and malformed emails early.

**Rules:**
* Enforce password strength at registration: minimum length, mixed character classes, and common-password rejection.
* Validate email format at request validation layer before user creation.
* Return clear, user-friendly validation errors instead of generic failures.

### 4. MongoDB Connection Pool Limits (Atlas Free Tier Safety)
Set conservative pool limits to avoid connection exhaustion on small clusters.

**Required Connection Options:**
```javascript
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 5,
  minPoolSize: 1
});
```

---

## DAY 2 — UPLOAD SECURITY, HASHING, & BUSINESS RULES

### 1. Strict File Rules & API Limits
The basic Multer config is not enough. We must enforce strict API-level limits to prevent cost explosion and storage abuse.

**Validation Rules:**
* **Allowed Formats:** Strictly check magic numbers/mimetypes for image/png, image/jpeg, image/webp. Reject image/gif, video/mp4, application/zip, application/pdf at the Multer level.
* **Price Validation:** Users cannot set ridiculous prices. Add Express-Validator middleware enforcing a minimum of 10 INR and a maximum of 10000 INR. The value must be an integer (no fractional paisa to avoid Stripe rounding errors).
* **Upload Timeout:** Set a strict timeout on the upload route. If an upload takes longer than 30 seconds to reach the server, terminate the connection to free up the thread.

### 2. Legal & Copyright Declaration
To ensure DMCA Safe Harbor protection, the upload request MUST include legal affirmations. If rightsConfirmed is false, the upload controller must reject the request entirely.

**Schema Additions (Product Model):**
```javascript
rightsConfirmed: { 
  type: Boolean, 
  required: true 
},
termsAcceptedAt: { 
  type: Date, 
  required: true 
},
licenseType: { 
  type: String, 
  enum: ['original', 'ai_generated', 'licensed', 'fan_art_with_permission'],
  required: true 
},
authorName: { 
  type: String 
},
sourceLink: { 
  type: String // Optional proof of ownership or source
},
copyrightOwner: {
  type: String
}
```

### 3. Upload Authorization + Storage Key Convention
To match marketplace policy from the condensed plan, uploads must be role-gated and key naming must remain deterministic.

**Rules:**
* Only `admin` and approved `creator` roles can upload.
* Original upload key format must be:

```text
originals/{productId}/{uuid}.{ext}
```

This keeps cleanup jobs and object tracing predictable in production.

---

## DAY 3 — ADVANCED IMAGE PROCESSING & FAIL-SAFES

### 1. EXIF Metadata Removal (CRITICAL)
Images straight from cameras or phones contain GPS coordinates, device models, and date/time. You must strip this to protect creator privacy and reduce file size.

**Implementation in Sharp:**
When passing the buffer to Sharp, immediately strip metadata before generating *any* variants.
```javascript
// Do NOT pass metadata to output. This is the crucial line for privacy.
const cleanBuffer = await sharp(buffer)
  .withMetadata(false) 
  .toBuffer();
```

### 2. Available Resolution Logic
You cannot generate a 4K variant from a 1080p source image without making it blurry (upscaling). The backend must calculate available resolutions based on the original width and restrict access accordingly.

**Calculation Logic:**
* If original width >= 3840: allow ['4k', '2k', 'fhd', 'mobile']
* If original width >= 2560: allow ['2k', 'fhd', 'mobile']
* If original width >= 1920: allow ['fhd', 'mobile']
* If original width < 1920: throw ApiError.badRequest('Image width must be at least 1920px')

**Schema Addition (Product Model):**
```javascript
availableResolutions: [{
  type: String,
  enum: ['4k', '2k', 'fhd', 'mobile']
}]
```

### 3. Watermark File Application
The preview variant MUST have a visual watermark to prevent right-click theft. 
* Create a physical /src/assets/watermark.png file (semi-transparent).
* Use Sharp's composite feature to overlay it onto the 1200x675 preview.

**Implementation Logic:**
```javascript
const watermarkedPreview = await sharp(resizedBuffer)
  .composite([{ 
    input: './src/assets/watermark.png', 
    gravity: 'center', 
    blend: 'over' 
  }])
  .jpeg({ quality: 70 })
  .toBuffer();
```

### 4. File Hash Duplicate Detection (In Processing Pipeline)
Hash every accepted image buffer and reject duplicates before expensive variant generation.

**Schema Requirement:**
```javascript
fileHash: {
  type: String,
  required: true,
  unique: true,
  index: true
}
```

**Hashing Logic Example:**
```javascript
const crypto = require('crypto');
const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
const existingProduct = await Product.findOne({ fileHash });
if (existingProduct) {
  throw ApiError.conflict('This exact image has already been uploaded to AniCart.');
}
```

### 5. R2 Upload Rollback (Atomic Uploads)
If you successfully upload 4K and 2K, but the FHD upload crashes, you have orphaned files taking up paid space, and a broken database record.

**Rollback Logic:**
* Keep an array of successfully uploaded keys during the parallel upload process.
* If the Promise.all fails, catch the error.
* Run an S3 DeleteObjectsCommand passing the array of successful keys to instantly wipe the partial upload from R2.
* Mark the product status as failed in the database.

### 6. Variant Access Matrix (Product Policy Snapshot)
Keep this matrix documented so frontend and backend are always aligned about what is public vs paid.

| Variant | Resolution | Access |
| :--- | :--- | :--- |
| Thumbnail | 400x225 | Public |
| Preview (Watermarked) | 1200x675 | Public |
| FHD | 1920x1080 | Public in MVP or Private in hardened mode |
| 2K | 2560x1440 | Paid |
| 4K | 3840x2160 | Paid |
| Original | Native | Paid |

---

## DAY 4 — WORKER HARDENING & MAINTENANCE JOBS

### 1. Sharp Memory Crash Fix
Image processing is incredibly RAM intensive. If 5 users upload 4K files at the same exact time, your DigitalOcean droplet (1GB RAM) will immediately crash with an Out Of Memory (OOM) error.

### 2. BullMQ Queue + Worker (from fix.md)
Image processing must be async. bullmq installed, zero queue code exists. Upload controller must become a job dispatcher.
**Files to create:** src/jobs/queues.js, src/jobs/imageProcessor.js, worker.js, ecosystem.config.js

### 3. Upload Status Polling (from fix.md)
Needed for async upload. Add GET /upload/status/:productId to poll job status.


**Worker Configuration Fixes:**
* **BullMQ Concurrency:** Set worker concurrency strictly to 1. It must process one image at a time to prevent CPU/RAM spikes.
* **Node Memory Limits:** When starting the worker process, increase the V8 memory limit flag.
    Start command: node --max-old-space-size=4096 worker.js

### 4. Orphaned R2 File Cleanup Job
Sometimes an upload hits R2, but the database connection drops before the Product document is saved. This leaves orphaned files in your Cloudflare bucket forever.

**Implementation (Daily Cron Job):**
* Create a new BullMQ repeatable job that runs every night at 3 AM.
* It paginates through the Cloudflare R2 originals/ prefix using ListObjectsV2Command.
* For each file key, it queries the MongoDB Product collection.
* If no product has that key after 24 hours of the file's creation date, the job deletes the object from R2.

### 5. Queue Rate Limits
To prevent a malicious user from spamming the upload route and filling your background job queue, apply a BullMQ rate limit.
* Limit: Maximum 10 image processing jobs per minute per creator.
* Any jobs over this limit are held in the delayed state until the next minute.

---

## DAY 5 — LICENSE ENFORCEMENT & USAGE LIMITS

### 1. Download Limits Per License
If a user buys a wallpaper, they get a license. However, if they write a script to generate signed URLs and share them on Discord, your R2 bandwidth will skyrocket. 

### 2. License Model + Download System (from fix.md)
License.js model missing. userService references it but it doesn't exist. Download endpoint completely absent.
**Files to create:** models/License.js, controllers/downloadController.js, services/downloadService.js, routers/downloadRoutes.js

### 3. Free Wallpaper Claim Endpoint (from fix.md)
1080p described as free in pricing. No route exists to claim a free license without going through Stripe. Undefined flow.
**Route:** POST /api/v1/licenses/claim-free in downloadRoutes.js


**Schema Additions (License Model):**
```javascript
downloadCount: { 
  type: Number, 
  default: 0 
},
maxDownloads: { 
  type: Number, 
  default: 10 // Hard limit to prevent abuse
}
```
**Logic:**
Every time the /download route is hit, increment downloadCount. If downloadCount >= maxDownloads, return a 403 Forbidden with a message indicating the download limit has been reached.

### 2. Free Tier License Generation
Not all products will be paid. For products priced at 0 INR, the checkout flow must be bypassed.
* Create a dedicated endpoint: POST /api/v1/licenses/claim-free
* Verify the product price is exactly 0.
* Generate the License document directly without Stripe integration.
* Add rate limits to this route (e.g., 5 free claims per hour per user) to prevent bot scraping.

---

## DAY 6 — SIGNED URLS & CDN SECURITY

### 1. Privacy Tiering in R2
Your Cloudflare R2 bucket cannot be entirely public. 

### 2. Stripe Checkout + Webhook (from fix.md)
stripe package installed, zero Stripe code. orderService.checkout() creates orders without payment. All orders "complete" for free.
**Files to create:** src/config/stripe.js, controllers/paymentController.js, services/paymentService.js, routers/webhookRoutes.js

* **Public Prefix:** /thumbnails and /previews must be publicly readable so your frontend can display them without generating millions of signed URLs.
* **Private Prefix:** /originals, /4k, /2k, /fhd must be entirely private.

### 2. Strict URL Expiry
When a signed URL is generated for a private asset, the expiresIn parameter must be set to a maximum of 900 seconds (15 minutes). This ensures that even if a user leaks the direct R2 link, it becomes dead quickly.

### 3. Download Access Flow (Must Stay Enforced)
```text
User clicks Download
  ->
Backend checks License collection
  ->
If owns: Generate Signed URL (15 min)
If not:  403 Forbidden
```

### 4. Storage Prefix Layout
Use a stable object layout so cleanup jobs, billing analytics, and access control stay predictable.

```text
originals/
thumbnails/
previews/
fhd/
2k/
4k/
mobile/
```

---

## DAY 7 — ADVANCED STRIPE & PAYOUTS

### 1. Stripe Connect (Creator Payouts)
If creators are selling wallpapers, the money cannot just sit in your bank account. You need a legally compliant way to route funds.

### 2. Stripe Connect + CreatorEarnings (from fix.md)
No creator payout mechanism. All sales money stays in your account. Illegal to keep creator revenue without payout system.
**Files to create:** models/CreatorEarnings.js, POST /creator/connect

### 3. Stripe Webhook Idempotency (from fix.md)
Stripe sends same event twice on retry. No idempotency key check = double order + double license on same payment.
**Fix:** Store event.id in Redis SET with TTL

### 4. Abandoned Cart Cleanup (from fix.md)
PaymentIntent never cancelled. Use BullMQ repeatable job.

**Implementation:**
* Integrate Stripe Connect Express.
* When a user applies to be a creator, they must complete Stripe Connect onboarding.
* Store their Stripe Account ID in the Creator model.
* During Checkout Session creation, use application_fee_amount to take your platform cut (e.g., 20%), and set transfer_data.destination to the creator's Stripe Account ID.

### 2. Creator Earnings Ledger
You must keep a permanent record of all financial splits for tax and auditing purposes.

**New Model (CreatorEarnings):**
```javascript
{
  creatorId: { type: ObjectId, ref: 'User', required: true },
  orderId: { type: ObjectId, ref: 'Order', required: true },
  productId: { type: ObjectId, ref: 'Product', required: true },
  saleAmount: { type: Number, required: true },
  platformCut: { type: Number, required: true },
  creatorAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'cleared', 'refunded'], default: 'pending' },
  stripeTransferId: { type: String }
}
```
*This is created inside the Webhook handler upon successful payment.*

### 3. Webhook Double Event Protection
Stripe occasionally fires the same webhook event twice. If your logic isn't idempotent, you will grant double licenses and write duplicate ledger entries.

**Redis Idempotency Logic:**
* Upon receiving a webhook, extract the stripe-event-id.
* Attempt to SET event:${eventId} in Upstash Redis using the NX (Not Exists) flag with an EX (expiry) of 86400 (24 hours).
* If Redis returns null/false, the event was already processed. Immediately return 200 OK to Stripe and halt execution.

### 4. Stripe Webhook Raw Body Ordering (Critical)
Stripe signature verification fails if JSON parsing mutates the payload before verification.

**Rule:**
* Register Stripe webhook route with raw body parser before global `express.json()` middleware.

**Example Pattern:**
```javascript
app.post('/api/v1/payments/webhook', express.raw({ type: 'application/json' }), webhookHandler);
app.use(express.json());
```

---

## DAY 8 — AUTHENTICATION POLISH

### 1. Email Verification Lock
Users must verify their email before they can make a purchase. This prevents fraudulent accounts from initiating Stripe checkouts.

### 2. Email Service (from fix.md)
Resend or nodemailer required for transactional emails.
**File:** emailService
* Add isEmailVerified: Boolean to the User schema.
* Generate a crypto-random token, hash it, store it in the DB, and email the raw token to the user.
* Create an endpoint to verify the token.
* Add middleware requireVerifiedEmail to the checkout routes.

### 2. Password Reset Flow
* Create POST /forgot-password to generate a short-lived (15 min) reset token.
* Email the link.
* Create PUT /reset-password/:token to accept the new password, hash it, and save it.

---

## DAY 9 — CACHE POLISH & JWT SECURITY

### 1. JWT Logout Blacklist
When a user logs out, deleting the cookie on the client side does not invalidate the JWT. If an attacker copied the token, they can still use it until it expires.

### 2. Upstash Redis Client Config (from fix.md)
Redis client missing. **File:** src/config/redis.js

### 3. Cache-Control Headers (from fix.md)
Performance: Add Cache-Control headers in productController.

**Fix (Redis Blacklist):**
* Add a jti (JWT ID) payload claim when signing tokens.
* On logout, extract the jti and remaining TTL of the token.
* Save the jti to Upstash Redis: SET blacklist:${jti} true EX ${remainingTTL}.
* In your auth middleware, check if the jti exists in Redis. If yes, throw 401 Unauthorized.

### 2. Edge Cache Headers
To prevent your Node server from being hit for static product data, implement standard Cache-Control headers on the /products listing endpoints.
* res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
* This allows Cloudflare's edge network to cache the JSON response for 10 minutes, drastically reducing your DigitalOcean bandwidth.

### 3. Login + API Rate Limits
Apply Redis-based limits to block brute-force and bot abuse while keeping normal users unaffected.

**Minimum Limits:**
* Login attempts: 10 per minute per IP/user key.
* Global API requests: 100 requests per minute.

### 4. Temporary Account Lock After Failed Logins
Add a short lockout to stop repeated password guessing without punishing legitimate users.

**Policy:**
* After 5 consecutive failed login attempts, lock account for 15 minutes.
* Reset failed-attempt counter after successful login.

---

## DAY 10 — MODERATION RULES (LAYER 2)

### 1. Auto-Hide After Reports (Community Moderation)
You cannot monitor every upload manually 24/7. 

### 2. Meilisearch Config + Search Routes (from fix.md)
Search system missing. **Files:** config + service + controller + routes

### 3. Meilisearch Index Settings (from fix.md)
Search filters won't work unless index settings are configured.

**Logic:**
* Add a Report model containing productId, userId, and reason.
* Add reportCount to the Product schema.
* When POST /api/v1/report/:productId is called, increment the count.
* Trigger check: If product.reportCount >= 3, automatically set product.status = 'under_review' and product.isActive = false.
* This removes it from the public feed instantly until an admin reviews it.

### 2. Search Index Layer (Meilisearch)
Add Meilisearch after moderation basics so discovery remains fast at scale.

**Implementation Targets:**
* Index active products only.
* Sync on product create/update/status change.
* Remove or de-index products when status becomes rejected/under_review/removed.

---

## DAY 11 — ADVANCED CREATOR RESTRICTIONS

### 1. Google Vision API SafeSearch (Automated NSFW Detection)
If you allow public uploads, users will attempt to upload NSFW content. 

**Implementation (Future-proofing):**
* Inside the BullMQ image processing worker, before generating variants, pass the thumbnail buffer to the Google Cloud Vision API.
* Request the safeSearchAnnotation feature.
* If adult, violence, or racy are flagged as VERY_LIKELY, immediately abort processing.
* Set Product status to rejected, log the reason as "Automated NSFW Detection", and email the creator.

### 2. Explicit Product Status Enum
Refine the Product status flow to be explicit rather than just relying on isActive boolean flags.
* pending: Uploaded, waiting for admin approval.
* active: Approved and visible in the marketplace.
* rejected: Denied by admin or NSFW filter.
* under_review: Flagged by community reports.
* removed: Soft-deleted by creator or admin.

### 3. Creator Application Workflow
Users should not become upload-capable creators automatically.

**Flow:**
```text
User -> Apply Creator -> Admin Approves -> role = creator
```

### 4. Moderation Layers Summary
* **Layer 1 (Automated):** file validation, duplicate detection, legal declaration, optional NSFW scan.
* **Layer 2 (Community):** report flow with auto-hide threshold.
* **Layer 3 (Admin):** manual approval/rejection queue.

---

## DAY 12 — DATA INTEGRITY & SOFT DELETES

### 1. Soft Delete Products
Never use Model.findByIdAndDelete() for products. If a product is hard-deleted, users who purchased it lose access, licenses break, and order history references become orphaned.

### 2. Report Model + Report Route (from fix.md)
Report system missing. **File:** models/Report.js

### 3. Missing Models (from fix.md)
Review, Wishlist, Notification, ModerationLog, Banner models missing. **File:** models

### 4. Admin Controller + Routes (from fix.md)
Admin API missing. **File:** adminController.js

**Implementation:**
* Add isDeleted: { type: Boolean, default: false } to the Product schema.
* Update all GET routes to append { isDeleted: false } to their queries.
* The DELETE /products/:id route simply toggles this flag.
* Users who own a license can still access soft-deleted products via their library, but new users cannot see or buy them.

---

## DAY 13 — FUTURE SCOPE & REAL-TIME PREP

### 1. MP4 Live Wallpapers Prep
While not in the MVP, the schema must be ready to support animated wallpapers without requiring a database migration later.

### 2. Socket.IO Redis Adapter (from fix.md)
Needed for PM2 clustering. **File:** socket config

**Schema adjustments:**
* Add productType: { type: String, enum: ['static', 'live', 'pack'], default: 'static' }.
* Add an additional sub-document under assets for video processing outputs (e.g., compressed mp4, webm fallback).
* Enforce different Multer rules based on the productType parameter passed in the upload request.

**Future Route Split:**
```text
POST /upload/wallpaper
POST /upload/live
POST /upload/pack
```

### 2. Notifications Prep
Add notification events for purchase and moderation outcomes so later real-time features do not require redesign.

**Initial Events:**
* purchase_succeeded
* payout_cleared
* product_under_review
* product_rejected

---

## DAY 14 — ENTERPRISE POLISH & SECURITY

### 1. Graceful Shutdown
If you deploy an update or your droplet restarts, PM2 will kill the Node process instantly. This corrupts active image processing and breaks ongoing database transactions.

### 2. GDPR Delete-Account (from fix.md)
Legal requirement. **Route:** DELETE /users/me

### 3. CSP on Helmet (from fix.md)
XSS protection. **Config:** helmet CSP config

**Implementation:**
```javascript
const shutdown = async () => {
  logger.info('SIGTERM received. Shutting down gracefully.');
  server.close(() => {
    logger.info('HTTP server closed.');
  });
  await mongoose.connection.close();
  await redis.quit();
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```

### 2. GDPR Delete Account Flow
If you plan to accept European users, you must have a hard-delete flow for user data.
* Endpoint: DELETE /api/v1/users/me
* Actions required: Anonymize their orders (change name to 'Deleted User'), delete their User record, delete their active session from Redis, and soft-delete any products they uploaded.

### 3. CSP Security Policy (Helmet Strict Config)
Prevent XSS attacks by configuring Helmet's Content Security Policy.
```javascript
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "[https://pub-xxx.r2.dev](https://pub-xxx.r2.dev)"],
    connectSrc: ["'self'", "[https://api.stripe.com](https://api.stripe.com)"],
    scriptSrc: ["'self'", "[https://js.stripe.com](https://js.stripe.com)"]
  }
}));
```

### 4. Comprehensive Backup Plan
* **MongoDB:** Ensure the Atlas M0 cluster has automated backups enabled.
* **R2 Storage:** Enable Object Versioning in the Cloudflare Dashboard to prevent accidental overwrites or malicious deletion of origin files.
* **Secrets:** Do not rely on local .env files on the droplet. Use Doppler to inject environment variables at runtime using `doppler run -- pm2 start`.
* **Exports:** Run a weekly database export for recovery drills.

### 5. Logging + Error Tracking (Production Observability)
Keep security strong but friction low by monitoring problems instead of interrupting normal users.

**Must Log:**
* Upload
* Download
* Purchase
* Failed payment
* Login
* Admin action
* System error

**Recommended Stack:**
```text
winston + sentry
```

### 6. Security Baseline Checklist
* JWT auth and password hashing enabled.
* Helmet and strict CSP enabled.
* Mongo sanitize enabled.
* CORS locked to known origins.
* Environment variables loaded from secure runtime source.
* Stripe webhook signature verification active.
* File type and size filter enforced at upload boundary.

### 7. Required Legal Pages (Frontend Track)
* Terms of Service
* DMCA Takedown Policy
* Privacy Policy
* Creator Agreement

### 8. Security Rules Summary

| Security | Implement |
| :--- | :--- |
| JWT Auth | Yes |
| Admin Upload Only | Yes |
| File Type Filter | Yes |
| File Size Limit | Yes |
| Sharp Validation | Yes |
| Signed URLs | Yes |
| License Check | Yes |
| Rate Limit | Yes |
| Duplicate Detection | Yes |
| NSFW Detection | Yes |
| Report System | Yes |
| Admin Approval | Yes |

---

## SECURITY VS USER EXPERIENCE BALANCE

Use smart security for paid assets and admin actions, not blanket friction for every visitor.

| Action | Security Level |
| :--- | :--- |
| Browse wallpapers | No login |
| Download free 1080p | Login |
| Upload wallpaper | Creator only |
| Buy wallpaper | Login + verified email |
| Download paid | License check |
| Admin | Admin role |

---

## BUSINESS RULES & MONETIZATION MATH SUMMARY

To ensure your backend logic correctly calculates revenue cuts, implement the following constants and math utilities in your order service:

### Commission Model
* Creator sets the base price.
* Platform takes 25% commission.
* Stripe takes approximately 3% + 30 cents per transaction.
* Creator receives the remainder.
* Platform-owned seeded content keeps 100% platform revenue.

**Example Calculation Logic:**
```javascript
const calculatePayouts = (price) => {
  const stripeFee = (price * 0.03) + 0.30;
  const platformCut = price * 0.25;
  const creatorPayout = price - stripeFee - platformCut;
  return { stripeFee, platformCut, creatorPayout };
};
```
*Note: Your own AI-generated or seeded wallpapers yield 100% platform cut. Track this by assigning an "Admin/System" user ID to those products.*

### Core Commerce Rules
* Cart quantity is fixed to 1 for digital goods.
* Order must be finalized only from verified Stripe webhook event, not client callback.
* License must be stored and checked before download URL generation.

### Pricing Bands (Reference)

| Resolution | Price |
| :--- | :--- |
| Preview | Free |
| 1080p | INR 29 |
| 2K | INR 49 |
| 4K | INR 79 |
| Bundle | INR 99 |

Users purchase a download license, not copyright ownership.

---

## COST PROTECTION & ABUSE LIMITS TABLE

Implement these exact limits across your middleware and BullMQ configurations to guarantee you stay within free-tier limits.

| System Parameter | Hard Limit Configured | Rejection Mechanism |
| :--- | :--- | :--- |
| Max Upload Size | 25MB | Multer limits configuration |
| Max Uploads/Day (Admin) | 50 per admin | Redis counter (reset daily) |
| Max Uploads/Day | 50 per creator | Redis counter (reset daily) |
| Max Downloads/Hour | 20 per user | Upstash Sliding Window |
| Global API Rate | 100 requests/min | Upstash Sliding Window |
| Checkout Attempts | 10 per hour | Prevent Stripe spam |
| Image Processing | 10 jobs/min | BullMQ delayed state |
| Login Attempts | 10 per minute | Upstash sliding window (IP based) |
| Registration | 5 per hour | Upstash sliding window (IP based) |

*Adhering strictly to these rules ensures AniCart remains highly scalable, secure, and financially protected from Day 1 of the MVP launch.*

---

## GLOBAL LAUNCH SUPPORT (FUTURE TRACK)

* Use Stripe for international payments.
* Store base prices in USD internally.
* Convert display pricing to INR on frontend.
* Deliver assets through Cloudflare R2 + CDN edge routing.

---

## MVP LAUNCH GATE

| Feature | Required |
| :--- | :--- |
| Auth | Yes |
| Upload | Yes |
| Image Processing | Yes |
| Product Listing | Yes |
| Cart | Yes |
| Stripe Checkout | Yes |
| License System | Yes |
| Secure Download | Yes |
| Admin Approval | Yes |
| Report System | Yes |

---

## UPDATED ROADMAP SNAPSHOT

| Day | Feature |
| :--- | :--- |
| Day 1 | Auth service + password strength + email validation + DB indexes + JWT blacklist + Mongo pool limits |
| Day 2 | R2 upload + price validation + timeout |
| Day 3 | Sharp processing + EXIF removal + watermark + file hash duplicate detection |
| Day 4 | BullMQ + memory limits + rollback + cleanup job |
| Day 5 | License system + download limits + free license |
| Day 6 | Signed URLs |
| Day 7 | Stripe + Stripe Connect + webhook protection + earnings ledger |
| Day 8 | Email verification + password reset |
| Day 9 | Redis cache + login/API rate limit + account lock + cache headers |
| Day 10 | Moderation + Meilisearch |
| Day 11 | Creator system + moderation hardening |
| Day 12 | Soft delete + report system |
| Day 13 | Notifications prep |
| Day 14 | Security + GDPR + graceful shutdown + winston/sentry + backup |

### Realistic Phase Plan

| Phase | Goal |
| :--- | :--- |
| Day 1-3 | Wallpaper platform |
| Day 4-6 | Paid downloads |
| Day 7-10 | Marketplace |
| Day 11-14 | Production ready |
```