const express = require('express');
const supabase = require('../db/supabase');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { createLog } = require('./logs');

const router = express.Router();

// Get statistics
router.get('/stats/overview', authMiddleware, async (req, res) => {
    try {
        const { count: totalRapports } = await supabase.from('rapports').select('*', { count: 'exact', head: true });
        const { count: rapportsEnCours } = await supabase.from('rapports').select('*', { count: 'exact', head: true }).eq('statut', 'En cours');
        const { count: rapportsPayes } = await supabase.from('rapports').select('*', { count: 'exact', head: true }).eq('statut', 'Payé');
        const { count: mesRapports } = await supabase.from('rapports').select('*', { count: 'exact', head: true }).eq('agent_id', req.user.id);

        res.json({
            totalRapports: totalRapports || 0,
            rapportsEnCours: rapportsEnCours || 0,
            rapportsPayes: rapportsPayes || 0,
            rapportsMois: 0,
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

        // Log création
        await createLog(req.user.id, 'CREATION_RAPPORT', `Rapport #${data.id} créé pour ${citoyen_prenom} ${citoyen_nom}`);

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
        const rapportId = req.params.id;

        // Récupérer le rapport avant modification pour le log
        const { data: oldRapport } = await supabase
            .from('rapports')
            .select('statut, citoyen_nom, citoyen_prenom')
            .eq('id', rapportId)
            .single();

        const { error } = await supabase
            .from('rapports')
            .update({ statut })
            .eq('id', rapportId);

        if (error) throw error;

        // Log modification
        await createLog(req.user.id, 'MODIFICATION_RAPPORT',
            `Rapport #${rapportId} (${oldRapport?.citoyen_prenom} ${oldRapport?.citoyen_nom}) : statut modifié de "${oldRapport?.statut}" à "${statut}"`);

        res.json({ message: 'Statut mis à jour' });
    } catch (error) {
        console.error('Erreur update statut:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Delete rapport (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const rapportId = parseInt(req.params.id);

        // Récupérer le rapport avant suppression pour le log
        const { data: rapport } = await supabase
            .from('rapports')
            .select('citoyen_nom, citoyen_prenom, montant_applique, description')
            .eq('id', rapportId)
            .single();

        const { error } = await supabase
            .from('rapports')
            .delete()
            .eq('id', rapportId);

        if (error) throw error;

        // Log suppression
        await createLog(req.user.id, 'SUPPRESSION_RAPPORT',
            `Rapport #${rapportId} SUPPRIMÉ - Citoyen: ${rapport?.citoyen_prenom} ${rapport?.citoyen_nom} - Montant: ${rapport?.montant_applique || 'N/A'}`);

        res.json({ message: 'Rapport supprimé' });
    } catch (error) {
        console.error('Erreur delete rapport:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Check recidive for a citizen (returns list of their previous infractions)
router.get('/recidive/:nom/:prenom', authMiddleware, async (req, res) => {
    try {
        const { nom, prenom } = req.params;

        // Get all previous reports for this citizen
        const { data: rapports, error } = await supabase
            .from('rapports')
            .select(`
                amende_id,
                amendes:amende_id (id, infraction)
            `)
            .ilike('citoyen_nom', nom)
            .ilike('citoyen_prenom', prenom);

        if (error) throw error;

        // Extract unique infraction IDs
        const previousInfractionIds = [...new Set(
            rapports
                .filter(r => r.amende_id)
                .map(r => r.amende_id)
        )];

        res.json({
            isRecidiviste: previousInfractionIds.length > 0,
            previousInfractionIds,
            totalPreviousReports: rapports.length
        });
    } catch (error) {
        console.error('Erreur check recidive:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
