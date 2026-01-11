const express = require('express');
const supabase = require('../db/supabase');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all wanted persons
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { data: wanted, error } = await supabase
            .from('wanted')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(wanted);
    } catch (error) {
        console.error('Erreur get wanted:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Add wanted person
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { citizen_id, name, photo_url, reason } = req.body;
        const added_by = req.user.id;

        // Build insert object, only include citizen_id if it's a valid non-empty value
        const insertData = {
            name,
            reason,
            added_by,
            status: 'active'
        };

        // Only add citizen_id if it exists and is not empty
        if (citizen_id && citizen_id.trim() !== '') {
            insertData.citizen_id = citizen_id;
        }

        // Only add photo_url if provided
        if (photo_url && photo_url.trim() !== '') {
            insertData.photo_url = photo_url;
        }

        const { data, error } = await supabase
            .from('wanted')
            .insert([insertData])
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error('Erreur add wanted:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Delete (Revoke) wanted status
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const { error } = await supabase
            .from('wanted')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ message: 'Avis de recherche supprimé' });
    } catch (error) {
        console.error('Erreur delete wanted:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
