# 🔄 Flux de Données (Data Flow)

Ce document détaille les principaux flux de données de l'application Koda.

## 1. Création d'une Automatisation (Vendeur)

C'est le flux le plus critique de l'application, permettant aux vendeurs de mettre en ligne leurs produits.

1.  **Upload du Fichier (Client -> AWS S3)** :
    - L'utilisateur sélectionne un fichier JSON (ex: export n8n).
    - Le client demande une URL présignée (Presigned URL) au serveur via une Server Action.
    - Le serveur valide la requête (authentification Clerk) et génère l'URL via `@aws-sdk/s3-request-presigner`.
    - Le client upload directement le fichier sur S3 via cette URL.

2.  **Enregistrement des Métadonnées (Client -> Server Action -> MongoDB)** :
    - Une fois l'upload réussi, le client envoie les détails (titre, description, prix, URL S3) à une Server Action `createAutomation`.
    - La Server Action :
        - Vérifie l'authentification.
        - Valide les données (Zod ou validation manuelle).
        - Crée un document `Automation` dans MongoDB via Mongoose.
    - La page est revalidée (`revalidatePath`) pour afficher la nouvelle automatisation.

## 2. Authentification (Clerk)

L'authentification est gérée entièrement par **Clerk**.

-   **Middleware** : Le fichier `proxy.ts` protège les routes sensibles.
-   **Client** : Les composants `<SignIn />`, `<SignUp />`, `<UserButton />` gèrent l'UI.
-   **Serveur** : `auth()` et `currentUser()` permettent de récupérer l'ID et les infos de l'utilisateur connecté dans les Server Components et Server Actions.

## 3. Consultation des Automatisations (Acheteur)

1.  **Chargement de la Page (Server Component)** :
    - Le composant de page (ex: `app/page.tsx`) appelle directement la base de données via Mongoose (`Automation.find()`).
    - Les données sont sérialisées et passées aux composants clients si nécessaire.
    - Grâce au SSR (Server-Side Rendering) de Next.js, le contenu est pré-rendu pour le SEO et la performance.
