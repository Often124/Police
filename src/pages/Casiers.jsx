import { useState, useEffect } from 'react';
import { useAuth } from '../App';

function Casiers() {
    const { user } = useAuth();
    const [citoyens, setCitoyens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCitoyen, setSelectedCitoyen] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newCitoyen, setNewCitoyen] = useState({
        nom: '',
        prenom: '',
        date_naissance: '',
        telephone: '',
        adresse: '',
        notes: ''
    });

    useEffect(() => {
        fetchCitoyens();
    }, []);

    const fetchCitoyens = async () => {
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`/api/citoyens${search ? `?search=${encodeURIComponent(search)}` : ''}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setCitoyens(data);
            }
        } catch (error) {
            console.error('Erreur chargement citoyens:', error);
        }

        setLoading(false);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setLoading(true);
        fetchCitoyens();
    };

    const viewCasier = async (citoyenId) => {
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`/api/citoyens/${citoyenId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setSelectedCitoyen(data);
                setShowModal(true);
            }
        } catch (error) {
            console.error('Erreur chargement casier:', error);
        }
    };

    const createCitoyen = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const response = await fetch('/api/citoyens', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newCitoyen)
            });

            if (response.ok) {
                setShowCreateModal(false);
                setNewCitoyen({
                    nom: '',
                    prenom: '',
                    date_naissance: '',
                    telephone: '',
                    adresse: '',
                    notes: ''
                });
                fetchCitoyens();
            } else {
                const data = await response.json();
                alert(data.error || 'Erreur lors de la création');
            }
        } catch (error) {
            console.error('Erreur création citoyen:', error);
        }
    };

    const deleteCitoyen = async (id) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce citoyen ?')) return;

        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`/api/citoyens/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setCitoyens(citoyens.filter(c => c.id !== id));
                if (selectedCitoyen?.id === id) {
                    setShowModal(false);
                    setSelectedCitoyen(null);
                }
            } else {
                const data = await response.json();
                alert(data.error || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Erreur suppression:', error);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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

    if (loading) {
        return (
            <main className="main-content">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Chargement des casiers...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="main-content fade-in">
            <div className="page-header">
                <h1 className="page-title">📁 Casiers judiciaires</h1>
                <p className="page-subtitle">
                    Consultez l'historique des citoyens interpellés
                </p>
            </div>

            <div className="table-container">
                <div className="table-header">
                    <h2 className="table-title">{citoyens.length} citoyens enregistrés</h2>
                    <div className="table-filters" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="🔍 Rechercher un citoyen..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ width: '250px' }}
                            />
                            <button type="submit" className="btn btn-primary">Rechercher</button>
                        </form>
                        <button
                            className="btn btn-success"
                            onClick={() => setShowCreateModal(true)}
                        >
                            ➕ Nouveau citoyen
                        </button>
                    </div>
                </div>

                {citoyens.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nom</th>
                                <th>Prénom</th>
                                <th>Date de naissance</th>
                                <th>Téléphone</th>
                                <th>Enregistré le</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {citoyens.map((citoyen) => (
                                <tr key={citoyen.id}>
                                    <td><strong>#{citoyen.id}</strong></td>
                                    <td><strong>{citoyen.nom}</strong></td>
                                    <td>{citoyen.prenom}</td>
                                    <td>{citoyen.date_naissance || '-'}</td>
                                    <td>{citoyen.telephone || '-'}</td>
                                    <td><small>{formatDate(citoyen.created_at)}</small></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => viewCasier(citoyen.id)}
                                                title="Voir le casier"
                                            >
                                                📋 Casier
                                            </button>
                                            {user?.role === 'admin' && (
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={() => deleteCitoyen(citoyen.id)}
                                                    title="Supprimer"
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
                        <div className="empty-state-icon">📁</div>
                        <h3>Aucun citoyen trouvé</h3>
                        <p>Créez un nouveau citoyen ou modifiez vos critères de recherche.</p>
                    </div>
                )}
            </div>

            {/* Modal Casier */}
            {showModal && selectedCitoyen && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
                        <div className="modal-header">
                            <h2>📁 Casier judiciaire</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {/* Info citoyen */}
                            <div style={{
                                background: 'var(--bg-elevated)',
                                padding: '1.5rem',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: '1.5rem'
                            }}>
                                <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>
                                    {selectedCitoyen.prenom} {selectedCitoyen.nom}
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                                    <div>
                                        <small style={{ color: 'var(--text-muted)' }}>Date de naissance</small>
                                        <div>{selectedCitoyen.date_naissance || 'Non renseignée'}</div>
                                    </div>
                                    <div>
                                        <small style={{ color: 'var(--text-muted)' }}>Téléphone</small>
                                        <div>{selectedCitoyen.telephone || 'Non renseigné'}</div>
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <small style={{ color: 'var(--text-muted)' }}>Adresse</small>
                                        <div>{selectedCitoyen.adresse || 'Non renseignée'}</div>
                                    </div>
                                    {selectedCitoyen.notes && (
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <small style={{ color: 'var(--text-muted)' }}>Notes</small>
                                            <div>{selectedCitoyen.notes}</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Stats */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '1rem',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                                        {selectedCitoyen.stats?.totalRapports || 0}
                                    </div>
                                    <small style={{ color: 'var(--text-muted)' }}>Rapports</small>
                                </div>
                                <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#d4af37' }}>
                                        {selectedCitoyen.stats?.totalAmendes || 0}€
                                    </div>
                                    <small style={{ color: 'var(--text-muted)' }}>Total amendes</small>
                                </div>
                                <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f39c12' }}>
                                        {selectedCitoyen.stats?.rapportsEnCours || 0}
                                    </div>
                                    <small style={{ color: 'var(--text-muted)' }}>En cours</small>
                                </div>
                                <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#27ae60' }}>
                                        {selectedCitoyen.stats?.rapportsPayes || 0}
                                    </div>
                                    <small style={{ color: 'var(--text-muted)' }}>Payés</small>
                                </div>
                            </div>

                            {/* Historique des rapports */}
                            <h4 style={{ marginBottom: '1rem' }}>📝 Historique des infractions</h4>
                            {selectedCitoyen.rapports && selectedCitoyen.rapports.length > 0 ? (
                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {selectedCitoyen.rapports.map((rapport) => (
                                        <div
                                            key={rapport.id}
                                            style={{
                                                padding: '1rem',
                                                background: 'var(--bg-card)',
                                                borderRadius: 'var(--radius-md)',
                                                marginBottom: '0.5rem',
                                                border: '1px solid var(--border-color)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <strong>#{rapport.id.toString().padStart(4, '0')}</strong>
                                                    <span style={{ marginLeft: '1rem' }}>
                                                        {rapport.amendes?.infraction || 'Infraction non spécifiée'}
                                                    </span>
                                                    {rapport.est_recidive && (
                                                        <span className="badge badge-danger" style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>
                                                            Récidive
                                                        </span>
                                                    )}
                                                </div>
                                                <span className={`badge ${getStatusBadge(rapport.statut)}`}>
                                                    {rapport.statut}
                                                </span>
                                            </div>
                                            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                <span style={{ color: '#d4af37', fontWeight: 600 }}>{rapport.montant_applique || '-'}</span>
                                                <span style={{ marginLeft: '1rem' }}>📍 {rapport.lieu || 'Lieu non précisé'}</span>
                                                <span style={{ marginLeft: '1rem' }}>📅 {formatDate(rapport.date_creation)}</span>
                                            </div>
                                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                Agent: {rapport.users?.prenom} {rapport.users?.nom}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                    ✅ Aucun antécédent
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Création */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>➕ Nouveau citoyen</h2>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
                        </div>
                        <form onSubmit={createCitoyen}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Prénom *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={newCitoyen.prenom}
                                            onChange={(e) => setNewCitoyen({ ...newCitoyen, prenom: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Nom *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={newCitoyen.nom}
                                            onChange={(e) => setNewCitoyen({ ...newCitoyen, nom: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Date de naissance</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Ex: 15/03/1990"
                                            value={newCitoyen.date_naissance}
                                            onChange={(e) => setNewCitoyen({ ...newCitoyen, date_naissance: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Téléphone</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Ex: 06 12 34 56 78"
                                            value={newCitoyen.telephone}
                                            onChange={(e) => setNewCitoyen({ ...newCitoyen, telephone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Adresse</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Adresse du citoyen"
                                        value={newCitoyen.adresse}
                                        onChange={(e) => setNewCitoyen({ ...newCitoyen, adresse: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Notes</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Informations complémentaires..."
                                        value={newCitoyen.notes}
                                        onChange={(e) => setNewCitoyen({ ...newCitoyen, notes: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                                    Annuler
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Créer le citoyen
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}

export default Casiers;
