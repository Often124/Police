import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';

function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentRapports, setRecentRapports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const token = localStorage.getItem('token');

        try {
            const [statsRes, rapportsRes] = await Promise.all([
                fetch('/api/rapports/stats/overview', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('/api/rapports?limit=5', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

            if (rapportsRes.ok) {
                const rapportsData = await rapportsRes.json();
                setRecentRapports(rapportsData.slice(0, 5));
            }
        } catch (error) {
            console.error('Erreur chargement données:', error);
        }

        setLoading(false);
    };

    const getStatusBadge = (statut) => {
        const badges = {
            'En cours': 'badge-warning',
            'Validé': 'badge-info',
            'Payé': 'badge-success',
            'Rejeté': 'badge-danger'
        };
        return badges[statut] || 'badge-default';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <main className="main-content">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Chargement du tableau de bord...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="main-content fade-in">
            <div className="page-header">
                <h1 className="page-title">Tableau de bord</h1>
                <p className="page-subtitle">
                    Bienvenue, {user?.grade} {user?.prenom} {user?.nom} ({user?.matricule})
                </p>
            </div>

            {/* Statistiques */}
            <div className="dashboard-stats">
                <div className="stat-card">
                    <div className="stat-icon blue">📝</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats?.totalRapports || 0}</div>
                        <div className="stat-label">Total des rapports</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon orange">⏳</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats?.rapportsEnCours || 0}</div>
                        <div className="stat-label">Rapports en cours</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon green">✅</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats?.rapportsPayes || 0}</div>
                        <div className="stat-label">Amendes payées</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon gold">📅</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats?.rapportsMois || 0}</div>
                        <div className="stat-label">Ce mois-ci</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon blue">👤</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats?.mesRapports || 0}</div>
                        <div className="stat-label">Mes rapports</div>
                    </div>
                </div>
            </div>

            {/* Actions rapides */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div className="card-header">
                    <h2 className="card-title">⚡ Actions rapides</h2>
                </div>
                <div className="card-body" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <Link to="/nouveau-rapport" className="btn btn-primary">
                        ➕ Nouveau rapport
                    </Link>
                    <Link to="/amendes" className="btn btn-outline">
                        📋 Voir les amendes
                    </Link>
                    <Link to="/rapports" className="btn btn-outline">
                        📝 Historique des rapports
                    </Link>
                </div>
            </div>

            {/* Derniers rapports */}
            <div className="table-container">
                <div className="table-header">
                    <h2 className="table-title">📋 Derniers rapports</h2>
                    <Link to="/rapports" className="btn btn-sm btn-outline">
                        Voir tout →
                    </Link>
                </div>

                {recentRapports.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Citoyen</th>
                                <th>Infraction</th>
                                <th>Montant</th>
                                <th>Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentRapports.map((rapport) => (
                                <tr key={rapport.id}>
                                    <td>{formatDate(rapport.date_creation)}</td>
                                    <td>
                                        <strong>{rapport.citoyen_prenom} {rapport.citoyen_nom}</strong>
                                    </td>
                                    <td>{rapport.amende_infraction || 'Non spécifiée'}</td>
                                    <td>{rapport.montant_applique || '-'}</td>
                                    <td>
                                        <span className={`badge ${getStatusBadge(rapport.statut)}`}>
                                            {rapport.statut}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">📝</div>
                        <h3>Aucun rapport</h3>
                        <p>Créez votre premier rapport de verbalisation.</p>
                        <Link to="/nouveau-rapport" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                            ➕ Créer un rapport
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}

export default Dashboard;
