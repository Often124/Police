import { useState, useEffect } from 'react';

function Admin() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        nom: '',
        prenom: '',
        matricule: '',
        grade: 'Gardien de la Paix',
        role: 'agent'
    });

    const grades = [
        'Gardien de la Paix',
        'Brigadier',
        'Brigadier-Chef',
        'Major',
        'Lieutenant',
        'Capitaine',
        'Commandant',
        'Commissaire'
    ];

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const token = localStorage.getItem('token');

        try {
            const response = await fetch('/api/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Erreur chargement utilisateurs:', error);
        }

        setLoading(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setFormData({
            username: '',
            password: '',
            nom: '',
            prenom: '',
            matricule: '',
            grade: 'Gardien de la Paix',
            role: 'agent'
        });
        setError('');
        setShowModal(true);
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            password: '',
            nom: user.nom,
            prenom: user.prenom,
            matricule: user.matricule,
            grade: user.grade,
            role: user.role
        });
        setError('');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const token = localStorage.getItem('token');

        try {
            if (editingUser) {
                // Update user
                const response = await fetch(`/api/users/${editingUser.id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nom: formData.nom,
                        prenom: formData.prenom,
                        matricule: formData.matricule,
                        grade: formData.grade,
                        role: formData.role
                    })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error);

                // Update password if provided
                if (formData.password) {
                    const pwdResponse = await fetch(`/api/users/${editingUser.id}/password`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ password: formData.password })
                    });

                    const pwdData = await pwdResponse.json();
                    if (!pwdResponse.ok) throw new Error(pwdData.error);
                }

                setSuccess('Utilisateur modifié avec succès');
            } else {
                // Create user
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error);

                setSuccess('Utilisateur créé avec succès');
            }

            setShowModal(false);
            fetchUsers();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message);
        }
    };

    const deleteUser = async (userId) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            setSuccess('Utilisateur supprimé');
            fetchUsers();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            alert(err.message);
        }
    };

    const getInitials = (prenom, nom) => {
        return `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase();
    };

    if (loading) {
        return (
            <main className="main-content">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Chargement des utilisateurs...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="main-content fade-in">
            <div className="page-header">
                <h1 className="page-title">⚙️ Administration</h1>
                <p className="page-subtitle">
                    Gestion des utilisateurs et des accès
                </p>
            </div>

            {success && (
                <div className="toast toast-success">
                    ✅ {success}
                </div>
            )}

            <div className="card">
                <div className="admin-header">
                    <h2 className="card-title">👥 Utilisateurs ({users.length})</h2>
                    <button className="btn btn-primary" onClick={openCreateModal}>
                        ➕ Nouvel utilisateur
                    </button>
                </div>

                <div>
                    {users.map((user) => (
                        <div key={user.id} className="user-card">
                            <div className="user-info">
                                <div className="user-avatar">{getInitials(user.prenom, user.nom)}</div>
                                <div className="user-details">
                                    <h4>{user.prenom} {user.nom}</h4>
                                    <p>{user.grade} • {user.matricule}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span className={`badge ${user.role === 'admin' ? 'badge-warning' : 'badge-info'}`}>
                                    {user.role === 'admin' ? '👑 Admin' : '👮 Agent'}
                                </span>
                                <div className="user-actions">
                                    <button
                                        className="btn btn-sm btn-outline"
                                        onClick={() => openEditModal(user)}
                                    >
                                        ✏️ Modifier
                                    </button>
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => deleteUser(user.id)}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {editingUser ? '✏️ Modifier l\'utilisateur' : '➕ Nouvel utilisateur'}
                            </h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {error && (
                                    <div className="login-error" style={{ marginBottom: '1rem' }}>
                                        ⚠️ {error}
                                    </div>
                                )}

                                {!editingUser && (
                                    <div className="form-group">
                                        <label className="form-label">Identifiant *</label>
                                        <input
                                            name="username"
                                            type="text"
                                            className="form-input"
                                            value={formData.username}
                                            onChange={handleChange}
                                            required={!editingUser}
                                        />
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">
                                        Mot de passe {editingUser ? '(laisser vide pour ne pas changer)' : '*'}
                                    </label>
                                    <input
                                        name="password"
                                        type="password"
                                        className="form-input"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required={!editingUser}
                                        minLength={6}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Prénom *</label>
                                        <input
                                            name="prenom"
                                            type="text"
                                            className="form-input"
                                            value={formData.prenom}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Nom *</label>
                                        <input
                                            name="nom"
                                            type="text"
                                            className="form-input"
                                            value={formData.nom}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Matricule *</label>
                                    <input
                                        name="matricule"
                                        type="text"
                                        className="form-input"
                                        placeholder="Ex: PN-123"
                                        value={formData.matricule}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Grade</label>
                                        <select
                                            name="grade"
                                            className="form-select"
                                            value={formData.grade}
                                            onChange={handleChange}
                                        >
                                            {grades.map((g) => (
                                                <option key={g} value={g}>{g}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Rôle</label>
                                        <select
                                            name="role"
                                            className="form-select"
                                            value={formData.role}
                                            onChange={handleChange}
                                        >
                                            <option value="agent">Agent</option>
                                            <option value="admin">Administrateur</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                                    Annuler
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingUser ? '💾 Enregistrer' : '➕ Créer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}

export default Admin;
