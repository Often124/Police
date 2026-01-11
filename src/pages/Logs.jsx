import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Navigate } from 'react-router-dom';

function Logs() {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        const token = localStorage.getItem('token');

        try {
            const response = await fetch('/api/logs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setLogs(data);
            }
        } catch (error) {
            console.error('Erreur chargement logs:', error);
        }

        setLoading(false);
    };

    const getActionBadge = (action) => {
        const badges = {
            'CREATION_RAPPORT': { color: '#27ae60', icon: '➕', label: 'Création' },
            'MODIFICATION_RAPPORT': { color: '#f39c12', icon: '✏️', label: 'Modification' },
            'SUPPRESSION_RAPPORT': { color: '#e74c3c', icon: '🗑️', label: 'Suppression' },
            'CONNEXION': { color: '#3498db', icon: '🔐', label: 'Connexion' }
        };
        return badges[action] || { color: '#7f8c8d', icon: '📋', label: action };
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    // Rediriger si pas admin
    if (user?.role !== 'admin') {
        return <Navigate to="/" />;
    }

    if (loading) {
        return (
            <main className="main-content">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Chargement des logs...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="main-content fade-in">
            <div className="page-header">
                <h1 className="page-title">📜 Journal d'activité</h1>
                <p className="page-subtitle">
                    Historique des actions effectuées sur les rapports
                </p>
            </div>

            <div className="table-container">
                <div className="table-header">
                    <h2 className="table-title">{logs.length} entrées</h2>
                </div>

                {logs.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Utilisateur</th>
                                <th>Action</th>
                                <th>Détails</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => {
                                const badge = getActionBadge(log.action);
                                return (
                                    <tr key={log.id}>
                                        <td>
                                            <small>{formatDate(log.created_at)}</small>
                                        </td>
                                        <td>
                                            <strong>{log.user_prenom} {log.user_nom}</strong>
                                            <br />
                                            <small style={{ color: 'var(--text-muted)' }}>{log.user_matricule}</small>
                                        </td>
                                        <td>
                                            <span
                                                className="badge"
                                                style={{
                                                    background: badge.color,
                                                    color: 'white',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem'
                                                }}
                                            >
                                                {badge.icon} {badge.label}
                                            </span>
                                        </td>
                                        <td style={{ maxWidth: '400px', wordBreak: 'break-word' }}>
                                            {log.details}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">📜</div>
                        <h3>Aucun log disponible</h3>
                        <p>Les actions seront enregistrées ici.</p>
                    </div>
                )}
            </div>
        </main>
    );
}

export default Logs;
