import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

function NouveauRapport() {
    const navigate = useNavigate();
    const [amendes, setAmendes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Citoyen selection
    const [citoyenSearch, setCitoyenSearch] = useState('');
    const [citoyenResults, setCitoyenResults] = useState([]);
    const [selectedCitoyen, setSelectedCitoyen] = useState(null);
    const [showCreateCitoyen, setShowCreateCitoyen] = useState(false);
    const [searchingCitoyen, setSearchingCitoyen] = useState(false);

    const [formData, setFormData] = useState({
        citoyen_nom: '',
        citoyen_prenom: '',
        lieu: '',
        est_recidive: false,
        description: ''
    });

    const [newCitoyenData, setNewCitoyenData] = useState({
        nom: '',
        prenom: '',
        date_naissance: '',
        telephone: '',
        adresse: ''
    });

    const [selectedAmendes, setSelectedAmendes] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchAmende, setSearchAmende] = useState('');

    // Récidive detection
    const [previousInfractionIds, setPreviousInfractionIds] = useState([]);
    const [recidiveInfo, setRecidiveInfo] = useState(null);

    useEffect(() => {
        fetchAmendes();
    }, []);

    // Search citoyens
    const searchCitoyens = useCallback(async (query) => {
        if (!query || query.length < 2) {
            setCitoyenResults([]);
            return;
        }

        const token = localStorage.getItem('token');
        setSearchingCitoyen(true);

        try {
            const response = await fetch(`/api/citoyens/search/${encodeURIComponent(query)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setCitoyenResults(data);
            }
        } catch (error) {
            console.error('Erreur recherche citoyens:', error);
        }

        setSearchingCitoyen(false);
    }, []);

    // Debounced citoyen search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            searchCitoyens(citoyenSearch);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [citoyenSearch, searchCitoyens]);

    // Check recidive when citoyen is selected
    const checkRecidive = useCallback(async (citoyenId) => {
        if (!citoyenId) {
            setPreviousInfractionIds([]);
            setRecidiveInfo(null);
            return;
        }

        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`/api/citoyens/${citoyenId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                const infractions = data.rapports
                    ?.filter(r => r.amende_id)
                    .map(r => r.amende_id) || [];
                setPreviousInfractionIds([...new Set(infractions)]);
                setRecidiveInfo({
                    isRecidiviste: data.stats?.totalRapports > 0,
                    totalPreviousReports: data.stats?.totalRapports || 0
                });

                if (data.stats?.totalRapports > 0) {
                    setFormData(prev => ({ ...prev, est_recidive: true }));
                }
            }
        } catch (error) {
            console.error('Erreur vérification récidive:', error);
        }
    }, []);

    const selectCitoyen = (citoyen) => {
        setSelectedCitoyen(citoyen);
        setFormData(prev => ({
            ...prev,
            citoyen_nom: citoyen.nom,
            citoyen_prenom: citoyen.prenom
        }));
        setCitoyenSearch('');
        setCitoyenResults([]);
        checkRecidive(citoyen.id);
    };

    const clearCitoyen = () => {
        setSelectedCitoyen(null);
        setFormData(prev => ({
            ...prev,
            citoyen_nom: '',
            citoyen_prenom: ''
        }));
        setPreviousInfractionIds([]);
        setRecidiveInfo(null);
    };

    const createCitoyen = async () => {
        if (!newCitoyenData.nom || !newCitoyenData.prenom) {
            alert('Nom et prénom requis');
            return;
        }

        const token = localStorage.getItem('token');

        try {
            const response = await fetch('/api/citoyens', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newCitoyenData)
            });

            if (response.ok) {
                const citoyen = await response.json();
                selectCitoyen(citoyen);
                setShowCreateCitoyen(false);
                setNewCitoyenData({
                    nom: '',
                    prenom: '',
                    date_naissance: '',
                    telephone: '',
                    adresse: ''
                });
            } else {
                const data = await response.json();
                alert(data.error || 'Erreur lors de la création');
            }
        } catch (error) {
            console.error('Erreur création citoyen:', error);
        }
    };

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

    const toggleAmende = (amende) => {
        setSelectedAmendes(prev => {
            const exists = prev.find(a => a.id === amende.id);
            if (exists) {
                return prev.filter(a => a.id !== amende.id);
            } else {
                return [...prev, amende];
            }
        });
    };

    const removeAmende = (amendeId) => {
        setSelectedAmendes(prev => prev.filter(a => a.id !== amendeId));
    };

    const isRecidiveInfraction = (amendeId) => {
        return previousInfractionIds.includes(amendeId);
    };

    const calculateTotal = () => {
        let total = 0;
        selectedAmendes.forEach(amende => {
            const isRecidive = formData.est_recidive && amende.recidive !== 'Non applicable';
            const montantStr = isRecidive ? amende.recidive : amende.montant;
            const montant = parseInt(montantStr?.replace(/[^0-9]/g, '') || '0');
            total += montant;
        });
        return total;
    };

    const calculateTotalPoints = () => {
        let total = 0;
        selectedAmendes.forEach(amende => {
            if (amende.retrait_points && amende.retrait_points !== 'Aucun' && amende.retrait_points !== '///' && !amende.retrait_points.toLowerCase().includes('suppr')) {
                const points = parseInt(amende.retrait_points.replace(/[^0-9]/g, '') || '0');
                total += points;
            }
        });
        const suppressionPermis = selectedAmendes.some(a =>
            a.retrait_points?.toLowerCase().includes('suppr')
        );
        return { total, suppressionPermis };
    };

    const calculateTotalPrison = () => {
        let totalMinutes = 0;
        selectedAmendes.forEach(amende => {
            const useRecidivePrison = formData.est_recidive || isRecidiveInfraction(amende.id);

            let prisonStr = amende.prison;

            // Si récidive, chercher d'abord les minutes dans le champ recidive
            if (useRecidivePrison && amende.recidive && amende.recidive !== 'Non applicable') {
                const recidiveMatch = amende.recidive.match(/(\d+)\s*(minutes?|min)/i);
                if (recidiveMatch) {
                    totalMinutes += parseInt(recidiveMatch[1]);
                    return;
                }
            }

            // Parser la peine de prison normale
            if (prisonStr && prisonStr !== 'Aucune' && prisonStr !== '///' && prisonStr.toLowerCase() !== 'aucune') {
                // Essayer plusieurs formats: "12 minutes", "12minutes", "12 min", "12min", ou juste un nombre
                const match = prisonStr.match(/(\d+)\s*(minutes?|min)?/i);
                if (match) {
                    totalMinutes += parseInt(match[1]);
                }
            }
        });
        return totalMinutes;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        const token = localStorage.getItem('token');

        const { total: totalPoints, suppressionPermis } = calculateTotalPoints();
        const totalPrison = calculateTotalPrison();

        const infractionsText = selectedAmendes.map(a => {
            const isRecidive = formData.est_recidive || isRecidiveInfraction(a.id);
            const montant = isRecidive && a.recidive !== 'Non applicable' ? a.recidive : a.montant;
            const recidiveTag = isRecidiveInfraction(a.id) ? ' [RÉCIDIVE]' : '';
            return `- ${a.infraction}${recidiveTag} (${montant})`;
        }).join('\n');

        let summaryText = '';
        if (selectedAmendes.length > 0) {
            summaryText = `INFRACTIONS COMMISES:\n${infractionsText}\n\n`;
            summaryText += `TOTAL: ${calculateTotal()}€`;
            if (totalPoints > 0 || suppressionPermis) {
                summaryText += ` | Points: ${suppressionPermis ? 'SUPPRESSION PERMIS' : `-${totalPoints}`}`;
            }
            if (totalPrison > 0) {
                summaryText += ` | Prison: ${totalPrison} min`;
            }
            summaryText += '\n\n';
        }

        const fullDescription = summaryText + formData.description;

        try {
            const response = await fetch('/api/rapports', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    citoyen_id: selectedCitoyen?.id || null,
                    citoyen_nom: formData.citoyen_nom,
                    citoyen_prenom: formData.citoyen_prenom,
                    amende_id: selectedAmendes.length > 0 ? selectedAmendes[0].id : null,
                    montant_applique: calculateTotal() > 0 ? `${calculateTotal()}€` : null,
                    lieu: formData.lieu,
                    est_recidive: formData.est_recidive,
                    description: fullDescription
                })
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

    const { total: totalPoints, suppressionPermis } = calculateTotalPoints();
    const totalPrison = calculateTotalPrison();

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
                        {/* Sélection du citoyen */}
                        <div className="form-section">
                            <h3 className="form-section-title">👤 Citoyen interpellé</h3>

                            {selectedCitoyen ? (
                                <div style={{
                                    padding: '1rem',
                                    background: 'var(--bg-elevated)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--primary)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <strong style={{ fontSize: '1.1rem' }}>
                                            {selectedCitoyen.prenom} {selectedCitoyen.nom}
                                        </strong>
                                        {selectedCitoyen.date_naissance && (
                                            <span style={{ marginLeft: '1rem', color: 'var(--text-muted)' }}>
                                                Né(e) le {selectedCitoyen.date_naissance}
                                            </span>
                                        )}
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                            ID: #{selectedCitoyen.id}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={clearCitoyen}
                                    >
                                        Changer
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="🔍 Rechercher un citoyen existant..."
                                            value={citoyenSearch}
                                            onChange={(e) => setCitoyenSearch(e.target.value)}
                                        />
                                        {searchingCitoyen && (
                                            <small style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                                Recherche...
                                            </small>
                                        )}
                                    </div>

                                    {/* Résultats de recherche */}
                                    {citoyenResults.length > 0 && (
                                        <div style={{
                                            marginTop: '0.5rem',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: 'var(--radius-md)',
                                            maxHeight: '200px',
                                            overflowY: 'auto'
                                        }}>
                                            {citoyenResults.map(citoyen => (
                                                <div
                                                    key={citoyen.id}
                                                    onClick={() => selectCitoyen(citoyen)}
                                                    style={{
                                                        padding: '0.75rem 1rem',
                                                        cursor: 'pointer',
                                                        borderBottom: '1px solid var(--border-color)',
                                                        transition: 'background 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.background = 'var(--bg-elevated)'}
                                                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                                >
                                                    <strong>{citoyen.prenom} {citoyen.nom}</strong>
                                                    {citoyen.date_naissance && (
                                                        <span style={{ marginLeft: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                            {citoyen.date_naissance}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>ou</span>
                                        <button
                                            type="button"
                                            className="btn btn-success"
                                            onClick={() => setShowCreateCitoyen(true)}
                                        >
                                            ➕ Créer un nouveau citoyen
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Recidive alert */}
                            {recidiveInfo && recidiveInfo.isRecidiviste && (
                                <div style={{
                                    marginTop: '1rem',
                                    padding: '1rem',
                                    background: 'rgba(231, 76, 60, 0.1)',
                                    border: '1px solid #e74c3c',
                                    borderRadius: 'var(--radius-md)',
                                    color: '#e74c3c'
                                }}>
                                    ⚠️ <strong>RÉCIDIVISTE DÉTECTÉ !</strong> Ce citoyen a déjà {recidiveInfo.totalPreviousReports} rapport(s) enregistré(s).
                                </div>
                            )}
                        </div>

                        {/* Infractions sélectionnées */}
                        {selectedAmendes.length > 0 && (
                            <div className="form-section">
                                <h3 className="form-section-title">✅ Infractions sélectionnées ({selectedAmendes.length})</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {selectedAmendes.map(amende => {
                                        const isRecidive = isRecidiveInfraction(amende.id);
                                        return (
                                            <div
                                                key={amende.id}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '0.75rem 1rem',
                                                    background: isRecidive ? 'rgba(231, 76, 60, 0.1)' : 'var(--bg-elevated)',
                                                    borderRadius: 'var(--radius-md)',
                                                    border: isRecidive ? '1px solid #e74c3c' : '1px solid var(--primary)'
                                                }}
                                            >
                                                <div>
                                                    <strong>{amende.infraction}</strong>
                                                    {isRecidive && (
                                                        <span style={{ marginLeft: '0.5rem', background: '#e74c3c', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>
                                                            RÉCIDIVE
                                                        </span>
                                                    )}
                                                    <span style={{ marginLeft: '1rem', color: '#d4af37' }}>
                                                        {(formData.est_recidive || isRecidive) && amende.recidive !== 'Non applicable'
                                                            ? amende.recidive
                                                            : amende.montant}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAmende(amende.id)}
                                                    style={{
                                                        background: '#e74c3c',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '50%',
                                                        width: '24px',
                                                        height: '24px',
                                                        cursor: 'pointer',
                                                        fontSize: '14px'
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        );
                                    })}

                                    {/* Résumé des totaux */}
                                    <div style={{
                                        marginTop: '0.5rem',
                                        padding: '1rem',
                                        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                                        borderRadius: 'var(--radius-md)',
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(3, 1fr)',
                                        gap: '1rem',
                                        textAlign: 'center'
                                    }}>
                                        <div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>💰 Montant total</div>
                                            <strong style={{ fontSize: '1.3rem', color: '#d4af37' }}>{calculateTotal()}€</strong>
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>🪪 Points de permis</div>
                                            <strong style={{ fontSize: '1.3rem', color: suppressionPermis ? '#e74c3c' : '#f39c12' }}>
                                                {suppressionPermis ? 'SUPPRESSION' : (totalPoints > 0 ? `-${totalPoints}` : '-')}
                                            </strong>
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>⛓️ Peine de prison</div>
                                            <strong style={{ fontSize: '1.3rem', color: totalPrison > 0 ? '#e74c3c' : 'var(--text-muted)' }}>
                                                {totalPrison > 0 ? `${totalPrison} min` : '-'}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Sélection des infractions */}
                        <div className="form-section">
                            <h3 className="form-section-title">📋 Ajouter des infractions</h3>

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

                            <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                                {filteredAmendes.map((amende) => {
                                    const isSelected = selectedAmendes.find(a => a.id === amende.id);
                                    const isRecidive = isRecidiveInfraction(amende.id);
                                    return (
                                        <div
                                            key={amende.id}
                                            onClick={() => toggleAmende(amende)}
                                            style={{
                                                margin: 0,
                                                borderRadius: 0,
                                                borderBottom: '1px solid var(--border-color)',
                                                padding: '0.75rem 1rem',
                                                cursor: 'pointer',
                                                background: isSelected ? 'rgba(0, 212, 170, 0.1)' : (isRecidive ? 'rgba(231, 76, 60, 0.05)' : 'transparent'),
                                                borderLeft: isSelected ? '3px solid var(--primary)' : (isRecidive ? '3px solid #e74c3c' : '3px solid transparent')
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <span style={{ marginRight: '0.5rem' }}>{isSelected ? '✅' : '⬜'}</span>
                                                    <strong>{amende.infraction}</strong>
                                                    {isRecidive && (
                                                        <span style={{ marginLeft: '0.5rem', background: '#e74c3c', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem' }}>
                                                            ⚠️ RÉCIDIVE
                                                        </span>
                                                    )}
                                                </div>
                                                <span style={{ color: '#d4af37', fontWeight: 600 }}>{amende.montant}</span>
                                            </div>
                                            <small style={{ color: 'var(--text-muted)', marginLeft: '1.5rem' }}>{amende.categorie}</small>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Détails du rapport */}
                        <div className="form-section">
                            <h3 className="form-section-title">📝 Détails du rapport</h3>

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

                            <div className="form-group">
                                <label className="form-checkbox">
                                    <input
                                        type="checkbox"
                                        name="est_recidive"
                                        checked={formData.est_recidive}
                                        onChange={handleChange}
                                    />
                                    <span>⚠️ Appliquer le tarif récidive à toutes les infractions</span>
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
                            disabled={submitting || (!selectedCitoyen && (!formData.citoyen_nom || !formData.citoyen_prenom))}
                        >
                            {submitting ? 'Création...' : `✓ Créer le rapport${selectedAmendes.length > 0 ? ` (${calculateTotal()}€)` : ''}`}
                        </button>
                    </div>
                </form>
            </div>

            {/* Modal création citoyen */}
            {showCreateCitoyen && (
                <div className="modal-overlay" onClick={() => setShowCreateCitoyen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>➕ Nouveau citoyen</h2>
                            <button className="modal-close" onClick={() => setShowCreateCitoyen(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Prénom *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={newCitoyenData.prenom}
                                        onChange={(e) => setNewCitoyenData({ ...newCitoyenData, prenom: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Nom *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={newCitoyenData.nom}
                                        onChange={(e) => setNewCitoyenData({ ...newCitoyenData, nom: e.target.value })}
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
                                        value={newCitoyenData.date_naissance}
                                        onChange={(e) => setNewCitoyenData({ ...newCitoyenData, date_naissance: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Téléphone</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Ex: 06 12 34 56 78"
                                        value={newCitoyenData.telephone}
                                        onChange={(e) => setNewCitoyenData({ ...newCitoyenData, telephone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Adresse</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Adresse du citoyen"
                                    value={newCitoyenData.adresse}
                                    onChange={(e) => setNewCitoyenData({ ...newCitoyenData, adresse: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-outline" onClick={() => setShowCreateCitoyen(false)}>
                                Annuler
                            </button>
                            <button type="button" className="btn btn-primary" onClick={createCitoyen}>
                                Créer et sélectionner
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default NouveauRapport;
