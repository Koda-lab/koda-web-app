# 🔌 API & Server Actions Reference

This document catalogs all **Server Actions** and **API Routes** used in the Koda application. These serve as the primary communication channels between the frontend and our backend services.

---

## 📂 `app/actions/automation.ts`

Handles the creation and initial submission of automation products.

### `createAutomation(formData: CreateAutomationInput)`
Creates a new `Automation` record in MongoDB.

- **Authentication**: Required (`userId` via Clerk).
- **Prerequisites**: Seller must have a verified Stripe Connect account (`onboardingComplete: true`).
- **Input**:
  - `title`: Product name (min 3 chars).
  - `description`: Detailed text (min 20 chars).
  - `price`: Numeric value (€).
  - `category`: Business enum (`ProductCategory`).
  - `platform`: Technology enum (`AutomationPlatform`).
  - `fileUrl`: Permanent AWS S3 link for the artifact.
  - `previewImageUrl`: (Optional) Thumbnail S3 link.
- **Validation**: Enforced via `ProductSchema` (Zod).
- **Returns**: `{ success: true, id: string }` on success.
- **Side Effects**: Automatically revalidates the Home page cache.

---

## 📂 `app/actions/product-management.ts`

Manages existing products (Edit/Delete).

### `updateProduct(productId: string, data)`
Updates specific fields of an existing product.

- **Security**: Verifies that the current user is the original seller.
- **Input**: `productId` and an object containing updated `title`, `description`, `price`, or `previewImageUrl`.
- **Validation**: `UpdateAutomationSchema` (partial validation).
- **Returns**: `{ success: true }`.

### `deleteProduct(productId: string)`
Permanently removes a product from the database.

- **Security**: Ownership check required.
- **Returns**: `{ success: true }`.
- **Side Effects**: Invalidates the "Products" cache and revalidates the Dashboard.

---

## 📂 `app/actions/transaction.ts`

Orchestrates the purchase journey.

### `createCheckoutSession(items: IAutomation[])`
Generates a Stripe Checkout URL for a collection of products.

- **Logic**:
  1. Re-fetches products from the DB to prevent price tampering.
  2. Ensures all sellers are still "Ready" in Stripe.
  3. Calculates the 15% platform commission per item.
  4. Bundles items into a single payment intent.
- **Returns**: `{ url: string }` (Stripe redirect URL).

---

## 📂 `app/actions/dashboard.ts`

Aggregates statistics and records for the User Dashboard.

### `getSellerBalance()`
Fetches real-time financial data from the Stripe Connect Express API.
- **Returns**: `available`, `pending` amounts, and the `currency`.

### `getMyProducts()` / `getSalesHistory()` / `getMyOrders()`
Wrappers for Mongoose queries to fetch user-specific records with proper object population.

---

## 📂 `app/actions/admin.ts`

Administrative tools for platform management.

### `fullSyncWithClerk()`
Performs a bi-directional sync with Clerk's user list.
- **Security**: Restricted to admins.
- **Upsert Logic**: Updates/recreates local profiles from Clerk.
- **Purge Logic**: Deletes local user records whose Clerk IDs no longer exist in the system.
- **Returns**: `{ success: true, count: number, deleted: number }`.

### `deleteUser(clerkId: string)`
Technically known as the **Nuclear Deletion**.
- **Scope**: Purges the user from Clerk, Stripe Connect, and all associated MongoDB instances (Products, Sales, Purchases).
- **Security**: Admins cannot delete their own active account.
- **Returns**: `{ success: true }`.

---

## 📂 Specialized API Routes

### `app/api/webhooks/stripe/route.ts`
Handles asynchronous events from Stripe.
- **Events**:
  - `account.updated`: Synced to local `User.onboardingComplete`.
  - `checkout.session.completed`: Creates `Purchase` records and **triggers automated emails**.
- **Automation Flows**:
  - Calls `sendBuyerEmail` with a full receipt of all items in the transaction.
  - Calls `sendSellerEmail` for each seller involved, notifying them of their net earnings.
- **Security**: Verifies the `stripe-signature` header.

### `app/api/webhooks/clerk/route.ts`
Synchronizes user profiles from Clerk to MongoDB.
- **Security**: Uses `svix` for signature verification.

### `app/api/upload/route.ts` (and `image/route.ts`)
Generates AWS S3 **Presigned URLs**.
- **Usage**: Allows the client to upload large files directly to S3 without passing through the Next.js server, improving performance and reducing memory usage.

---

## 🛡️ Global Protective Measures

All actions and routes implement:
1. **Authentication Check**: Rejection of anonymous requests via `requireAuth` or `requireUser`.
2. **Input Sanitization**: Data is cleaned and validated against Zod schemas.
3. **Cache Management**: Systematic use of `revalidatePath` and `invalidateCache` to ensure the UI stays synchronized with database changes.
