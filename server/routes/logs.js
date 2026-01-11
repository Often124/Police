const express = require('express');
const supabase = require('../db/supabase');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all logs (admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { data: logs, error } = await supabase
            .from('logs')
            .select(`
                *,
                users:user_id (nom, prenom, matricule)
            `)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;

        const formattedLogs = logs.map(log => ({
            ...log,
            user_nom: log.users?.nom,
            user_prenom: log.users?.prenom,
            user_matricule: log.users?.matricule
        }));

        res.json(formattedLogs);
    } catch (error) {
        console.error('Erreur get logs:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Utility function to create a log entry
const createLog = async (userId, action, details) => {
    try {
        await supabase
            .from('logs')
            .insert([{
                user_id: userId,
                action,
                details,
                created_at: new Date().toISOString()
            }]);
    } catch (error) {
        console.error('Erreur création log:', error);
    }
};

module.exports = { router, createLog };
