# 🗄 Architecture de la Base de Données

Koda utilise **MongoDB** comme base de données principale, interfacée via l'ODM **Mongoose**.

## Connexion

La connexion à la base de données est gérée dans [`lib/db.ts`](../lib/db.ts). Elle utilise un pattern de cache pour éviter de multiplier les connexions lors des rechargements à chaud en développement (Hot Reload).

## Modèles de Données

### Product (Base Model avec Discriminators)

Le modèle `Product` utilise le pattern **discriminator** de Mongoose pour supporter différents types de produits (actuellement `Automation`, extensible pour Templates, Plugins, etc.).

**Fichier** : [`models/Product.ts`](../models/Product.ts)

| Champ | Type | Requis | Description |
| :--- | :--- | :--- | :--- |
| `title` | `String` | ✅ Oui | Titre du produit. |
| `description` | `String` | ✅ Oui | Description détaillée. |
| `price` | `Number` | ✅ Oui | Prix de vente en euros. |
| `category` | `ProductCategory` | ✅ Oui | Catégorie business : `Social Media`, `Email Marketing`, `Productivity`, `Sales`, `Other`. |
| `tags` | `String[]` | ❌ Non | Tags pour faciliter la recherche. |
| `previewImageUrl`| `String` | ❌ Non | URL de l'image de prévisualisation (S3). |
| `sellerId` | `String` | ✅ Oui | Identifiant utilisateur Clerk du vendeur. |
| `productType` | `String` | - | Discriminator key (défini automatiquement : `Automation`, etc.). |
| `createdAt` | `Date` | - | Date de création (timestamp automatique). |
| `updatedAt` | `Date` | - | Date de modification (timestamp automatique). |

---

### Automation (extends Product)

Modèle pour les automatisations (n8n, Make, Zapier, Python, etc.).

**Fichier** : [`models/Automation.ts`](../models/Automation.ts)

**Champs supplémentaires** :

| Champ | Type | Requis | Description |
| :--- | :--- | :--- | :--- |
| `platform` | `AutomationPlatform` | ✅ Oui | Plateforme : `n8n`, `Make`, `Zapier`, `Python`, `Other`. |
| `fileUrl` | `String` | ✅ Oui | URL du fichier JSON hébergé sur AWS S3. |
| `version` | `String` | ❌ Non | Version de l'automatisation (ex: `v1.0.0`). |

---

### User

Modèle pour les utilisateurs de la plateforme.

**Fichier** : [`models/User.ts`](../models/User.ts)

| Champ | Type | Requis | Description |
| :--- | :--- | :--- | :--- |
| `clerkId` | `String` | ✅ Oui | ID unique de l'utilisateur depuis Clerk. |
| `firstName` | `String` | ❌ Non | Prénom (sync depuis Clerk). |
| `lastName` | `String` | ❌ Non | Nom (sync depuis Clerk). |
| `email` | `String` | ❌ Non | Email (sync depuis Clerk, unique avec sparse index). |
| `imageUrl` | `String` | ❌ Non | URL de la photo de profil (sync depuis Clerk). |
| `stripeConnectId` | `String` | ❌ Non | ID du compte Stripe Connect pour les vendeurs. |
| `onboardingComplete` | `Boolean` | - | `true` si le vendeur a complété l'onboarding Stripe. Défaut : `false`. |
| `createdAt` | `Date` | - | Date de création (timestamp automatique). |
| `updatedAt` | `Date` | - | Date de modification (timestamp automatique). |

---

### Purchase

Enregistrement des achats effectués sur la plateforme.

**Fichier** : [`models/Purchase.ts`](../models/Purchase.ts)

| Champ | Type | Requis | Description |
| :--- | :--- | :--- | :--- |
| `productId` | `ObjectId` | ✅ Oui | Référence au produit acheté. |
| `buyerId` | `String` | ✅ Oui | ID Clerk de l'acheteur. |
| `sellerId` | `String` | ✅ Oui | ID Clerk du vendeur. |
| `amount` | `Number` | ✅ Oui | Montant payé en euros. |
| `stripeSessionId` | `String` | ❌ Non | ID de la session Stripe Checkout. |
| `createdAt` | `Date` | - | Date d'achat (timestamp automatique). |

## Types TypeScript

Les types TypeScript sont définis dans `/types` :
- **[`types/product.ts`](../types/product.ts)** : `IProduct`, `ProductCategory`
- **[`types/automation.ts`](../types/automation.ts)** : `IAutomation`, `AutomationPlatform`, `CreateAutomationInput`

---

## Bonnes Pratiques

- **Validation** : Mongoose assure la validation des types et des champs requis avant l'insertion.
- **Indexation** : 
  - `clerkId` est indexé (unique) dans `User`
  - `email` est indexé (unique, sparse) dans `User`
  - `sellerId` peut être indexé dans `Product` pour améliorer les recherches par vendeur
- **Discriminators** : Permet d'étendre facilement le modèle `Product` pour ajouter de nouveaux types sans migration de données

---

## 🚨 Dépannage Connexion (DNS)

Si vous rencontrez des erreurs de connexion persistantes en local (`MongooseServerSelectionError` ou timeouts), votre fournisseur d'accès bloque peut-être certaines résolutions DNS.

**Solution recommandée :**
Configurez votre ordinateur pour utiliser les DNS publics de Google : `8.8.8.8` (primaire) et `8.8.4.4` (secondaire).

1. **Mac** : Réglages > Réseau > Détails > DNS.
2. **Windows** : Paramètres Réseau > IPv4 > Propriétés > DNS.
