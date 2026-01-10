# 🚔 Intranet Police Nationale - Nova-RP

Application web complète pour la gestion des verbalisations et amendes de la Police Nationale sur le serveur Nova-RP.

## 📋 Fonctionnalités

- 🔐 **Authentification sécurisée** - Connexion JWT pour les agents
- 📊 **Tableau de bord** - Vue d'ensemble avec statistiques
- 📝 **Gestion des amendes** - 66+ infractions avec tarifs et sanctions
- 📄 **Rapports de verbalisation** - Création et suivi des verbalisations
- 👥 **Administration** - Gestion des utilisateurs (admin)

## 🛠️ Technologies

- **Backend**: Node.js + Express.js
- **Frontend**: React (Vite)
- **Base de données**: SQLite (sql.js)
- **Auth**: JWT (JSON Web Tokens)

## 🚀 Installation

```bash
# Cloner le projet
git clone https://github.com/Often124/PoliceNovaRP.git
cd PoliceNovaRP

# Installer les dépendances
npm install
cd client && npm install && cd ..

# Initialiser la base de données
npm run seed

# Démarrer le serveur (backend)
npm run dev

# Dans un autre terminal, démarrer le client
cd client && npm run dev
```

## 🔑 Identifiants par défaut

| Champ | Valeur |
|-------|--------|
| Identifiant | `admin` |
| Mot de passe | `admin123` |

⚠️ **Pensez à changer le mot de passe après la première connexion !**

## 📁 Structure du projet

```
PoliceNovaRP/
├── server/
│   ├── index.js          # Serveur Express
│   ├── db/               # Base de données SQLite
│   ├── routes/           # API REST
│   └── middleware/       # Auth JWT
├── client/
│   ├── src/
│   │   ├── pages/        # Pages React
│   │   └── components/   # Composants
│   └── index.html
└── package.json
```

## 📜 Licence

MIT
