# 🔌 Documentation API (Server Actions)

Ce document référence l'ensemble des **Server Actions** disponibles dans l'application Koda.
Elles sont situées dans le dossier `/app/actions` et sont les seuls points d'entrée pour les mutations de données et les interactions avec les services tiers (Stripe, S3, MongoDB).

---

## 📂 `app/actions/automation.ts`

Gère la création des produits (automatisations).

### `createAutomation(formData: CreateAutomationInput)`
Crée un nouveau produit dans la base de données.

- **Authentification** : Requise (`userId` Clerk).
- **Prérequis** : L'utilisateur doit avoir un compte Stripe Connect configuré et validé (`onboardingComplete: true`).
- **Entrée** (`CreateAutomationInput`) :
  - `title`: string
  - `description`: string
  - `price`: number
  - `category`: ProductCategory (enum)
  - `platform`: AutomationPlatform (`'n8n' | 'Make' | 'Zapier' | 'Python' | 'Other'`)
  - `tags`: string[] (optionnel)
  - `version`: string (optionnel)
  - `fileUrl`: string (URL S3)
  - `previewImageUrl`: string (optionnel)
- **Validation** : Utilise `AutomationSchema` (Zod)
- **Sortie** : `{ success: true, id: string }`
- **Side Effects** : Revalide la route `/`

---

## 📂 `app/actions/product-management.ts`

Gère la modification et la suppression des produits existants.

### `updateProduct(productId: string, data)`
Met à jour les informations d'un produit.

- **Authentification** : Requise + Vérification que l'utilisateur est bien le vendeur (`sellerId`).
- **Entrée** :
  - `productId`: string
  - `data`:
    - `title`: string
    - `description`: string
    - `price`: number
    - `previewImageUrl`: string (optionnel)
- **Validation** : Utilise `UpdateAutomationSchema` (Zod)
- **Sortie** : `{ success: true }`
- **Side Effects** : Revalide `/dashboard`

### `deleteProduct(productId: string)`
Supprime définitivement un produit.

- **Authentification** : Requise + Vérification `sellerId`.
- **Entrée** : `productId` (string)
- **Sortie** : `{ success: true }`
- **Side Effects** : Revalide `/dashboard`

---

## 📂 `app/actions/transaction.ts`

Gère le processus d'achat côté acheteur.

### `createCheckoutSession(items: IAutomation[])`
Initialise une session de paiement Stripe Checkout pour un panier de produits.

- **Authentification** : Requise (Acheteur).
- **Logique** :
  1. Récupère les produits depuis la BD (ne fait pas confiance au frontend pour les prix)
  2. Vérifie que tous les vendeurs ont configuré Stripe Connect
  3. Calcule les frais de plateforme (15%)
  4. Crée une session Stripe en mode `payment` avec line items
- **Entrée** : `items` (Array<IAutomation>)
- **Sortie** : `{ url: string }` - URL de redirection vers Stripe
- **Redirection** :
  - Succès : `/success?session_id={CHECKOUT_SESSION_ID}`
  - Annulation : `/`

### `createSingleProductCheckout(productId: string)`
Helper pour acheter un seul produit (depuis la page produit).

- **Authentification** : Requise
- **Logique** : Récupère le produit, le convertit en format IAutomation, et appelle `createCheckoutSession([item])`
- **Entrée** : `productId` (string)
- **Sortie** : `url` (string)

---

## 📂 `app/actions/stripe-connect.ts`

Gère l'onboarding et l'accès au dashboard des vendeurs.

### `getStripeOnboardingLink()`
Génère un lien pour créer ou finaliser la configuration d'un compte Stripe Connect Express.

- **Authentification** : Requise
- **Logique** :
  - Si l'utilisateur n'a pas de `stripeConnectId`, un compte Express est créé
  - Génère un `accountLink` Stripe de type `account_onboarding`
  - Return et refresh URLs pointent vers `/stripe/return` pour vérification
- **Sortie** : `url` (string)

### `getStripeLoginLink()`
Génère un lien de connexion unique pour accéder au dashboard Stripe Express du vendeur.

- **Authentification** : Requise
- **Prérequis** : L'utilisateur doit avoir un `stripeConnectId` valide
- **Sortie** : `url` (string)

---

## 📂 `app/actions/dashboard.ts`

Agrège les données pour l'affichage du Dashboard utilisateur.

### `getMyProducts()`
Récupère la liste des produits mis en vente par l'utilisateur connecté.
- **Authentification** : Requise
- **Sortie** : `Array<Automation>`

### `getSalesHistory()`
Récupère l'historique des ventes (items vendus par l'utilisateur).
- **Authentification** : Requise
- **Sortie** : `Array<Purchase>` (avec `productId` peuplé via populate)

### `getMyOrders()`
Récupère l'historique des achats (items achetés par l'utilisateur).
- **Authentification** : Requise
- **Sortie** : `Array<Purchase>` (avec `productId` peuplé via populate)

### `getSellerBalance()`
Récupère la balance financière directement depuis l'API Stripe.
- **Authentification** : Requise
- **Prérequis** : Compte Stripe Connect configuré
- **Sortie** :
  - `available`: number (Montant disponible pour virement)
  - `pending`: number (Montant en cours de traitement)
  - `currency`: string (ex: "EUR")

---

## 📂 Routes API

### `app/api/webhooks/stripe/route.ts`

Endpoint webhook pour recevoir les événements Stripe.

**Événements gérés** :
- **`account.updated`** : Met à jour `onboardingComplete` quand un vendeur configure son compte
- **`checkout.session.completed`** : Crée un enregistrement `Purchase` après un paiement réussi

**Sécurité** : Vérification de la signature webhook avec `STRIPE_WEBHOOK_SECRET`

### `app/api/webhooks/clerk/route.ts`

Endpoint webhook pour synchroniser les données utilisateur depuis Clerk.

**Événements gérés** :
- **`user.created`** : Crée un utilisateur dans MongoDB
- **`user.updated`** : Met à jour les données utilisateur (firstName, lastName, email, imageUrl)

**Sécurité** : Vérification de la signature webhook avec la bibliothèque `svix`

### `app/api/upload/route.ts`

Génère des URLs présignées pour l'upload vers S3.

- **Authentification** : Requise
- **Entrée** : `{ fileName, fileType }`
- **Sortie** : `{ url, key }` (URL présignée + clé S3)

### `app/api/image/route.ts`

Génère des URLs présignées pour l'upload d'images vers S3.

- **Authentification** : Requise
- **Entrée** : `{ fileName, fileType }`
- **Validation** : Vérifie que le type de fichier est une image
- **Sortie** : `{ url, key }`

---

## 🔒 Sécurité

Toutes les Server Actions :
- Vérifient l'authentification via `auth()` de Clerk
- Valident les données d'entrée (Zod schemas)
- Vérifient les permissions (ex: seul le vendeur peut modifier son produit)
- Utilisent `revalidatePath()` pour synchroniser le cache Next.js
