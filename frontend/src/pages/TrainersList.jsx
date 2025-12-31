import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Star,
  Users,
  Award,
  MessageCircle,
  Send,
  AlertCircle,
  Dumbbell,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

// ✅ ESTE É O TRAINERSLIST.JSX - LANDING PAGE PÚBLICA
// 📍 Usar em: /trainers (rota pública)
// 🎯 Função: Visitantes e clientes podem ver trainers e enviar pedidos

const TrainersList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [reason, setReason] = useState('');
  const [showModal, setShowModal] = useState(false);

  // ✅ Verificar se está autenticado
  const isAuthenticated = !!user;
  const isClient = user?.role === 'client';

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      // ✅ Usar endpoint público se não estiver autenticado
      const endpoint = isAuthenticated
        ? '/users/trainers'
        : '/users/trainers/public';

      const response = await api.get(endpoint);
      setTrainers(response.data.trainers || []);
    } catch (error) {
      console.error('Erro ao carregar trainers:', error);
      if (error.response?.status === 401) {
        // Se 401, tentar endpoint público
        try {
          const response = await api.get('/users/trainers/public');
          setTrainers(response.data.trainers || []);
        } catch (publicError) {
          console.error('Erro no endpoint público:', publicError);
          addNotification('error', 'Erro ao carregar lista de trainers');
        }
      } else {
        addNotification('error', 'Erro ao carregar lista de trainers');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (trainerId) => {
    console.log('🎯 handleSendRequest chamada com trainerId:', trainerId);

    // Verificar autenticação primeiro
    if (!isAuthenticated) {
      console.log('❌ User não autenticado');
      addNotification('info', 'Precisa de criar conta para enviar um pedido');
      navigate('/register');
      return;
    }

    // Verificar se é cliente
    if (!isClient) {
      console.log('❌ User não é cliente, role:', user?.role);
      addNotification('warning', 'Apenas clientes podem enviar pedidos');
      return;
    }

    // Verificar se já tem trainer
    if (user?.trainer) {
      console.log('❌ User já tem trainer:', user.trainer);
      addNotification('warning', 'Já tens um Personal Trainer associado. Para mudares, contacta o administrador.');
      setShowModal(false);
      return;
    }

    if (!reason.trim()) {
      console.log('❌ Motivo vazio');
      addNotification('warning', 'Por favor, indica o motivo do pedido');
      return;
    }

    try {
      console.log('📤 A enviar pedido...');
      console.log('📦 Payload:', {
        trainer: trainerId,
        reason: reason
      });

      const response = await api.post('/requests', {
        trainer: trainerId,  // ✅ Campo correto
        reason
      });

      console.log('✅ Resposta recebida:', response.data);

      addNotification('success', 'Pedido enviado com sucesso!');
      setShowModal(false);
      setReason('');
      setSelectedTrainer(null);
    } catch (error) {
      console.error('❌ Erro completo:', error);
      console.error('❌ Resposta do erro:', error.response?.data);
      console.error('❌ Status do erro:', error.response?.status);

      const errorMsg = error.response?.data?.message || 'Erro ao enviar pedido';
      addNotification('error', errorMsg);
    }
  };

  const openRequestModal = (trainer) => {
    // ✅ Redirecionar para registo se não autenticado
    if (!isAuthenticated) {
      addNotification('info', 'Crie uma conta para enviar um pedido');
      navigate('/register');
      return;
    }

    // ✅ Verificar se é cliente
    if (!isClient) {
      addNotification('warning', 'Apenas clientes podem enviar pedidos');
      return;
    }

    // ✅ Bloquear se já tiver trainer
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
    <div className="trainers-list-page">
      {/* ✅ Navbar Pública */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo" onClick={() => navigate('/welcome')}>
            <Dumbbell size={28} />
            <span>FitTrainer</span>
          </div>
          <div className="nav-links">
            {isAuthenticated ? (
              <>
                <button className="nav-link" onClick={() => navigate('/')}>
                  Voltar ao Dashboard
                </button>
              </>
            ) : (
              <>
                <button className="nav-link" onClick={() => navigate('/login')}>
                  Entrar
                </button>
                <button className="btn-register" onClick={() => navigate('/register')}>
                  Registar
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="trainers-list-container">
        <header className="page-header">
          {isAuthenticated && (
            <button className="btn-back" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1>Personal Trainers Disponíveis</h1>
            <p>Escolhe o teu Personal Trainer ideal e envia um pedido de associação</p>
          </div>
        </header>

        {/* ✅ Aviso se não autenticado */}
        {!isAuthenticated && (
          <div className="info-banner info">
            <AlertCircle size={20} />
            <div>
              <strong>Precisa de uma conta para enviar pedidos</strong>
              <p>Crie uma conta gratuita para se conectar com um Personal Trainer</p>
            </div>
            <button className="btn-banner" onClick={() => navigate('/register')}>
              Criar Conta
            </button>
          </div>
        )}

        {/* ✅ Aviso se já tiver trainer */}
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
                    {!isAuthenticated ? 'Enviar Pedido' :
                      (isClient && user?.trainer) ? 'Já tens Trainer' : 'Enviar Pedido'}
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
      </div>

      <style>{`
        .trainers-list-page {
          min-height: 100vh;
          background: linear-gradient(to bottom, #1a2332 0%, #0f1419 100%);
          color: white;
        }

        /* Navbar */
        .navbar {
          background: rgba(15, 20, 25, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          position: sticky;
          top: 0;
          z-index: 1000;
          padding: 1.25rem 0;
        }

        .nav-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.5rem;
          font-weight: 700;
          color: #60a5fa;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .logo:hover {
          transform: scale(1.05);
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .nav-link {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.8);
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 0.5rem;
        }

        .nav-link:hover {
          color: white;
        }

        .btn-register {
          background: #60a5fa;
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-register:hover {
          background: #3b82f6;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(96, 165, 250, 0.4);
        }

        /* Container */
        .trainers-list-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .page-header {
          text-align: center;
          margin-bottom: 3rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
        }

        .btn-back {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 0.75rem;
          border-radius: 0.5rem;
          cursor: pointer;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }

        .btn-back:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .page-header h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #60a5fa, #93c5fd);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .page-header p {
          color: rgba(255, 255, 255, 0.7);
        }

        .info-banner {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
          border-radius: 0.75rem;
          margin-bottom: 2rem;
        }

        .info-banner.info {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .info-banner.warning {
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.3);
        }

        .info-banner svg {
          flex-shrink: 0;
          margin-top: 0.2rem;
        }

        .info-banner.info svg {
          color: #60a5fa;
        }

        .info-banner.warning svg {
          color: #fbbf24;
        }

        .info-banner strong {
          display: block;
          margin-bottom: 0.25rem;
        }

        .info-banner p {
          margin: 0;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .btn-banner {
          background: #60a5fa;
          color: white;
          border: none;
          padding: 0.6rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          margin-left: auto;
          transition: all 0.3s;
        }

        .btn-banner:hover {
          background: #3b82f6;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .empty-state svg {
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .trainers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 2rem;
        }

        .trainer-card {
          background: rgba(26, 35, 50, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1.5rem;
          border-radius: 1rem;
          transition: all 0.3s;
        }

        .trainer-card:hover {
          transform: translateY(-4px);
          border-color: rgba(96, 165, 250, 0.3);
          box-shadow: 0 8px 24px rgba(96, 165, 250, 0.2);
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
          border: 3px solid #60a5fa;
        }

        .trainer-info h3 {
          margin: 0;
          font-size: 1.25rem;
        }

        .trainer-email {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.875rem;
          margin: 0.25rem 0 0 0;
        }

        .trainer-stats {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 0.5rem;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .stat svg {
          color: #60a5fa;
        }

        .trainer-bio {
          color: rgba(255, 255, 255, 0.7);
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
          background: #60a5fa;
          color: white;
          border: none;
        }

        .btn-primary:hover:not(:disabled) {
          background: #3b82f6;
          transform: translateY(-2px);
        }

        .btn-primary.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: transparent;
          color: #60a5fa;
          border: 2px solid #60a5fa;
        }

        .btn-secondary:hover {
          background: #60a5fa;
          color: white;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 1rem;
        }

        .modal-content {
          background: #1a2332;
          border-radius: 1rem;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 2rem;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.6);
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.5rem;
          transition: all 0.3s;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .trainer-preview {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
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
          color: rgba(255, 255, 255, 0.7);
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
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(0, 0, 0, 0.3);
          color: white;
          resize: vertical;
          font-family: inherit;
        }

        .input-group textarea:focus {
          outline: none;
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
        }

        .modal-footer {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
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
          color: white;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.2);
          border-top-color: #60a5fa;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .nav-links {
            gap: 1rem;
          }

          .page-header {
            flex-direction: column;
          }

          .page-header h1 {
            font-size: 2rem;
          }

          .trainers-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default TrainersList;