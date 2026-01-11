const express = require('express');
const cors = require('cors');
const path = require('path');
const supabase = require('./db/supabase');

const authRoutes = require('./routes/auth');
const amendesRoutes = require('./routes/amendes');
const rapportsRoutes = require('./routes/rapports');
const usersRoutes = require('./routes/users');
const { router: logsRoutes } = require('./routes/logs');
const citoyensRoutes = require('./routes/citoyens');
const sivRoutes = require('./routes/siv');
const wantedRoutes = require('./routes/wanted');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/amendes', amendesRoutes);
app.use('/api/rapports', rapportsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/citoyens', citoyensRoutes);
app.use('/api/siv', sivRoutes);
app.use('/api/wanted', wantedRoutes);

// Health check Supabase
app.get('/api/health', async (req, res) => {
    const { error } = await supabase.from('amendes').select('count', { count: 'exact', head: true });
    if (error) return res.status(500).json({ status: 'error', message: error.message });
    res.json({ status: 'ok', database: 'connected' });
});

// Serve static files in production
app.use(express.static(path.join(__dirname, '../dist')));

// Handle React routing in production
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    }
});

// Export app for Vercel
module.exports = app;

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
        console.log(`🚔 Serveur Intranet Police Nationale démarré sur http://localhost:${PORT}`);
        console.log('⚡ Connecté à Supabase');
    });
}
