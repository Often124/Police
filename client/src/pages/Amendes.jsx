import { useState, useEffect } from 'react';

function Amendes() {
    const [amendes, setAmendes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

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
                                <th>Immob.</th>
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
                                    <td>
                                        {amende.immobilisation !== 'Non' && amende.immobilisation !== '///'
                                            ? <span className="badge badge-info">{amende.immobilisation}</span>
                                            : '-'
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">🔍</div>
                        <h3>Aucune infraction trouvée</h3>
                        <p>Modifiez vos critères de recherche.</p>
                    </div>
                )}
            </div>
        </main>
    );
}

export default Amendes;
