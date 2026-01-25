# 🗄 Database Architecture

Koda uses **MongoDB** as its primary data store, interfaced through the **Mongoose** Object Data Modeling (ODM) library.

## Connection Management

Database connections are handled in [`lib/db.ts`](../lib/db.ts). We implement a connection caching pattern to reuse existing connections across Serverless function invocations and prevent "Too many connections" errors during development hot-reloads.

## Data Models

### Product (Base Model)

The `Product` model is the foundation of the marketplace. It uses the Mongoose **discriminator** pattern to support different product types (e.g., `Automation`) while sharing a common core.

**File**: [`models/Product.ts`](../models/Product.ts)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `title` | `String` | ✅ Yes | The name of the product. |
| `description` | `String` | ✅ Yes | Detailed product explanation. |
| `price` | `Number` | ✅ Yes | Sale price in Euros. |
| `category` | `ProductCategory` | ✅ Yes | One of: `Social Media`, `Email Marketing`, `Productivity`, `Sales`, `Other`. |
| `tags` | `String[]` | ❌ No | Keywords for search optimization. |
| `previewImageUrl`| `String` | ❌ No | S3 URL for the thumbnail image. |
| `sellerId` | `String` | ✅ Yes | Clerk User ID of the owner. |
| `productType` | `String` | - | Automated discriminator key (e.g., `Automation`). |
| `averageRating`| `Number` | - | Calculated rating (default: 0). |
| `reviewCount` | `Number` | - | Total reviews received (default: 0). |

---

### Automation (Discriminator)

Specialized model for automations (n8n, Make, Zapier, Python, etc.). It extends the base `Product` with file-specific fields.

**File**: [`models/Automation.ts`](../models/Automation.ts)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `platform` | `AutomationPlatform`| ✅ Yes | One of: `n8n`, `Make`, `Zapier`, `Python`, `Other`. |
| `fileUrl` | `String` | ✅ Yes | S3 URL of the JSON/Workflow file. |
| `version` | `String` | ❌ No | SemVer versioning (e.g., `1.2.0`). |

---

### User

Stores local metadata associated with the Clerk authentication profile.

**File**: [`models/User.ts`](../models/User.ts)

| Field | Type | Description |
| :--- | :--- | :--- |
| `clerkId` | `String` | Primary key linking to Clerk Auth. |
| `firstName` | `String` | User's first name (Synced via Webhook). |
| `lastName` | `String` | User's last name (Synced via Webhook). |
| `email` | `String` | User's email (Unique index). |
| `imageUrl` | `String` | Profile picture URL. |
| `role` | `String` | `user` or `admin`. |
| `isBanned` | `Boolean` | Flag for account suspension. |
| `stripeConnectId`| `String` | ID for the seller's Stripe Express account. |
| `onboardingComplete`| `Boolean`| True if Stripe onboarding is finished. |
| `cart` | `ObjectId[]` | References to `Product` IDs for the shopping cart. |

---

### Purchase

Records every successful transaction on the platform.

**File**: [`models/Purchase.ts`](../models/Purchase.ts)

| Field | Type | Description |
| :--- | :--- | :--- |
| `productId` | `ObjectId` | Reference to the `Product`. |
| `buyerId` | `String` | Clerk ID of the purchaser. |
| `sellerId` | `String` | Clerk ID of the seller. |
| `amount` | `Number` | Total amount paid (Gross). |
| `stripeSessionId`| `String` | Link to the Stripe Checkout session. |

---

## Data Integrity & Cleanup
### Full Database Sync
Administrators can trigger a bi-directional synchronization between the local database and Clerk.
- **Auto-Update**: Existing local users are refreshed with the latest Clerk metadata (Names, Emails, Avatars).
- **Auto-Restore**: Users present in Clerk but missing from MongoDB are automatically recreated.
- **Auto-Prune**: Crucially, local records for users that no longer exist in Clerk are identified and deleted to prevent stale or orphaned data.

### Nuclear Deletion Cascade
To ensure absolute data privacy and integrity, the `deleteUser` action implements a comprehensive cleanup cascade across all MongoDB collections:
1. **Products**: All listings owned by the user are permanently deleted.
2. **Purchases**: All transaction records (where the user was either buyer or seller) are removed.
3. **Automations**: All associated automation child-documents are purged.
4. **User**: The primary profile is deleted last.

### Query Optimization
- **Lean Queries**: We frequently use `.lean()` in our queries to return plain JavaScript objects instead of Mongoose Documents, significantly reducing memory overhead and improving speed.
- **Projections**: Expensive fields like `cart` or `fileUrl` are excluded from high-traffic queries (like user lists) unless explicitly required.

---

## Technical Considerations

### Indexing Strategies
- **Unique Indexes**: `clerkId` and `email` are uniquely indexed in the `User` model to prevent duplicates.
- **Sparse Indexes**: Used for `email` to allow users without emails (if applicable) while maintaining uniqueness for those who have them.
### Extensibility
Thanks to the discriminator pattern, adding a "Plugin" or "Template" product type only requires creating a new model that extends `Product` with its specific fields. No database migration is needed for existing records.
