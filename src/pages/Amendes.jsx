import { useState, useEffect } from 'react';
import { useAuth } from '../App';

function Amendes() {
    const { user } = useAuth();
    const [amendes, setAmendes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [newAmende, setNewAmende] = useState({
        infraction: '',
        montant: '',
        recidive: '',
        retrait_points: '',
        prison: '',
        immobilisation: 'Non',
        fourriere: 'Non',
        categorie: 'Autres infractions'
    });

    const categoriesList = [
        'Infractions routières',
        'Crimes et délits',
        'Stupéfiants',
        'Troubles à l\'ordre public',
        'Autres infractions'
    ];

    useEffect(() => {
        fetchAmendes();
    }, [selectedCategory, search]);

    const fetchAmendes = async () => {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();

        if (selectedCategory !== 'all') {
            params.append('categorie', selectedCategory);
        }
        if (search) {
            params.append('search', search);
        }

        try {
            const [amendesRes, categoriesRes] = await Promise.all([
                fetch(`/api/amendes?${params}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                categories.length === 0 ? fetch('/api/amendes/categories/list', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }) : Promise.resolve(null)
            ]);

            if (amendesRes.ok) {
                const data = await amendesRes.json();
                setAmendes(data);
            }

            if (categoriesRes && categoriesRes.ok) {
                const catData = await categoriesRes.json();
                setCategories(catData);
            }
        } catch (error) {
            console.error('Erreur chargement amendes:', error);
        }

        setLoading(false);
    };

    const handleCreateAmende = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const response = await fetch('/api/amendes', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newAmende)
            });

            if (response.ok) {
                setShowModal(false);
                setNewAmende({
                    infraction: '',
                    montant: '',
                    recidive: '',
                    retrait_points: '',
                    prison: '',
                    immobilisation: 'Non',
                    fourriere: 'Non',
                    categorie: 'Autres infractions'
                });
                fetchAmendes();
            } else {
                const data = await response.json();
                alert(data.error || 'Erreur lors de la création');
            }
        } catch (error) {
            console.error('Erreur création:', error);
        }
    };

    const handleDeleteAmende = async (id) => {
        if (!confirm('Supprimer cette infraction ?')) return;

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/amendes/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                fetchAmendes();
            }
        } catch (error) {
            console.error('Erreur suppression:', error);
        }
    };

    const getCategoryEmoji = (category) => {
        const emojis = {
            'Infractions routières': '🚗',
            'Crimes et délits': '⚠️',
            'Stupéfiants': '🚫',
            'Troubles à l\'ordre public': '📢',
            'Autres infractions': '📋'
        };
        return emojis[category] || '📋';
    };

    if (loading) {
        return (
            <main className="main-content">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Chargement des amendes...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="main-content fade-in">
            <div className="page-header">
                <h1 className="page-title">📋 Barème des amendes</h1>
                <p className="page-subtitle">
                    Liste complète des infractions et sanctions applicables
                </p>
            </div>

            <div className="table-container">
                <div className="table-header">
                    <h2 className="table-title">{amendes.length} infractions</h2>
                    <div className="table-filters">
                        <input
                            type="text"
                            className="table-search"
                            placeholder="Rechercher une infraction..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <select
                            className="table-filter-select"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="all">Toutes les catégories</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        {user?.role === 'admin' && (
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowModal(true)}
                            >
                                ➕ Ajouter
                            </button>
                        )}
                    </div>
                </div>

                {amendes.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>Infraction</th>
                                <th>Catégorie</th>
                                <th>Amende</th>
                                <th>Récidive</th>
                                <th>Points</th>
                                <th>Prison</th>
                                {user?.role === 'admin' && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {amendes.map((amende) => (
                                <tr key={amende.id}>
                                    <td>
                                        <strong>{amende.infraction}</strong>
                                    </td>
                                    <td>
                                        <span className="category-badge">
                                            {getCategoryEmoji(amende.categorie)} {amende.categorie}
                                        </span>
                                    </td>
                                    <td style={{ color: '#d4af37', fontWeight: 600 }}>
                                        {amende.montant}
                                    </td>
                                    <td style={{ color: '#e74c3c' }}>
                                        {amende.recidive !== 'Non applicable' ? amende.recidive : '-'}
                                    </td>
                                    <td>
                                        {amende.retrait_points !== 'Aucun' && amende.retrait_points !== '///'
                                            ? <span className="badge badge-warning">{amende.retrait_points}</span>
                                            : '-'
                                        }
                                    </td>
                                    <td>
                                        {amende.prison !== 'Aucune' && amende.prison !== '///'
                                            ? <span className="badge badge-danger">{amende.prison}</span>
                                            : '-'
                                        }
                                    </td>
                                    {user?.role === 'admin' && (
                                        <td>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleDeleteAmende(amende.id)}
                                                style={{ padding: '4px 8px', fontSize: '12px' }}
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">🔍</div>
                        <h3>Aucune infraction trouvée</h3>
                        <p>Modifiez vos critères de recherche ou ajoutez une nouvelle infraction.</p>
                    </div>
                )}
            </div>

            {/* Modal création */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>➕ Nouvelle infraction</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleCreateAmende}>
                            <div className="form-group">
                                <label className="form-label">Nom de l'infraction *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newAmende.infraction}
                                    onChange={(e) => setNewAmende({ ...newAmende, infraction: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Montant</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Ex: 500$"
                                        value={newAmende.montant}
                                        onChange={(e) => setNewAmende({ ...newAmende, montant: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Récidive</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Ex: 1000$"
                                        value={newAmende.recidive}
                                        onChange={(e) => setNewAmende({ ...newAmende, recidive: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Retrait de points</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Ex: 2 points"
                                        value={newAmende.retrait_points}
                                        onChange={(e) => setNewAmende({ ...newAmende, retrait_points: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Peine de prison</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Ex: 10 min"
                                        value={newAmende.prison}
                                        onChange={(e) => setNewAmende({ ...newAmende, prison: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Catégorie</label>
                                <select
                                    className="form-select"
                                    value={newAmende.categorie}
                                    onChange={(e) => setNewAmende({ ...newAmende, categorie: e.target.value })}
                                >
                                    {categoriesList.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Annuler
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Créer l'infraction
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}

export default Amendes;
