const express = require('express');
const supabase = require('../db/supabase');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get agents list
router.get('/list/agents', authMiddleware, async (req, res) => {
    try {
        const { data: agents, error } = await supabase
            .from('users')
            .select('id, nom, prenom, matricule, grade')
            .neq('role', 'admin')
            .order('nom');

        if (error) throw error;
        res.json(agents);
    } catch (error) {
        console.error('Erreur get agents:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Get all users (admin)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, username, nom, prenom, matricule, grade, role, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(users);
    } catch (error) {
        console.error('Erreur get users:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Update user info
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { nom, prenom, matricule, grade, role } = req.body;

        const { error } = await supabase
            .from('users')
            .update({ nom, prenom, matricule, grade, role })
            .eq('id', userId);

        if (error) throw error;
        res.json({ message: 'Utilisateur mis à jour' });
    } catch (error) {
        console.error('Erreur update user:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Update password
router.patch('/:id/password', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({ error: 'Mot de passe trop court' });
        }

        const { error } = await supabase
            .from('users')
            .update({ password }) // In a real app, hash this!
            .eq('id', userId);

        if (error) throw error;
        res.json({ message: 'Mot de passe mis à jour' });
    } catch (error) {
        console.error('Erreur update password:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Delete user
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if (userId === req.user.id) {
            return res.status(400).json({ error: 'Impossible de supprimer son propre compte' });
        }

        const { error } = await supabase.from('users').delete().eq('id', userId);

        if (error) throw error;
        res.json({ message: 'Utilisateur supprimé' });
    } catch (error) {
        console.error('Erreur delete user:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
