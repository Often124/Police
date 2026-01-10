const express = require('express');
const { dbHelpers, saveDatabase } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get statistics - doit être AVANT /:id
router.get('/stats/overview', authMiddleware, (req, res) => {
    try {
        const db = dbHelpers;
        const totalRapports = db.prepare('SELECT COUNT(*) as count FROM rapports').get()?.count || 0;
        const rapportsEnCours = db.prepare("SELECT COUNT(*) as count FROM rapports WHERE statut = 'En cours'").get()?.count || 0;
        const rapportsPayes = db.prepare("SELECT COUNT(*) as count FROM rapports WHERE statut = 'Payé'").get()?.count || 0;
        const rapportsMois = db.prepare("SELECT COUNT(*) as count FROM rapports WHERE strftime('%Y-%m', date_creation) = strftime('%Y-%m', 'now')").get()?.count || 0;
        const mesRapports = db.prepare('SELECT COUNT(*) as count FROM rapports WHERE agent_id = ?').get(req.user.id)?.count || 0;

        res.json({
            totalRapports,
            rapportsEnCours,
            rapportsPayes,
            rapportsMois,
            mesRapports
        });
    } catch (error) {
        console.error('Erreur stats:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Get all rapports
router.get('/', authMiddleware, (req, res) => {
    try {
        const db = dbHelpers;
        const { statut, agent_id } = req.query;

        let rapports;

        if (statut && statut !== 'all' && agent_id) {
            rapports = db.prepare(`
        SELECT r.*, 
               u.nom as agent_nom, u.prenom as agent_prenom, u.matricule as agent_matricule,
               a.infraction as amende_infraction
        FROM rapports r
        LEFT JOIN users u ON r.agent_id = u.id
        LEFT JOIN amendes a ON r.amende_id = a.id
        WHERE r.statut = ? AND r.agent_id = ?
        ORDER BY r.date_creation DESC
      `).all(statut, parseInt(agent_id));
        } else if (statut && statut !== 'all') {
            rapports = db.prepare(`
        SELECT r.*, 
               u.nom as agent_nom, u.prenom as agent_prenom, u.matricule as agent_matricule,
               a.infraction as amende_infraction
        FROM rapports r
        LEFT JOIN users u ON r.agent_id = u.id
        LEFT JOIN amendes a ON r.amende_id = a.id
        WHERE r.statut = ?
        ORDER BY r.date_creation DESC
      `).all(statut);
        } else if (agent_id) {
            rapports = db.prepare(`
        SELECT r.*, 
               u.nom as agent_nom, u.prenom as agent_prenom, u.matricule as agent_matricule,
               a.infraction as amende_infraction
        FROM rapports r
        LEFT JOIN users u ON r.agent_id = u.id
        LEFT JOIN amendes a ON r.amende_id = a.id
        WHERE r.agent_id = ?
        ORDER BY r.date_creation DESC
      `).all(parseInt(agent_id));
        } else {
            rapports = db.prepare(`
        SELECT r.*, 
               u.nom as agent_nom, u.prenom as agent_prenom, u.matricule as agent_matricule,
               a.infraction as amende_infraction
        FROM rapports r
        LEFT JOIN users u ON r.agent_id = u.id
        LEFT JOIN amendes a ON r.amende_id = a.id
        ORDER BY r.date_creation DESC
      `).all();
        }

        res.json(rapports);
    } catch (error) {
        console.error('Erreur get rapports:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Get single rapport
router.get('/:id', authMiddleware, (req, res) => {
    try {
        const db = dbHelpers;
        const rapport = db.prepare(`
      SELECT r.*, 
             u.nom as agent_nom, u.prenom as agent_prenom, u.matricule as agent_matricule, u.grade as agent_grade,
             a.infraction as amende_infraction, a.montant as amende_montant, a.recidive as amende_recidive
      FROM rapports r
      LEFT JOIN users u ON r.agent_id = u.id
      LEFT JOIN amendes a ON r.amende_id = a.id
      WHERE r.id = ?
    `).get(parseInt(req.params.id));

        if (!rapport) {
            return res.status(404).json({ error: 'Rapport non trouvé' });
        }

        res.json(rapport);
    } catch (error) {
        console.error('Erreur get rapport:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Create rapport
router.post('/', authMiddleware, (req, res) => {
    try {
        const db = dbHelpers;
        const { citoyen_nom, citoyen_prenom, amende_id, montant_applique, description, lieu, est_recidive } = req.body;

        if (!citoyen_nom || !citoyen_prenom) {
            return res.status(400).json({ error: 'Le nom et prénom du citoyen sont obligatoires' });
        }

        const result = db.prepare(`
      INSERT INTO rapports (agent_id, citoyen_nom, citoyen_prenom, amende_id, montant_applique, description, lieu, est_recidive, statut, date_creation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'En cours', datetime('now'))
    `).run(
            req.user.id,
            citoyen_nom,
            citoyen_prenom,
            amende_id || null,
            montant_applique || null,
            description || null,
            lieu || null,
            est_recidive ? 1 : 0
        );

        res.status(201).json({
            message: 'Rapport créé avec succès',
            id: result.lastInsertRowid
        });
    } catch (error) {
        console.error('Erreur create rapport:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Update rapport status
router.patch('/:id/statut', authMiddleware, (req, res) => {
    try {
        const db = dbHelpers;
        const { statut } = req.body;
        const validStatuts = ['En cours', 'Validé', 'Rejeté', 'Payé'];

        if (!validStatuts.includes(statut)) {
            return res.status(400).json({ error: 'Statut invalide' });
        }

        const rapport = db.prepare('SELECT * FROM rapports WHERE id = ?').get(parseInt(req.params.id));

        if (!rapport) {
            return res.status(404).json({ error: 'Rapport non trouvé' });
        }

        if (rapport.agent_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Non autorisé' });
        }

        db.prepare('UPDATE rapports SET statut = ? WHERE id = ?').run(statut, parseInt(req.params.id));

        res.json({ message: 'Statut mis à jour' });
    } catch (error) {
        console.error('Erreur update statut:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Delete rapport
router.delete('/:id', authMiddleware, (req, res) => {
    try {
        const db = dbHelpers;
        const rapport = db.prepare('SELECT * FROM rapports WHERE id = ?').get(parseInt(req.params.id));

        if (!rapport) {
            return res.status(404).json({ error: 'Rapport non trouvé' });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Seuls les administrateurs peuvent supprimer des rapports' });
        }

        db.prepare('DELETE FROM rapports WHERE id = ?').run(parseInt(req.params.id));

        res.json({ message: 'Rapport supprimé' });
    } catch (error) {
        console.error('Erreur delete rapport:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
