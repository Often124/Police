const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../db/supabase');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Identifiant et mot de passe requis' });
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !user) {
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
router.post('/register', authMiddleware, async (req, res) => {
    try {
        const { username, password, nom, prenom, matricule, grade, role } = req.body;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Seuls les administrateurs peuvent créer des comptes' });
        }

        if (!username || !password || !nom || !prenom || !matricule) {
            return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
        }

        // Vérifier unicité
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .single();

        if (existingUser) {
            return res.status(400).json({ error: 'Cet identifiant existe déjà' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);

        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([{
                username,
                password: hashedPassword,
                nom,
                prenom,
                matricule,
                grade: grade || 'Gardien de la Paix',
                role: role || 'agent'
            }])
            .select()
            .single();

        if (insertError) {
            throw insertError;
        }

        res.status(201).json({
            message: 'Utilisateur créé avec succès',
            userId: newUser.id
        });
    } catch (error) {
        console.error('Erreur register:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
