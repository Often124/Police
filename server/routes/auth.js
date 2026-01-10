const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbHelpers } = require('../db/database');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', (req, res) => {
    try {
        const { username, password } = req.body;
        const db = dbHelpers;

        if (!username || !password) {
            return res.status(400).json({ error: 'Identifiant et mot de passe requis' });
        }

        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

        if (!user) {
            return res.status(401).json({ error: 'Identifiants incorrects' });
        }

        const validPassword = bcrypt.compareSync(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ error: 'Identifiants incorrects' });
        }

        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role,
                nom: user.nom,
                prenom: user.prenom,
                matricule: user.matricule,
                grade: user.grade
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                nom: user.nom,
                prenom: user.prenom,
                matricule: user.matricule,
                grade: user.grade,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Erreur login:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Register (admin only)
router.post('/register', authMiddleware, (req, res) => {
    try {
        const db = dbHelpers;
        const { username, password, nom, prenom, matricule, grade, role } = req.body;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Seuls les administrateurs peuvent créer des comptes' });
        }

        if (!username || !password || !nom || !prenom || !matricule) {
            return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
        }

        const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
        if (existingUser) {
            return res.status(400).json({ error: 'Cet identifiant existe déjà' });
        }

        const existingMatricule = db.prepare('SELECT id FROM users WHERE matricule = ?').get(matricule);
        if (existingMatricule) {
            return res.status(400).json({ error: 'Ce matricule existe déjà' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);

        const result = db.prepare(`
      INSERT INTO users (username, password, nom, prenom, matricule, grade, role)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(username, hashedPassword, nom, prenom, matricule, grade || 'Gardien de la Paix', role || 'agent');

        res.status(201).json({
            message: 'Utilisateur créé avec succès',
            userId: result.lastInsertRowid
        });
    } catch (error) {
        console.error('Erreur register:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Get current user
router.get('/me', authMiddleware, (req, res) => {
    try {
        const db = dbHelpers;
        const user = db.prepare('SELECT id, username, nom, prenom, matricule, grade, role, created_at FROM users WHERE id = ?').get(req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        res.json(user);
    } catch (error) {
        console.error('Erreur me:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
