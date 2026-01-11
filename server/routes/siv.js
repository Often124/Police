const express = require('express');
const supabase = require('../db/supabase');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Search vehicle by plate
router.get('/:plate', authMiddleware, async (req, res) => {
    try {
        const plate = req.params.plate.toUpperCase();

        const { data: vehicle, error } = await supabase
            .from('vehicles')
            .select(`
                *,
                owner:citizens (
                    id,
                    firstname,
                    lastname,
                    birthdate,
                    phone_number
                )
            `)
            .ilike('plate', `%${plate}%`) // Partial match or exact? Requirement says "Search", partial is often better.
            .limit(5); // Limit results if partial

        // If exact match is needed or preferred:
        // .eq('plate', plate)

        if (error) throw error;

        res.json(vehicle);
    } catch (error) {
        console.error('Erreur search siv:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
