# 🏗 Technical Architecture

This document provides a deep dive into the technical design and architectural choices made for the Koda project.

## 🛠 Core Technology Stack

- **Frontend / Fullstack Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
    - **React 19**: Leveraging the latest React features and optimizations.
    - **Server Components**: By default, pages and many components are rendered on the server to optimize performance and SEO.
    - **Client Components**: Used sparingly for interactive elements (forms, cart management) marked with `"use client"`.
    - **Server Actions**: Used as the primary mechanism for data mutations (POST/PUT/DELETE), providing a type-safe bridge between the frontend and backend.
- **Language**: [TypeScript](https://www.typescriptlang.org/)
    - Strict typing is enforced throughout the project to catch errors early.
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
    - Modern utility-first CSS for rapid development.
    - **Aesthetics**: Glassmorphism, subtle gradients, and custom animations ensure a premium feel.
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
    - Flexible NoSQL storage.
    - Mongoose ODM provides schema validation and advanced features like discriminators.
- **Authentication**: [Clerk](https://clerk.com/)
    - Managed authentication provider handling user registration, sessions, and security.
- **File Storage**: [AWS S3](https://aws.amazon.com/s3/)
    - Scalable object storage for product files and preview images.
- **Caching**: [Redis (via Upstash)](https://upstash.com/)
    - High-performance caching for product listings and expensive queries.

## 📂 Directory Layout

The project follows the standard Next.js App Router structure with localized features:

```text
koda/
├── app/                  # Next.js App Router (The "Heart")
│   ├── [locale]/         # Internationalized routes (next-intl)
│   ├── actions/          # Server Actions (Business Logic)
│   ├── api/              # API Endpoints & Webhooks
│   └── components/       # Feature-specific UI components
├── components/           # Reusable UI primitives (Shadcn)
├── models/               # Mongoose Schema Definitions (Data)
├── lib/                  # Service clients (S3, Stripe, DB)
├── hooks/                # Custom React hooks
├── types/                # Global TypeScript definitions
├── messages/             # i18n JSON translations
├── __tests__/            # Unit & Integration tests
└── e2e/                  # Playwright browser tests
```

## 🔄 Design Patterns

### Backend-for-Frontend (BFF) via Server Actions
Instead of exposing a traditional REST API, Koda uses Server Actions. This allows:
1. **Direct DB Access**: No need to create fetch routes; actions connect directly to MongoDB.
2. **Type Safety**: The frontend knows exactly what the action expects and returns.
3. **Security**: Validation (Zod) and Auth (Clerk) are checked at the server entry point.

### Model Discriminators (Extensibility)
The `Product` model acts as a base. We use **Mongoose discriminators** to create specialized types like `Automation`. This allows the marketplace to easily add new product types (e.g., "Plugins", "Datasets") in the future without major schema migrations.

### Cache-Aside Strategy
For product listings, we use a `getOrSetCache` utility. This utility:
1. Checks Redis for the data.
2. If missing, fetches from MongoDB.
3. Saves to Redis for future requests (TTL based).
4. Automatic invalidation occurs when products are created, updated, or deleted.

### Dashboard Mode Management
The Buyer and Seller experience is unified into a single Dashboard route.
- **Server-Side Fetching**: Data for both modes (purchases, sales, products) is fetched in parallel on the server to ensure high performance.
- **Client-Side State**: A `DashboardModeSwitcher` manages the active view using a persistent client-side state, allowing for zero-latency toggling without page reloads.

### Internationalization (i18n)
Koda uses `next-intl` for a seamless multi-language experience.
1. **Translation Files**: Located in `/messages/{locale}.json`.
2. **Context-Aware Hooks**: Components use `useTranslations` to fetch keys.
3. **Dynamic Localized Toasts**: The `useLocalizedToast` hook handles both static keys and **dynamic parameters** (e.g., "5 items synced"). This ensures that even complex notifications remain fully internationalized without leaking raw strings.

## 🔒 Security Architecture

- **Path Protection**: Next.js middleware checks for active sessions on sensitive routes.
- **Action Protection**: Every Server Action verifies the user's ID via Clerk's `auth()` helper.
- **Resource Protection**: Sellers can only mutate products where `sellerId === currentUserId`.
- **Download Protection**: Download links are not stored publicly. S3 URLs are "Pre-signed," meaning they expire after 5 minutes and are only generated for users who have a confirmed `Purchase` record.
