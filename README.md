# 🛒 AniCart — Futuristic Anime eCommerce Platform

AniCart is a modern full-stack anime eCommerce platform built with a premium sci-fi interface and scalable architecture. The platform currently focuses on anime wallpapers and will evolve into a full-featured anime merchandise store including posters, clothing, figurines, and digital downloads.

AniCart is designed as a real-world full-stack project featuring authentication, cart system, global state management, and a futuristic glassmorphism UI.

---

## ✨ Features

* 🔐 User Authentication (Login / Signup)
* 🖼️ Anime Wallpaper Store
* 🛒 Add to Cart System
* 💳 Checkout System (Future)
* 📦 Order Management (Future)
* 🌌 Premium Sci-Fi UI (Glassmorphism + Neon Theme)
* 📱 Fully Responsive Design
* ⚡ Fast Performance
* 🌐 Full-Stack Architecture
* ☁️ Cloud Deployment

---

## 🧰 Tech Stack

### Frontend
* React.js
* CSS / Glassmorphism UI
* Framer Motion (Animations)

### Backend
* Node.js
* Express.js

### Database
* MongoDB / Supabase (Planned)

### Deployment
* Vercel (Frontend)
* Render / Railway (Backend)
* GitHub (Version Control)

---

## 📁 Project Structure

```
AniCart/
│
├── client/                 # React Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupPage.jsx
│   │   │   └── Dashboard.jsx
│   │   │
│   │   ├── App.js
│   │   └── App.css
│   │
│   └── package.json
│
├── server/                 # Node Backend
│   ├── routes/             # App Router aggregations
│   ├── controllers/        # Route Handlers
│   ├── models/             # Database Schemas
│   ├── services/           # Business Logic Layer
│   ├── utils/              # Common Utilities
│   ├── jobs/               # BullMQ Background Workers
│   ├── testUpload.http     # REST client endpoints test
│   ├── server.js           # Server entry point
│   └── package.json
│
├── docs/                   # Authoritative Documentation
│   ├── BACKEND_MASTER_PLAN.md
│   └── PRODUCTION_HARDENING.md
│
├── README.md               # Main project documentation
├── LICENSE                 # Project License (MIT)
├── export.py               # Deterministic code bundle exporter
└── package.json            # Monorepo workspaces configuration
```

---

## 🚀 Installation & Setup

### 1️⃣ Install all dependencies
From the project root:
```bash
npm run install:all
```

### 2️⃣ Run development server (Client, Server & Worker concurrently)
From the project root:
```bash
npm run dev
```

### Alternatively, run components separately:
* Run frontend: `npm run start:client`
* Run backend API: `npm run start:server`
* Run background worker: `npm run start:worker`

---

## 🌌 Design System

AniCart uses a **Premium Sci-Fi Theme**:

| Element        | Color                 |
| -------------- | --------------------- |
| Background     | `#020617`             |
| Glass Panel    | `rgba(15, 23, 42, 0.6)` |
| Neon Accent    | `#00f3ff`             |
| Text           | `#94a3b8`             |
| Cards Radius   | `16px`                |
| Buttons Radius | `12px`                |

### Design Style:
* Glassmorphism UI
* Neon Glow Buttons
* Smooth Page Transitions
* Futuristic Typography
* Dark Space Theme

---

## 👨‍💻 Author

**Ashwin**  
B.Tech IT Student  
Full-Stack Developer (Learning & Building Real Projects)

---

## 📜 License

This project is licensed under the [MIT License](file:///c:/Users/Superduash/Desktop/Projects/AniCart/LICENSE).

---

## 💬 Tagline

> *“Enter the Databank. Initiate Link. Explore the Anime Universe.”* 🌌
