const express = require('express');
const supabase = require('../db/supabase');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

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
        const { data, error } = await supabase.from('amendes').select('categorie');

        if (error) throw error;

        const uniqueCategories = [...new Set(data.map(item => item.categorie))].filter(Boolean).sort();
        res.json(uniqueCategories);
    } catch (error) {
        console.error('Erreur get categories:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Create amende (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { infraction, montant, recidive, retrait_points, prison, immobilisation, fourriere, categorie } = req.body;

        if (!infraction) {
            return res.status(400).json({ error: 'Le nom de l\'infraction est obligatoire' });
        }

        const { data, error } = await supabase
            .from('amendes')
            .insert([{
                infraction,
                montant: montant || 'Non défini',
                recidive: recidive || 'Non applicable',
                retrait_points: retrait_points || 'Aucun',
                prison: prison || 'Aucune',
                immobilisation: immobilisation || 'Non',
                fourriere: fourriere || 'Non',
                categorie: categorie || 'Autres infractions'
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ message: 'Infraction créée avec succès', amende: data });
    } catch (error) {
        console.error('Erreur create amende:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Update amende (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { infraction, montant, recidive, retrait_points, prison, immobilisation, fourriere, categorie } = req.body;

        if (!infraction) {
            return res.status(400).json({ error: 'Le nom de l\'infraction est obligatoire' });
        }

        const { data, error } = await supabase
            .from('amendes')
            .update({
                infraction,
                montant: montant || 'Non défini',
                recidive: recidive || 'Non applicable',
                retrait_points: retrait_points || 'Aucun',
                prison: prison || 'Aucune',
                immobilisation: immobilisation || 'Non',
                fourriere: fourriere || 'Non',
                categorie: categorie || 'Autres infractions'
            })
            .eq('id', parseInt(req.params.id))
            .select()
            .single();

        if (error) throw error;

        res.json({ message: 'Infraction modifiée avec succès', amende: data });
    } catch (error) {
        console.error('Erreur update amende:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Delete amende (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { error } = await supabase
            .from('amendes')
            .delete()
            .eq('id', parseInt(req.params.id));

        if (error) throw error;

        res.json({ message: 'Infraction supprimée' });
    } catch (error) {
        console.error('Erreur delete amende:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
