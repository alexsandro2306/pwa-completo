import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Send, User, Paperclip, Search, Menu } from 'lucide-react';
import { getAvatarUrl } from '../utils/imageUtils';

const Chat = () => {
    const { userId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const scrollRef = useRef();

    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [recipient, setRecipient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSidebar, setShowSidebar] = useState(true); // For mobile responsiveness

    // 1. Initial Setup based on Role
    useEffect(() => {
        const initChat = async () => {
            if (user.role === 'client') {
                // Client Logic: Auto-redirect to Trainer
                if (!userId) {
                    try {
                        const res = await api.get('/users/me');
                        const trainer = res.data.user.trainer;
                        if (trainer && trainer._id) {
                            navigate(`/chat/${trainer._id}`, { replace: true });
                        }
                    } catch (err) {
                        console.error('Erro ao buscar trainer:', err);
                    }
                }
                setLoading(false);
            } else if (user.role === 'trainer') {
                // Trainer Logic: Load Client List
                try {
                    const res = await api.get('/users/my-clients');
                    setConversations(res.data.data);
                } catch (err) {
                    console.error('Erro ao buscar clientes:', err);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        initChat();
    }, [user.role, userId, navigate]);

    // 2. Fetch Messages & Recipient when userId changes
    useEffect(() => {
        if (!userId) {
            setRecipient(null);
            setMessages([]);
            return;
        }

        const fetchChatData = async () => {
            try {
                // Fetch Recipient Details
                const userRes = await api.get(`/users/${userId}`);
                setRecipient(userRes.data.data);

                // Fetch Messages
                const msgRes = await api.get(`/messages/${userId}`);
                setMessages(msgRes.data.data);

                // On mobile, hide sidebar when chat opens
                if (window.innerWidth < 768) setShowSidebar(false);
            } catch (err) {
                console.error('Erro ao carregar chat:', err);
            }
        };

        fetchChatData();

        // Polling (Simplified for now)
        const interval = setInterval(async () => {
            try {
                const res = await api.get(`/messages/${userId}`);
                setMessages(prev => {
                    const newMsgs = res.data.data;
                    if (newMsgs.length !== prev.length || (newMsgs.length > 0 && newMsgs[newMsgs.length - 1]._id !== prev[prev.length - 1]?._id)) {
                        return newMsgs;
                    }
                    return prev;
                });
            } catch (err) { console.error(err); }
        }, 3000);

        return () => clearInterval(interval);

    }, [userId]);

    // 3. Scroll Handling
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        try {
            const res = await api.post('/messages/send', {
                receiverId: userId,
                content: newMessage
            });
            setMessages([...messages, res.data.data]);
            setNewMessage('');
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (msgId) => {
        if (!window.confirm('Apagar mensagem?')) return;
        try {
            await api.delete(`/messages/${msgId}`);
            setMessages(messages.filter(m => m._id !== msgId));
        } catch (err) {
            console.error('Erro ao apagar', err);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('proofImage', file); // Reusing existing upload endpoint which expects 'proofImage' or similar depending on route

        try {
            // We need a general upload endpoint. Let's use /upload/training-proof which returns { proofUrl } 
            // OR create a new one. existing one is /upload/training-proof.
            // Ideally we should have a generic one but let's reuse for speed if compatible, 
            // or use the one we used for profiles.
            const res = await api.post('/upload/training-proof', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const attachmentUrl = res.data.proofUrl;

            // Send message with attachment
            const msgRes = await api.post('/messages/send', {
                receiverId: userId,
                content: 'Anexo', // Fallback text
                attachmentUrl,
                attachmentType: file.type.startsWith('image') ? 'image' : 'document'
            });

            setMessages([...messages, msgRes.data.data]);
        } catch (err) {
            console.error('Erro upload', err);
            alert('Erro ao enviar anexo');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (loading) return <div>Carregando...</div>;

    const isClient = user.role === 'client';

    return (
        <div className="chat-layout animate-fade">
            {/* Sidebar code... */}
            {!isClient && (
                <aside className={`chat-sidebar ${showSidebar ? 'active' : ''} glass`}>
                    <div className="sidebar-header">
                        <h3>Mensagens</h3>
                    </div>

                    <div className="contacts-list">
                        {conversations.length === 0 ? (
                            <p className="no-contacts">Sem clientes associados.</p>
                        ) : (
                            conversations.map(contact => (
                                <div
                                    key={contact._id}
                                    className={`contact-item ${contact._id === userId ? 'active' : ''}`}
                                    onClick={() => navigate(`/chat/${contact._id}`)}
                                >
                                    <div className="contact-avatar">
                                        {contact.avatar ? (
                                            <img src={getAvatarUrl(contact.avatar)} alt={contact.firstName} />
                                        ) : (
                                            <User size={20} />
                                        )}
                                    </div>
                                    <div className="contact-info">
                                        <h4>{contact.firstName} {contact.lastName}</h4>
                                        <span>Cliente</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </aside>
            )}

            {/* Main Chat Area */}
            <main className={`chat-main glass ${!userId ? 'empty' : ''} ${!showSidebar ? 'full-width' : ''}`}>
                {!isClient && (
                    <button className="toggle-sidebar" onClick={() => setShowSidebar(!showSidebar)}>
                        <Menu size={24} />
                    </button>
                )}

                {!userId ? (
                    <div className="empty-state">
                        <User size={64} color="var(--text-secondary)" />
                        <h2>Selecione um cliente</h2>
                        <p>Escolha um contacto para iniciar a conversa.</p>
                    </div>
                ) : (
                    <>
                        <header className="chat-header">
                            <div className="avatar">
                                {recipient?.avatar ? (
                                    <img src={getAvatarUrl(recipient.avatar)} alt="Avatar" />
                                ) : (
                                    <User size={20} />
                                )}
                            </div>
                            <div className="recipient-info">
                                <h3>{recipient?.firstName} {recipient?.lastName}</h3>
                                <span>{recipient?.role === 'trainer' ? 'Personal Trainer' : 'Cliente'}</span>
                            </div>
                        </header>

                        {messages.map((msg, idx) => {
                            const currentUserId = user.id || user._id;
                            const msgSenderId = msg.sender._id || msg.sender;
                            const isMine = msgSenderId === currentUserId;

                            const isImage = msg.attachmentType === 'image';
                            const showContent = msg.content && msg.content !== 'Anexo' && msg.content !== 'Anexo enviado';

                            return (
                                <div key={idx} className={`message-bubble ${isMine ? 'sent' : 'received'}`}>
                                    {msg.attachmentUrl && (
                                        <div className="attachment-preview">
                                            {isImage ? (
                                                <img src={getAvatarUrl(msg.attachmentUrl)} alt="Anexo" onClick={() => window.open(getAvatarUrl(msg.attachmentUrl), '_blank')} />
                                            ) : (
                                                <a href={getAvatarUrl(msg.attachmentUrl)} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
                                                    Ver Anexo
                                                </a>
                                            )}
                                        </div>
                                    )}
                                    {showContent && <p>{msg.content}</p>}
                                    <div className="msg-footer">
                                        <span className="timestamp">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        {isMine && (
                                            <button className="delete-msg-btn" onClick={() => handleDelete(msg._id)} title="Apagar">
                                                &times;
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        <form className="chat-input" onSubmit={handleSend}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileUpload}
                                accept="image/*,application/pdf"
                            />
                            <button type="button" className="btn-icon" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                                <Paperclip size={20} />
                            </button>
                            <input
                                type="text"
                                placeholder={isUploading ? "A enviar anexo..." : "Escreva sua mensagem..."}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                disabled={isUploading}
                            />
                            <button type="submit" className="btn-send" disabled={isUploading || !newMessage.trim()}><Send size={20} /></button>
                        </form>
                    </>
                )}
            </main>


            <style jsx>{`
                .chat-layout { display: flex; height: calc(100vh - 7rem); gap: 1rem; position: relative; }
                
                /* Sidebar */
                .chat-sidebar { width: 300px; display: flex; flex-direction: column; border-right: 1px solid var(--border-color); background: var(--bg-secondary); border-radius: 1rem; overflow: hidden; }
                .sidebar-header { padding: 1.5rem; border-bottom: 1px solid var(--border-color); }
                .sidebar-header h3 { font-size: 1.2rem; margin: 0; }
                
                .contacts-list { flex: 1; overflow-y: auto; }
                .contact-item { display: flex; items-center; gap: 1rem; padding: 1rem 1.5rem; cursor: pointer; transition: 0.2s; border-bottom: 1px solid var(--border-color); }
                .contact-item:hover, .contact-item.active { background: var(--accent-primary-alpha); }
                .contact-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--border-color); display: flex; align-items: center; justify-content: center; overflow: hidden; }
                .contact-avatar img { width: 100%; height: 100%; object-fit: cover; }
                .contact-info h4 { margin: 0; font-size: 0.95rem; }
                .contact-info span { font-size: 0.75rem; color: var(--text-secondary); }
                .no-contacts { padding: 2rem; text-align: center; color: var(--text-secondary); }

                /* Main Area */
                .chat-main { flex: 1; display: flex; flex-direction: column; border-radius: 1rem; overflow: hidden; position: relative; }
                .chat-main.empty { align-items: center; justify-content: center; }
                .empty-state { text-align: center; color: var(--text-secondary); }
                
                .chat-header { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; gap: 1rem; background: var(--glass-bg); }
                .avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--accent-primary); color: white; display: flex; align-items: center; justify-content: center; overflow: hidden; } 
                .avatar img { width: 100%; height: 100%; object-fit: cover; }
                
                .messages-area { flex: 1; overflow-y: auto; padding: 2rem; display: flex; flex-direction: column; gap: 1rem; }
                .message-bubble { max-width: 70%; padding: 0.75rem 1rem; border-radius: 1rem; position: relative; display: flex; flex-direction: column; }
                .message-bubble.sent { align-self: flex-end; background: var(--accent-primary); color: white; border-bottom-right-radius: 0.25rem; }
                .message-bubble.received { align-self: flex-start; background: var(--bg-primary); border: 1px solid var(--border-color); border-bottom-left-radius: 0.25rem; }
                
                .chat-input { padding: 1.5rem; border-top: 1px solid var(--border-color); display: flex; gap: 1rem; align-items: center; background: var(--glass-bg); }
                .chat-input input { flex: 1; background: var(--bg-primary); border: 1px solid var(--border-color); padding: 0.75rem 1rem; border-radius: 0.75rem; color: var(--text-primary); }
                .btn-icon, .btn-send { background: transparent; border: none; cursor: pointer; color: var(--text-secondary); }
                .btn-send { color: var(--accent-primary); }

                .toggle-sidebar { display: none; position: absolute; top: 1rem; left: 1rem; z-index: 10; background: var(--bg-primary); border: 1px solid var(--border-color); padding: 0.5rem; border-radius: 0.5rem; }

                /* Responsive */
                @media (max-width: 768px) {
                    .chat-sidebar { position: absolute; left: -100%; height: 100%; z-index: 20; transition: 0.3s; width: 80%; }
                    .chat-sidebar.active { left: 0; box-shadow: 0 0 20px rgba(0,0,0,0.5); }
                    .toggle-sidebar { display: block; }
                    .chat-main { width: 100%; }
                }

                .msg-footer { display: flex; justify-content: flex-end; align-items: center; gap: 0.5rem; margin-top: 0.25rem; }
                .delete-msg-btn { background: none; border: none; color: rgba(255,255,255,0.6); cursor: pointer; font-size: 1.2rem; line-height: 1; padding: 0; display: none; }
                .message-bubble:hover .delete-msg-btn { display: block; }
                .attachment-preview img { max-width: 200px; border-radius: 0.5rem; margin-bottom: 0.5rem; cursor: pointer; }
                .attachment-preview { margin-bottom: 0.5rem; }
            `}</style>
        </div>
    );
};

export default Chat;
