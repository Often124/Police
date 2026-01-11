import { useState, useEffect } from 'react';

function Wanted() {
    const [wantedList, setWantedList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        photo_url: '',
        reason: '',
        citizen_id: ''
    });

    useEffect(() => {
        fetchWanted();
    }, []);

    const fetchWanted = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('/api/wanted', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setWantedList(data);
            }
        } catch (error) {
            console.error('Erreur loading wanted:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Retirer cet avis de recherche ?')) return;

        const token = localStorage.getItem('token');
        try {
            await fetch(`/api/wanted/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchWanted();
        } catch (error) {
            alert('Erreur lors de la suppression');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const response = await fetch('/api/wanted', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setShowModal(false);
                setFormData({ name: '', photo_url: '', reason: '', citizen_id: '' });
                fetchWanted();
            } else {
                alert('Erreur lors de la création');
            }
        } catch (error) {
            console.error('Error adding wanted:', error);
        }
    };

    return (
        <main className="main-content fade-in">
            <div className="page-header">
                <h1 className="page-title">☠️ Avis de Recherche</h1>
                <p className="page-subtitle">Individus recherchés par les services de police</p>
            </div>

            <div className="actions-bar" style={{ marginBottom: '2rem' }}>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    ➕ Ajouter un avis
                </button>
            </div>

            {loading ? (
                <div className="loading-container"><div className="spinner"></div></div>
            ) : (
                <div className="wanted-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    {wantedList.map(person => (
                        <div key={person.id} className="card wanted-card" style={{ borderLeft: '4px solid #e74c3c' }}>
                            <div className="wanted-photo" style={{ height: '200px', backgroundColor: '#2c3e50', marginBottom: '1rem', borderRadius: '8px', overflow: 'hidden' }}>
                                {person.photo_url ? (
                                    <img src={person.photo_url} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '3rem' }}>👤</div>
                                )}
                            </div>
                            <h3 className="card-title">{person.name}</h3>
                            <p className="badge badge-warning" style={{ display: 'inline-block', margin: '0.5rem 0' }}>RECHERCHÉ</p>
                            <p style={{ color: '#e74c3c', fontWeight: 'bold' }}>Motif: {person.reason}</p>
                            <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '1rem' }}>
                                Ajouté le {new Date(person.created_at).toLocaleDateString()}
                            </p>
                            <button className="btn btn-sm btn-outline btn-danger" style={{ marginTop: '1rem', width: '100%' }} onClick={() => handleDelete(person.id)}>
                                🏁 Fin de recherche / Arrêté
                            </button>
                        </div>
                    ))}

                    {wantedList.length === 0 && (
                        <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                            <div className="empty-icon">✅</div>
                            <h3>Aucun avis de recherche en cours</h3>
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Nouvel avis de recherche</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Nom / Prénom *</label>
                                    <input
                                        className="form-input"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ex: John DOE"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Motif de recherche *</label>
                                    <textarea
                                        className="form-input"
                                        required
                                        value={formData.reason}
                                        onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                        placeholder="Ex: Braquage de banque, Meurtre..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Photo URL</label>
                                    <input
                                        className="form-input"
                                        value={formData.photo_url}
                                        onChange={e => setFormData({ ...formData, photo_url: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="btn btn-primary">Publier</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}

export default Wanted;
