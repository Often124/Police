const express = require('express');
const bcrypt = require('bcryptjs');
const { dbHelpers } = require('../db/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get agents list (for rapport form) - doit être AVANT /:id
router.get('/list/agents', authMiddleware, (req, res) => {
    try {
        const db = dbHelpers;
        const agents = db.prepare("SELECT id, nom, prenom, matricule, grade FROM users WHERE role != 'admin' ORDER BY nom").all();
        res.json(agents);
    } catch (error) {
        console.error('Erreur get agents:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Get all users (admin only)
router.get('/', authMiddleware, adminMiddleware, (req, res) => {
    try {
        const db = dbHelpers;
        const users = db.prepare('SELECT id, username, nom, prenom, matricule, grade, role, created_at FROM users ORDER BY created_at DESC').all();
        res.json(users);
    } catch (error) {
        console.error('Erreur get users:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Get single user
router.get('/:id', authMiddleware, (req, res) => {
    try {
        const db = dbHelpers;
        const userId = parseInt(req.params.id);

        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Non autorisé' });
        }

        const user = db.prepare('SELECT id, username, nom, prenom, matricule, grade, role, created_at FROM users WHERE id = ?').get(userId);

        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        res.json(user);
    } catch (error) {
        console.error('Erreur get user:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Update user (admin only)
router.put('/:id', authMiddleware, adminMiddleware, (req, res) => {
    try {
        const db = dbHelpers;
        const { nom, prenom, matricule, grade, role } = req.body;
        const userId = parseInt(req.params.id);

        const existingUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        if (!existingUser) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        if (matricule && matricule !== existingUser.matricule) {
            const matriculeExists = db.prepare('SELECT id FROM users WHERE matricule = ? AND id != ?').get(matricule, userId);
            if (matriculeExists) {
                return res.status(400).json({ error: 'Ce matricule est déjà utilisé' });
            }
        }

        db.prepare(`
      UPDATE users 
      SET nom = ?, prenom = ?, matricule = ?, grade = ?, role = ?
      WHERE id = ?
    `).run(
            nom || existingUser.nom,
            prenom || existingUser.prenom,
            matricule || existingUser.matricule,
            grade || existingUser.grade,
            role || existingUser.role,
            userId
        );

        res.json({ message: 'Utilisateur mis à jour' });
    } catch (error) {
        console.error('Erreur update user:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Reset password (admin only)
router.patch('/:id/password', authMiddleware, adminMiddleware, (req, res) => {
    try {
        const db = dbHelpers;
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, parseInt(req.params.id));

        res.json({ message: 'Mot de passe réinitialisé' });
    } catch (error) {
        console.error('Erreur reset password:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Delete user (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, (req, res) => {
    try {
        const db = dbHelpers;
        const userId = parseInt(req.params.id);

        if (userId === req.user.id) {
            return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
        }

        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        const rapportsCount = db.prepare('SELECT COUNT(*) as count FROM rapports WHERE agent_id = ?').get(userId)?.count || 0;
        if (rapportsCount > 0) {
            return res.status(400).json({
                error: `Impossible de supprimer cet utilisateur car il a ${rapportsCount} rapport(s).`
            });
        }

        db.prepare('DELETE FROM users WHERE id = ?').run(userId);

        res.json({ message: 'Utilisateur supprimé' });
    } catch (error) {
        console.error('Erreur delete user:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
