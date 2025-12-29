import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { User, Calendar, MessageCircle, BarChart2, Plus, Bell, Search, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { getAvatarUrl } from '../utils/imageUtils';

const ClientManagement = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { addNotification } = useNotifications();
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [alertContent, setAlertContent] = useState('');

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const res = await api.get('/users/my-clients');
                setClients(res.data.data);
            } catch (err) {
                setError('Erro ao carregar seus clientes.');
            } finally {
                setLoading(false);
            }
        };
        fetchClients();
    }, []);

    const handleSendAlert = async (e) => {
        e.preventDefault();
        try {
            await api.post('/messages/alert', {
                receiverId: selectedClient._id,
                content: alertContent
            });
            addNotification('success', `Alerta enviado para ${selectedClient.firstName}`);
            setShowAlertModal(false);
            setAlertContent('');
        } catch (err) {
            addNotification('error', 'Erro ao enviar alerta.');
        }
    };

    const [searchTerm, setSearchTerm] = useState('');

    const handleUnlinkClient = async (id) => {
        if (!window.confirm('Tem a certeza que deseja remover este cliente da sua lista?')) return;
        try {
            await api.patch(`/users/unlink-client/${id}`);
            addNotification('success', 'Cliente removido da sua lista.');
            setClients(prev => prev.filter(c => c._id !== id));
        } catch (err) {
            addNotification('error', 'Erro ao desvincular cliente.');
        }
    };

    const filteredClients = clients.filter(c =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div>Carregando clientes...</div>;

    return (
        <div className="client-mgmt animate-fade">
            <header className="page-header">
                <div className="header-content">
                    <h1>Meus Clientes</h1>
                    <p>Gira os planos e acompanhe o progresso dos seus atletas.</p>
                </div>
                <div className="header-actions">
                    <div className="glass search-bar-mini">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Procurar atleta..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn-primary" onClick={() => navigate('/trainer/clients/add')}>
                        <Plus size={20} /> Registar Recruta
                    </button>
                </div>
            </header>

            {error && <div className="error-message">{error}</div>}

            <div className="client-grid">
                {filteredClients.length === 0 ? (
                    <p className="empty-msg glass">Nenhum atleta encontrado.</p>
                ) : (
                    filteredClients.map(client => (
                        <div key={client._id} className="glass client-card">
                            <div className="client-avatar">
                                {client.avatar ? (
                                    <img
                                        src={getAvatarUrl(client.avatar)}
                                        alt={client.firstName}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <User size={32} />
                                )}
                            </div>
                            <div className="client-details">
                                <h3>{client.firstName} {client.lastName}</h3>
                                <p>@{client.username}</p>
                            </div>
                            <div className="client-actions">
                                <button
                                    onClick={() => navigate(`/trainer/plans/${client._id}`)}
                                    className="action-btn"
                                    title="Plano de Treino"
                                >
                                    <Calendar size={20} />
                                </button>
                                <button
                                    onClick={() => navigate(`/chat/${client._id}`)}
                                    className="action-btn"
                                    title="Mensagens"
                                >
                                    <MessageCircle size={20} />
                                </button>
                                <button
                                    onClick={() => { setSelectedClient(client); setShowAlertModal(true); }}
                                    className="action-btn"
                                    title="Enviar Alerta"
                                >
                                    <Bell size={20} />
                                </button>
                                <button
                                    onClick={() => navigate(`/trainer/dashboard/${client._id}`)}
                                    className="action-btn"
                                    title="Estatísticas/Dashboard"
                                >
                                    <BarChart2 size={20} />
                                </button>
                                <button
                                    onClick={() => handleUnlinkClient(client._id)}
                                    className="action-btn delete"
                                    title="Remover Atleta"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showAlertModal && (
                <div className="modal-overlay">
                    <div className="glass log-modal">
                        <h3>Enviar Alerta para {selectedClient?.firstName}</h3>
                        <form onSubmit={handleSendAlert}>
                            <div className="input-group">
                                <label>Mensagem de Alerta</label>
                                <textarea
                                    placeholder="Ex: Não registou o treino de hoje. Tudo bem?"
                                    value={alertContent}
                                    onChange={(e) => setAlertContent(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowAlertModal(false)} className="btn-text">Cancelar</button>
                                <button type="submit" className="btn-primary">Enviar Alerta</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
        .client-mgmt { display: flex; flex-direction: column; gap: 2rem; }
        .page-header { display: flex; justify-content: space-between; align-items: center; }
        .client-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
        .client-card { padding: 1.5rem; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1rem; }
        .client-avatar { width: 64px; height: 64px; background: var(--bg-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--accent-primary); border: 2px solid var(--border-color); }
        .client-details h3 { margin: 0; font-size: 1.25rem; }
        .client-details p { color: var(--text-secondary); margin: 0; }
        .client-actions { display: flex; gap: 0.75rem; width: 100%; border-top: 1px solid var(--border-color); padding-top: 1rem; justify-content: center; }
        .action-btn { background: var(--bg-primary); border: 1px solid var(--border-color); padding: 0.5rem; border-radius: 0.5rem; cursor: pointer; color: var(--text-secondary); transition: var(--transition); }
        .action-btn:hover { background: var(--accent-primary); color: white; border-color: var(--accent-primary); }
        .empty-msg { padding: 3rem; text-align: center; color: var(--text-secondary); grid-column: 1 / -1; }
        
        .header-actions { display: flex; align-items: center; gap: 1rem; }
        .search-bar-mini { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 1rem; border-radius: 2rem; border: 1px solid var(--border-color); width: 250px; }
        .search-bar-mini input { background: transparent; border: none; outline: none; color: var(--text-primary); font-size: 0.9rem; width: 100%; }
        .action-btn.delete:hover { background: #ef4444; border-color: #ef4444; }
      `}</style>
        </div>
    );
};

export default ClientManagement;
