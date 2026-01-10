const express = require('express');
const supabase = require('../db/supabase');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get statistics
router.get('/stats/overview', authMiddleware, async (req, res) => {
    try {
        const { count: totalRapports } = await supabase.from('rapports').select('*', { count: 'exact', head: true });
        const { count: rapportsEnCours } = await supabase.from('rapports').select('*', { count: 'exact', head: true }).eq('statut', 'En cours');
        const { count: rapportsPayes } = await supabase.from('rapports').select('*', { count: 'exact', head: true }).eq('statut', 'Payé');
        const { count: mesRapports } = await supabase.from('rapports').select('*', { count: 'exact', head: true }).eq('agent_id', req.user.id);

        // Pour le mois, c'est plus complexe en filtre JS simple, on simplifie pour l'instant

        res.json({
            totalRapports: totalRapports || 0,
            rapportsEnCours: rapportsEnCours || 0,
            rapportsPayes: rapportsPayes || 0,
            rapportsMois: 0, // Temporaire
            mesRapports: mesRapports || 0
        });
    } catch (error) {
        console.error('Erreur stats:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Get all rapports
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { statut, agent_id } = req.query;

        let query = supabase
            .from('rapports')
            .select(`
        *,
        users:agent_id (nom, prenom, matricule),
        amendes:amende_id (infraction)
      `)
            .order('date_creation', { ascending: false });

        if (statut && statut !== 'all') {
            query = query.eq('statut', statut);
        }

        if (agent_id) {
            query = query.eq('agent_id', agent_id);
        }

        const { data: rapports, error } = await query;

        if (error) throw error;

        // Transformer les données pour correspondre au format attendu par le frontend (aplatir les jointures)
        const formattedRapports = rapports.map(r => ({
            ...r,
            agent_nom: r.users?.nom,
            agent_prenom: r.users?.prenom,
            agent_matricule: r.users?.matricule,
            amende_infraction: r.amendes?.infraction
        }));

        res.json(formattedRapports);
    } catch (error) {
        console.error('Erreur get rapports:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Create rapport
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { citoyen_nom, citoyen_prenom, amende_id, montant_applique, description, lieu, est_recidive } = req.body;

        const { data, error } = await supabase
            .from('rapports')
            .insert([{
                agent_id: req.user.id,
                citoyen_nom,
                citoyen_prenom,
                amende_id: amende_id || null,
                montant_applique: montant_applique || null,
                description,
                lieu,
                est_recidive: est_recidive ? true : false,
                statut: 'En cours',
                date_creation: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            message: 'Rapport créé avec succès',
            id: data.id
        });
    } catch (error) {
        console.error('Erreur create rapport:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Update statut
router.patch('/:id/statut', authMiddleware, async (req, res) => {
    try {
        const { statut } = req.body;
        const { error } = await supabase
            .from('rapports')
            .update({ statut })
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'Statut mis à jour' });
    } catch (error) {
        console.error('Erreur update statut:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
