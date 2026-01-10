# 🚔 Guide du Projet Intranet Police Nationale

Ce document résume l'état final du projet et les instructions de déploiement.

## 🏗️ Architecture Actuelle

Le projet a été restructuré pour une compatibilité maximale avec **Vercel** (Hébergement) et **Supabase** (Base de données).

- **Racine (`/`)** : Application Frontend (React/Vite). C'est ce que Vercel construit par défaut.
- **`/api`** : Backend (Node.js/Express) adapté en "Serverless Functions" pour Vercel.
- **`/server`** : Le code source du backend (routes, logique).
- **Base de données** : Supabase (PostgreSQL Cloud).

## 🚀 Mise en ligne (Vercel)

1. **Connecter le Repo** : Importez votre dépôt GitHub `Police` sur Vercel.
2. **Configuration Build** :
   - Framework Preset : **Vite** (Détecté automatiquement normalement)
   - Root Directory : `/` (Racine)
3. **Variables d'Environnement (Environment Variables)** :
   Ajoutez ces clés dans les réglages du projet Vercel :
   - `SUPABASE_URL` : (Votre URL Supabase)
   - `SUPABASE_KEY` : (Votre Clé Anon/Public Supabase)
   - `JWT_SECRET` : (Votre secret personnalisé)

## 💻 Développement Local

Pour travailler sur le projet sur votre ordinateur :

```bash
# 1. Installer les dépendances (une seule fois)
npm install

# 2. Configurer le fichier .env
# Créez un fichier .env à la racine avec les mêmes variables que sur Vercel :
# SUPABASE_URL=...
# SUPABASE_KEY=...
# JWT_SECRET=...

# 3. Lancer le projet
npm run dev
```

La commande `npm run dev` lance **en même temps** :
- Le Frontend (http://localhost:5173)
- Le Backend (http://localhost:3001)

## 🗄️ Gestion de la Base de Données

Si vous devez réinitialiser la base de données ou importer de nouvelles amendes :

1. Assurez-vous d'avoir exécuté le code SQL (`supabase_schema.sql`) dans l'interface Supabase.
2. Lancez la commande suivante en local :
   ```bash
   npm run seed
   ```
   Cela va :
   - Créer l'administrateur par défaut (`admin` / `admin123`)
   - Importer les 66 amendes du fichier CSV

## 🔑 Identifiants par défaut

- **Utilisateur** : `admin`
- **Mot de passe** : `admin123`

---
*Projet configuré par l'Assistant Google DeepMind - 2026*
