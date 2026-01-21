# 🚀 Koda Marketplace - Guide de Démarrage (Dev)

Bienvenue sur le projet **Koda** !  
Ce document explique comment configurer ton environnement local pour commencer à coder.

---

## 🛠 Prérequis

Assure-toi d'avoir installé :

- **Node.js** (version 20 ou supérieure recommandée)
- **npm**, **yarn**, **pnpm** ou **bun**

---

## 📥 Installation

1. Cloner le dépôt (si ce n'est pas déjà fait).
2. Installer les dépendances :

```bash
npm install
# ou
yarn install
```

---

## 🔐 Configuration de l'environnement (IMPORTANT)

Pour que l'application fonctionne (Authentification, Base de données, S3), tu as besoin de variables d'environnement.

Récupère le contenu du fichier .env.local sur notre canal Discord.

À la racine du projet, crée un fichier nommé .env.local.

Colle le contenu récupéré à l'intérieur.

⚠️ CAUTION
Ne jamais push le fichier .env.local !
Ce fichier contient des clés privées (Clerk, MongoDB, AWS).
Il est déjà listé dans le fichier .gitignore pour éviter toute fuite de données.

---

## 🏃‍♂️ Lancer l'application

Une fois les dépendances installées et le .env.local configuré, lance le serveur de développement :
```bash
npm run dev
# ou
yarn dev
```

---

L'application sera disponible sur :
👉 http://localhost:3000

## 📁 Structure du Projet

- /app : Routes et pages Next.js (App Router)

- /app/actions : Fonctions Server Actions pour la logique backend (ex : créer une automatisation)

- /models : Schémas Mongoose pour MongoDB

- /components : Composants UI réutilisables

- /lib : Utilitaires et configurations (DB, S3)

---

## 🧪 Rappel des technos utilisées

- Framework : Next.js 15+

- Auth : Clerk

- Base de données : MongoDB via Mongoose

- Style : Tailwind CSS 4

- Stockage : AWS S3

---

## 📦 Tester l'upload de fichiers JSON sur S3 (optionnel)

Pour tester l'upload vers AWS S3 en local :

Assure-toi que les variables suivantes sont bien définies dans .env.local :

- AWS_ACCESS_KEY_ID

- AWS_SECRET_ACCESS_KEY

- AWS_REGION

- AWS_BUCKET_NAME

Lance l'application en local :
```bash

npm run dev

```

Utilise l'interface prévue ou une route API pour envoyer un fichier .json.

Vérifie dans la console AWS S3 que le fichier est bien présent dans le bucket.

💡 Astuce : tu peux activer les logs côté serveur pour afficher la réponse S3 et déboguer plus facilement.


