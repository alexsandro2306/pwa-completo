import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Star,
    Users,
    Award,
    MessageCircle,
    Send,
    AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const TrainersListDashboard = () => {
    const { user } = useAuth();
    const { addNotification } = useNotifications();
    const [trainers, setTrainers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTrainer, setSelectedTrainer] = useState(null);
    const [reason, setReason] = useState('');
    const [showModal, setShowModal] = useState(false);

    const isClient = user?.role === 'client';

    useEffect(() => {
        fetchTrainers();
    }, []);

    const fetchTrainers = async () => {
        try {
            const response = await api.get('/users/trainers');
            setTrainers(response.data.trainers || []);
        } catch (error) {
            console.error('Erro ao carregar trainers:', error);
            addNotification('error', 'Erro ao carregar lista de trainers');
        } finally {
            setLoading(false);
        }
    };

    const handleSendRequest = async (trainerId) => {
        if (!isClient) {
            addNotification('warning', 'Apenas clientes podem enviar pedidos');
            return;
        }

        if (user?.trainer) {
            addNotification('warning', 'Já tens um Personal Trainer associado. Para mudares, contacta o administrador.');
            setShowModal(false);
            return;
        }

        if (!reason.trim()) {
            addNotification('warning', 'Por favor, indica o motivo do pedido');
            return;
        }

        try {
            const response = await api.post('/requests', {
                trainer: trainerId,
                reason
            });

            addNotification('success', 'Pedido enviado com sucesso!');
            setShowModal(false);
            setReason('');
            setSelectedTrainer(null);
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Erro ao enviar pedido';
            addNotification('error', errorMsg);
        }
    };

    const openRequestModal = (trainer) => {
        if (!isClient) {
            addNotification('warning', 'Apenas clientes podem enviar pedidos');
            return;
        }

        if (user?.trainer) {
            addNotification('warning', 'Já tens um Personal Trainer associado!');
            return;
        }

        setSelectedTrainer(trainer);
        setShowModal(true);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>A carregar trainers...</p>
            </div>
        );
    }

    return (
        <div className="trainers-dashboard-container">
            <header className="page-header">
                <h1>Personal Trainers Disponíveis</h1>
                <p>Escolhe o teu Personal Trainer ideal e envia um pedido de associação</p>
            </header>

            {/* Aviso se já tiver trainer */}
            {isClient && user?.trainer && (
                <div className="info-banner warning">
                    <AlertCircle size={20} />
                    <div>
                        <strong>Já tens um trainer associado!</strong>
                        <p>Se quiseres mudar de trainer, contacta o administrador.</p>
                    </div>
                </div>
            )}

            {trainers.length === 0 ? (
                <div className="empty-state">
                    <Users size={48} />
                    <h3>Nenhum trainer disponível</h3>
                    <p>Ainda não há personal trainers validados no sistema.</p>
                </div>
            ) : (
                <div className="trainers-grid">
                    {trainers.map((trainer) => (
                        <div key={trainer._id} className="trainer-card glass">
                            <div className="trainer-header">
                                <img
                                    src={trainer.avatar || `https://ui-avatars.com/api/?name=${trainer.firstName}+${trainer.lastName}&background=3b82f6&color=fff&size=128`}
                                    alt={`${trainer.firstName} ${trainer.lastName}`}
                                    className="trainer-avatar"
                                />
                                <div className="trainer-info">
                                    <h3>{trainer.firstName} {trainer.lastName}</h3>
                                    <p className="trainer-email">{trainer.email}</p>
                                </div>
                            </div>

                            <div className="trainer-stats">
                                <div className="stat">
                                    <Users size={18} />
                                    <span>{trainer.clientCount || 0} clientes</span>
                                </div>
                                <div className="stat">
                                    <Award size={18} />
                                    <span>Certificado</span>
                                </div>
                                <div className="stat">
                                    <Star size={18} />
                                    <span>Validado</span>
                                </div>
                            </div>

                            {trainer.bio && (
                                <p className="trainer-bio">{trainer.bio}</p>
                            )}

                            <div className="trainer-actions">
                                <button
                                    className="btn-secondary"
                                    onClick={() => window.location.href = `mailto:${trainer.email}`}
                                >
                                    <MessageCircle size={18} />
                                    Contactar
                                </button>
                                <button
                                    className={`btn-primary ${(isClient && user?.trainer) ? 'disabled' : ''}`}
                                    onClick={() => openRequestModal(trainer)}
                                    disabled={isClient && user?.trainer}
                                >
                                    <Send size={18} />
                                    {(isClient && user?.trainer) ? 'Já tens Trainer' : 'Enviar Pedido'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Pedido */}
            {showModal && selectedTrainer && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Pedido de Associação</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        <div className="modal-body">
                            <div className="trainer-preview">
                                <img
                                    src={selectedTrainer.avatar || `https://ui-avatars.com/api/?name=${selectedTrainer.firstName}+${selectedTrainer.lastName}`}
                                    alt={selectedTrainer.firstName}
                                />
                                <div>
                                    <h3>{selectedTrainer.firstName} {selectedTrainer.lastName}</h3>
                                    <p>{selectedTrainer.email}</p>
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Motivo do Pedido</label>
                                <textarea
                                    placeholder="Ex: Gostaria de treinar força e hipertrofia..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={4}
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>
                                Cancelar
                            </button>
                            <button
                                className="btn-primary"
                                onClick={() => handleSendRequest(selectedTrainer._id)}
                            >
                                <Send size={18} />
                                Enviar Pedido
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .trainers-dashboard-container {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 2rem;
        }

        .page-header h1 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .page-header p {
          color: var(--text-secondary);
        }

        .info-banner {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1.25rem;
          border-radius: 0.75rem;
          margin-bottom: 2rem;
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.3);
        }

        .info-banner svg {
          color: #f59e0b;
          flex-shrink: 0;
          margin-top: 0.2rem;
        }

        .info-banner strong {
          display: block;
          margin-bottom: 0.25rem;
          color: var(--text-primary);
        }

        .info-banner p {
          margin: 0;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--text-secondary);
        }

        .empty-state svg {
          color: var(--text-tertiary);
          margin-bottom: 1rem;
        }

        .trainers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .trainer-card {
          padding: 1.5rem;
          border-radius: 1rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .trainer-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .trainer-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .trainer-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid var(--accent-primary);
        }

        .trainer-info h3 {
          margin: 0;
          font-size: 1.25rem;
        }

        .trainer-email {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin: 0.25rem 0 0 0;
        }

        .trainer-stats {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          padding: 1rem;
          background: var(--bg-secondary);
          border-radius: 0.5rem;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .stat svg {
          color: var(--accent-primary);
        }

        .trainer-bio {
          color: var(--text-secondary);
          font-size: 0.9rem;
          line-height: 1.5;
          margin-bottom: 1.5rem;
        }

        .trainer-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .btn-primary, .btn-secondary {
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.3s;
          font-size: 0.9rem;
        }

        .btn-primary {
          background: var(--accent-primary);
          color: white;
          border: none;
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--accent-hover);
          transform: translateY(-2px);
        }

        .btn-primary.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: transparent;
          color: var(--accent-primary);
          border: 2px solid var(--accent-primary);
        }

        .btn-secondary:hover {
          background: var(--accent-primary);
          color: white;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-content {
          background: var(--bg-primary);
          border-radius: 1rem;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 2rem;
          cursor: pointer;
          color: var(--text-secondary);
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.5rem;
          transition: var(--transition);
        }

        .close-btn:hover {
          background: var(--glass-bg);
          color: var(--text-primary);
        }

        .modal-body {
          padding: 1.5rem;
        }

        .trainer-preview {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--glass-bg);
          border-radius: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .trainer-preview img {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          object-fit: cover;
        }

        .trainer-preview h3 {
          margin: 0;
          font-size: 1.1rem;
        }

        .trainer-preview p {
          margin: 0.25rem 0 0 0;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-group label {
          font-weight: 600;
          font-size: 0.9rem;
        }

        .input-group textarea {
          padding: 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid var(--border-color);
          background: var(--bg-primary);
          color: var(--text-primary);
          resize: vertical;
          font-family: inherit;
        }

        .input-group textarea:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .modal-footer {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          border-top: 1px solid var(--border-color);
        }

        .modal-footer button {
          flex: 1;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 1rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--border-color);
          border-top-color: var(--accent-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .trainers-dashboard-container {
            padding: 1rem;
          }

          .page-header h1 {
            font-size: 1.75rem;
          }

          .trainers-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    );
};

export default TrainersListDashboard;