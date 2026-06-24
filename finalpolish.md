# finalpolish.md — AniCart Complete Gap Audit

Both frontend and backend read in full. Every finding below is traced to specific files and line numbers — not guesswork. Issues are grouped by severity. Fix the **Critical** section first; nothing else matters until those 404s and crashes are gone.

---

## Critical — These break real user flows right now

---

### [C1] AdminProductsPage calls a route that is unreachable

**File:** `Backend/routers/productRoutes.js`

```js
router.get('/:id', apiLimiter, productIdValidation, getProduct);      // defined 4th
// ...
router.get('/admin/pending', protect, adminOnly, getPendingProducts); // defined 9th
```

Express matches `/admin/pending` against `/:id` first (because it's registered earlier) with `id = "admin"`. The `productIdValidation` middleware rejects it as a bad ObjectId and returns a 400. `getPendingProducts` never runs.

**Fix:** Move the `/admin/pending` route above `/:id` in `productRoutes.js`:

```js
router.get('/series/list', getSeries);
router.get('/admin/pending', protect, adminOnly, paginationValidation, getPendingProducts); // ← MOVE UP
router.get('/:id', apiLimiter, productIdValidation, getProduct);
```

---

### [C2] AdminCreatorsPage calls the wrong URL — permanent 404

**File:** `Frontend/src/pages/admin/AdminCreatorsPage.jsx`

```js
// Current — wrong:
apiClient.get('/creator/admin/creator-requests')
apiClient.put(`/creator/admin/creator-requests/${id}/approve`)

// Correct — creatorRoutes is mounted at '/' not '/creator/':
// routes/index.js: router.use('/', creatorRoutes)
apiClient.get('/admin/creator-requests')
apiClient.put(`/admin/creator-requests/${id}/approve`)
```

The reject action is also missing from this page entirely. Add a reject button that calls `PUT /admin/creator-requests/${id}/reject`.

---

### [C3] ProductDetailPage calls review endpoints that don't exist

**File:** `Frontend/src/pages/ProductDetailPage.jsx`

```js
// Current — wrong paths:
apiClient.get(`/products/${id}/reviews`)  // 404
apiClient.post(`/products/${id}/reviews`, reviewForm)  // 404

// Backend routes are mounted at /reviews/:productId:
apiClient.get(`/reviews/${id}`)           // correct
apiClient.post(`/reviews/${id}`, reviewForm)  // correct
```

---

### [C4] CreatorStatsPage calls the wrong URL — permanent 404

**File:** `Frontend/src/pages/creator/CreatorStatsPage.jsx`

```js
// Current — wrong:
apiClient.get('/creators/stats')

// Correct:
apiClient.get('/creator/stats')
```

Also: the backend `getCreatorStats` only returns `user.creatorStats` which has `uploadsThisMonth`, `salesCount`, `creatorLevel`, `uploadLimit`. But `CreatorStatsPage.jsx` expects `totalEarnings`, `totalSales`, `activeProducts`, `topProducts`. These fields don't exist in the response. **The stats page will render zeros for everything.**

Fix `getCreatorStats` in `creatorController.js` to compute and return the expected shape:

```js
const getCreatorStats = catchAsync(async (req, res) => {
  const [user, products, orders] = await Promise.all([
    User.findById(req.user.id).select('creatorStats role'),
    Product.find({ creator: req.user.id, status: 'active' }).select('name series price assets salesCount'),
    Order.find({ status: 'completed' }),
  ]);

  if (!user || user.role !== CONSTANTS.ROLES.CREATOR) {
    throw ApiError.forbidden('Only creators can access this');
  }

  const creatorProductIds = new Set(products.map(p => p._id.toString()));
  
  let totalEarnings = 0;
  let totalSales = 0;
  const salesByProduct = {};

  for (const order of orders) {
    for (const item of order.items) {
      const pid = item.product?.toString();
      if (creatorProductIds.has(pid)) {
        totalEarnings += item.price || 0;
        totalSales += 1;
        salesByProduct[pid] = (salesByProduct[pid] || 0) + 1;
      }
    }
  }

  const topProducts = products
    .map(p => ({ ...p.toObject(), salesCount: salesByProduct[p._id.toString()] || 0 }))
    .sort((a, b) => b.salesCount - a.salesCount)
    .slice(0, 5);

  res.status(200).json(successResponse({
    message: 'Creator stats retrieved successfully',
    data: {
      stats: {
        totalEarnings: Number(totalEarnings.toFixed(2)),
        totalSales,
        activeProducts: products.length,
        topProducts,
        ...user.creatorStats,
      }
    },
  }));
});
```

---

### [C5] Creator product delete route doesn't exist

**File:** `Frontend/src/pages/creator/CreatorUploadsPage.jsx`

```js
await apiClient.delete(`/creators/products/${id}`);  // 404 — route does not exist
```

No `DELETE` route exists anywhere for creators to delete their own products. Add to `creatorRoutes.js`:

```js
router.delete('/creator/products/:id', protect, async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, creator: req.user.id });
    if (!product) throw ApiError.notFound('Product not found or you do not own it');
    if (product.status === 'active') throw ApiError.badRequest('Cannot delete a live product — reject it first');
    await product.deleteOne();
    res.status(200).json(successResponse({ message: 'Product deleted' }));
  } catch (err) { next(err); }
});
```

Then fix the frontend call to use `/creator/products/${id}`.

---

### [C6] `createCreatorProduct` will throw Mongoose validation errors

**File:** `Backend/controllers/creatorController.js`

```js
const product = await require('../models/Product').create({
  name, series, price, description,
  creator: req.user.id,
  status: 'draft',
  assets: { status: 'pending' },
  // MISSING: rightsConfirmed, termsAcceptedAt, licenseType — all required:true in Product model
});
```

Add defaults:
```js
rightsConfirmed: true,        // creator explicitly agreed during application
termsAcceptedAt: new Date(),
licenseType: 'original',
```

---

### [C7] Silent logout failure — AuthContext never hears about 401s after refresh fails

**File:** `Frontend/src/api/client.js`

```js
} catch (refreshError) {
  setAccessToken(null);
  // "We could dispatch a logout event or redirect here" — but it DOESN'T
}
```

`AuthContext.jsx` IS listening for `'auth:unauthorized'` events (there is an event listener wired up). But the interceptor never fires the event. Result: when refresh fails, the access token is cleared but `user` state in AuthContext remains set. The user sees themselves as logged in, every API call silently fails with 401, and there's no redirect to login.

**Fix — one line:**
```js
} catch (refreshError) {
  setAccessToken(null);
  window.dispatchEvent(new Event('auth:unauthorized')); // ← add this
}
```

---

### [C8] Guest cart is destroyed on login — sync is never called

**File:** `Frontend/src/contexts/CartContext.jsx`

When `user` changes from `null` → logged-in user, `CartContext` calls `fetchCart()` which overwrites the local cart with the server cart. The guest cart (from localStorage) is silently discarded. The `syncCart` function exists but nobody calls it.

**Fix — call `syncCart` during login, before the server cart overwrites local state:**

In `LoginPage.jsx`, import `useCart` and call sync after login:
```js
const { cart, syncCart } = useCart();

// After successful login:
const { user: loggedInUser, accessToken } = res.data.data;
setAccessToken(accessToken);
if (cart.length > 0) await syncCart(cart).catch(() => {});  // merge guest cart first
login(loggedInUser, accessToken);
```

---

### [C9] Default download resolution 'original' doesn't exist — users can't download

**File:** `Frontend/src/pages/dashboard/LibraryPage.jsx`

```js
const res = await apiClient.get(`/products/${id}/download`);
// No ?resolution= param → backend defaults to 'original'
```

**File:** `Backend/services/productService.js`

```js
async function downloadProduct(userId, productId, resolution = 'original') {
  const assetKey = product.assets?.[resolution]?.key;
  if (!assetKey) throw ApiError.badRequest(`Requested resolution '${resolution}' is not available`);
```

The image processor creates: `4k`, `2k`, `1080p`, `preview`, `thumbnail`. It does NOT create an `original` key. Every download from LibraryPage will throw a 400 "Requested resolution 'original' is not available".

**Fix:** Change the backend default to `'4k'`, and add a resolution picker dropdown to LibraryPage that lets users choose `4k` / `2k` / `1080p`:

```js
// productService.js
async function downloadProduct(userId, productId, resolution = '4k') {
```

And in LibraryPage, build a small resolution dropdown per product showing only the resolutions the product actually has available.

---

### [C10] `adminController.getAdminStats` uses wrong field name in aggregation

**File:** `Backend/controllers/adminController.js`

```js
$group: {
  _id: '$items.product',
  sales: { $sum: '$items.quantity' },  // WRONG — Order model uses 'qty' not 'quantity'
```

**File:** `Backend/models/Order.js` confirms: `qty: { type: Number, default: 1 }`.

Result: `sales` is always 0 for every product in the admin stats. Fix:
```js
sales: { $sum: '$items.qty' },
```

---

## High Priority — Broken functionality but not a total crash

---

### [H1] LibraryPage `downloadUrl` field name mismatch

**File:** `Frontend/src/pages/dashboard/LibraryPage.jsx`

```js
const url = res.data?.data?.url || res.data?.url;
```

**File:** `Backend/services/productService.js`

```js
return { downloadUrl, expiresIn: 900 };  // field is 'downloadUrl', not 'url'
```

The frontend reads `data.url` but backend returns `data.downloadUrl`. Change frontend to:
```js
const url = res.data?.data?.downloadUrl || res.data?.downloadUrl;
```

Same mismatch in `ProductDetailPage.jsx`:
```js
const url = res.data?.data?.url || res.data?.url;  // ← same fix needed
```

---

### [H2] `getPendingCreatorRequests` is used as a general "list all users" by AdminCreatorsPage

The AdminCreatorsPage is titled "Creator Applications" but the backend query is:
```js
User.find({ 'creatorRequest.status': 'pending' })
```

When there are no pending applications, the page shows "No regular users found" — which is incorrect copy. Also, users who apply to be creators submit `POST /creator/apply`, but the AdminCreatorsPage provides no "Reject" action — only "Promote to Creator". Add a reject button calling `PUT /admin/creator-requests/${id}/reject`.

---

### [H3] `createPaymentIntent` creates an Order before payment is confirmed

**File:** `Backend/services/orderService.js`

```js
const order = await Order.createFromCart(userId, cart.items);
// ... then creates Stripe intent with orderId in metadata
```

If the user abandons checkout, a permanent `status: 'pending'` Order sits in the database. Stripe's webhook only handles `payment_intent.succeeded` — there's no cleanup for abandoned intents.

**Fix:** Add a cleanup job or Stripe webhook handler for `payment_intent.payment_failed` and `payment_intent.canceled`:

```js
if (event.type === 'payment_intent.payment_failed' || event.type === 'payment_intent.canceled') {
  const pi = event.data.object;
  await Order.findOneAndUpdate(
    { stripePaymentIntentId: pi.id, status: 'pending' },
    { status: 'cancelled' }
  );
}
```

---

### [H4] Backend allows a user to buy a product they already own

**File:** `Backend/services/orderService.js`, in `createPaymentIntent`:

There is no check for `License.exists({ user: userId, product: productId })`. A user who already owns a wallpaper can add it to cart and pay again. The second payment succeeds, creates a duplicate order, and their download counter increments unnecessarily.

**Fix:** In `createPaymentIntent`, after fetching the cart:
```js
const existingLicenses = await License.find({
  user: userId,
  product: { $in: cart.items.map(i => i.product._id) },
  isActive: true
}).select('product');

if (existingLicenses.length > 0) {
  const owned = existingLicenses.map(l => l.product.toString());
  const alreadyOwned = cart.items.filter(i => owned.includes(i.product._id.toString()));
  const names = alreadyOwned.map(i => i.product.name).join(', ');
  throw ApiError.badRequest(`You already own: ${names}`);
}
```

---

### [H5] Resend verification email — backend route exists, no frontend UI

**File:** `Backend/routers/authRoutes.js` — `POST /auth/resend-verification` exists.

**File:** `Frontend/src/pages/auth/SignupPage.jsx`

The "Check Your Email" success screen only shows a "← Change email" button. If the email gets spam-filtered or the link expires, there's no resend path.

**Fix:** Add a "Resend email" button to the success state in SignupPage:
```jsx
<button onClick={async () => {
  try {
    await apiClient.post('/auth/resend-verification', { email: submittedEmail });
    addToast('Verification email resent!', 'success');
  } catch { addToast('Failed to resend. Try again.', 'error'); }
}} className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}>
  Resend verification email
</button>
```

---

### [H6] Creator application has no frontend page — non-creators are silently redirected

**File:** `Frontend/src/App.jsx` — `ProtectedRoute role="creator"` redirects to `/` with no message.

The LandingPage "Sell Your Art on AniCart → Apply to Create" link goes to `/creator`. A logged-in non-creator hits the ProtectedRoute, gets silently pushed to `/`, and has no idea what happened or where to apply.

**Fix:** Create `Frontend/src/pages/creator/CreatorApplyPage.jsx` — a page accessible to any logged-in user with a form that calls `POST /creator/apply`. Mount it at `/creator/apply` outside the creator ProtectedRoute. Change the landing page CTA and ProtectedRoute redirect accordingly:

```jsx
if (role === 'creator' && user.role !== 'creator' && user.role !== 'admin') {
  return <Navigate to="/creator/apply" replace />;  // not to '/'
}
```

---

### [H7] No error boundary anywhere in the app

**File:** `Frontend/src/App.jsx` — no `<ErrorBoundary>` component wrapping any route.

A render-time crash in any component (null access, missing context, etc.) white-screens the entire app with a React production error. Add an ErrorBoundary class component wrapping `AnimatedRoutes` at minimum.

---

### [H8] `ProductDetailPage` fetches entire library to check ownership — expensive

**File:** `Frontend/src/pages/ProductDetailPage.jsx`

```js
apiClient.get('/users/library')
  .then(r => {
    const library = r.data?.data || [];
    const owned = library.some(item => ...);
```

Fetches every item a user has ever purchased just to answer "do you own this one product?". On a user with 50+ purchases this is a 50-item response for a yes/no answer.

**Fix:** Add a dedicated backend check. Either:

Option A — query param on product endpoint (simplest):
```js
// GET /api/v1/products/:id?checkOwnership=true
// When authenticated + checkOwnership=true, include `isOwned: bool` in response
```

Option B — dedicated route:
```js
// GET /api/v1/users/library/:productId → { owned: bool }
router.get('/library/:productId', protect, async (req, res) => {
  const license = await License.exists({ user: req.user.id, product: req.params.productId, isActive: true });
  res.json(successResponse({ data: { owned: !!license } }));
});
```

---

### [H9] `STRIPE_PUBLIC_KEY` non-standard env variable name

**File:** `Backend/controllers/orderController.js`

```js
publishableKey: process.env.STRIPE_PUBLIC_KEY,
```

Stripe's standard convention is `STRIPE_PUBLISHABLE_KEY`. Any dev following Stripe docs will set `STRIPE_PUBLISHABLE_KEY` and get `undefined` from the config endpoint, breaking checkout initialization silently.

**Fix:** Rename to `STRIPE_PUBLISHABLE_KEY` in server code and update `.env.example`.

---

## Medium Priority — UX gaps and missing polish

---

### [M1] ProductCard has no wishlist button — users must navigate to detail page to wishlist

Every ProductCard in the marketplace grid and landing page lacks a heart/wishlist toggle. Users have to click into each product to wishlist it.

**Fix:** Add a heart button overlay to `Frontend/src/components/product/ProductCard.jsx`:
```jsx
{user && (
  <button
    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(); }}
    className="product-wishlist-btn"
    aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
  >
    {isWishlisted ? '♥' : '♡'}
  </button>
)}
```
Needs wishlist state from a new `useWishlist` hook or WishlistContext, or just local optimistic state + API call.

---

### [M2] Cart does not show a loading state during API sync

**File:** `Frontend/src/contexts/CartContext.jsx` exports `cartLoading`.

No page or component reads `cartLoading`. When the API cart fetch is in-flight, the cart page shows an empty cart briefly, then populates. Should pass `cartLoading` into CartPage and show a skeleton or disabled state during sync.

---

### [M3] `useTitle('')` in ProductDetailPage — wrong behavior

**File:** `Frontend/src/pages/ProductDetailPage.jsx`

```js
useTitle('');
// ...later in useEffect:
document.title = `${prod.name} — AniCart`;
```

The hook is called with `''` at mount (which probably sets `document.title = ' — AniCart'`), then the useEffect sets it correctly after fetch. If the user navigates away while loading, or the fetch fails, the title stays blank. Use the hook correctly:

```js
const [productName, setProductName] = useState('');
useTitle(productName || 'Product');
// In useEffect after successful fetch:
setProductName(prod.name);
```

---

### [M4] MarketplacePage series filter truncates at 8 with no "show more"

**File:** `Frontend/src/pages/MarketplacePage.jsx`

```js
{seriesList.slice(0, 8).map(s => ...)}
```

If there are 20+ series, 12 are invisible with no way to access them. Add an accordion or "Show all (X)" toggle.

---

### [M5] LibraryPage doesn't offer resolution selection on download

**File:** `Frontend/src/pages/dashboard/LibraryPage.jsx`

The `handleDownload` function calls `GET /products/${id}/download` with no resolution — gets the default. Users who paid for a 4K product should be able to choose which resolution to download.

**Fix:** Add a resolution picker dropdown to each library card. Populate available resolutions from `license.product.availableResolutions` or by inspecting `product.assets` keys.

---

### [M6] `AuthContext` duplicates API URL construction — should import from `client.js`

**File:** `Frontend/src/contexts/AuthContext.jsx`

```js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
```

`src/api/client.js` already defines this. Export the base URL from client.js:
```js
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
```
And import it in AuthContext.

---

### [M7] `fetchCart` in CartContext is not memoized

**File:** `Frontend/src/contexts/CartContext.jsx`

`fetchCart` is a plain async function defined inside the component and included in the context value. Every re-render of CartProvider creates a new function reference, potentially causing all cart consumers to re-render unnecessarily.

```js
const fetchCart = useCallback(async () => {
  // ...
}, []);
```

---

### [M8] WishlistPage doesn't explain how to add to wishlist

**File:** `Frontend/src/pages/dashboard/WishlistPage.jsx`

Empty state body: *"Heart any wallpaper in the marketplace to save it here."* — but product cards don't have a heart button yet (see M1). Until M1 is fixed, this instruction is wrong. Either fix M1 first or update the empty state to say *"Open any product and click 'Save to Wishlist'."*

---

### [M9] No Stripe environment variable in `.env.example`

There is no `.env.example` file in the export. The non-standard `STRIPE_PUBLIC_KEY` (server-side) and `VITE_STRIPE_PUBLISHABLE_KEY` (if needed client-side) have no documentation. Any new developer setting up the project will miss these and get silent failures.

Create `Backend/.env.example` and `Frontend/.env.example` with all required variables explicitly listed.

---

### [M10] `isLoading` state in AuthContext is not exposed to app shell

**File:** `Frontend/src/App.jsx`

```jsx
function AppShell() {
  // No check for auth.isLoading here
  return (
    <>
      <Navbar />
      <AnimatedRoutes />
```

During the initial silent refresh, `isLoading` is `true` but the full app renders anyway. `ProtectedRoute` correctly shows `<PageLoader />` when `isLoading` is true. However, Navbar also renders — and since `user` starts from localStorage (which may be a stale user), the Navbar briefly shows the user as logged in even when the refresh might fail. Minor visual flicker, but worth noting.

---

## Low Priority — Code quality and cleanup

---

### [L1] Dead `react-scripts` references in `package.json` eslintConfig

**File:** `Frontend/package.json`

```json
"eslintConfig": {
  "extends": ["react-app", "react-app/jest"]
}
```

This project uses Vite (confirmed: `devDependencies` has `vite` and `@vitejs/plugin-react`, scripts use `vite`). `react-app` eslint config comes from `react-scripts` (CRA), which is not installed. This eslintConfig does nothing and would error if ESLint is run. Remove it or replace with `"extends": ["eslint:recommended", "plugin:react/recommended"]`.

---

### [L2] `BackgroundEffects` component is potentially expensive on low-end devices

**File:** `Frontend/src/components/BackgroundEffects.jsx`

The component includes a `mousemove` listener that updates state on every mouse movement. This runs on every page, even pages where the background effect isn't visible (full-screen modals, etc.). Should throttle with `requestAnimationFrame` or limit update frequency.

---

### [L3] `config/db.js` is dead code

**File:** `Backend/config/db.js` — still in the repo, nothing imports it. `Backend/db/database.js` is the one actually used in `server.js`. Delete `config/db.js`.

---

### [L4] Test/debug routes — now correctly guarded but could be removed entirely

**File:** `Backend/routes/index.js`

```js
if (process.env.NODE_ENV !== 'production') {
  router.use('/test', testRoutes);
  router.use('/debug', debugRoutes);
}
```

These are correctly gated. Low priority to delete them, but `testRoutes` only has one route (`GET /sentry-test`) that throws an error. Could be a one-liner in development setup instead of a separate file.

---

### [L5] `OrderCard` in OrdersPage shows `gap: -6` which is not valid CSS

**File:** `Frontend/src/pages/dashboard/OrdersPage.jsx`

```jsx
<div style={{ display: 'flex', gap: -6, flexShrink: 0 }}>
```

`gap` does not accept negative values — this does nothing. The intent is overlapping thumbnails (stacked avatar style). The correct approach is `marginLeft: -10` on subsequent children (which is already there), not a negative gap. Remove `gap: -6`.

---

### [L6] Pagination in MarketplacePage only shows pages 1–7 regardless of total

```js
{Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => ...)}
```

If there are 15 pages, only pages 1–7 are shown and there's no way to reach page 8+. Use a proper windowed pagination (show current ±2, first, last, with `...` ellipsis).

---

## Summary table

| # | Severity | File(s) | Description |
|---|---|---|---|
| C1 | 🔴 Critical | productRoutes.js | `/admin/pending` unreachable — route ordering bug |
| C2 | 🔴 Critical | AdminCreatorsPage.jsx | Wrong URL — calls `/creator/admin/creator-requests` instead of `/admin/creator-requests` |
| C3 | 🔴 Critical | ProductDetailPage.jsx | Review endpoints don't exist at `/products/:id/reviews` — should be `/reviews/:id` |
| C4 | 🔴 Critical | CreatorStatsPage.jsx, creatorController.js | Wrong URL + response shape mismatch — page always shows zeros |
| C5 | 🔴 Critical | CreatorUploadsPage.jsx, creatorRoutes.js | Delete route doesn't exist — permanent 404 |
| C6 | 🔴 Critical | creatorController.js | `createCreatorProduct` missing required Product fields — throws Mongoose validation error |
| C7 | 🔴 Critical | api/client.js | Refresh fail never dispatches `auth:unauthorized` — user stuck in broken auth state |
| C8 | 🔴 Critical | CartContext.jsx, LoginPage.jsx | Guest cart silently discarded on login — `syncCart` never called |
| C9 | 🔴 Critical | LibraryPage.jsx, productService.js | Default resolution `'original'` doesn't exist — every download returns 400 |
| C10 | 🔴 Critical | adminController.js | Admin stats aggregation uses `$items.quantity` but model uses `$items.qty` |
| H1 | 🟠 High | LibraryPage.jsx, ProductDetailPage.jsx | Download URL field name: frontend reads `url`, backend returns `downloadUrl` |
| H2 | 🟠 High | AdminCreatorsPage.jsx | No "Reject" button — creator applications can only be approved |
| H3 | 🟠 High | orderService.js | Abandoned checkout creates permanent orphaned pending orders |
| H4 | 🟠 High | orderService.js | No duplicate-ownership check — user can repurchase products they already own |
| H5 | 🟠 High | SignupPage.jsx | No "Resend verification email" button despite backend support |
| H6 | 🟠 High | App.jsx, creatorController.js | No creator apply page — non-creators silently redirected to `/` |
| H7 | 🟠 High | App.jsx | No error boundary — component crash white-screens entire app |
| H8 | 🟠 High | ProductDetailPage.jsx | Fetches entire library just to check if one product is owned |
| H9 | 🟠 High | orderController.js, .env | `STRIPE_PUBLIC_KEY` non-standard — should be `STRIPE_PUBLISHABLE_KEY` |
| M1 | 🟡 Medium | ProductCard.jsx | No wishlist heart button on product cards |
| M2 | 🟡 Medium | CartPage.jsx | `cartLoading` state never used — cart flashes empty on page load |
| M3 | 🟡 Medium | ProductDetailPage.jsx | `useTitle('')` — wrong usage of title hook |
| M4 | 🟡 Medium | MarketplacePage.jsx | Series filter truncates at 8, no "show more" |
| M5 | 🟡 Medium | LibraryPage.jsx | No resolution selector on downloads |
| M6 | 🟡 Medium | AuthContext.jsx | Duplicate API URL construction — should import from client.js |
| M7 | 🟡 Medium | CartContext.jsx | `fetchCart` not memoized with `useCallback` |
| M8 | 🟡 Medium | WishlistPage.jsx | Empty state instruction incorrect until M1 is fixed |
| M9 | 🟡 Medium | Both | No `.env.example` files — missing all env var documentation |
| M10 | 🟡 Medium | App.jsx | `isLoading` not used in AppShell — brief stale-user flicker in Navbar |
| L1 | ⚪ Low | package.json | Dead CRA eslintConfig in Vite project |
| L2 | ⚪ Low | BackgroundEffects.jsx | Unthrottled `mousemove` handler runs on every page |
| L3 | ⚪ Low | config/db.js | Dead file — nothing imports it |
| L4 | ⚪ Low | routes/index.js | testRoutes correctly guarded but could be removed entirely |
| L5 | ⚪ Low | OrdersPage.jsx | `gap: -6` — invalid CSS, does nothing |
| L6 | ⚪ Low | MarketplacePage.jsx | Pagination caps at page 7 regardless of total pages |
