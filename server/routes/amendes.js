const express = require('express');
const { dbHelpers } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all amendes
router.get('/', authMiddleware, (req, res) => {
    try {
        const db = dbHelpers;
        const { categorie, search } = req.query;

        let amendes;

        if (categorie && categorie !== 'all' && search) {
            amendes = db.prepare('SELECT * FROM amendes WHERE categorie = ? AND infraction LIKE ? ORDER BY categorie, infraction')
                .all(categorie, `%${search}%`);
        } else if (categorie && categorie !== 'all') {
            amendes = db.prepare('SELECT * FROM amendes WHERE categorie = ? ORDER BY categorie, infraction')
                .all(categorie);
        } else if (search) {
            amendes = db.prepare('SELECT * FROM amendes WHERE infraction LIKE ? ORDER BY categorie, infraction')
                .all(`%${search}%`);
        } else {
            amendes = db.prepare('SELECT * FROM amendes ORDER BY categorie, infraction').all();
        }

        res.json(amendes);
    } catch (error) {
        console.error('Erreur get amendes:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Get single amende
router.get('/:id', authMiddleware, (req, res) => {
    try {
        const db = dbHelpers;
        const amende = db.prepare('SELECT * FROM amendes WHERE id = ?').get(parseInt(req.params.id));

        if (!amende) {
            return res.status(404).json({ error: 'Amende non trouvée' });
        }

        res.json(amende);
    } catch (error) {
        console.error('Erreur get amende:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Get categories
router.get('/categories/list', authMiddleware, (req, res) => {
    try {
        const db = dbHelpers;
        const categories = db.prepare('SELECT DISTINCT categorie FROM amendes ORDER BY categorie').all();
        res.json(categories.map(c => c.categorie));
    } catch (error) {
        console.error('Erreur get categories:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
