import { useState } from 'react';

function Siv() {
    const [plate, setPlate] = useState('');
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!plate.trim()) return;

        setLoading(true);
        setError('');
        setVehicles([]);
        setSearched(false);

        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`/api/siv/${plate}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setVehicles(data);
            } else {
                setError('Erreur lors de la recherche');
            }
        } catch (err) {
            setError('Erreur serveur');
        } finally {
            setLoading(false);
            setSearched(true);
        }
    };

    return (
        <main className="main-content fade-in">
            <div className="page-header">
                <h1 className="page-title">🚗 Système SIV</h1>
                <p className="page-subtitle">Recherche de véhicules et propriétaires</p>
            </div>

            <div className="card" style={{ maxWidth: '600px', margin: '0 auto 2rem' }}>
                <form onSubmit={handleSearch} className="search-form" style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Plaque d'immatriculation (ex: AB-123-CD)"
                        value={plate}
                        onChange={(e) => setPlate(e.target.value.toUpperCase())}
                        style={{ fontSize: '1.2rem', textAlign: 'center', letterSpacing: '2px' }}
                    />
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? '...' : '🔍 Rechercher'}
                    </button>
                </form>
            </div>

            {error && <div className="toast toast-error">⚠️ {error}</div>}

            {searched && vehicles.length === 0 && !error && (
                <div className="empty-state">
                    <div className="empty-icon">🤷‍♂️</div>
                    <h3>Aucun véhicule trouvé</h3>
                    <p>Aucun véhicule ne correspond à la plaque "{plate}"</p>
                </div>
            )}

            <div className="results-grid" style={{ display: 'grid', gap: '1.5rem' }}>
                {vehicles.map((vehicle) => (
                    <div key={vehicle.plate} className="card vehicle-card">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 className="card-title" style={{ fontSize: '1.5rem', fontFamily: 'monospace' }}>
                                {vehicle.plate}
                            </h2>
                            <span className="badge badge-info">{vehicle.model.toUpperCase()}</span>
                        </div>

                        <div className="vehicle-details" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Véhicule</h4>
                                <p><strong>Couleur:</strong> {vehicle.color}</p>
                                <p><strong>État:</strong> {vehicle.state || 'Inconnu'}</p>
                            </div>

                            <div>
                                <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Propriétaire</h4>
                                {vehicle.owner ? (
                                    <>
                                        <p><strong>Nom:</strong> {vehicle.owner.firstname} {vehicle.owner.lastname}</p>
                                        <p><strong>Tel:</strong> {vehicle.owner.phone_number}</p>
                                        <p><strong>Né(e) le:</strong> {vehicle.owner.birthdate}</p>
                                    </>
                                ) : (
                                    <p className="text-muted">Inconnu</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}

export default Siv;
