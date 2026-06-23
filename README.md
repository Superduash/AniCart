<div align="center">

<img src="https://capsule-render.vercel.app/api?type=venom&height=250&color=0:312e81,35:6d28d9,70:7c3aed,100:22d3ee&text=AniCart&fontSize=90&fontColor=ffffff&animation=fadeIn&fontAlignY=45&desc=Futuristic%20Anime%20Marketplace&descAlignY=68&descColor=e2e8f0&descSize=20"/>

<br/>

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Framer Motion](https://img.shields.io/badge/Framer-Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://framer.com/motion)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-00f3ff?style=for-the-badge)](LICENSE)

<br/>

*A full-stack anime merchandise platform with sci-fi glassmorphism UI, JWT authentication, cart state management, and cloud deployment.*

[**🌐 Live Demo**](https://your-demo-link.vercel.app) · [**📖 Architecture**](#-architecture) · [**🚀 Quick Start**](#-quick-start) · [**🎨 Design System**](#-design-system)

<br/>

</div>

---

## 📸 Preview

<div align="center">

> *Add a screenshot or screen recording GIF here — paste an image into the GitHub README editor.*

<img src="YOUR_SCREENSHOT_HERE" width="85%" alt="AniCart Preview"/>

</div>

---

## 🌌 What Is AniCart?

AniCart is a **full-stack eCommerce web application** built around anime merchandise — starting with digital wallpapers and designed to scale into a complete store with posters, apparel, figurines, and digital downloads.

The project demonstrates a production-style MERN stack implementation: a React frontend with global state management and animated UI, a Node/Express REST API with JWT authentication, and a MongoDB database with Mongoose schemas — all deployed separately on Vercel and Render.

> Built to showcase real-world full-stack architecture, authentication flows, and UI/UX design systems in a portfolio context.

---

## ✨ Features

<table>
<tr>
<td width="50%">

**Implemented**
- 🔐 JWT-based user authentication (signup, login, protected routes)
- 🛒 Add to cart with persistent global state via Context API
- 🖼️ Anime wallpaper catalog with product cards
- 🌌 Glassmorphism UI with neon accent system
- 📱 Fully responsive layout (mobile-first)
- ⚡ Smooth page transitions via Framer Motion
- ☁️ Deployed frontend (Vercel) + backend (Render)

</td>
<td width="50%">

**Planned**
- 💳 Stripe payment integration
- ❤️ Wishlist with user persistence
- ⭐ Product ratings and reviews
- 🔎 Search, filters, and category pages
- 👤 User profile with order history
- 📦 Order tracking system
- 🛍️ Full merchandise catalog expansion
- 📱 React Native mobile app

</td>
</tr>
</table>

---

## Architecture

```
        Browser (React SPA)
                │
                │  REST API (JSON over HTTP)
                ▼
┌───────────────────────────────┐
│   Express.js API Server       │
│                               │
│  POST /api/auth/register      │  Hashes password with bcrypt
│  POST /api/auth/login         │  Issues signed JWT (7d expiry)
│  GET  /api/products           │  Paginated product catalog
│  GET  /api/products/:id       │  Single product detail
│  POST /api/cart               │  Auth-protected, persists cart
│  GET  /api/cart/:userId       │  Returns user's cart state
└──────────────┬────────────────┘
               │  Mongoose ODM
               ▼
┌───────────────────────────────┐
│   MongoDB Atlas               │
│                               │
│   users       { email, passwordHash, createdAt }
│   products    { title, price, image, category, tags }
│   carts       { userId, items[], updatedAt }
└───────────────────────────────┘
```

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| UI Framework | **React 18** | Component-based SPA with hooks |
| State | **Context API** | Auth and cart global state, no Redux overhead |
| Animations | **Framer Motion** | Page transitions and card entrance animations |
| Styling | **CSS + Glassmorphism** | Custom design system, no UI library |
| Backend | **Node.js + Express** | REST API, middleware, route handlers |
| Auth | **JWT + bcrypt** | Stateless authentication, hashed credentials |
| Database | **MongoDB + Mongoose** | Document store with typed schemas |
| Frontend Deploy | **Vercel** | Automatic deploys from `main`, edge CDN |
| Backend Deploy | **Render** | Managed Node service, zero-downtime redeploys |

---

## 📂 Project Structure

```
AniCart/
├── client/                        # React frontend (deployed to Vercel)
│   └── src/
│       ├── pages/
│       │   ├── LandingPage.jsx    # Hero + product showcase
│       │   ├── LoginPage.jsx      # JWT login form
│       │   ├── SignupPage.jsx     # Registration form
│       │   └── Dashboard.jsx      # Protected product catalog
│       ├── components/
│       │   ├── Navbar.jsx         # Auth-aware nav with cart count
│       │   ├── ProductCard.jsx    # Glassmorphism product tile
│       │   ├── Footer.jsx
│       │   └── Toast.jsx          # Notification feedback
│       ├── context/
│       │   ├── AuthContext.js     # Token state, login/logout helpers
│       │   └── CartContext.js     # Cart items, add/remove/sync
│       ├── App.js                 # Route definitions + context wrappers
│       └── App.css                # Design tokens + global styles
│
├── server/                        # Express API (deployed to Render)
│   ├── models/
│   │   ├── User.js                # Mongoose user schema
│   │   ├── Product.js             # Product schema with category tags
│   │   └── Cart.js                # Cart schema linked to user
│   ├── routes/
│   │   ├── auth.js                # /register, /login endpoints
│   │   ├── products.js            # Catalog CRUD endpoints
│   │   └── cart.js                # Cart read/write endpoints
│   ├── middleware/
│   │   └── verifyToken.js         # JWT auth guard for protected routes
│   └── server.js                  # Express setup, CORS, MongoDB connect
│
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier)

### 1. Clone

```bash
git clone https://github.com/yourusername/anicart.git
cd anicart
```

### 2. Backend

```bash
cd server
npm install
```

Create `server/.env`:

```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key_here
PORT=5000
```

```bash
npm run dev
```

### 3. Frontend

```bash
cd client
npm install
```

Create `client/.env`:

```env
REACT_APP_API_URL=http://localhost:5000
```

```bash
npm start
```

Open `http://localhost:3000`

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

MIT — free to use, fork, and build on.

---

<div align="center">

**AniCart** · Built by [Superduash](https://github.com/Superduash)


⭐ Star this repo if it helped you or if you'd like to see it grow.

<img src="https://capsule-render.vercel.app/api?type=waving&height=120&section=footer&color=0:22d3ee,40:7c3aed,70:6d28d9,100:312e81"/>

</div>
