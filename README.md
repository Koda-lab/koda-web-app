# 🚀 Koda Marketplace - Guide de Développeur

Bienvenue sur **Koda**, la marketplace d'automations no-code (n8n, Make, Zapier, Python).
Ce projet permet aux créateurs de vendre leurs workflows et aux utilisateurs de les acheter instantanément.

---

## ✨ Fonctionnalités Principales

- **🏪 Marketplace Digitale** : Catalogue de produits avec système de panier et filtrage par catégorie
- **💳 Paiements Scindés (Stripe Connect)** :
    - Les vendeurs connectent leur compte Stripe Express
    - Lors d'une vente, 85% va au vendeur, 15% à la plateforme (Commission)
    - Paiements sécurisés et virements automatiques
    - Vérification automatique de l'onboarding Stripe
- **☁️ Hébergement Sécurisé (AWS S3)** :
    - Les fichiers JSON d'automatisation sont stockés sur S3
    - Liens de téléchargement sécurisés et temporaires générés uniquement après achat
- **🔐 Authentification (Clerk)** : Gestion complète des utilisateurs (Inscription, Connexion, Profil)
- **🛡 Protection des produits** :
    - Les acheteurs ne peuvent télécharger que s'ils ont payé
    - Les vendeurs ne peuvent pas acheter leurs propres produits
    - Les vendeurs ne peuvent modifier/supprimer que leurs propres produits
- **📦 Système de Types** :
    - Architecture extensible avec discriminators Mongoose
    - Support de multiples types de produits (Automations, et plus à venir)
    - Types TypeScript complets pour la sécurité du code

---

## 🛠 Prérequis Technique

- **Node.js** (v20+)
- **npm** ou **yarn**
- **Compte Stripe** (Mode Test)
- **Compte AWS** (S3)
- **Compte MongoDB Atlas**
- **Compte Clerk**

---

## 📥 Installation

1. **Cloner le projet**
   ```bash
   git clone <repo_url>
   cd koda
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configuration de l'environnement**
   Créez un fichier `.env.local` à la racine et remplissez-le avec vos clés API :

   ```env
   # CLERK AUTH
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   CLERK_WEBHOOK_SECRET=whsec_...

   # MONGODB
   MONGODB_URI=mongodb+srv://...

   # AWS S3
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=eu-west-3
   AWS_BUCKET_NAME=...

   # STRIPE
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   
   # APP URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Configuration des Webhooks Stripe (Local)**
   
   Pour tester les webhooks en local :
   ```bash
   # Dans un terminal séparé
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   
   Copiez le signing secret affiché et ajoutez-le à `STRIPE_WEBHOOK_SECRET` dans `.env.local`

5. **Lancer le serveur**
   ```bash
   npm run dev
   ```
   Accédez à [http://localhost:3000](http://localhost:3000).

---

## 📚 Documentation Détaillée

Pour comprendre l'architecture en profondeur, consultez le **Guide Développeur** complet :

- [🏗 Architecture Technique](docs/ARCHITECTURE.md)
- [🗄 Base de Données & Modèles](docs/DATABASE.md)
- [🔄 Flux de Données](docs/DATA_FLOW.md)
- [🔌 Référence API (Server Actions)](docs/API.md)
- [💳 Infrastructure Paiements (Stripe)](docs/STRIPE.md)

---

## 🚨 Dépannage (Troubleshooting)

### 🍃 Problème de connexion MongoDB
Si vous rencontrez des erreurs de connexion à MongoDB (timeout, network error), cela est souvent lié à la configuration DNS de votre réseau ou fournisseur d'accès.

**Solution : Changer le serveur DNS pour celui de Google (8.8.8.8).**

**Sur macOS :**
1. Ouvrez **Réglages Système** > **Réseau**.
2. Cliquez sur votre réseau actif (Wi-Fi ou Ethernet) > **Détails**.
3. Allez dans l'onglet **DNS**.
4. Cliquez sur le **+** et ajoutez `8.8.8.8` et `8.8.4.4`.
5. Validez et redémarrez votre terminal.

**Sur Windows :**
1. Panneau de configuration > Réseau et Internet > Centre Réseau et partage.
2. Modifier les paramètres de la carte > Clic droit sur votre connexion > Propriétés.
3. Sélectionnez **Protocole Internet version 4 (TCP/IPv4)** > Propriétés.
4. Cochez "Utiliser l'adresse de serveur DNS suivante" et mettez `8.8.8.8`.

### ⚡ Webhooks Stripe
- **En local** : Utilisez le Stripe CLI avec `stripe listen`
- **En production** : Configurez les webhooks dans le Dashboard Stripe
- Assurez-vous que `STRIPE_WEBHOOK_SECRET` est correctement configuré

---

## 📁 Structure du Projet

- `/app` : Pages et Routes API (Next.js App Router)
  - `/actions` : Server Actions (Logique métier : Stripe, Upload, DB)
  - `/api` : Routes API (Webhooks, Upload)
  - `/components` : Composants React UI spécifiques aux pages
- `/models` : Schémas de base de données Mongoose (Product, Automation, User, Purchase)
- `/types` : Définitions TypeScript (IProduct, IAutomation, etc.)
- `/lib` : Utilitaires (Connexion DB, Client S3, Helpers)
- `/components` : Composants React réutilisables (UI)

---

## 🧪 Commandes Utiles

- `npm run dev` : Lance le serveur de dev
- `npm run build` : Build pour la production
- `npm run start` : Lance le serveur de production
- `npx shadcn@latest add <component>` : Ajoute un composant UI
- `stripe listen --forward-to localhost:3000/api/webhooks/stripe` : Écoute les webhooks Stripe

---

## 🚀 Déploiement en Production

1. Déployez sur Vercel/Netlify ou votre plateforme préférée
2. Configurez toutes les variables d'environnement
3. Configurez les webhooks Stripe dans le Dashboard :
   - URL : `https://votre-domaine.com/api/webhooks/stripe`
   - Événements : `account.updated`, `checkout.session.completed`
4. Configurez les webhooks Clerk dans le Dashboard :
   - URL : `https://votre-domaine.com/api/webhooks/clerk`
   - Événements : `user.created`, `user.updated`
