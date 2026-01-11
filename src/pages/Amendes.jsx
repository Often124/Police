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
    const [editingAmende, setEditingAmende] = useState(null);
    const [formData, setFormData] = useState({
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

    const openCreateModal = () => {
        setEditingAmende(null);
        setFormData({
            infraction: '',
            montant: '',
            recidive: '',
            retrait_points: '',
            prison: '',
            immobilisation: 'Non',
            fourriere: 'Non',
            categorie: 'Autres infractions'
        });
        setShowModal(true);
    };

    const openEditModal = (amende) => {
        setEditingAmende(amende);
        setFormData({
            infraction: amende.infraction || '',
            montant: amende.montant || '',
            recidive: amende.recidive || '',
            retrait_points: amende.retrait_points || '',
            prison: amende.prison || '',
            immobilisation: amende.immobilisation || 'Non',
            fourriere: amende.fourriere || 'Non',
            categorie: amende.categorie || 'Autres infractions'
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const url = editingAmende ? `/api/amendes/${editingAmende.id}` : '/api/amendes';
            const method = editingAmende ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setShowModal(false);
                setEditingAmende(null);
                fetchAmendes();
            } else {
                const data = await response.json();
                alert(data.error || 'Erreur lors de l\'opération');
            }
        } catch (error) {
            console.error('Erreur:', error);
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
                                onClick={openCreateModal}
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
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={() => openEditModal(amende)}
                                                    style={{ padding: '4px 8px', fontSize: '12px', background: '#3498db' }}
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleDeleteAmende(amende.id)}
                                                    style={{ padding: '4px 8px', fontSize: '12px' }}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
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

            {/* Modal création / édition */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingAmende ? '✏️ Modifier l\'infraction' : '➕ Nouvelle infraction'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Nom de l'infraction *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.infraction}
                                    onChange={(e) => setFormData({ ...formData, infraction: e.target.value })}
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
                                        value={formData.montant}
                                        onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Récidive</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Ex: 1000$"
                                        value={formData.recidive}
                                        onChange={(e) => setFormData({ ...formData, recidive: e.target.value })}
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
                                        value={formData.retrait_points}
                                        onChange={(e) => setFormData({ ...formData, retrait_points: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Peine de prison</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Ex: 10 min"
                                        value={formData.prison}
                                        onChange={(e) => setFormData({ ...formData, prison: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Catégorie</label>
                                <select
                                    className="form-select"
                                    value={formData.categorie}
                                    onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
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
                                    {editingAmende ? 'Enregistrer' : 'Créer l\'infraction'}
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
