# 🚀 Koda Marketplace - Developer's Guide
(secret)

Welcome to **Koda**, a premium marketplace for no-code automations (n8n, Make, Zapier, Python).
This platform empowers creators to sell their workflows and allows users to purchase and download them instantly, now with full international support.

---

## ✨ Key Features

- **🌐 Internationalization (i18n)**:
    - Fully translated in 4 languages: **English, French, Spanish, German**.
    - Auto-detection of user locale with persistent preferences.
    - SEO-friendly localized routing (`/en/catalog`, `/fr/catalog`).
- **🖥️ Premium Unified Dashboard**:
    - Single-page interactive experience with **Buyer** and **Seller** modes.
    - Real-time sales metrics, recent activity feeds, and order tracking.
    - Smooth transitions and glassmorphic UI.
- **⚡ Real-Time Interactions (Pusher)**:
    - Instant messaging between buyers and sellers.
    - Live purchase notifications.
    - Real-time sales alerts on the dashboard.
- **💳 Split Payments (Stripe Connect)**:
    - Sellers connect their own Stripe Express accounts.
    - Automated commission management: 85% goes to the seller, 15% to the platform.
    - Automatic email receipts for buyers and sale alerts for sellers via **Resend**.
- **🛡️ Nuclear Admin Tools**:
    - **Marketing Blasts**: Send bulk emails or system notifications to all users.
    - **User Sync**: Bi-directional synchronization with Clerk.
    - **Nuclear Deletion**: One-click purge of users across Clerk, Stripe, and Database.
- **☁️ Secure Hosting (AWS S3)**:
    - Automation JSON files are stored in private S3 buckets.
    - Signed, temporary download links generated only after verified payment.
- **🔐 User Management (Clerk)**:
    - Enterprise-grade authentication (Sign-up, Log-in, Profile).
    - Custom domain support (`clerk.kodas.works`).
- **👀 Monitoring**:
    - **Sentry**: Full-stack error tracking and performance monitoring.
    - **Vercel Analytics**: Privacy-first visitor tracking.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Database**: MongoDB via [Mongoose](https://mongoosejs.com/)
- **Auth**: [Clerk](https://clerk.com/)
- **Payments**: [Stripe Connect](https://stripe.com/connect)
- **Emails**: [Resend](https://resend.com/)
- **Real-time**: [Pusher](https://pusher.com/)
- **Storage**: [AWS S3](https://aws.amazon.com/s3/)
- **Caching**: [Upstash Redis](https://upstash.com/)
- **I18n**: [next-intl](https://next-intl-docs.vercel.app/)
- **Monitoring**: Sentry

---

## 📥 Getting Started

### 1. Prerequisites
- **Node.js** (v20+)
- **Stripe Account** (Test Mode allowed)
- **AWS Account** (S3)
- **MongoDB Atlas**
- **Clerk Account**
- **Pusher Account**
- **Resend Account**

### 2. Installation
```bash
# Clone the repository
git clone <repo_url>
cd koda

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory.

> **⚠️ IMPORTANT**: For production (Vercel), add these to your Project Settings -> Environment Variables.

```env
# --- CLERK AUTHENTICATION ---
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...  # Found in Clerk Dashboard -> Webhooks -> [Endpoint] -> Signing Secret

# Clerk Redirects
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# --- MONGODB ---
MONGODB_URI=mongodb+srv://...

# --- AWS S3 (Storage) ---
AWS_REGION=eu-west-3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=...

# --- STRIPE (Payments) ---
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# --- RESEND (Emails) ---
RESEND_API_KEY=re_...
FROM_EMAIL="Koda Market <noreply@kodas.works>" # Update after verifying domain

# --- PUSHER (Real-time) ---
PUSHER_APP_ID=...
NEXT_PUBLIC_PUSHER_APP_KEY=...
PUSHER_SECRET=...
NEXT_PUBLIC_PUSHER_CLUSTER=eu

# --- MONITORING (SENTRY) ---
SENTRY_AUTH_TOKEN=...

# --- REDIS/UPSTASH (Caching - Recommended) ---
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# --- APP CONFIG ---
NEXT_PUBLIC_APP_URL=http://localhost:3000 # Use https://kodas.works in production
```

### 4. Local Webhooks Setup
To test payments and user creation locally:

**Stripe Webhooks:**
```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Clerk Webhooks:**
Use `ngrok` or similar to expose port 3000.
```bash
ngrok http 3000
```
Add the `https://....ngrok-free.app/api/webhooks/clerk` URL to Clerk Dashboard.

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## 🚢 Production Deployment (Vercel)

### 1. Build Verification
Before deploying, ensure the app builds locally:
```bash
npm run build
```

### 2. Vercel Setup
1. Push code to GitHub.
2. Import project in Vercel.
3. **CRITICAL**: Add ALL environment variables from step 3 to Vercel.
4. Deploy.

### 3. Custom Domains & CSP
If you use a custom domain (e.g., `kodas.works` and `clerk.kodas.works`), you **MUST** update the Content Security Policy in `next.config.ts` to allow scripts from your new domain.

**Example `next.config.ts` update:**
```typescript
"script-src 'self' ... https://clerk.kodas.works https://*.kodas.works ...;"
```
*If you see "Content Security Policy" errors in the console, check this first.*

### 4. Webhook Production URLs
Update your webhook providers with the live URLs:
- **Clerk**: `https://kodas.works/api/webhooks/clerk`
- **Stripe**: `https://kodas.works/api/webhooks/stripe`

---

## 📁 Project Structure

```text
koda/
├── app/                  # Next.js App Router (Pages, API, Actions)
│   ├── [locale]/         # Internationalized routes (en, fr, etc.)
│   ├── api/              # Backend API routes
│   └── actions/          # Server Actions
├── components/           # Reusable UI Components
├── models/               # Mongoose Database Schemas
├── lib/                  # Utilities (S3, Stripe, Resend, Auth)
├── hooks/                # Custom React Hooks
├── messages/             # i18n JSON Translation files
└── public/               # Static assets
```

---

## 🚀 Troubleshooting

### Clerk Login Blocked / Infinite Loading?
- **CSP Error**: Check browser console. If "Content Security Policy" violation, you need to update `next.config.ts` to allow your Clerk custom domain.
- **Middleware**: Ensure `middleware.ts` is not overriding headers incorrectly.

### Emails Not Sending?
- **Domain Verification**: Resend requires domain verification (SPF/DKIM) to send to anyone other than yourself.
- **Logs**: Check server logs. If `RESEND_API_KEY` is missing, emails will fail silently or throw validation errors.

### Real-time events not firing?
- Check `NEXT_PUBLIC_PUSHER_CLUSTER`. It must match your Pusher dashboard exactly.
