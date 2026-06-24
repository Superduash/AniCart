# AniCart React Frontend — Vercel Deployment Guide

This guide outlines the step-by-step process to deploy the React frontend of **AniCart** on **Vercel.com**.

---

## 1. Prerequisites and Configuration

AniCart is a Single Page Application (SPA) using React Router. When deployed on Vercel, if a user accesses a nested route directly (e.g., `/marketplace` or `/dashboard/library`) or refreshes the page, Vercel will return a `404 Not Found` because there is no physical file at that directory.

To resolve this, we have created a `vercel.json` file in the `client/` root directory to rewrite all path routes to `/index.html`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This configuration ensures Vercel delegates routing authority entirely to React Router.

---

## 2. Step-by-Step Vercel Deployment

### Step A: Import GitHub Project
1. Log in to your [Vercel Dashboard](https://vercel.com/).
2. Click **Add New...** and select **Project**.
3. Import your GitHub repository `AniCart`.

### Step B: Configure Build Settings
Under the **Configure Project** screen, set up the build settings carefully:

*   **Project Name:** `anicart-web`
*   **Framework Preset:** `Create React App`
*   **Root Directory:** `client` *(CRITICAL: This ensures Vercel builds from the client workspace, not the monorepo root!)*
*   **Build Command:** `npm run build`
*   **Output Directory:** `build`

### Step C: Configure Environment Variables
Expand the **Environment Variables** section and configure variables:

| Key | Value / Description | Notes |
| :--- | :--- | :--- |
| `REACT_APP_API_BASE_URL` | `https://anicart-backend.onrender.com` | **Your deployed Render backend domain** (no trailing slash) |
| `REACT_APP_API_URL` | `https://anicart-backend.onrender.com/api/v1` | **Your backend API base URL** (must end with `/api/v1`) |

*Click **Add** after typing the key and value.*

### Step D: Deploy!
Click **Deploy**. Vercel will fetch the codebase from `client/`, run `npm install`, compile the static assets, and deploy the application.

---

## 3. Post-Deployment Verification

1. Copy the Vercel-generated domain (e.g., `https://anicart-web.vercel.app`).
2. Go back to your **Render Backend dashboard** under the **Environment** tab.
3. Update the `CLIENT_URL` environment variable to match your new Vercel URL exactly (e.g., `https://anicart-web.vercel.app` — no trailing slash).
4. Redeploy the backend server on Render. This guarantees the secure HTTP cookie sharing (such as JWT refresh token cookie exchange) and CORS permissions work correctly.
