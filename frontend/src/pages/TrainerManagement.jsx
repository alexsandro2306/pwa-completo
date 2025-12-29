import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Check, X, Trash2, User, Clock, AlertCircle } from 'lucide-react';

const TrainerManagement = () => {
    const [pendingTrainers, setPendingTrainers] = useState([]);
    const [activeTrainers, setActiveTrainers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            // 1. Buscar trainers PENDENTES (não validados)
            const pendingRes = await api.get('/admin/trainers/pending');
            setPendingTrainers(pendingRes.data.data || []);

            // 2. Buscar TODOS os users e filtrar trainers VALIDADOS
            const usersRes = await api.get('/admin/users');
            const allUsers = usersRes.data.data || [];
            const validatedTrainers = allUsers.filter(u => u.role === 'trainer' && u.isValidated === true);
            setActiveTrainers(validatedTrainers);
        } catch (err) {
            console.error('Erro ao carregar dados:', err);
            setError('Falha ao carregar dados dos treinadores.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleValidate = async (id) => {
        try {
            await api.patch(`/admin/trainers/${id}/validate`);
            fetchData(); // Recarregar dados
        } catch (err) {
            alert('Erro ao validar treinador.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja remover este treinador?')) return;
        try {
            await api.delete(`/admin/trainers/${id}`);
            fetchData(); // Recarregar dados
        } catch (err) {
            alert('Erro ao remover treinador.');
        }
    };

    if (loading) return <div className="loading">Carregando gestão de trainers...</div>;

    return (
        <div className="trainer-mgmt animate-fade">
            <header className="section-header">
                <h2>Gestão de Personal Trainers</h2>
                <p>Valide novos registos e gira os treinadores ativos na plataforma.</p>
            </header>

            {error && <div className="error-message glass">{error}</div>}

            {/* PENDENTES */}
            <section className="mgmt-section">
                <div className="section-title">
                    <Clock size={20} />
                    <h3>Pendentes de Validação ({pendingTrainers.length})</h3>
                </div>
                <div className="trainer-grid">
                    {pendingTrainers.length === 0 ? (
                        <p className="empty-msg glass">Nenhum treinador pendente no momento.</p>
                    ) : (
                        pendingTrainers.map(trainer => (
                            <div key={trainer._id} className="glass trainer-card pending">
                                <div className="trainer-info">
                                    <div className="avatar">
                                        {trainer.avatar ? (
                                            <img src={`http://localhost:5000${trainer.avatar}`} alt={trainer.firstName} />
                                        ) : (
                                            <User size={24} />
                                        )}
                                    </div>
                                    <div>
                                        <h4>{trainer.firstName} {trainer.lastName}</h4>
                                        <span>{trainer.username ? `@${trainer.username}` : trainer.email}</span>
                                    </div>
                                </div>
                                <div className="actions">
                                    <button onClick={() => handleValidate(trainer._id)} className="btn-icon approve" title="Validar">
                                        <Check size={20} />
                                    </button>
                                    <button onClick={() => handleDelete(trainer._id)} className="btn-icon reject" title="Rejeitar/Excluir">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* ATIVOS */}
            <section className="mgmt-section mt-4">
                <div className="section-title">
                    <User size={20} />
                    <h3>Treinadores Ativos ({activeTrainers.length})</h3>
                </div>
                {activeTrainers.length === 0 ? (
                    <p className="empty-msg glass">Nenhum treinador ativo ainda.</p>
                ) : (
                    <div className="trainer-table-container glass">
                        <table className="trainer-table">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Username</th>
                                    <th>E-mail</th>
                                    <th>Telemóvel</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeTrainers.map(trainer => (
                                    <tr key={trainer._id}>
                                        <td>{trainer.firstName} {trainer.lastName}</td>
                                        <td>{trainer.username ? `@${trainer.username}` : 'N/A'}</td>
                                        <td>{trainer.email}</td>
                                        <td>{trainer.phone || 'N/A'}</td>
                                        <td>
                                            <button onClick={() => handleDelete(trainer._id)} className="btn-icon delete" title="Remover">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <style>{`
        .trainer-mgmt { display: flex; flex-direction: column; gap: 2rem; }
        .section-header h2 { margin-bottom: 0.25rem; }
        .section-header p { color: var(--text-secondary); }
        .mgmt-section { display: flex; flex-direction: column; gap: 1.25rem; }
        .section-title { display: flex; align-items: center; gap: 0.75rem; color: var(--accent-primary); }
        .trainer-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
        .trainer-card { padding: 1.25rem; display: flex; align-items: center; justify-content: space-between; }
        .trainer-info { display: flex; align-items: center; gap: 1rem; }
        .avatar { width: 44px; height: 44px; background: var(--bg-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); overflow: hidden; }
        .avatar img { width: 100%; height: 100%; object-fit: cover; }
        .trainer-info h4 { margin: 0; font-size: 1rem; }
        .trainer-info span { font-size: 0.85rem; color: var(--text-secondary); }
        .actions { display: flex; gap: 0.5rem; }
        .btn-icon { background: var(--bg-primary); border: 1px solid var(--border-color); width: 36px; height: 36px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: var(--transition); color: var(--text-secondary); }
        .btn-icon.approve:hover { background: #10b981; color: white; border-color: #10b981; }
        .btn-icon.reject:hover, .btn-icon.delete:hover { background: #ef4444; color: white; border-color: #ef4444; }
        .mt-4 { margin-top: 2rem; }
        .trainer-table-container { overflow-x: auto; padding: 1.5rem; }
        .trainer-table { width: 100%; border-collapse: collapse; text-align: left; }
        .trainer-table th, .trainer-table td { padding: 1rem; border-bottom: 1px solid var(--border-color); }
        .trainer-table th { font-weight: 600; color: var(--text-secondary); font-size: 0.9rem; }
        .empty-msg { color: var(--text-secondary); font-style: italic; padding: 2rem; text-align: center; }
        .error-message { padding: 1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 0.75rem; color: #ef4444; text-align: center; }
        .loading { text-align: center; padding: 3rem; color: var(--text-secondary); }
      `}</style>
        </div>
    );
};

export default TrainerManagement;