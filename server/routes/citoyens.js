const express = require('express');
const supabase = require('../db/supabase');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all citoyens with search
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { search, limit = 50 } = req.query;

        let query = supabase
            .from('citoyens')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(parseInt(limit));

        if (search) {
            query = query.or(`nom.ilike.%${search}%,prenom.ilike.%${search}%`);
        }

        const { data: citoyens, error } = await query;

        if (error) throw error;

        res.json(citoyens);
    } catch (error) {
        console.error('Erreur get citoyens:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Get citoyen by ID with full casier (all reports)
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        // Get citoyen info
        const { data: citoyen, error: citoyenError } = await supabase
            .from('citoyens')
            .select('*')
            .eq('id', id)
            .single();

        if (citoyenError) throw citoyenError;

        // Get all reports for this citoyen
        const { data: rapports, error: rapportsError } = await supabase
            .from('rapports')
            .select(`
                *,
                users:agent_id (nom, prenom, matricule),
                amendes:amende_id (infraction, montant)
            `)
            .eq('citoyen_id', id)
            .order('date_creation', { ascending: false });

        if (rapportsError) throw rapportsError;

        // Calculate statistics
        const stats = {
            totalRapports: rapports.length,
            totalAmendes: rapports.reduce((sum, r) => {
                const montant = parseInt(r.montant_applique?.replace(/[^0-9]/g, '') || '0');
                return sum + montant;
            }, 0),
            rapportsEnCours: rapports.filter(r => r.statut === 'En cours').length,
            rapportsPayes: rapports.filter(r => r.statut === 'Payé').length
        };

        res.json({
            ...citoyen,
            rapports,
            stats
        });
    } catch (error) {
        console.error('Erreur get citoyen:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Search citoyens by name (for autocomplete)
router.get('/search/:query', authMiddleware, async (req, res) => {
    try {
        const { query } = req.params;

        if (!query || query.length < 2) {
            return res.json([]);
        }

        const { data: citoyens, error } = await supabase
            .from('citoyens')
            .select('id, nom, prenom, date_naissance')
            .or(`nom.ilike.%${query}%,prenom.ilike.%${query}%`)
            .limit(10);

        if (error) throw error;

        res.json(citoyens);
    } catch (error) {
        console.error('Erreur search citoyens:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Create new citoyen
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { nom, prenom, date_naissance, telephone, adresse, notes } = req.body;

        if (!nom || !prenom) {
            return res.status(400).json({ error: 'Nom et prénom requis' });
        }

        const { data, error } = await supabase
            .from('citoyens')
            .insert([{
                nom: nom.toUpperCase(),
                prenom,
                date_naissance,
                telephone,
                adresse,
                notes,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('Erreur create citoyen:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Update citoyen
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, prenom, date_naissance, telephone, adresse, notes } = req.body;

        const { data, error } = await supabase
            .from('citoyens')
            .update({
                nom: nom?.toUpperCase(),
                prenom,
                date_naissance,
                telephone,
                adresse,
                notes,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Erreur update citoyen:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Delete citoyen (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if citoyen has reports
        const { count } = await supabase
            .from('rapports')
            .select('*', { count: 'exact', head: true })
            .eq('citoyen_id', id);

        if (count > 0) {
            return res.status(400).json({
                error: 'Impossible de supprimer ce citoyen car il a des rapports associés'
            });
        }

        const { error } = await supabase
            .from('citoyens')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Citoyen supprimé' });
    } catch (error) {
        console.error('Erreur delete citoyen:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
