const express = require('express');
const supabase = require('../db/supabase');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all amendes
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { categorie, search } = req.query;

        let query = supabase.from('amendes').select('*');

        if (categorie && categorie !== 'all') {
            query = query.eq('categorie', categorie);
        }

        if (search) {
            query = query.ilike('infraction', `%${search}%`);
        }

        const { data: amendes, error } = await query.order('infraction');

        if (error) throw error;
        res.json(amendes);
    } catch (error) {
        console.error('Erreur get amendes:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Get categories
router.get('/categories/list', authMiddleware, async (req, res) => {
    try {
        // Supabase ne supporte pas DISTINCT direct facilement via JS client, on récupère tout et on filtre en JS pour simplifier
        // Ou on utilise .select('categorie') mais on aura des doublons
        const { data, error } = await supabase.from('amendes').select('categorie');

        if (error) throw error;

        const uniqueCategories = [...new Set(data.map(item => item.categorie))].sort();
        res.json(uniqueCategories);
    } catch (error) {
        console.error('Erreur get categories:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
