const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./db/database');

const authRoutes = require('./routes/auth');
const amendesRoutes = require('./routes/amendes');
const rapportsRoutes = require('./routes/rapports');
const usersRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/amendes', amendesRoutes);
app.use('/api/rapports', rapportsRoutes);
app.use('/api/users', usersRoutes);

// Serve static files in production
app.use(express.static(path.join(__dirname, '../client/dist')));

// Handle React routing in production
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    }
});

// Initialiser la base de données puis démarrer le serveur
async function start() {
    try {
        await initDatabase();
        console.log('📦 Base de données initialisée');

        app.listen(PORT, () => {
            console.log(`🚔 Serveur Intranet Police Nationale démarré sur http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Erreur au démarrage:', error);
        process.exit(1);
    }
}

start();
