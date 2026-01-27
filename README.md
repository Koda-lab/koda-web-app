# 🚀 Koda Marketplace - Developer's Guide
(secret)

Welcome to **Koda**, a premium marketplace for no-code automations (n8n, Make, Zapier, Python).
This platform empowers creators to sell their workflows and allows users to purchase and download them instantly.

---

## ✨ Key Features

- **🖥️ Premium Unified Dashboard**:
    - Single-page interactive experience with **Buyer** and **Seller** modes.
    - Real-time sales metrics, recent activity feeds, and order tracking.
    - Smooth transitions and glassmorphic UI for a pro experience.
- **💳 Split Payments (Stripe Connect)**:
    - Sellers connect their own Stripe Express accounts.
    - Automated commission management: 85% goes to the seller, 15% to the platform.
    - **New**: Automatic email receipts for buyers and sale alerts for sellers via **Resend**.
- **🛡️ Nuclear Admin Tools**:
    - **Full Sync**: Bi-directional synchronization with Clerk (creates missing local users, removes orphaned ones).
    - **Nuclear Deletion**: One-click purge of a user across Clerk, Stripe Connect, and all associated MongoDB data (Products, Sales, Purchases).
- **☁️ Secure Hosting (AWS S3)**:
    - Automation JSON files are stored in private S3 buckets.
    - Temporary, secure download links are generated only after a verified purchase.
- **🔐 User management (Clerk)**: Full authentication suite (Sign-up, Log-in, Profile management).
- **Product Protection**:
    - Gated downloads: only accessible to verified buyers.
    - Anti-collision rules: sellers cannot buy their own products.
- **📦 Extensible Architecture**:
    - Built with Mongoose discriminators to support multiple product types beyond just automations.
    - Comprehensive TypeScript types for type safety across the stack.
- **👀 Monitoring & Testing**:
    - **Sentry**: Real-time error tracking and performance monitoring.
    - **Vitest**: Robust unit and integration testing suite.
    - **Playwright**: End-to-end UI testing.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Runtime**: Node.js v20+
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Database**: MongoDB via [Mongoose](https://mongoosejs.com/)
- **Auth**: [Clerk](https://clerk.com/)
- **Payments**: [Stripe Connect](https://stripe.com/connect)
- **Storage**: [AWS S3](https://aws.amazon.com/s3/)
- **Testing**: Vitest & Playwright

---

## 📥 Getting Started

### 1. Prerequisites
Ensure you have the following accounts and tools:
- **Node.js** (v20+)
- **npm** or **yarn**
- **Stripe Account** (Test Mode)
- **AWS Account** (S3 capability)
- **MongoDB Atlas**
- **Clerk Account**

### 2. Installation
```bash
# Clone the repository
git clone <repo_url>
cd koda

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory and fill it with your API keys:

```env
# --- CLERK AUTHENTICATION ---
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Clerk Redirects
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# --- MONGODB ---
MONGODB_URI=mongodb+srv://...

# --- AWS S3 ---
AWS_REGION=eu-west-3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=...

# --- STRIPE ---
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# --- EMAIL (RESEND) ---
RESEND_API_KEY=re_...

# --- MONITORING (SENTRY) ---
SENTRY_AUTH_TOKEN=sntrys_...

# --- REDIS/UPSTASH (Optional for Caching) ---
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# --- APP CONFIG ---
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Local Webhooks Setup (Critical)
To test payments and user creation locally, you must proxy webhooks:

**Stripe Webhooks:**
```bash
# In a separate terminal
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
Copy the `whsec_...` secret to your `.env.local` file.

**Clerk Webhooks:**
Use a tool like `ngrok` or `localtunnel` to expose your local port 3000 and configure the webhook URL in the Clerk dashboard.

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see your app.

---

## 📚 Detailed Documentation

Dive deeper into our technical guides:

- [🏗 Technical Architecture](docs/ARCHITECTURE.md) - Design patterns and stack details.
- [🗄 Database & Models](docs/DATABASE.md) - Mongoose schemas and data structure.
- [🔄 Data Flow](docs/DATA_FLOW.md) - How data moves through the app.
- [🔌 API Reference](docs/API.md) - Detailed Server Actions documentation.
- [💳 Payments Guide](docs/STRIPE.md) - Stripe Connect and financial logic.
- [🧪 Testing Guide](docs/TESTING.md) - Unit, Integration, and E2E testing strategy.

---

## 📁 Project Structure

```text
koda/
├── app/                  # Pages, API & Server Actions
├── components/           # Reusable UI & Layout
├── models/               # Database Schemas
├── lib/                  # Shared Utilities (S3, Stripe)
├── hooks/                # Custom Client Hooks
├── types/                # TypeScript Interfaces
├── messages/             # i18n Translations
├── __tests__/            # Unit & Integration Tests
└── e2e/                  # Browser Tests
```

---

## 🧪 Testing Commands

- `npm run test`: Run the full Vitest suite (Unit + Integration)
- `npx playwright test`: Run the E2E browser tests
- `npm run lint`: Check for code style issues

---

## 🚀 Troubleshooting

### MongoDB Connection Issues
If you face "MongooseServerSelectionError" or timeouts locally, it's often a DNS resolution issue from your ISP.
**Solution**: Use Google Public DNS (`8.8.8.8`).

### Webhook Failures
- Ensure the `stripe listen` command is running.
- Verify that the `STRIPE_WEBHOOK_SECRET` matches the one generated by the CLI.
- Check the Clerk dashboard to ensure the user creation webhook is firing.

---

## 🚢 Production Deployment

1. Deploy the code to **Vercel** or your preferred provider.
2. Configure all environment variables in the production dashboard.
3. Update Stripe Webhook URL in Dashboard: `https://your-domain.com/api/webhooks/stripe`.
4. Update Clerk Webhook URL: `https://your-domain.com/api/webhooks/clerk`.
