import { useState } from 'react';
import { useAuth } from '../App';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(username, password);
        } catch (err) {
            setError(err.message);
        }

        setLoading(false);
    };

    return (
        <div className="login-page">
            <div className="login-container fade-in">
                <div className="login-header">
                    <div className="login-logo">🚔</div>
                    <h1 className="login-title">Police Nationale</h1>
                    <p className="login-subtitle">Nova-RP Intranet</p>
                </div>

                <div className="login-card">
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="login-error">
                                ⚠️ {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label" htmlFor="username">
                                Identifiant
                            </label>
                            <input
                                id="username"
                                type="text"
                                className="form-input"
                                placeholder="Entrez votre identifiant"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoComplete="username"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="password">
                                Mot de passe
                            </label>
                            <input
                                id="password"
                                type="password"
                                className="form-input"
                                placeholder="Entrez votre mot de passe"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg login-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span>
                                    Connexion...
                                </>
                            ) : (
                                '🔐 Se connecter'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;
