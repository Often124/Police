import { useState, useEffect } from 'react';
import { useAuth } from '../App';

function Rapports() {
    const { user } = useAuth();
    const [rapports, setRapports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [showMine, setShowMine] = useState(false);

    useEffect(() => {
        fetchRapports();
    }, [filter, showMine]);

    const fetchRapports = async () => {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();

        if (filter !== 'all') {
            params.append('statut', filter);
        }

        if (showMine) {
            params.append('agent_id', user.id);
        }

        try {
            const response = await fetch(`/api/rapports?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setRapports(data);
            }
        } catch (error) {
            console.error('Erreur chargement rapports:', error);
        }

        setLoading(false);
    };

    const updateStatut = async (id, newStatut) => {
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`/api/rapports/${id}/statut`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ statut: newStatut })
            });

            if (response.ok) {
                setRapports(rapports.map(r =>
                    r.id === id ? { ...r, statut: newStatut } : r
                ));
            }
        } catch (error) {
            console.error('Erreur mise à jour statut:', error);
        }
    };

    const deleteRapport = async (id) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) return;

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/rapports/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setRapports(rapports.filter(r => r.id !== id));
            } else {
                const data = await response.json();
                alert(data.error || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Erreur suppression:', error);
        }
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
                    <p>Chargement des rapports...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="main-content fade-in">
            <div className="page-header">
                <h1 className="page-title">📝 Historique des rapports</h1>
                <p className="page-subtitle">
                    Consultez et gérez tous les rapports de verbalisation
                </p>
            </div>

            <div className="table-container">
                <div className="table-header">
                    <h2 className="table-title">{rapports.length} rapports</h2>
                    <div className="table-filters">
                        <label className="form-checkbox" style={{ fontSize: '0.9rem' }}>
                            <input
                                type="checkbox"
                                checked={showMine}
                                onChange={(e) => setShowMine(e.target.checked)}
                            />
                            Mes rapports uniquement
                        </label>
                        <select
                            className="table-filter-select"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        >
                            <option value="all">Tous les statuts</option>
                            <option value="En cours">En cours</option>
                            <option value="Validé">Validé</option>
                            <option value="Payé">Payé</option>
                            <option value="Rejeté">Rejeté</option>
                        </select>
                    </div>
                </div>

                {rapports.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>Réf.</th>
                                <th>Date</th>
                                <th>Citoyen</th>
                                <th>Infraction</th>
                                <th>Montant</th>
                                <th>Agent</th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rapports.map((rapport) => (
                                <tr key={rapport.id}>
                                    <td>
                                        <strong>#{rapport.id.toString().padStart(4, '0')}</strong>
                                    </td>
                                    <td>{formatDate(rapport.date_creation)}</td>
                                    <td>
                                        <strong>{rapport.citoyen_prenom} {rapport.citoyen_nom}</strong>
                                        {rapport.est_recidive === 1 && (
                                            <span className="badge badge-danger" style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>
                                                Récidive
                                            </span>
                                        )}
                                    </td>
                                    <td>{rapport.amende_infraction || 'Non spécifiée'}</td>
                                    <td style={{ color: '#d4af37', fontWeight: 600 }}>
                                        {rapport.montant_applique || '-'}
                                    </td>
                                    <td>
                                        {rapport.agent_prenom} {rapport.agent_nom}
                                        <br />
                                        <small style={{ color: 'var(--text-muted)' }}>{rapport.agent_matricule}</small>
                                    </td>
                                    <td>
                                        <span className={`badge ${getStatusBadge(rapport.statut)}`}>
                                            {rapport.statut}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            {(rapport.agent_id === user.id || user.role === 'admin') && rapport.statut === 'En cours' && (
                                                <>
                                                    <button
                                                        className="btn btn-sm btn-success"
                                                        onClick={() => updateStatut(rapport.id, 'Payé')}
                                                        title="Marquer comme payé"
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => updateStatut(rapport.id, 'Rejeté')}
                                                        title="Rejeter"
                                                    >
                                                        ✗
                                                    </button>
                                                </>
                                            )}
                                            {user.role === 'admin' && (
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={() => deleteRapport(rapport.id)}
                                                    title="Supprimer le rapport"
                                                    style={{ background: '#555', padding: '4px 8px' }}
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">📝</div>
                        <h3>Aucun rapport trouvé</h3>
                        <p>Modifiez vos critères de recherche ou créez un nouveau rapport.</p>
                    </div>
                )}
            </div>
        </main>
    );
}

export default Rapports;
