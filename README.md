<div align="center">

<img src="https://capsule-render.vercel.app/api?type=venom&height=250&color=0:312e81,35:6d28d9,70:7c3aed,100:22d3ee&text=AniCart&fontSize=90&fontColor=ffffff&animation=fadeIn&fontAlignY=45&desc=Futuristic%20Anime%20Marketplace&descAlignY=68&descColor=e2e8f0&descSize=20"/>

<br/>

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare-R2-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://cloudflare.com)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-008CDD?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com)

<br/>

*A production-ready anime merchandise platform featuring real-time image processing, secure payments, and a creator ecosystem.*

[**🌐 Live Demo**](https://anicartwallpaper.vercel.app/) · [**🚀 Quick Start**](#-quick-start) · [**🎨 Design System**](#-design-system) · [**🔑 API Reference**](#-api-reference)

<br/>

</div>

---

## 📸 Preview

<div align="center">

> *A complete showcase of our high-resolution anime wallpaper catalog.*

<img src="YOUR_SCREENSHOT_HERE" width="85%" alt="AniCart Preview"/>

</div>

---

## 🌌 Overview

AniCart is a full-stack digital marketplace tailored for anime artwork and wallpapers. Built with a modern MERN stack alongside Redis and Cloudflare R2, it demonstrates advanced architectural patterns including background worker queues, real-time WebSocket communication, and secure payment handling.

The platform supports a dual-sided ecosystem: users can browse, purchase, and manage their library, while approved creators can upload assets, track analytics, and monetize their work. An integrated admin panel provides full moderation controls and dynamic homepage layout management.

> Built to showcase real-world full-stack architecture, background task processing, and modern UI/UX design systems in a portfolio context.

---

## ✨ Features

* **Advanced Authentication:** JWT-based flow utilizing short-lived access tokens, HTTP-only refresh tokens, email verification, and secure password resets.
* **Creator Studio:** Dedicated dashboard for creators to upload high-resolution artwork, track sales metrics, and manage their portfolios.
* **Automated Image Processing:** Background worker queues (BullMQ + Redis) process original uploads into 4K, 2K, 1080p, and mobile-optimized variants using Sharp.
* **Real-Time Updates:** Socket.io integration streams live upload processing progress and status updates directly to connected creators.
* **Cloudflare R2 Storage:** Scalable, secure object storage for original files and generated variants with private signed URLs for verified purchases.
* **Secure Payments:** Full Stripe API integration with webhooks for robust transaction fulfillment and order status updates.
* **Admin Moderation:** Internal tooling to review creator applications, moderate product uploads, and customize the active homepage layout.
* **Automated Cron Jobs:** Scheduled tasks handle abandoned cart recovery emails, monthly creator quota resets, and orphaned file cleanup.
* **Global Search:** Fast, debounced search overlay accessible via `Ctrl+K` keyboard shortcuts.
* **Glassmorphism UI:** Neon accent system with fully responsive layout and smooth page transitions via Framer Motion.

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19, React Router v7, Framer Motion, Vite | Component-based SPA with animated UI |
| **State & Data** | Context API, Axios | Global state, request caching, and interceptors |
| **Backend** | Node.js, Express.js | REST API, middleware, and request validation |
| **Database** | MongoDB Atlas, Mongoose ODM | Document store with typed schemas |
| **Cache & Queues** | Redis (Upstash / IORedis), BullMQ | Real-time cache and robust background workers |
| **Storage** | Cloudflare R2 (AWS SDK) | Scalable object storage for high-res assets |
| **Payments** | Stripe Elements & Webhooks | Secure, PCI-compliant checkout and fulfillment |
| **Real-Time** | Socket.io | WebSocket streaming for processing progress |

---

## 📂 Project Structure

```text
AniCart/
├── client/
│   ├── src/
│   │   ├── api/          # Axios instance, interceptors, and caching
│   │   ├── components/   # Reusable UI, layout, and search overlays
│   │   ├── contexts/     # Auth, Cart, UI, and Socket global state
│   │   ├── hooks/        # Custom hooks (useSEO, useDebounce, etc.)
│   │   └── pages/        # Route components (Admin, Creator, Auth, Dashboard)
│   └── package.json
│
└── server/
    ├── config/           # Environment, Redis, and R2 configurations
    ├── controllers/      # Route handlers and request validation
    ├── jobs/             # BullMQ workers, image processing, cron tasks
    ├── middleware/       # JWT guards, role checks, and error handling
    ├── models/           # Mongoose schemas (User, Product, Order, etc.)
    ├── routes/           # API endpoint definitions
    ├── services/         # Core business logic and external integrations
    └── app.js            # Express application setup
```

---

## 🚀 Quick Start

### Prerequisites

* Node.js 18+
* MongoDB instance
* Redis instance
* Cloudflare R2 account
* Stripe account

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/anicart.git
cd anicart

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `server` directory. Refer to `server/config/index.js` for required variables, including:

```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
REDIS_URL=your_redis_url
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
```

Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

### 3. Run Development Servers

Start the backend (from `/server`):

```bash
npm run dev
```

Start the frontend (from `/client`):

```bash
npm start
```

Visit `http://localhost:3000` (or the port defined by Vite) to view the application.

---

## 🎨 Design System

AniCart uses a custom **Deep Space** design language — dark backgrounds, translucent glass panels, and cyan neon accents.

| Token | Value | Usage |
|---|---|---|
| `--bg-base` | `#020617` | Page background |
| `--bg-glass` | `rgba(15, 23, 42, 0.6)` | Cards, panels |
| `--accent-neon` | `#00f3ff` | Buttons, active states, glow |
| `--accent-glow` | `rgba(0, 243, 255, 0.15)` | Box shadows |
| `--text-primary` | `#f1f5f9` | Headings |
| `--text-secondary` | `#94a3b8` | Body, labels |
| `--radius-card` | `16px` | Product cards, modals |
| `--radius-btn` | `12px` | Buttons, inputs |

**Glassmorphism pattern used across all surface components:**

```css
.glass-card {
  background: var(--bg-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 243, 255, 0.1);
  border-radius: var(--radius-card);
  box-shadow: 0 0 24px rgba(0, 243, 255, 0.05);
}
```

---

## 🔑 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ | Create user account |
| `POST` | `/api/auth/login` | ❌ | Returns signed JWT |
| `GET` | `/api/products` | ❌ | List all products |
| `GET` | `/api/products/:id` | ❌ | Single product detail |
| `GET` | `/api/cart/:userId` | ✅ JWT | Get user's cart |
| `POST` | `/api/cart` | ✅ JWT | Add item to cart |
| `DELETE` | `/api/cart/:itemId` | ✅ JWT | Remove item from cart |

---

## 🤝 Contributing

Issues and pull requests are welcome. For major changes, open an issue first.

---

## 📜 License

MIT License. Free to use, modify, and distribute.

---

<div align="center">

**AniCart** · Built by [Superduash](https://github.com/Superduash)

⭐ Star this repo if it helped you or if you'd like to see it grow.

<img src="https://capsule-render.vercel.app/api?type=waving&height=120&section=footer&color=0:22d3ee,40:7c3aed,70:6d28d9,100:312e81"/>

</div>
