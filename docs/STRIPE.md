# 💳 Infrastructure de Paiement (Stripe)

Koda utilise **Stripe Connect (Express)** pour gérer une marketplace multi-vendeurs.
Ce document détaille les flux financiers, la configuration et les webhooks.

---

## 🔄 Flux d'Onboarding (Vendeurs)

Pour vendre sur Koda, un utilisateur doit connecter un compte Stripe.

1. **Vérification** : À chaque tentative d'accès à `/sell` ou publication d'un produit, on vérifie si le champ `stripeConnectId` est présent dans le profil `User` (MongoDB).
2. **Création du Compte** : Si absent, on appelle l'API Stripe pour créer un `account` de type `express`.
3. **Lien d'Onboarding** : On génère un `accountLink` pour rediriger l'utilisateur vers le formulaire hébergé par Stripe (KYC, RIB).
4. **Validation** : Une fois le formulaire rempli, Stripe renvoie l'utilisateur vers `/stripe/return`. La page vérifie directement le statut du compte Stripe et met à jour la base de données avant de rediriger vers `/sell`.

---

## 💸 Flux de Paiement (Split Payments)

Lorsqu'un acheteur paie un produit, l'argent est immédiatement séparé (**Direct Charges** avec `application_fee`).

### Répartition pour une vente de 100€
- **Prix Payé** : 100€
- **Frais de Plateforme (Koda)** : 15% (15€)
- **Vendeur (Stripe Connect)** : 85% (85€)
- **Frais Stripe** : Déduits de la part de la plateforme.

### Code (Server Action)
```typescript
const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [...],
    payment_intent_data: {
        application_fee_amount: 1500, // 15.00€ pour Koda
        transfer_data: {
            destination: "acct_...", // ID Connect du Vendeur
        },
    },
});
```

Cette méthode assure que :
1. Le vendeur voit son propre CA net dans son dashboard.
2. La plateforme ne touche que sa commission.
3. Stripe gère la conformité fiscale pour les transferts.

---

## 🔔 Webhooks

L'application écoute les événements Stripe via la route `/app/api/webhooks/stripe`.

### Événements écoutés

#### `checkout.session.completed`
Déclenché après un paiement réussi.
- **Action** :
  1. Récupère `productId` et `userId` dans les métadonnées de la session.
  2. Crée un enregistrement `Purchase` dans MongoDB.
  3. Débloque l'accès au téléchargement pour l'acheteur.

#### `account.updated`
Déclenché quand un vendeur met à jour ses infos.
- **Action** :
  1. Vérifie si `details_submitted` est passé à `true`.
  2. Met à jour le flag `onboardingComplete` de l'utilisateur dans MongoDB.

---

## ⚙️ Configuration des Webhooks

### Développement Local (Stripe CLI)

**1. Installez et connectez-vous au Stripe CLI**
```bash
stripe login
```

**2. Lancez le listener de webhooks**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**3. Copiez le signing secret** (commence par `whsec_...`)

**4. Ajoutez-le dans `.env.local`**
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**5. Lancez votre application**
```bash
npm run dev
```

**Important** : Laissez `stripe listen` tourner pendant vos tests. Vous verrez tous les webhooks en temps réel dans le terminal.

---

### Production

**1. Allez sur le [Dashboard Stripe](https://dashboard.stripe.com)**

**2. Accédez à Developers → Webhooks**

**3. Cliquez sur "Add endpoint"**

**4. Configurez l'endpoint**
- **Endpoint URL** : `https://votre-domaine.com/api/webhooks/stripe`
- **Events from** : Your account
- **API version** : 2025-12-15.clover (ou la plus récente)
- **Events to listen** : 
  - `account.updated`
  - `checkout.session.completed`

**5. Récupérez le signing secret**

Après création, copiez le signing secret et ajoutez-le à vos variables d'environnement de production (Vercel, Netlify, etc.) :
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

---

## 🛡 Sécurité

- **Stripe Express** : Les vendeurs n'ont pas accès aux données de la plateforme, uniquement à leur dashboard isolé.
- **Liens de Connexion** : Les liens "Voir mon Dashboard" sont générés dynamiquement (Tokens temporaires) et ne sont jamais stockés.
- **Validation des Webhooks** : Tous les webhooks sont vérifiés avec le signing secret pour garantir qu'ils proviennent bien de Stripe.
