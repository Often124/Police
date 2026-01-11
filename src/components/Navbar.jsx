import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../App';

function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    const isActive = (path) => location.pathname === path;

    const closeMenu = () => setMenuOpen(false);

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Logo / Brand */}
                <Link to="/" className="navbar-brand" onClick={closeMenu}>
                    <div className="navbar-logo">🚔</div>
                    <div className="navbar-brand-text">
                        <div className="navbar-title">Police Nationale</div>
                        <div className="navbar-subtitle">Nova-RP</div>
                    </div>
                </Link>

                {/* Hamburger Button (Mobile) */}
                <button
                    className={`navbar-toggle ${menuOpen ? 'open' : ''}`}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                {/* Navigation Menu */}
                <div className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
                    <Link to="/" className={`navbar-link ${isActive('/') ? 'active' : ''}`} onClick={closeMenu}>
                        📊 Accueil
                    </Link>
                    <Link to="/amendes" className={`navbar-link ${isActive('/amendes') ? 'active' : ''}`} onClick={closeMenu}>
                        📋 Amendes
                    </Link>
                    <Link to="/rapports" className={`navbar-link ${isActive('/rapports') ? 'active' : ''}`} onClick={closeMenu}>
                        📝 Rapports
                    </Link>
                    <Link to="/nouveau-rapport" className={`navbar-link ${isActive('/nouveau-rapport') ? 'active' : ''}`} onClick={closeMenu}>
                        ➕ Nouveau
                    </Link>
                    <Link to="/casiers" className={`navbar-link ${isActive('/casiers') ? 'active' : ''}`} onClick={closeMenu}>
                        📁 Casiers
                    </Link>
                    <Link to="/siv" className={`navbar-link ${isActive('/siv') ? 'active' : ''}`} onClick={closeMenu}>
                        🚗 SIV
                    </Link>
                    <Link to="/wanted" className={`navbar-link ${isActive('/wanted') ? 'active' : ''}`} onClick={closeMenu}>
                        ☠️ Avis
                    </Link>
                    {user?.role === 'admin' && (
                        <>
                            <div className="navbar-divider"></div>
                            <Link to="/admin" className={`navbar-link ${isActive('/admin') ? 'active' : ''}`} onClick={closeMenu}>
                                ⚙️ Admin
                            </Link>
                            <Link to="/logs" className={`navbar-link ${isActive('/logs') ? 'active' : ''}`} onClick={closeMenu}>
                                📜 Logs
                            </Link>
                        </>
                    )}

                    {/* User Info (Mobile) */}
                    <div className="navbar-user-mobile">
                        <div className="navbar-user-info">
                            <div className="navbar-user-name">{user?.prenom} {user?.nom}</div>
                            <div className="navbar-user-role">{user?.grade} • {user?.matricule}</div>
                        </div>
                        <button className="navbar-logout" onClick={() => { logout(); closeMenu(); }}>
                            🚪 Déconnexion
                        </button>
                    </div>
                </div>

                {/* User Info (Desktop) */}
                <div className="navbar-user">
                    <div className="navbar-user-info">
                        <div className="navbar-user-name">{user?.prenom} {user?.nom}</div>
                        <div className="navbar-user-role">{user?.grade} • {user?.matricule}</div>
                    </div>
                    <button className="navbar-logout" onClick={logout}>
                        Déconnexion
                    </button>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
