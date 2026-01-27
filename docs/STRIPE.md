# 💳 Stripe Connect & Payment Infrastructure

Koda leverages **Stripe Connect (Express)** to power its multi-vendor marketplace. This allows for automated seller onboarding, secure payment processing, and transparent commission handling.

---

## 🔄 Seller Onboarding Workflow

To list products on Koda, users must link their bank accounts via Stripe.

1. **Eligibility Check**: The application verifies the seller's `stripeConnectId` in MongoDB during product submission.
2. **Account Creation**: If the user is new to selling, a **Stripe Express Account** is generated automatically.
3. **KYC Redirection**: The user is redirected to a Stripe-hosted onboarding flow to provide personal and banking details.
4. **Platform Verification**: Upon return to `/stripe/return`, our server queries the Stripe API. If `details_submitted` is true, the user is marked as verified locally.

---

## 💸 Financial Logic: Split Payments

We implement **Direct Charges with Application Fees**. This ensures that sellers see their net earnings immediately, while the platform automatically retains its commission.

### Example Case: €100 Sale
- **Total Customer Payment**: €100.00
- **Platform Commission (15%)**: €15.00 (Revenue for Koda)
- **Seller Earnings**: €85.00
- **Stripe Fees**: Deducted from the platform's €15.00 share.

### Technical Implementation
When creating the checkout session, the funds initially land on the platform account. Upon a successful `checkout.session.completed` event, the webhook handles the split:

1. **Calculate**: Determine the 85% share (e.g., €100 sale = €85 seller share).
2. **Transfer**: Use the `stripe.transfers.create` API to move funds to the seller's **Connect Express** account.
3. **Record**: Log the purchase in MongoDB.

```typescript
// Inside Webhook (Simplified logic)
const transfer = await stripe.transfers.create({
    amount: Math.round(product.price * 100 * 0.85),
    currency: "eur",
    destination: seller.stripeConnectId,
    description: `Payout for ${product.title}`,
});
```

### 🔔 Post-Payment Notifications (Email Automation)
After a successful purchase, the Stripe Webhook triggers a series of automated emails via **Resend**:
1. **Buyer Receipt**: A complete HTML receipt listing all items, the total price, and a link to their new downloads.
2. **Seller Sale Alert**: Each seller involved in the transaction receives an individual alert specifying the product sold and their net payout.

---

## 🔔 Webhook Management

Koda listens for specific events from Stripe at `/api/webhooks/stripe`.

| Event | Logic |
| :--- | :--- |
| `checkout.session.completed` | Verifies the payment and creates a `Purchase` record in MongoDB. |
| `account.updated` | Updates the seller's `onboardingComplete` status if they update their Stripe profile. |

### Development Setup (Local)
1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli).
2. Run `stripe login`.
3. Start the proxy: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
4. Use the provided **Webhook Signing Secret** (`whsec_...`) in your `.env.local`.

### 🧪 Testing Webhooks (Simulation)

To simulate a successful payment (`checkout.session.completed`) with valid data from your local database:

1. **Start the Listener** (Terminal 1):
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
2. **Trigger the Event** (Terminal 2):
   ```bash
   npx tsx scripts/trigger-payment-webhook.ts
   ```
   *This script fetches a real user/product from your local DB and executes `stripe trigger` with the correct metadata, ensuring the server can process the purchase logic.*

---

## 🛡️ Security & Compliance

- **Express Dashboard**: Sellers have access to a simplified dashboard for payouts and tax identity, managed entirely by Stripe.
- **Nuclear Data Deletion**: Admins can permanently delete a seller's Stripe Connect account via the Admin Panel. This is handled using the `stripe.accounts.del()` API as part of the unified cleanup process.
- **Isolations**: Your platform doesn't store sensitive banking details (IBANs, SSNs); all sensitive data is handled within Stripe's PCI-compliant infrastructure.
