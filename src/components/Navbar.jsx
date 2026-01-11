import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../App';

function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-brand">
                    <div className="navbar-logo">🚔</div>
                    <div>
                        <div className="navbar-title">Police Nationale</div>
                        <div className="navbar-subtitle">Nova-RP Intranet</div>
                    </div>
                </Link>

                <div className="navbar-menu">
                    <Link to="/" className={`navbar-link ${isActive('/') ? 'active' : ''}`}>
                        📊 Tableau de bord
                    </Link>
                    <Link to="/amendes" className={`navbar-link ${isActive('/amendes') ? 'active' : ''}`}>
                        📋 Amendes
                    </Link>
                    <Link to="/rapports" className={`navbar-link ${isActive('/rapports') ? 'active' : ''}`}>
                        📝 Rapports
                    </Link>
                    <Link to="/nouveau-rapport" className={`navbar-link ${isActive('/nouveau-rapport') ? 'active' : ''}`}>
                        ➕ Nouveau
                    </Link>
                    <Link to="/casiers" className={`navbar-link ${isActive('/casiers') ? 'active' : ''}`}>
                        📁 Casiers
                    </Link>
                    <Link to="/siv" className={`navbar-link ${isActive('/siv') ? 'active' : ''}`}>
                        🚗 SIV
                    </Link>
                    <Link to="/wanted" className={`navbar-link ${isActive('/wanted') ? 'active' : ''}`}>
                        ☠️ Recherche
                    </Link>
                    {user?.role === 'admin' && (
                        <>
                            <Link to="/admin" className={`navbar-link ${isActive('/admin') ? 'active' : ''}`}>
                                ⚙️ Admin
                            </Link>
                            <Link to="/logs" className={`navbar-link ${isActive('/logs') ? 'active' : ''}`}>
                                📜 Logs
                            </Link>
                        </>
                    )}
                </div>

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
