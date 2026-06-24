# AniCart Express Backend — Render Deployment Guide

This guide outlines the step-by-step process to deploy the Express backend server of **AniCart** on **Render.com**.

---

## 1. Setup Architecture on Render

To run the full stack on Render, you should deploy the backend as a **Web Service** and optionally deploy the background queue worker as a **Background Worker** (or run them together if resources are constrained).

*   **Primary Web Service:** Hosts the main Express API (`server.js`). Handles HTTP endpoints, auth, cart, payments, and client communications.
*   **Background Worker Service:** Runs the background queues (`worker.js`). Handles variant generation, Sharp image compression, and daily database/storage cleanups.

---

## 2. Step-by-Step Render Deployment

### Step A: Link GitHub Repository
1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub account and choose the `AniCart` repository.

### Step B: Configure Web Service Settings
Provide the following configurations for the backend Web Service:

*   **Name:** `anicart-backend`
*   **Region:** Select the region closest to your users.
*   **Branch:** `main` (or your development branch)
*   **Root Directory:** `server` *(CRITICAL: This ensures Render runs commands in the server folder, not the workspace root!)*
*   **Runtime:** `Node`
*   **Build Command:** `npm install`
*   **Start Command:** `npm start`
*   **Instance Type:** `Free` (or `Starter` for production scale)

### Step C: Configure Worker Service Settings (Optional)
If running a separate worker instance to handle background tasks asynchronously via BullMQ:
1. Click **New +** and select **Background Worker**.
2. Select the `AniCart` repository.
3. Configure settings:
    *   **Name:** `anicart-worker`
    *   **Root Directory:** `server`
    *   **Build Command:** `npm install`
    *   **Start Command:** `npm run worker`
    *   **Instance Type:** `Starter` (Background workers are not supported on the Free tier and require Redis).

---

## 3. Environment Variables Config

Add the following environment variables under the **Environment** tab in your Render service dashboards. (You can also create a **Group** on Render to share these variables between the Web Service and Background Worker).

| Key | Example Value / Description | Notes |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production security and Sentry logs |
| `PORT` | `10000` | Render injects this automatically |
| `MONGODB_URI` | `mongodb+srv://<user>:<password>@cluster0.ltihowj.mongodb.net/anicart` | MongoDB Atlas URI |
| `JWT_SECRET` | `your_long_random_jwt_secret_signature_key` | Make it a cryptographically strong string |
| `JWT_ACCESS_SECRET` | `your_long_secure_access_secret_key` | Fallback to `JWT_SECRET` if omitted |
| `JWT_REFRESH_SECRET` | `your_long_secure_refresh_secret_key` | Fallback to `JWT_SECRET` if omitted |
| `REDIS_URL` | `rediss://default:<token>@better-mastodon.upstash.io:6379` | **Upstash Redis TCP URL** (required for BullMQ) |
| `UPSTASH_REDIS_REST_URL` | `https://better-mastodon.upstash.io` | Upstash Redis HTTPS REST URL for caching |
| `UPSTASH_REDIS_REST_TOKEN` | `your_upstash_redis_rest_token` | Upstash Redis HTTPS REST Token |
| `R2_ACCOUNT_ID` | `b4ec010900574cc9c4539e406a482b48` | Cloudflare R2 Account ID |
| `R2_ACCESS_KEY_ID` | `6594f264cd1b6a5bd03df5b0a84c9a1c` | Cloudflare R2 Access Key ID |
| `R2_SECRET_ACCESS_KEY` | `your_r2_secret_access_key` | Cloudflare R2 Secret Access Key |
| `R2_BUCKET_NAME` | `anicart-images` | Cloudflare R2 Bucket Name |
| `R2_PUBLIC_URL` | `https://pub-your-bucket-id.r2.dev` | Cloudflare R2 Bucket Public URL |
| `STRIPE_SECRET_KEY` | `sk_test_your_stripe_secret_key` | Stripe secret key (optional, disables checkouts if empty) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_your_stripe_webhook_secret` | Stripe webhook signing secret (optional) |
| `CLIENT_URL` | `https://anicart-frontend.vercel.app` | **Vercel frontend domain URL** (Required for CORS/Cookies) |
| `EMAIL_USER` | `anicartapp@gmail.com` | SMTP Email username for registration verification |
| `EMAIL_PASS` | `your_gmail_app_password` | SMTP Email app password |
| `EMAIL_FROM` | `"AniCart" <anicartapp@gmail.com>` | Sender identity |
| `SENTRY_DSN` | `https://your-dsn-key@sentry.io/project` | Sentry DSN for error logs aggregation (optional) |

---

## 4. Production Hardening Features Ready

AniCart's codebase includes the following production-ready features that work natively on Render:

1.  **CORS White-listing:** Allowed origins dynamically read the `CLIENT_URL` environment variable. Ensure the Vercel frontend URL is set accurately without trailing slashes.
2.  **Reverse Proxy Support:** `app.set('trust proxy', 1)` is enabled in `app.js` to ensure cookies, IP rate-limiting, and headers function behind Render's routing proxies.
3.  **Security Headers:** Helmet.js is pre-configured to set XSS, frame buffers, and secure headers.
4.  **Health Checks:** Render will monitor the `/api/health` HTTP endpoint to ensure MongoDB, Redis, and R2 connections are active before routing client traffic.
5.  **Clean Shutdowns:** Express server listens to SIGINT/SIGTERM to close active sockets and database connections before exit.
