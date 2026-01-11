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

    const [formData, setFormData] = useState({
        citoyen_nom: '',
        citoyen_prenom: '',
        lieu: '',
        est_recidive: false,
        description: ''
    });

    const [selectedAmendes, setSelectedAmendes] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchAmende, setSearchAmende] = useState('');

    // Récidive detection
    const [previousInfractionIds, setPreviousInfractionIds] = useState([]);
    const [checkingRecidive, setCheckingRecidive] = useState(false);
    const [recidiveInfo, setRecidiveInfo] = useState(null);

    useEffect(() => {
        fetchAmendes();
    }, []);

    // Check recidive when citizen name changes
    const checkRecidive = useCallback(async (nom, prenom) => {
        if (!nom || !prenom || nom.length < 2 || prenom.length < 2) {
            setPreviousInfractionIds([]);
            setRecidiveInfo(null);
            return;
        }

        const token = localStorage.getItem('token');
        setCheckingRecidive(true);

        try {
            const response = await fetch(`/api/rapports/recidive/${encodeURIComponent(nom)}/${encodeURIComponent(prenom)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setPreviousInfractionIds(data.previousInfractionIds || []);
                setRecidiveInfo(data);

                // Auto-enable recidive if citizen has previous infractions
                if (data.isRecidiviste) {
                    setFormData(prev => ({ ...prev, est_recidive: true }));
                }
            }
        } catch (error) {
            console.error('Erreur vérification récidive:', error);
        }

        setCheckingRecidive(false);
    }, []);

    // Debounced recidive check
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            checkRecidive(formData.citoyen_nom, formData.citoyen_prenom);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [formData.citoyen_nom, formData.citoyen_prenom, checkRecidive]);

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

    // Check if infraction is a recidive for this citizen
    const isRecidiveInfraction = (amendeId) => {
        return previousInfractionIds.includes(amendeId);
    };

    // Calcul du montant total
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

    // Calcul du total des points de permis
    const calculateTotalPoints = () => {
        let total = 0;
        selectedAmendes.forEach(amende => {
            if (amende.retrait_points && amende.retrait_points !== 'Aucun' && amende.retrait_points !== '///' && amende.retrait_points !== 'supression du permis') {
                const points = parseInt(amende.retrait_points.replace(/[^0-9]/g, '') || '0');
                total += points;
            }
        });
        const suppressionPermis = selectedAmendes.some(a =>
            a.retrait_points?.toLowerCase().includes('supression') ||
            a.retrait_points?.toLowerCase().includes('suppression')
        );
        return { total, suppressionPermis };
    };

    // Calcul du total de la peine de prison (avec récidive automatique)
    const calculateTotalPrison = () => {
        let totalMinutes = 0;
        selectedAmendes.forEach(amende => {
            // Use recidive prison time if this specific infraction was committed before by this citizen
            const useRecidivePrison = formData.est_recidive || isRecidiveInfraction(amende.id);

            let prisonStr = amende.prison;

            // If recidive, try to extract prison from recidive field
            if (useRecidivePrison && amende.recidive !== 'Non applicable') {
                // Check if recidive field contains prison time
                const recidiveMatch = amende.recidive?.match(/(\d+)\s*(minutes?|min)/i);
                if (recidiveMatch) {
                    totalMinutes += parseInt(recidiveMatch[1]);
                    return; // Skip normal prison extraction
                }
            }

            if (prisonStr && prisonStr !== 'Aucune' && prisonStr !== '///') {
                const match = prisonStr.match(/(\d+)\s*(minutes?|min)/i);
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
                                    {checkingRecidive && ' Vérification...'}
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
                            disabled={submitting || !formData.citoyen_nom || !formData.citoyen_prenom}
                        >
                            {submitting ? 'Création...' : `✓ Créer le rapport${selectedAmendes.length > 0 ? ` (${calculateTotal()}€)` : ''}`}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}

export default NouveauRapport;
