import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function NouveauRapport() {
    const navigate = useNavigate();
    const [amendes, setAmendes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        citoyen_nom: '',
        citoyen_prenom: '',
        amende_id: '',
        montant_applique: '',
        lieu: '',
        est_recidive: false,
        description: ''
    });

    const [selectedAmende, setSelectedAmende] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchAmende, setSearchAmende] = useState('');

    useEffect(() => {
        fetchAmendes();
    }, []);

    const fetchAmendes = async () => {
        const token = localStorage.getItem('token');

        try {
            const [amendesRes, categoriesRes] = await Promise.all([
                fetch('/api/amendes', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('/api/amendes/categories/list', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (amendesRes.ok) {
                const data = await amendesRes.json();
                setAmendes(data);
            }

            if (categoriesRes.ok) {
                const catData = await categoriesRes.json();
                setCategories(catData);
            }
        } catch (error) {
            console.error('Erreur chargement amendes:', error);
        }

        setLoading(false);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const selectAmende = (amende) => {
        setSelectedAmende(amende);
        setFormData(prev => ({
            ...prev,
            amende_id: amende.id,
            montant_applique: prev.est_recidive && amende.recidive !== 'Non applicable'
                ? amende.recidive.split('+')[0].trim()
                : amende.montant
        }));
    };

    useEffect(() => {
        if (selectedAmende) {
            setFormData(prev => ({
                ...prev,
                montant_applique: prev.est_recidive && selectedAmende.recidive !== 'Non applicable'
                    ? selectedAmende.recidive.split('+')[0].trim()
                    : selectedAmende.montant
            }));
        }
    }, [formData.est_recidive, selectedAmende]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        const token = localStorage.getItem('token');

        try {
            const response = await fetch('/api/rapports', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la création du rapport');
            }

            setSuccess(true);
            setTimeout(() => {
                navigate('/rapports');
            }, 2000);
        } catch (err) {
            setError(err.message);
        }

        setSubmitting(false);
    };

    const filteredAmendes = amendes.filter(a => {
        const matchCategory = selectedCategory === 'all' || a.categorie === selectedCategory;
        const matchSearch = !searchAmende || a.infraction.toLowerCase().includes(searchAmende.toLowerCase());
        return matchCategory && matchSearch;
    });

    if (loading) {
        return (
            <main className="main-content">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Chargement...</p>
                </div>
            </main>
        );
    }

    if (success) {
        return (
            <main className="main-content">
                <div className="form-page">
                    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                        <h2 style={{ marginBottom: '0.5rem' }}>Rapport créé avec succès !</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Redirection vers la liste des rapports...</p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="main-content fade-in">
            <div className="page-header">
                <h1 className="page-title">➕ Nouveau rapport</h1>
                <p className="page-subtitle">
                    Créez un nouveau rapport de verbalisation
                </p>
            </div>

            <div className="form-page">
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="login-error" style={{ marginBottom: '1.5rem' }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="form-card">
                        {/* Informations du citoyen */}
                        <div className="form-section">
                            <h3 className="form-section-title">👤 Informations du citoyen</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label" htmlFor="citoyen_prenom">Prénom *</label>
                                    <input
                                        id="citoyen_prenom"
                                        name="citoyen_prenom"
                                        type="text"
                                        className="form-input"
                                        placeholder="Prénom du citoyen"
                                        value={formData.citoyen_prenom}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="citoyen_nom">Nom *</label>
                                    <input
                                        id="citoyen_nom"
                                        name="citoyen_nom"
                                        type="text"
                                        className="form-input"
                                        placeholder="Nom du citoyen"
                                        value={formData.citoyen_nom}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sélection de l'infraction */}
                        <div className="form-section">
                            <h3 className="form-section-title">📋 Infraction commise</h3>

                            <div className="form-row" style={{ marginBottom: '1rem' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="🔍 Rechercher une infraction..."
                                    value={searchAmende}
                                    onChange={(e) => setSearchAmende(e.target.value)}
                                />
                                <select
                                    className="form-select"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    <option value="all">Toutes les catégories</option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                                {filteredAmendes.map((amende) => (
                                    <div
                                        key={amende.id}
                                        className={`amende-selector ${selectedAmende?.id === amende.id ? 'selected' : ''}`}
                                        onClick={() => selectAmende(amende)}
                                        style={{
                                            margin: 0,
                                            borderRadius: 0,
                                            borderBottom: '1px solid var(--border-color)',
                                            padding: '1rem'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <strong>{amende.infraction}</strong>
                                            <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>{amende.montant}</span>
                                        </div>
                                        <small style={{ color: 'var(--text-muted)' }}>{amende.categorie}</small>
                                    </div>
                                ))}
                            </div>

                            {selectedAmende && (
                                <div className="amende-info" style={{ marginTop: '1rem' }}>
                                    <div className="amende-info-item">
                                        <div className="amende-info-label">Amende</div>
                                        <div className="amende-info-value" style={{ color: 'var(--secondary)' }}>{selectedAmende.montant}</div>
                                    </div>
                                    <div className="amende-info-item">
                                        <div className="amende-info-label">Récidive</div>
                                        <div className="amende-info-value" style={{ color: 'var(--accent-red)' }}>
                                            {selectedAmende.recidive !== 'Non applicable' ? selectedAmende.recidive : '-'}
                                        </div>
                                    </div>
                                    <div className="amende-info-item">
                                        <div className="amende-info-label">Points</div>
                                        <div className="amende-info-value">{selectedAmende.retrait_points !== 'Aucun' ? selectedAmende.retrait_points : '-'}</div>
                                    </div>
                                    <div className="amende-info-item">
                                        <div className="amende-info-label">Prison</div>
                                        <div className="amende-info-value">{selectedAmende.prison !== 'Aucune' ? selectedAmende.prison : '-'}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Détails du rapport */}
                        <div className="form-section">
                            <h3 className="form-section-title">📝 Détails du rapport</h3>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label" htmlFor="montant_applique">Montant appliqué</label>
                                    <input
                                        id="montant_applique"
                                        name="montant_applique"
                                        type="text"
                                        className="form-input"
                                        placeholder="Ex: 135€"
                                        value={formData.montant_applique}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="lieu">Lieu de l'infraction</label>
                                    <input
                                        id="lieu"
                                        name="lieu"
                                        type="text"
                                        className="form-input"
                                        placeholder="Ex: Boulevard Central"
                                        value={formData.lieu}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-checkbox">
                                    <input
                                        type="checkbox"
                                        name="est_recidive"
                                        checked={formData.est_recidive}
                                        onChange={handleChange}
                                    />
                                    <span>⚠️ Récidive (appliquer le tarif récidive)</span>
                                </label>
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="description">Description / Circonstances</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    className="form-textarea"
                                    placeholder="Décrivez les circonstances de l'infraction..."
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => navigate('/rapports')}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            disabled={submitting || !formData.citoyen_nom || !formData.citoyen_prenom}
                        >
                            {submitting ? 'Création...' : '✓ Créer le rapport'}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}

export default NouveauRapport;
