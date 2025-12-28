import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Filter, Award, Dumbbell, MessageCircle, Send } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const TrainersList = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [trainers, setTrainers] = useState([]);
    const [filteredTrainers, setFilteredTrainers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [loading, setLoading] = useState(true);
    const [sendingRequest, setSendingRequest] = useState(null);

    useEffect(() => {
        fetchTrainers();
    }, []);

    useEffect(() => {
        handleFilter();
    }, [searchTerm, sortBy, trainers]);

    const fetchTrainers = async () => {
        try {
            console.log('🔍 A carregar trainers...');
            const response = await api.get('/trainers/public');
            console.log('✅ Resposta recebida:', response.data);
            console.log('📊 Trainers encontrados:', response.data.data);
            setTrainers(response.data.data || []);
            setLoading(false);
        } catch (error) {
            console.error('❌ Erro ao carregar trainers:', error);
            console.error('Detalhes do erro:', error.response?.data);
            setLoading(false);
        }
    };

    const handleFilter = () => {
        let filtered = [...trainers];
        console.log('🔧 A filtrar trainers. Total:', trainers.length);

        if (searchTerm) {
            filtered = filtered.filter(trainer =>
                trainer.name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            console.log('🔍 Após pesquisa:', filtered.length);
        }

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return (a.name || '').localeCompare(b.name || '');
                case 'surname':
                    return (a.surname || '').localeCompare(b.surname || '');
                case 'clients':
                    return (b.clientCount || 0) - (a.clientCount || 0);
                case 'recent':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                default:
                    return 0;
            }
        });

        console.log('✅ Trainers filtrados:', filtered.length);
        setFilteredTrainers(filtered);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        handleFilter();
    };

    const handleSendRequest = async (trainerId, trainerName) => {
        const reason = prompt(`Por que queres ${trainerName} como teu trainer?`);
        if (!reason || reason.trim() === '') {
            alert('⚠️ Precisas de fornecer um motivo para o pedido');
            return;
        }

        try {
            setSendingRequest(trainerId);
            await api.post('/requests', {
                trainerId,
                reason: reason.trim()
            });
            alert('✅ Pedido enviado com sucesso! O trainer irá avaliar o teu pedido.');
        } catch (error) {
            console.error('❌ Erro ao enviar pedido:', error);
            const errorMsg = error.response?.data?.message || error.message;
            alert('❌ Erro ao enviar pedido: ' + errorMsg);
        } finally {
            setSendingRequest(null);
        }
    };

    return (
        <div className="trainers-list-page">
            {/* Navbar - Igual à Landing */}
            <nav className="navbar">
                <div className="nav-container">
                    <div className="logo" onClick={() => navigate('/landing')}>
                        <Dumbbell size={28} />
                        <span>FitTrainer</span>
                    </div>
                    <div className="nav-links">
                        <button className="nav-link" onClick={() => navigate('/landing')}>
                            Voltar
                        </button>
                        {!user && (
                            <>
                                <button className="nav-link" onClick={() => navigate('/login')}>
                                    Entrar
                                </button>
                                <button className="btn-register" onClick={() => navigate('/register')}>
                                    Registar
                                </button>
                            </>
                        )}
                        {user && (
                            <button className="nav-link" onClick={() => navigate('/')}>
                                Dashboard
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <div className="badge">
                        <Award size={16} />
                        <span>Personal Trainers Certificados</span>
                    </div>
                    <h1>Encontre o Seu Personal Trainer</h1>
                    <p>Profissionais qualificados prontos para transformar a sua jornada fitness</p>
                </div>
            </section>

            {/* Search & Filter Section */}
            <section className="search-section">
                <div className="container">
                    <form onSubmit={handleSearch} className="search-bar">
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Pesquisar por nome..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button type="submit" className="btn-search">
                            Pesquisar
                        </button>
                    </form>

                    <div className="filter-bar">
                        <Filter size={18} />
                        <span>Ordenar por:</span>
                        <button
                            className={`filter-btn ${sortBy === 'name' ? 'active' : ''}`}
                            onClick={() => setSortBy('name')}
                        >
                            Nome (A-Z)
                        </button>
                        <button
                            className={`filter-btn ${sortBy === 'surname' ? 'active' : ''}`}
                            onClick={() => setSortBy('surname')}
                        >
                            Apelido
                        </button>
                        <button
                            className={`filter-btn ${sortBy === 'clients' ? 'active' : ''}`}
                            onClick={() => setSortBy('clients')}
                        >
                            Nº Clientes
                        </button>
                        <button
                            className={`filter-btn ${sortBy === 'recent' ? 'active' : ''}`}
                            onClick={() => setSortBy('recent')}
                        >
                            Mais Recentes
                        </button>
                    </div>

                    <div className="results-count">
                        <Users size={18} />
                        <span>{filteredTrainers.length} Personal Trainers encontrados</span>
                    </div>
                </div>
            </section>

            {/* Trainers Grid */}
            <section className="trainers-section">
                <div className="container">
                    {loading ? (
                        <div className="loading">A carregar trainers...</div>
                    ) : filteredTrainers.length === 0 ? (
                        <div className="no-results">
                            <Users size={48} />
                            <p>Nenhum trainer encontrado com os critérios de pesquisa.</p>
                        </div>
                    ) : (
                        <div className="trainers-grid">
                            {filteredTrainers.map((trainer) => (
                                <div key={trainer._id} className="trainer-card">
                                    <div className="verified-badge">
                                        <Award size={14} />
                                        <span>Verificado</span>
                                    </div>
                                    <div className="trainer-avatar">
                                        <Users size={48} />
                                    </div>
                                    <h3>{trainer.name} {trainer.surname}</h3>
                                    <p className="trainer-username">@{trainer.username}</p>

                                    <div className="trainer-info">
                                        <div className="info-item">
                                            <Users size={16} />
                                            <span>{trainer.clientCount || 0} clientes</span>
                                        </div>
                                        <div className="info-item">
                                            <MessageCircle size={16} />
                                            <span>{trainer.email}</span>
                                        </div>
                                        {trainer.phone && (
                                            <div className="info-item">
                                                <span>📱</span>
                                                <span>{trainer.phone}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Botão de Enviar Pedido - Apenas para Clientes */}
                                    {user?.role === 'client' && (
                                        <button
                                            className="btn-send-request"
                                            onClick={() => handleSendRequest(trainer._id, trainer.name)}
                                            disabled={sendingRequest === trainer._id}
                                        >
                                            <Send size={18} />
                                            {sendingRequest === trainer._id ? 'Enviando...' : 'Enviar Pedido'}
                                        </button>
                                    )}

                                    {/* Mensagem para quem não está logado */}
                                    {!user && (
                                        <button
                                            className="btn-send-request"
                                            onClick={() => navigate('/login')}
                                        >
                                            <Send size={18} />
                                            Entrar para Enviar Pedido
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <style jsx>{`
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                .trainers-list-page {
                    min-height: 100vh;
                    background: #1a2332;
                    color: white;
                }

                /* Navbar - IGUAL À TRAINERSLIST */
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

                /* Hero Section */
                .hero {
                    text-align: center;
                    padding: 6rem 2rem 4rem;
                    background: #1a2332;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }

                .hero-content {
                    max-width: 800px;
                    margin: 0 auto;
                }

                .badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1.5rem;
                    background: rgba(96, 165, 250, 0.15);
                    border: 1px solid rgba(96, 165, 250, 0.3);
                    border-radius: 50px;
                    color: #60a5fa;
                    font-size: 0.9rem;
                    margin-bottom: 2rem;
                    font-weight: 500;
                }

                .hero h1 {
                    font-size: 3.5rem;
                    font-weight: 800;
                    margin-bottom: 1.5rem;
                    background: linear-gradient(to right, white, rgba(255, 255, 255, 0.8));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .hero p {
                    font-size: 1.25rem;
                    color: rgba(255, 255, 255, 0.7);
                    line-height: 1.6;
                }

                /* Container */
                .container {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 2rem;
                }

                /* Search Section */
                .search-section {
                    padding: 3rem 0;
                    background: rgba(15, 20, 25, 0.5);
                }

                .search-bar {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    background: rgba(26, 35, 50, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 1rem 1.5rem;
                    border-radius: 12px;
                    margin-bottom: 2rem;
                }

                .search-bar input {
                    flex: 1;
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1rem;
                    outline: none;
                }

                .search-bar input::placeholder {
                    color: rgba(255, 255, 255, 0.4);
                }

                .btn-search {
                    background: #60a5fa;
                    color: white;
                    border: none;
                    padding: 0.75rem 2rem;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .btn-search:hover {
                    background: #3b82f6;
                    transform: translateY(-2px);
                }

                .filter-bar {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    flex-wrap: wrap;
                    margin-bottom: 1.5rem;
                    color: rgba(255, 255, 255, 0.6);
                }

                .filter-btn {
                    padding: 0.65rem 1.25rem;
                    background: rgba(26, 35, 50, 0.6);
                    color: rgba(255, 255, 255, 0.7);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 0.9rem;
                }

                .filter-btn:hover {
                    background: rgba(26, 35, 50, 0.9);
                    color: white;
                    border-color: rgba(96, 165, 250, 0.3);
                }

                .filter-btn.active {
                    background: #60a5fa;
                    color: white;
                    border-color: #60a5fa;
                }

                .results-count {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 0.95rem;
                }

                /* Trainers Section */
                .trainers-section {
                    padding: 4rem 0;
                }

                .trainers-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 2rem;
                }

                .trainer-card {
                    background: rgba(26, 35, 50, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 2rem;
                    text-align: center;
                    position: relative;
                    transition: all 0.3s ease;
                }

                .trainer-card:hover {
                    transform: translateY(-8px);
                    background: rgba(26, 35, 50, 0.8);
                    border-color: rgba(96, 165, 250, 0.3);
                    box-shadow: 0 8px 32px rgba(96, 165, 250, 0.2);
                }

                .verified-badge {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.35rem 0.85rem;
                    background: rgba(96, 165, 250, 0.2);
                    border: 1px solid rgba(96, 165, 250, 0.4);
                    color: #60a5fa;
                    border-radius: 50px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .trainer-avatar {
                    width: 120px;
                    height: 120px;
                    margin: 0 auto 1.5rem;
                    background: rgba(96, 165, 250, 0.1);
                    border: 2px solid rgba(96, 165, 250, 0.2);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #60a5fa;
                }

                .trainer-card h3 {
                    font-size: 1.35rem;
                    margin-bottom: 0.5rem;
                    color: white;
                }

                .trainer-username {
                    color: rgba(255, 255, 255, 0.5);
                    margin-bottom: 1.5rem;
                    font-size: 0.9rem;
                }

                .trainer-info {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    text-align: left;
                    background: rgba(15, 20, 25, 0.4);
                    padding: 1.25rem;
                    border-radius: 10px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    margin-bottom: 1rem;
                }

                .info-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 0.9rem;
                    word-break: break-word;
                }

                .info-item svg {
                    color: #60a5fa;
                    flex-shrink: 0;
                }

                .info-item span:first-child {
                    flex-shrink: 0;
                }

                /* Botão Enviar Pedido */
                .btn-send-request {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    background: #60a5fa;
                    color: white;
                    border: none;
                    padding: 0.85rem 2rem;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 1rem;
                }

                .btn-send-request:hover:not(:disabled) {
                    background: #3b82f6;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(96, 165, 250, 0.4);
                }

                .btn-send-request:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                /* Loading & No Results */
                .loading, .no-results {
                    text-align: center;
                    padding: 4rem 2rem;
                    color: white;
                    font-size: 1.1rem;
                }

                .no-results {
                    background: rgba(26, 35, 50, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .nav-links {
                        gap: 1rem;
                    }

                    .nav-link {
                        font-size: 0.9rem;
                    }

                    .btn-register {
                        padding: 0.6rem 1.5rem;
                        font-size: 0.9rem;
                    }

                    .hero {
                        padding: 4rem 1.5rem 3rem;
                    }

                    .hero h1 {
                        font-size: 2.25rem;
                    }

                    .hero p {
                        font-size: 1rem;
                    }

                    .trainers-grid {
                        grid-template-columns: 1fr;
                    }

                    .filter-bar {
                        font-size: 0.85rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default TrainersList;