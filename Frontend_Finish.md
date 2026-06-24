# Frontend_Finish.md — AniCart Complete Frontend Blueprint

---

## Product Vision

**What AniCart is:** A premium digital marketplace for anime wallpapers where independent creators upload high-resolution artwork and fans purchase downloads. Every piece of metadata, every price, every review, every order is real — nothing fabricated.

**Target users:**
- **Buyers:** Anime fans aged 16–35 who want quality desktop/mobile wallpapers from their favorite series. They shop on impulse, filter by series, and expect instant download delivery.
- **Creators:** Fan artists and digital illustrators who want a revenue channel for their work. They need upload tools, sales visibility, and payout tracking.
- **Admins:** One or two people moderating uploads, managing the catalog, and reviewing reports.

**Marketplace goals:**
- Creators upload → admin approves → buyers browse, buy, download. That's the full loop. Every page serves this loop.
- Buyers trust the platform because reviews are real, download counts are real, and prices are clear.
- Creators return because their stats are accurate and payout tracking is transparent.

**UX goals:**
- Every page loads meaningful content within 1.5s on a mid-tier connection.
- Every interactive element has a loading, error, and empty state.
- No page shows hardcoded numbers, fake reviews, or placeholder text.
- The anime-inspired aesthetic enhances the product without distracting from it.

---

## Frontend Status: 38% Complete

### Current strengths
- `src/api/client.js` is solid: axios instance, token interceptor, automatic 401 → refresh → retry chain.
- Login page calls the real API. Token is extracted and stored correctly in the module-level variable.
- Checkout.jsx implements Stripe Elements correctly: loads publishable key from `/orders/config`, creates PaymentIntent, confirms with `stripe.confirmPayment`.
- Library tab fetches from `/users/library` and correctly handles the download URL request.
- The sci-fi visual language (dark background, cyan neon accent, glassmorphism cards) is distinctive and consistent. Worth preserving as the foundation of the design system.
- Products are fetched from the real API in App.js.
- Framer Motion and react-router-dom are installed and ready to use.

### Critical weaknesses

**Architectural — must fix before adding anything else:**

1. **No react-router-dom usage despite it being installed.** The entire app runs as a single-page component tree with a `useState(PAGES.LANDING)` switch. There are no URLs, no browser history, no deep-linking, no bookmark support. Navigating to `/dashboard/library` is impossible. Back button does nothing.

2. **Access token is lost on page refresh.** `accessToken` lives in a module-level variable in `api/client.js` — it evaporates on reload. The user's `name`/`email` is in localStorage so the navbar shows them as logged in, but every API call returns 401 because the token is gone. On refresh, the app should silently call `POST /api/v1/auth/refresh` (the httpOnly cookie persists) to get a fresh token before rendering any protected content.

3. **Cart is local state only.** `addToCart`, `removeFromCart`, `updateQty` only modify React state and localStorage. The backend cart routes (`POST /api/v1/cart/add`, `DELETE /api/v1/cart/remove/:id`) are never called. When a user logs in from a second device, their cart is empty.

4. **CartSidebar checkout is fake.** The "Proceed to Checkout" button in the cart sidebar calls `addToast('Order placed! Total: $X.XX 🎉 (Demo Mode)')` and clears the cart — it doesn't use `Checkout.jsx` or call any API. The real checkout component only appears in Dashboard's cart tab.

5. **Profile save is fake.** `handleSave` in ProfileTab shows a success toast without calling `PUT /api/v1/users/profile`.

6. **SignupPage creates users locally.** Calls `login(newUser)` with a client-generated object — never calls `POST /api/v1/auth/register`. No email verification flow is wired.

### Technical debt
- All styling is inline styles via JSX style props. ~1,400 lines of `style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}` repeated across 50+ JSX elements. Unmaintainable at scale.
- `window.innerWidth < 600` in the render function of Navbar causes a server-side-rendering flash and doesn't respond to resize events.
- All hover effects use `onMouseEnter`/`onMouseLeave` with direct style mutation. This is expensive and bypasses React's reconciler.
- No error boundaries anywhere. An uncaught render error in any component white-screens the entire app.
- No code splitting. The entire app ships as one bundle.
- No skeleton loaders for any async content.
- No SEO: `<title>React App</title>`, no `<meta name="description">`, no Open Graph tags.
- OverviewTab stats (0 Purchases, 150 Points, 1 Day Streak) are hardcoded strings.
- Hero section stats (50K+ Wallpapers, 200K+ Happy Fans, 500+ Anime Series) are invented numbers.
- Series filter chips are hardcoded: `['Jujutsu Kaisen', 'Attack on Titan', ...]` — not fetched from `/api/v1/products/series/list`.

### Reusable components (keep these)
- Toast system (design is good, implementation is fine)
- Glassmorphism card styles from App.css (`.glass-card`, `.glass-card-flat`)
- Button variants (`.btn-primary`, `.btn-secondary`, `.btn-full`)
- Form input system (`.form-input`, `.form-group`, `.form-error`)
- `BackgroundEffects` (keep the visual concept, optimize the implementation)
- `CheckoutForm` inside `Checkout.jsx` — the Stripe integration logic is correct
- `src/api/client.js` — keep entirely

### Components to rebuild
- `App.js` — replace state-based routing with `<BrowserRouter>` and `<Routes>`
- All navigation — build a single `<Navbar>` component using `useNavigate` from react-router-dom
- `CartSidebar` — wire to real cart API
- `OverviewTab` — remove all hardcoded stats, fetch from real endpoints
- `ProfileTab` — wire save to API, add password change form
- `LandingPage` hero stats — either remove or fetch from `/api/v1/admin/stats` (not yet exposed publicly, defer)
- Series filters — fetch from `/api/v1/products/series/list`

---

## Architecture Decisions

### Switch to react-router-dom

Replace the PAGES enum routing entirely.

```
/                    → Landing / Marketplace (combined)
/marketplace         → Full product browser with filters and search
/products/:id        → Product detail
/auth/login          → Login
/auth/signup         → Signup
/auth/verify-email   → Email verification landing
/auth/forgot         → Forgot password
/auth/reset          → Reset password
/dashboard           → User overview (redirect to /dashboard/library)
/dashboard/library   → Purchased wallpapers
/dashboard/orders    → Order history
/dashboard/wishlist  → Wishlist
/dashboard/settings  → Profile and password
/cart                → Cart page
/checkout            → Checkout (protected)
/creator             → Creator dashboard (role: creator)
/creator/uploads     → Upload management
/admin               → Admin dashboard (role: admin)
/admin/products      → Product moderation queue
/admin/creators      → Creator applications
```

All dashboard and creator routes wrapped in `<ProtectedRoute role="user">` and `<ProtectedRoute role="creator">` components that check auth state and redirect to login with a `?next=` param.

### Token refresh on app load

`App.js` must attempt a silent token refresh before rendering any route:

On mount: call `POST /api/v1/auth/refresh`. If it succeeds, store the access token and set the user in context. If it fails, clear auth state. Show a loading spinner during this check so users don't see a flash of the unauthenticated state.

### Cart synchronization strategy

On login: call `POST /api/v1/cart/sync` with the items in localStorage. This merges the local cart into the server cart. After login, all cart mutations go to the API. On logout, clear local cart and server cart state.

For guest users (not logged in), cart remains in localStorage only. On checkout attempt, redirect to login.

### State management

Keep the Context API approach — it's appropriate for this app size. Consolidate into:
- `AuthContext` — user, accessToken, login, logout, isLoading (for the initial refresh check)
- `CartContext` — cart items, syncing state, all cart mutations (now API-backed)
- `UIContext` — toast queue, modal state, sidebar open/close

Remove `products` from `CartContext`. Products belong to page-level fetches, not global state.

---

## Design System

### Visual identity

The existing dark sci-fi aesthetic is the right direction. The problem is execution: it leans too heavily on Orbitron/Rajdhani/Exo 2 everywhere, making body text hard to read. The fix is hierarchy, not replacement.

**Typography hierarchy:**
- **Brand/display** (hero titles, logo): `Orbitron` — keep, used sparingly
- **UI/headings** (section titles, card titles, nav): `Rajdhani` — semi-bold, tracked
- **Body/readable text** (descriptions, product names, prices, form labels): `Inter` — already in index.css, use consistently for everything readable
- **Monospace/data** (prices, codes, stats, resolution labels): `JetBrains Mono` or `Fira Code` — replace Orbitron in data contexts where legibility matters more than style

### Color system

CSS custom properties, building on what already exists:

```css
/* Base */
--color-void:        #020617;   /* page background */
--color-surface:     #0a1628;   /* cards, panels */
--color-surface-2:   #111827;   /* nested surfaces */
--color-border:      rgba(255,255,255,0.07);
--color-border-glow: rgba(0,243,255,0.15);

/* Text */
--color-text:        #f1f5f9;   /* primary */
--color-text-2:      #94a3b8;   /* secondary */
--color-text-3:      #475569;   /* muted/placeholder */

/* Accent — cyan */
--color-accent:      #00f3ff;
--color-accent-dim:  rgba(0,243,255,0.08);
--color-accent-glow: 0 0 20px rgba(0,243,255,0.25);

/* Pink accent */
--color-pink:        #ff2d78;
--color-pink-dim:    rgba(255,45,120,0.08);

/* Semantic */
--color-success:     #22c55e;
--color-warning:     #f59e0b;
--color-error:       #ef4444;
--color-info:        #3b82f6;

/* Gradients */
--gradient-brand: linear-gradient(135deg, #00f3ff 0%, #7c3aed 100%);
--gradient-card:  linear-gradient(180deg, rgba(10,22,40,0) 0%, rgba(10,22,40,0.9) 100%);
```

### Component system

Migrate from inline styles to CSS classes. Create `src/styles/` directory:

```
src/styles/
  globals.css        — CSS variables, reset, base typography
  components.css     — button, card, badge, input, tag components
  animations.css     — keyframes, transition utilities
  utilities.css      — spacing, layout, text utility classes
```

Every component gets its own `.module.css` file using CSS Modules for scope isolation.

**Button variants:**
- `.btn-primary` — cyan fill, glow on hover
- `.btn-secondary` — transparent, cyan border
- `.btn-ghost` — no border, text only
- `.btn-danger` — pink/red, for destructive actions
- `.btn-sm`, `.btn-lg` — size modifiers

**Card variants:**
- `.card` — base surface card with border
- `.card-glow` — hover border brightens
- `.card-interactive` — adds cursor pointer + lift transform

### Motion system

All animations via Framer Motion. Three categories:

**Page transitions:** Fade + slight upward slide. Duration 0.25s. Use `AnimatePresence` at the router level.

**Component entrance:** `initial={{ opacity: 0, y: 16 }}` → `animate={{ opacity: 1, y: 0 }}`. Use `staggerChildren` on grids so product cards appear sequentially.

**Micro-interactions:** Button press scale `0.97`, card hover `translateY(-3px)`, skeleton shimmer. Keep fast — 150–200ms.

**Never animate:** Content that updates frequently (cart count, prices). These should update instantly.

### Responsive breakpoints

```css
--bp-sm:  640px;
--bp-md:  768px;
--bp-lg:  1024px;
--bp-xl:  1280px;
--bp-2xl: 1536px;
```

Mobile-first. All product grids collapse to 1 column on mobile. Dashboard becomes a bottom-tab-bar layout on mobile. Cart becomes a full-screen modal on mobile instead of a sidebar.

### Accessibility standards
- All interactive elements have visible focus rings (`:focus-visible` with `outline: 2px solid var(--color-accent)`)
- Color contrast: body text meets WCAG AA (4.5:1 minimum)
- All images have descriptive `alt` text
- All form inputs have associated `<label>` elements
- Modal/sidebar traps focus when open, restores on close
- Skip-to-main-content link at top of every page
- `aria-live` region for toast notifications

---

## Page-by-Page Redesign

---

### Landing Page `GET /`

**Purpose:** Convert visitors to buyers. Show what AniCart is, what's available, and why to sign up.

**Sections:**
1. **Navbar** — Logo, "Browse" link, Search icon (opens search modal), Cart count, Login/Signup or User avatar
2. **Hero** — Headline, subheading, two CTAs (Browse + Sign Up). Background is the animated particle field. No fake stats. No "200K+ Happy Fans."
3. **Series marquee** — Scrolling ticker of real series names fetched from `/api/v1/products/series/list`
4. **Featured products** — 8 newest `status: active` products from `/api/v1/products?limit=8&sort=newest`. Real thumbnails, real prices, real ratings (or no rating display if none yet).
5. **How it works** — Three static steps: Browse → Buy → Download. No fake feature grid with marketing fluff.
6. **Creator CTA** — "Sell your art on AniCart" section targeting artists. Links to creator application.
7. **Footer** — Logo, navigation links, social links, legal.

**What to remove:**
- "50K+ Wallpapers / 200K+ Happy Fans / 500+ Anime Series" — all invented. Replace with nothing until real metrics exist, or simply remove.
- "Join 200,000+ Anime Fans" CTA banner — invented number.
- The "Limited Time Access" tag — no limited time offer exists.
- "First wallpaper pack absolutely free. No credit card required." — this is false.

**APIs:** `GET /api/v1/products?limit=8`, `GET /api/v1/products/series/list`

---

### Marketplace `GET /marketplace`

**Purpose:** Full product browser. Where buyers spend most of their time.

**Layout:** Two-column: narrow filter sidebar (fixed on desktop, drawer on mobile) + product grid.

**Filter sidebar sections:**
- Search (text input → debounced → `?search=` query param)
- Series (checkboxes, populated from `/api/v1/products/series/list`)
- Price range (min/max number inputs)
- Resolution (checkboxes: 4K, 2K, 1080p)
- Sort (newest, price low-to-high, price high-to-low, top rated)
- Badge (HOT, NEW, BESTSELLER, etc.)
- Active filter tags displayed at top of grid with ✕ to remove each

**Product grid:**
- 3 columns desktop, 2 tablet, 1 mobile
- Product cards show: thumbnail, name, series, resolution badge, price, star rating (from real review average), "Add to cart" on hover
- Pagination or infinite scroll (prefer pagination — easier to implement correctly)
- Skeleton cards shown during loading
- Empty state: illustrated empty state with "No wallpapers match your filters" + reset button

**APIs:** `GET /api/v1/products` (with all query params), `GET /api/v1/products/series/list`

---

### Product Detail `GET /products/:id`

**Purpose:** Show everything about one wallpaper before purchase. The conversion page.

**Layout:**
- Left: Large preview image (watermarked, from `product.assets.preview.url`). Resolution selector tabs (4K / 2K / 1080p) — locked behind "Purchase to download" unless already owned.
- Right: Name, series, creator name (if available), price, resolution options, "Add to Cart" button, "Add to Wishlist" icon button. If already in library: show "Download" button instead.

**Below the fold:**
- Resolution comparison table (actual pixel dimensions per tier)
- License terms (personal use, no redistribution)
- Reviews section (if none: "Be the first to review" only shown post-purchase)
- Review form (only shown if user owns the product, has no review yet): star selector + comment text area + submit
- Related products (same series, `GET /api/v1/products?series=X&limit=4`)

**What to remove:**
- Quantity selectors — this is digital goods, one copy is the license. No qty.

**APIs:** `GET /api/v1/products/:id`, `GET /api/v1/reviews/:productId`, `POST /api/v1/reviews` (auth), `GET /api/v1/products/:id/download` (auth, ownership check)

**New backend requirement:** The download endpoint needs to accept an optional `?resolution=4k|2k|1080p` param and return a presigned URL for that specific variant. Backend already implements this.

---

### Search `modal / GET /marketplace?search=`

**Purpose:** Find a specific product fast.

**Implementation:** A full-screen search overlay triggered by clicking the search icon in the navbar. Text input auto-focused. As the user types (debounced 300ms), call `GET /api/v1/products?search=X&limit=6`. Show results inline in the modal. Pressing Enter navigates to `/marketplace?search=X`. Pressing Escape closes.

No dedicated search page needed — results live in the Marketplace page.

---

### Cart `GET /cart`

**Purpose:** Review, adjust, and proceed to checkout.

**Layout:** Full page, two-column on desktop (items left, summary right). On mobile, stacks vertically with summary pinned to bottom.

**Cart item row:** Thumbnail, name, series, resolution badge, price, remove button. No quantity selector (digital goods — each is a unique item). No qty means the `updateCartItem` backend route (which was really just re-adding) is not needed on the frontend.

**Order summary:** Item subtotal, tax (calculated from backend on checkout), total. "Proceed to Checkout" button (redirects to `/checkout` if logged in, else to `/auth/login?next=/checkout`).

**Empty state:** Illustrated empty cart, "Start browsing" CTA.

**API changes needed:** Cart must be API-backed. Every add/remove calls the real endpoint. On page load, fetch from `GET /api/v1/cart` if logged in.

**APIs:** `GET /api/v1/cart`, `POST /api/v1/cart/add`, `DELETE /api/v1/cart/remove/:productId`, `DELETE /api/v1/cart/clear`

---

### Checkout `GET /checkout`

**Purpose:** Complete payment.

**Layout:** Single-column, narrow (max-width 480px centered). Minimal distraction.

**Sections:**
1. Order summary (compact — items + total + tax)
2. Stripe PaymentElement
3. "Pay $X.XX" button
4. Security badges (SSL padlock, Stripe branding)

**Flow:**
1. Page mounts → call `GET /api/v1/orders/config` for publishable key → call `POST /api/v1/orders/create-payment-intent` → receive `clientSecret`
2. User fills payment details → `stripe.confirmPayment()` → on success call `POST /api/v1/orders/checkout` → clear cart → redirect to `/dashboard/library` with success toast

Note: The existing `Checkout.jsx` already implements this correctly. Keep the logic, replace the minimal inline styling with the proper design system.

**Protected route:** Redirect to login if not authenticated.

---

### User Dashboard `GET /dashboard`

Redirect to `/dashboard/library` by default.

**Shared layout:** Persistent sidebar on desktop with navigation links. On mobile: top tabs or bottom bar.

Sidebar links:
- Library
- Orders
- Wishlist
- Settings

No "Overview" tab showing fake stats. The dashboard is a container, not a content page.

---

### Library `GET /dashboard/library`

**Purpose:** All purchased wallpapers, ready to download.

**Layout:** Product grid (same as Marketplace but with Download button instead of Add to Cart). Download button shows a dropdown: "4K", "2K", "1080p" (only options the product actually has, based on `availableResolutions`).

**Download flow:** Click resolution → call `GET /api/v1/products/:id/download?resolution=4k` → receive presigned URL → `window.open(url, '_blank')`.

**Empty state:** Clean illustration, "Your library is empty. Start building your collection." + Browse link.

**Loading state:** Skeleton grid of cards.

**APIs:** `GET /api/v1/users/library`, `GET /api/v1/products/:id/download?resolution=`

---

### Orders `GET /dashboard/orders`

**Purpose:** Complete order history.

**Layout:** List of order cards, newest first. Each card shows: order date, number of items, total paid, status badge (completed/cancelled), "View Details" link.

**Order detail modal or `/dashboard/orders/:id`:** Lists each product with its thumbnail and price. Shows Stripe payment ID (truncated). No re-download button here — downloads are in the Library.

**Empty state:** "No orders yet. Check your library for past purchases."

**APIs:** `GET /api/v1/orders`, `GET /api/v1/orders/:id`, `PUT /api/v1/orders/:id/cancel` (only shown for pending orders, which in practice won't exist since orders are instantly completed after successful payment)

---

### Wishlist `GET /dashboard/wishlist`

**Purpose:** Products saved for later.

**Layout:** Same product grid as Marketplace. Each card has a "Remove from wishlist" icon and an "Add to Cart" button.

**Empty state:** "Save products you like while you browse."

**Heart icon on product cards throughout the site:** Toggles wishlist state. Requires login. Optimistic UI — update immediately, revert on API error.

**APIs:** `GET /api/v1/users/wishlist`, `POST /api/v1/users/wishlist/:productId`, `DELETE /api/v1/users/wishlist/:productId`

---

### Settings `GET /dashboard/settings`

**Purpose:** Manage profile and security.

**Layout:** Two sections, vertically stacked.

**Profile section:**
- Avatar (letter-based, same as now — add ability to pick initials color)
- Display name (editable text input + Save button — calls `PUT /api/v1/users/profile`)
- Email (read-only, shown with verified badge)

**Security section:**
- Change password form: current password, new password, confirm new password. Calls `PUT /api/v1/users/password`.
- Password strength indicator (client-side, matches the SignupPage's existing implementation)

**Danger zone:**
- "Delete account" — shows a confirmation modal with "Type your email to confirm". No backend route yet — mark as "coming soon" with disabled button.

**APIs:** `PUT /api/v1/users/profile`, `PUT /api/v1/users/password`

---

### Creator Dashboard `GET /creator`

**Access:** Only users with `role: creator`.

**Layout:** Sidebar (desktop) with sections: My Uploads, Stats, Settings.

**My Uploads `GET /creator/uploads`:**
- Table of all products created by this user
- Columns: Thumbnail, Name, Status (pending / active / rejected), Sales count, Upload date, Actions
- Status badges: pending = amber, active = green, rejected = red
- Actions: "View" links to product detail. No edit (wrong scope for v1)
- Upload new product button → opens upload modal

**Upload modal flow:**
1. Drag-and-drop or click to upload file (JPEG, PNG, WEBP, max 25MB)
2. Form fields: Product name, series, price, tags, license type, rights confirmation checkbox
3. Note: Product must already exist in the backend before upload (current backend requires a `productId`). The flow needs to be: create product first (`POST /api/v1/products` — but this is admin-only currently). **Required backend change:** Add a `POST /api/v1/creator/products` route that creates a product record with `status: pending` and `role: creator` access. Then the existing `/api/v1/upload/wallpaper` route handles the file with that `productId`.
4. Submit → backend processes in background → show processing indicator using `GET /api/v1/upload/status/:productId` polling

**Stats `GET /creator/stats`:**
- Sales this month (from `creatorStats.salesCount`)
- Upload limit progress (`uploadsThisMonth / uploadLimit`)
- Creator level badge (New / Growing / Pro)
- Points earned (not implemented in backend — skip for now)

**APIs:** `GET /api/v1/creator/products`, `GET /api/v1/creator/stats`, `POST /api/v1/creator/products` (needs adding), `POST /api/v1/upload/wallpaper`, `GET /api/v1/upload/status/:productId`

---

### Admin Dashboard `GET /admin`

**Access:** Only users with `role: admin`. Redirect all others to `/`.

**Layout:** Sidebar navigation with sections.

**Product Moderation `GET /admin/products`:**
- Filter by status: pending / active / rejected / all
- Each pending product row: Thumbnail preview, name, creator, upload date, resolution, actions
- Actions: Approve (calls `PUT /api/v1/products/:id/approve`) or Reject with required reason field (calls `PUT /api/v1/products/:id/reject`)
- On approve/reject: row updates immediately (optimistic) and creator receives email

**Creator Applications `GET /admin/creators`:**
- List of pending creator applications
- Each row: user name, email, portfolio link (clickable), applied date
- Actions: Approve (`PUT /api/v1/admin/creator-requests/:id/approve`) or Reject (`PUT /api/v1/admin/creator-requests/:id/reject`)

**APIs:** `GET /api/v1/admin/products/pending`, `PUT /api/v1/products/:id/approve`, `PUT /api/v1/products/:id/reject`, `GET /api/v1/admin/creator-requests`, `PUT /api/v1/admin/creator-requests/:id/approve`, `PUT /api/v1/admin/creator-requests/:id/reject`

---

### Authentication Pages

**Login `GET /auth/login`:**
- Keep the current design (it's good)
- Wire `handleDemoLogin` to the real API (already done in the latest code)
- Remove the hardcoded `DEMO_USERS` array — it's vestigial, login already calls the API
- Add forgot password link → `/auth/forgot`
- After login: redirect to `?next=` param if present, else dashboard

**Signup `GET /auth/signup`:**
- Keep the two-step layout
- Step 1 submits to `POST /api/v1/auth/register`
- On success: show "Check your email" confirmation screen instead of instantly logging in (email verification is required)
- Don't call `login()` on signup — user must verify email first

**Email verification `GET /auth/verify-email`:**
- Reads `?token=` from URL
- On mount: calls `GET /api/v1/auth/verify-email/:token`
- Success: "Email verified! You can now log in." + Login button
- Failure: "This link has expired or is invalid." + Resend verification button

**Forgot password `GET /auth/forgot`:**
- Single email input
- Calls `POST /api/v1/auth/forgot-password`
- Always shows generic "If that email exists, we've sent a reset link" — don't reveal whether email is registered

**Reset password `GET /auth/reset`:**
- Reads `?token=` from URL
- New password + confirm password inputs
- Calls `POST /api/v1/auth/reset-password/:token`
- On success: redirect to login

**Required backend change:** `POST /api/v1/orders/config` — this route is called in `Checkout.jsx` to get the Stripe publishable key. It doesn't appear to exist in the backend yet. Add it: returns `{ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY }`.

---

## Backend Integration Audit

### Complete integrations (already wired)
| Flow | Status |
|---|---|
| Login → API → token stored | ✅ Done |
| Fetch products on app load | ✅ Done |
| Library fetch + download URL | ✅ Done |
| Stripe checkout (Checkout.jsx) | ✅ Done |

### Missing integrations (frontend must add)
| Flow | Missing |
|---|---|
| Signup → `POST /api/v1/auth/register` | Not called |
| Email verification page | Page doesn't exist |
| Forgot/reset password pages | Don't exist |
| Silent token refresh on app load | Not wired |
| Cart → API (add/remove/get) | All local state |
| Profile save → `PUT /api/v1/users/profile` | Fake toast only |
| Password change → `PUT /api/v1/users/password` | No UI |
| Wishlist (all CRUD) | No UI |
| Orders list and detail | No UI |
| Reviews (submit, list) | No UI |
| Creator dashboard | No UI |
| Admin dashboard | No UI |
| Upload flow | No UI |
| Series filters from API | Hardcoded |
| Search (debounced) | No UI |

### New backend routes needed by frontend
| Route | Reason |
|---|---|
| `GET /api/v1/orders/config` | Checkout.jsx needs Stripe publishable key |
| `POST /api/v1/creator/products` | Creators need to create product records before uploading |

---

## Missing Features for a Complete Marketplace

### Search
Debounced search input in Navbar and Marketplace. Calls `GET /api/v1/products?search=`. The backend already handles this (with regex — escaping is fixed). Future: wire to Meilisearch once syncing is implemented.

### Reviews
- List reviews per product (public)
- Submit review (requires ownership via License)
- Delete own review
- Product card and detail page show real average rating from reviews, not the manual `product.rating` field
- Backend validation: one review per user per product (unique index already exists on Review model)

### Wishlist
Described in page section above.

### Orders
Described in page section above.

### Creator tools
- Upload management UI
- Upload flow (drag-and-drop → form → background processing status)
- Sales and stats dashboard

### Admin tools
- Product moderation queue
- Creator application review

### Notifications
The backend has `sendProductRejectionEmail` and `sendOrderReceiptEmail` — these are push notifications (email). There is no in-app notification system. For v1, email is sufficient. Do not build a fake in-app notification panel that shows nothing. If a notification bell is desired later, it requires a Notification model and API endpoints that don't exist yet.

### Downloads
Described in Library section. Already backed by the presigned URL route.

---

## Performance & Quality

### Loading states
Every async boundary gets a skeleton loader, not a spinner. Skeletons match the shape of the content they're loading (card grid → skeleton cards, order list → skeleton rows, etc.).

### Error states
Every `useEffect` that fetches data must have a catch block that sets an error state. Error states show a message + a retry button that re-runs the fetch. Never show a blank page on API failure.

### Empty states
Every list or grid that can be empty (Library, Orders, Wishlist, Cart, product search results) gets a designed empty state: an icon or illustration, a descriptive sentence, and an appropriate CTA. No empty containers, no "undefined", no `[]`.

### Code splitting
Use `React.lazy` and `Suspense` for route-level splitting:
- Admin routes (split from main bundle entirely)
- Creator routes
- Dashboard (loaded only after login)

### Lazy loading
All `<img>` tags get `loading="lazy"`. Product grid images below the fold are deferred. Use `IntersectionObserver` for image reveals with a fade-in on load.

### Caching
- Products list cached in component state for the session. No re-fetch on every navigate.
- Series list fetched once on app mount, stored in a context or module-level cache.
- User profile data cached in `AuthContext` — re-fetched only on explicit refresh or after profile update.

### SEO
- `<title>` set per page via a `useTitle` hook: `AniCart — Browse Anime Wallpapers`, `Sign In — AniCart`, etc.
- `index.html` gets a proper `<meta name="description">` and Open Graph tags.
- Product detail pages should have structured data (JSON-LD) for the product — this helps search engines index the catalog.

### Accessibility
- Tab order follows visual order on all forms
- All icon-only buttons have `aria-label`
- Cart count badge: `aria-label="3 items in cart"`
- Modal/drawer: `role="dialog"`, `aria-modal="true"`, focus trap

---

## Execution Plan

---

### Phase A — Foundation (Week 1)

**Goal:** Stable routing, working auth, API-backed cart. Everything that exists should work correctly before adding anything new.

**Tasks:**
1. Install and configure react-router-dom routes for all planned paths
2. Implement silent token refresh in `AuthContext` on app mount
3. Wire `SignupPage` to `POST /api/v1/auth/register` — add "check your email" confirmation step
4. Build `/auth/verify-email`, `/auth/forgot`, `/auth/reset` pages
5. Wire cart mutations to API (`POST /api/v1/cart/add`, `DELETE /api/v1/cart/remove/:id`, `GET /api/v1/cart`)
6. Wire cart sync on login (`POST /api/v1/cart/sync`)
7. Wire `CartSidebar` checkout to navigate to `/checkout` (use real `Checkout.jsx`, not the fake toast)
8. Wire profile save in Settings: `PUT /api/v1/users/profile`
9. Wire password change: `PUT /api/v1/users/password`
10. Remove all hardcoded `DEMO_USERS` arrays and fake data (the `DEMO_USERS` const in LoginPage)
11. Add error boundaries: one wrapping all routes, one per page
12. Fix `window.innerWidth` in Navbar render — use a `useWindowWidth` hook or CSS media queries

**Dependencies:** None — these are all fixes to existing pages with existing API endpoints.

**Complexity:** Medium. Most is plumbing, not new UI.

---

### Phase B — Marketplace (Week 2)

**Goal:** A real browsable product catalog with search, filters, and a proper product detail page.

**Tasks:**
1. Build `/marketplace` page with filter sidebar (series, price range, resolution, sort)
2. Fetch series list from `/api/v1/products/series/list` for filter checkboxes — remove hardcoded filter array
3. Debounced search input wired to `?search=` query param
4. Product grid with skeleton loading and empty state
5. Build `/products/:id` product detail page
6. Presigned download preview (watermarked) on product detail
7. "Already owned" state on product detail → show Download button
8. Series marquee on landing page from real API data
9. Search overlay (keyboard shortcut `Cmd+K` / `Ctrl+K` opens modal)
10. Migrate inline styles to CSS module classes for all rebuilt components

**APIs:** `GET /api/v1/products` (with filters), `GET /api/v1/products/series/list`, `GET /api/v1/products/:id`

**Complexity:** Medium-high. The filter state management and URL sync (query params ↔ filter UI) is the trickiest part.

---

### Phase C — User Features (Week 3)

**Goal:** Complete user-facing features. After Phase C, a buyer can do everything: browse, buy, download, review, wishlist.

**Tasks:**
1. Build `/dashboard/library` with resolution download selector
2. Build `/dashboard/orders` — list and detail
3. Build `/dashboard/wishlist` with grid display
4. Wire wishlist heart icon on product cards and detail page
5. Build reviews section on product detail: list existing reviews, submit form (post-purchase users only)
6. Add `GET /api/v1/orders/config` backend route (for Stripe publishable key)
7. Dashboard sidebar layout (replaces tab bar)
8. Add proper skeleton loaders to all async content in dashboard
9. Fix OverviewTab stats — fetch real data from `/api/v1/auth/me` (points, purchasesCount from User model) or remove the stats cards

**APIs:** `GET /api/v1/users/library`, `GET /api/v1/products/:id/download`, `GET /api/v1/orders`, `GET /api/v1/orders/:id`, `GET /api/v1/users/wishlist`, `POST /api/v1/users/wishlist/:id`, `DELETE /api/v1/users/wishlist/:id`, `GET /api/v1/reviews/:productId`, `POST /api/v1/reviews`

**Complexity:** Medium.

---

### Phase D — Creator Features (Week 4)

**Goal:** Creators can upload, track, and manage their products.

**Tasks:**
1. Add `POST /api/v1/creator/products` backend route (creator-scoped product creation)
2. Build `/creator` dashboard layout with stats and upload list
3. Build upload modal: drag-and-drop file area, form fields, rights confirmation, submit
4. Poll `/api/v1/upload/status/:productId` after upload — show progress bar
5. Upload history table with status badges
6. Creator application form (`POST /api/v1/creator/apply`)
7. "Become a Creator" CTA in footer and user dashboard (shown only to non-creator users)

**APIs:** `GET /api/v1/creator/products`, `GET /api/v1/creator/stats`, `POST /api/v1/creator/products` (new), `POST /api/v1/upload/wallpaper`, `GET /api/v1/upload/status/:productId`, `POST /api/v1/creator/apply`

**Complexity:** High. File upload with progress tracking and status polling is the most complex UI flow in the app.

---

### Phase E — Admin Features (Week 5)

**Goal:** Admins can moderate content and manage creator applications.

**Tasks:**
1. Build `/admin` layout — sidebar, protected by `role: admin`
2. Build product moderation queue — pending products table with approve/reject actions
3. Build creator application review table
4. Reject modal with required reason text field
5. Optimistic UI for approve/reject actions (row disappears immediately)
6. Add a visible "admin" badge in the navbar when logged in as admin

**APIs:** `GET /api/v1/admin/products/pending`, `PUT /api/v1/products/:id/approve`, `PUT /api/v1/products/:id/reject`, `GET /api/v1/admin/creator-requests`, `PUT /api/v1/admin/creator-requests/:id/approve`, `PUT /api/v1/admin/creator-requests/:id/reject`

**Complexity:** Low-Medium. Mostly table UIs with action buttons.

---

### Phase F — Polish (Week 6)

**Goal:** Production-ready quality on all fronts.

**Tasks:**
1. React.lazy + Suspense code splitting for admin, creator, and dashboard routes
2. `loading="lazy"` on all product images
3. SEO: page titles per route, meta description in index.html, Open Graph tags
4. Animate page transitions with Framer Motion's AnimatePresence at the router level
5. Migrate remaining inline styles to CSS modules
6. Accessibility audit: keyboard navigation, focus management, aria labels
7. Remove all `console.log` statements
8. Error boundary polish — design the error fallback UI to match the app's aesthetic
9. Mobile layout audit — every page on 375px viewport
10. Cross-browser test (Chrome, Firefox, Safari)
11. `npm run build` → verify bundle size → identify heavy dependencies
12. Performance audit with Lighthouse — target 90+ on Performance

---

## Summary

The existing codebase has the right visual direction, the right tech choices, and several pieces of real functionality (login, library, checkout). What's missing is architectural discipline (real routing, token persistence, API-backed cart) and the remaining pages (marketplace, product detail, orders, wishlist, creator tools, admin).

The fake content (invented stats, demo credentials, hardcoded filter options) must be removed — not replaced with more fake content, removed. A marketplace with 0 real products in the catalog is an honest empty state. A marketplace claiming "200K+ Happy Fans" is a lie.

Following the six phases above produces a production-ready marketplace where every visible element connects to real data, every flow reaches the backend, and the anime-inspired aesthetic serves the product rather than decorating a demo.
