# 🔄 Flux de Données (Data Flow)

Ce document détaille les principaux flux de données de l'application Koda.

## 1. Création d'une Automatisation (Vendeur)

C'est le flux le plus critique de l'application, permettant aux vendeurs de mettre en ligne leurs produits.

### 1.1 Upload du Fichier (Client → AWS S3)
- L'utilisateur sélectionne un fichier JSON (ex: export n8n) et une image de prévisualisation
- Le client demande des URLs présignées (Presigned URLs) au serveur via une Server Action
- Le serveur valide la requête (authentification Clerk) et génère les URLs via `@aws-sdk/s3-request-presigner`
- Le client upload directement les fichiers sur S3 via ces URLs

### 1.2 Enregistrement des Métadonnées (Client → Server Action → MongoDB)
- Une fois l'upload réussi, le client envoie les détails via la Server Action `createAutomation`
- Données envoyées :
  - `title`, `description`, `price`
  - `category` (ProductCategory)
  - `platform` (AutomationPlatform)
  - `tags`, `version`
  - URLs S3 : `fileUrl`, `previewImageUrl`

- La Server Action :
  - Vérifie l'authentification avec `auth()` de Clerk
  - Vérifie que l'utilisateur a configuré Stripe Connect (`onboardingComplete`)
  - Valide les données avec Zod (`AutomationSchema`)
  - Crée un document `Automation` dans MongoDB via Mongoose
  - Revalide la page (`revalidatePath`)

---

## 2. Configuration Stripe Connect (Vendeur)

### 2.1 Création du compte Stripe
1. L'utilisateur accède à `/sell` sans compte Stripe configuré
2. Redirection vers la page de configuration
3. Clic sur "Configurer mes paiements" → `getStripeOnboardingLink()` 
4. Création d'un compte Stripe Express si nécessaire
5. Génération d'un lien d'onboarding et redirection vers Stripe

### 2.2 Retour après onboarding
1. Stripe redirige vers `/stripe/return`
2. La page vérifie le statut du compte via l'API Stripe
3. Si `details_submitted` et `charges_enabled` sont `true` :
   - Met à jour `onboardingComplete: true` dans MongoDB
   - Redirige vers `/sell`
4. Sinon : Redirige vers `/dashboard` avec message d'erreur

### 2.3 Webhooks (Fallback)
- `account.updated` : Met à jour `onboardingComplete` si le webhook arrive avant que l'utilisateur retourne

---

## 3. Achat d'un Produit (Acheteur)

### 3.1 Sélection et Paiement
1. L'acheteur consulte un produit sur `/product/[id]`
2. Vérifications :
   - Si déjà acheté → Affiche bouton de téléchargement
   - Si c'est son propre produit → Affiche badge "Votre produit"
   - Sinon → Affiche bouton "Acheter maintenant"
3. Clic sur "Acheter" → `createSingleProductCheckout(productId)`
4. La Server Action :
   - Récupère le produit depuis MongoDB
   - Vérifie que le vendeur a Stripe configuré
   - Crée une session Stripe Checkout avec `application_fee` (15%)
   - Redirige vers la page de paiement Stripe

### 3.2 Confirmation de Paiement
1. Stripe envoie le webhook `checkout.session.completed`
2. Le webhook handler (`/api/webhooks/stripe`) :
   - Vérifie la signature du webhook
   - Crée un enregistrement `Purchase` dans MongoDB
   - L'achat est maintenant visible dans le dashboard de l'acheteur

### 3.3 Téléchargement
1. L'acheteur retourne sur `/product/[id]`
2. Le système détecte qu'il a acheté le produit
3. Génération d'une URL S3 présignée sécurisée pour le téléchargement
4. Affichage du bouton "Télécharger maintenant"

---

## 4. Authentification (Clerk)

L'authentification est gérée entièrement par **Clerk**.

- **Middleware** : Le fichier `middleware.ts` protège les routes sensibles
- **Client** : Les composants `<SignIn />`, `<SignUp />`, `<UserButton />` gèrent l'UI
- **Serveur** : `auth()` permet de récupérer l'ID de l'utilisateur connecté dans les Server Components et Server Actions
- **Sync** : Les webhooks Clerk (`user.created`, `user.updated`) synchronisent les données utilisateur dans MongoDB

---

## 5. Consultation des Produits (Page d'accueil)

1. **Chargement de la Page (Server Component)** :
   - Le composant de page (`app/page.tsx`) appelle directement la base de données
   - `Automation.find()` récupère les produits
   - Les images sont transformées en URLs publiques via `getPublicImageUrl()`
   - Grâce au SSR (Server-Side Rendering) de Next.js, le contenu est pré-rendu pour le SEO

2. **Interaction Client** :
   - Les utilisateurs peuvent ajouter des produits au panier (state client)
   - Clic sur un produit → Navigation vers `/product/[id]`

---

## 6. Dashboard Vendeur

1. L'utilisateur accède à `/dashboard`
2. Récupération parallèle des données :
   - Solde Stripe via `getSellerBalance()`
   - Historique des ventes via `getSalesHistory()`
   - Produits mis en vente via `getMyProducts()`
   - Achats effectués via `getMyOrders()`

3. Affichage des différents onglets :
   - **Compte** : Infos personnelles (sync depuis MongoDB)
   - **Mes Commandes** : Produits achetés
   - **Ventes** : Statistiques et historique
   - **Produits** : Gestion des automatisations publiées

---

## Diagramme Simplifié

```
[Client] 
   ↓
[Server Actions] ← Auth (Clerk)
   ↓
[MongoDB] ← Mongoose Models
   ↓
[S3] ← File Storage
   ↓
[Stripe] ← Payments & Connect
```
