import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { User, Mail, Phone, Shield, Camera, Save, QrCode as QrIcon, CheckCircle2, RefreshCw } from 'lucide-react';

const Profile = () => {
    const { user, login, updateUser } = useAuth();
    const { addNotification } = useNotifications();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        avatar: ''
    });
    const [qrData, setQrData] = useState(null);
    const [qrToken, setQrToken] = useState('');
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Change Trainer States
    const [showChangeModal, setShowChangeModal] = useState(false);
    const [trainers, setTrainers] = useState([]);
    const [changeRequest, setChangeRequest] = useState({ newTrainerId: '', reason: '' });
    const [requestLoading, setRequestLoading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/users/me');
                const data = res.data.user;
                setFormData({
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    phone: data.phone || '',
                    avatar: data.avatar || ''
                });
            } catch (err) {
                addNotification('error', 'Erro ao carregar perfil');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const res = await api.patch('/users/me', formData);
            updateUser(res.data.user); // Update global context
            addNotification('success', 'Perfil atualizado com sucesso');
        } catch (err) {
            addNotification('error', 'Erro ao atualizar perfil');
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const data = new FormData();
        data.append('avatar', file);

        setUploading(true);
        try {
            const res = await api.post('/upload/avatar', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const newAvatarUrl = res.data.avatarUrl;
            setFormData({ ...formData, avatar: newAvatarUrl });
            updateUser({ avatar: newAvatarUrl }); // Update global context immediately
            addNotification('success', 'Avatar atualizado!');
        } catch (err) {
            addNotification('error', 'Erro no upload do avatar');
        } finally {
            setUploading(false);
        }
    };

    const generateQR = async () => {
        try {
            const res = await api.post('/auth/qrcode/generate');
            setQrData(res.data);
        } catch (err) {
            addNotification('error', 'Erro ao gerar QR Code');
        }
    };

    const verifyQR = async () => {
        try {
            await api.post('/auth/qrcode/verify', { token: qrToken });
            addNotification('success', '2FA ativado com sucesso!');
            setQrData(null);
            setQrToken('');
        } catch (err) {
            addNotification('error', 'Token inválido');
        }
    };

    const loadTrainersForChange = async () => {
        try {
            const res = await api.get('/users/trainers');
            setTrainers(res.data.data);
            setShowChangeModal(true);
        } catch (err) {
            addNotification('error', 'Erro ao carregar lista de trainers.');
        }
    };

    const handleSubmitChangeRequest = async (e) => {
        e.preventDefault();
        if (!changeRequest.newTrainerId || !changeRequest.reason) {
            addNotification('warning', 'Preencha todos os campos.');
            return;
        }

        setRequestLoading(true);
        try {
            await api.post('/users/request-trainer-change', changeRequest);
            addNotification('success', 'Pedido enviado com sucesso! Aguarde aprovação.');
            setShowChangeModal(false);
            setChangeRequest({ newTrainerId: '', reason: '' });
        } catch (err) {
            addNotification('error', err.response?.data?.message || 'Erro ao enviar pedido.');
        } finally {
            setRequestLoading(false);
        }
    };

    if (loading) return <div>Carregando perfil...</div>;

    return (
        <div className="profile-container animate-fade">
            <header className="page-header">
                <h1>Meu Perfil</h1>
                <p>Gira as tuas informações pessoais e de segurança.</p>
            </header>

            <div className="profile-grid">
                <section className="glass profile-info">
                    <div className="avatar-section">
                        <div className="avatar-wrapper">
                            {formData.avatar ? (
                                <img src={`http://localhost:5000${formData.avatar}`} alt="Avatar" />
                            ) : (
                                <div className="avatar-placeholder"><User size={48} /></div>
                            )}
                            <label className="upload-label">
                                <Camera size={20} />
                                <input type="file" onChange={handleAvatarUpload} disabled={uploading} />
                            </label>
                        </div>
                        <h3>{user.username}</h3>
                        <span className="role-badge">{user.role}</span>
                        {user.role === 'client' && (
                            <button className="btn-text btn-change-trainer" onClick={loadTrainersForChange}>
                                <RefreshCw size={14} /> Mudar de Trainer
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleUpdateProfile}>
                        <div className="form-grid">
                            <div className="input-group">
                                <label>Primeiro Nome</label>
                                <input
                                    type="text"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Apelido</label>
                                <input
                                    type="text"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="input-group">
                            <label>Telemóvel</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="btn-primary full-width">
                            <Save size={20} /> Salvar Alterações
                        </button>
                    </form>
                </section>

                <section className="glass security-section">
                    <h3><Shield size={20} /> Segurança (2FA)</h3>
                    <p>Adiciona uma camada extra de proteção à tua conta usando Google Authenticator ou similar.</p>

                    {qrData ? (
                        <div className="qr-setup animate-fade">
                            <img src={qrData.qrCodeURL} alt="QR Code" />
                            <p className="secret">Code: <code>{qrData.secret}</code></p>
                            <div className="verify-group">
                                <input
                                    type="text"
                                    placeholder="Insere o código de 6 dígitos"
                                    value={qrToken}
                                    onChange={(e) => setQrToken(e.target.value)}
                                />
                                <button onClick={verifyQR} className="btn-primary">Verificar</button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={generateQR} className="btn-secondary">
                            <QrIcon size={20} /> Configurar QR Code 2FA
                        </button>
                    )}

                    <div className="security-status">
                        <CheckCircle2 size={16} color={user.twoFactorEnabled ? '#10b981' : '#ccc'} />
                        <span>2FA {user.twoFactorEnabled ? 'Ativado' : 'Não Configurado'}</span>
                    </div>
                </section>
            </div>

            {showChangeModal && (
                <div className="modal-overlay">
                    <div className="glass modal-content animate-slide-up">
                        <h3>Solicitar Mudança de Trainer</h3>
                        <p className="modal-desc">Escolha o novo profissional e justifique o pedido. A alteração requer aprovação.</p>

                        <form onSubmit={handleSubmitChangeRequest}>
                            <div className="input-group">
                                <label>Novo Personal Trainer</label>
                                <select
                                    value={changeRequest.newTrainerId}
                                    onChange={(e) => setChangeRequest({ ...changeRequest, newTrainerId: e.target.value })}
                                    required
                                >
                                    <option value="">Selecione um trainer...</option>
                                    {trainers.map(trainer => (
                                        <option key={trainer._id} value={trainer._id}>
                                            {trainer.firstName} {trainer.lastName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="input-group">
                                <label>Motivo da Troca</label>
                                <textarea
                                    placeholder="Ex: Horários incompatíveis..."
                                    value={changeRequest.reason}
                                    onChange={(e) => setChangeRequest({ ...changeRequest, reason: e.target.value })}
                                    required
                                    rows="3"
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-text" onClick={() => setShowChangeModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={requestLoading}>
                                    {requestLoading ? 'A enviar...' : 'Enviar Pedido'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
        .profile-container { display: flex; flex-direction: column; gap: 2rem; }
        .profile-grid { display: grid; grid-template-columns: 3fr 2fr; gap: 2rem; }
        .profile-info { padding: 2.5rem; }
        .avatar-section { display: flex; flex-direction: column; align-items: center; gap: 1rem; margin-bottom: 2.5rem; }
        .avatar-wrapper { position: relative; width: 120px; height: 120px; border-radius: 50%; background: var(--bg-primary); border: 3px solid var(--accent-primary); overflow: hidden; }
        .avatar-wrapper img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); }
        .upload-label { position: absolute; bottom: 0; left: 0; right: 0; height: 40px; background: rgba(0,0,0,0.5); color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.3s; }
        .upload-label:hover { background: rgba(0,0,0,0.7); }
        .upload-label input { display: none; }
        .role-badge { background: var(--accent-primary); color: white; padding: 0.2rem 0.8rem; border-radius: 1rem; font-size: 0.75rem; text-transform: uppercase; font-weight: 700; }
        
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .input-group { margin-bottom: 1.5rem; text-align: left; }
        .input-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.9rem; }
        .input-group input { width: 100%; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary); }
        
        .security-section { padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
        .qr-setup { border: 1px solid var(--border-color); padding: 1.5rem; border-radius: 1rem; text-align: center; background: white; }
        .qr-setup img { width: 200px; height: 200px; margin-bottom: 1rem; }
        .secret code { background: #eee; padding: 0.2rem 0.5rem; border-radius: 0.25rem; font-size: 0.9rem; }
        .verify-group { display: flex; gap: 0.5rem; margin-top: 1rem; }
        .verify-group input { flex: 1; padding: 0.5rem; border-radius: 0.5rem; border: 1px solid #ccc; }
        .security-status { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: var(--text-secondary); }
        
        
        @media (max-width: 900px) {
          .profile-grid { grid-template-columns: 1fr; }
        }

        .btn-change-trainer { font-size: 0.8rem; margin-top: 0.5rem; display: flex; align-items: center; gap: 0.4rem; color: var(--text-secondary); }
        .btn-change-trainer:hover { color: var(--accent-primary); }

        .modal-content { background: var(--bg-primary); padding: 2rem; border-radius: 1rem; width: 100%; max-width: 500px; border: 1px solid var(--border-color); }
        .modal-desc { margin-bottom: 1.5rem; font-size: 0.9rem; color: var(--text-secondary); }
        .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
        
        select, textarea { width: 100%; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); resize: vertical; }
      `}</style>
        </div>
    );
};

export default Profile;
