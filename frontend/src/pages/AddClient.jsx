import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { UserPlus, User, Mail, Lock, Phone, ArrowLeft, Shield } from 'lucide-react';

const AddClient = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'client',
        phone: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            // Direct registration by trainer assigns the client to them (handled in backend usually)
            await api.post('/auth/register', formData);
            setSuccess(true);
            setTimeout(() => navigate('/trainer/clients'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao registar cliente.');
        }
    };

    return (
        <div className="add-client-container animate-fade">
            <header className="page-header">
                <button className="btn-back" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </button>
                <div className="header-text">
                    <h1>Registar Novo Cliente</h1>
                    <p>Crie uma conta para o seu novo aluno.</p>
                </div>
            </header>

            <div className="glass form-card">
                {success ? (
                    <div className="success-message">
                        Cliente registado com sucesso! Redirecionando...
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {error && <div className="error-message">{error}</div>}

                        <div className="form-grid">
                            <div className="input-group">
                                <label><User size={16} /> Nome</label>
                                <input
                                    type="text"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>Apelido</label>
                                <input
                                    type="text"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label><Shield size={16} /> Username</label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label><Mail size={16} /> E-mail</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label><Phone size={16} /> Telemóvel</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        <div className="input-group">
                            <label><Lock size={16} /> Senha Temporária</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>

                        <button type="submit" className="btn-primary full-width">
                            <UserPlus size={20} /> Concluir Registo
                        </button>
                    </form>
                )}
            </div>

            <style jsx>{`
        .add-client-container { display: flex; flex-direction: column; gap: 2rem; max-width: 600px; margin: 0 auto; }
        .page-header { display: flex; align-items: center; gap: 1.5rem; }
        .btn-back { background: var(--glass-bg); border: 1px solid var(--border-color); padding: 0.5rem; border-radius: 0.5rem; cursor: pointer; color: var(--text-primary); }
        .form-card { padding: 2.5rem; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .input-group { text-align: left; margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .input-group label { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; font-size: 0.9rem; }
        .input-group input { padding: 0.75rem; border-radius: 0.5rem; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary); }
        .full-width { width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 1rem; }
        .error-message { color: #ef4444; background: #fee2e2; padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 1.5rem; font-size: 0.9rem; }
        .success-message { color: #10b981; background: #d1fae5; padding: 1rem; border-radius: 0.5rem; text-align: center; }
      `}</style>
        </div>
    );
};

export default AddClient;
