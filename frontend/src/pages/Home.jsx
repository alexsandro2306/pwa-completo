import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    Activity,
    Calendar,
    TrendingUp,
    AlertCircle,
    MessageCircle,
    Users,
    UserCheck,
    ClipboardList,
    Clock,
    CheckCircle2,
    XCircle,
    ChevronRight,
    Bell,
    UserPlus,
    Search
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { getAvatarUrl } from '../utils/imageUtils';

const StatCard = ({ icon: Icon, label, value, color, onClick }) => (
    <div className={`glass stat-card ${onClick ? 'clickable' : ''}`} onClick={onClick}>
        <div className="stat-icon" style={{ backgroundColor: color }}>
            <Icon size={24} color="white" />
        </div>
        <div className="stat-info">
            <h3>{value}</h3>
            <p>{label}</p>
        </div>
        <style>{`
      .stat-card { padding: 1.5rem; display: flex; align-items: center; gap: 1.5rem; flex: 1; min-width: 250px; transition: var(--transition); }
      .stat-card.clickable:hover { transform: translateY(-5px); border-color: var(--accent-primary); cursor: pointer; }
      .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
      .stat-info h3 { font-size: 1.5rem; margin: 0; }
      .stat-info p { color: var(--text-secondary); font-size: 0.875rem; margin: 0; }
    `}</style>
    </div>
);

const Home = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [trainerInsights, setTrainerInsights] = useState({
        recentLogs: [],
        expiringPlans: [],
        upcomingBirthdays: [],
        activeCount: 0,
        unreadMsgs: 0
    });
    const [adminStats, setAdminStats] = useState({ pendingTrainers: 0, pendingRequests: 0, totalTrainers: 0 });
    const [loading, setLoading] = useState(true);

    // ✅ REDIRECIONAR ADMIN AUTOMATICAMENTE
    useEffect(() => {
        if (user?.role === 'admin') {
            navigate('/admin', { replace: true });
        }
    }, [user, navigate]);

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                if (user.role === 'client') {
                    const res = await api.get('/users/dashboard/me');
                    setData(res.data.data);
                } else if (user.role === 'trainer') {
                    const [clientsRes, unreadRes] = await Promise.all([
                        api.get('/users/my-clients'),
                        api.get('/messages/unread')
                    ]);

                    const clients = clientsRes.data.data;

                    setTrainerInsights({
                        activeCount: clients.length,
                        unreadMsgs: unreadRes.data.data?.length || 0,
                        recentLogs: [],
                        expiringPlans: []
                    });

                    setData({ clients });
                } else if (user.role === 'admin') {
                    const [pendingTrainers, pendingRequests, trainers] = await Promise.all([
                        api.get('/admin/trainers/pending'),
                        api.get('/admin/requests/pending'),
                        api.get('/admin/users')
                    ]);
                    setAdminStats({
                        pendingTrainers: pendingTrainers.data.results || 0,
                        pendingRequests: pendingRequests.data.results || 0,
                        totalTrainers: trainers.data.data.filter(u => u.role === 'trainer').length
                    });
                }
            } catch (err) {
                console.error('Erro ao carregar dashboard');
            } finally {
                setLoading(false);
            }
        };

        if (user?.role !== 'admin') {
            fetchHomeData();
        }
    }, [user?.role]);

    if (loading) return <div>Carregando dashboard...</div>;

    const clientStats = data?.statsByMonth || [];

    // ✅ VERIFICAR SE CLIENTE NÃO TEM TRAINER
    const isClientWithoutTrainer = user.role === 'client' && !user.trainer;

    return (
        <div className="home-container animate-fade">
            <header className="page-header">
                <div className="header-main">
                    <h1>Olá, {user.firstName}!</h1>
                    <p>
                        {user.role === 'admin'
                            ? 'Painel de Controlo da Plataforma.'
                            : user.role === 'trainer'
                                ? 'Gestão de atletas e planeamento.'
                                : 'O seu centro de treino personalizado.'}
                    </p>
                </div>
                {user.role === 'trainer' && !user.isValidated && (
                    <div className="glass validation-alert">
                        <AlertCircle size={20} color="#f59e0b" />
                        <span>A sua conta aguarda validação do Administrador.</span>
                    </div>
                )}
            </header>

            {/* ✅ NOVO: Banner para clientes sem trainer */}
            {isClientWithoutTrainer && (
                <div className="glass cta-banner">
                    <div className="banner-content">
                        <div className="banner-icon">
                            <UserPlus size={40} />
                        </div>
                        <div className="banner-text">
                            <h2>Ainda não tem um Personal Trainer?</h2>
                            <p>Escolha o seu trainer ideal e comece a sua transformação hoje!</p>
                        </div>
                        <button className="btn-banner" onClick={() => navigate('/dashboard/trainers')}>
                            <Search size={20} />
                            Ver Personal Trainers
                        </button>
                    </div>
                </div>
            )}

            <div className="stats-grid">
                {user.role === 'client' ? (
                    <>
                        <StatCard icon={Activity} label="Treinos Concluídos" value={data?.totalWorkouts || 0} color="#3b82f6" />
                        <StatCard icon={Calendar} label="Próximo Treino" value="Hoje" color="#10b981" onClick={() => navigate('/client')} />
                        <StatCard icon={TrendingUp} label="Taxa Cumprimento" value={data?.completionRate || '0%'} color="#854dff" onClick={() => navigate('/client/statistics')} />
                    </>
                ) : user.role === 'trainer' ? (
                    <>
                        <StatCard icon={Users} label="Clientes Ativos" value={trainerInsights.activeCount} color="#3b82f6" onClick={() => navigate('/trainer/clients')} />
                        <StatCard icon={Bell} label="Alertas de Hoje" value={0} color="#ef4444" />
                        <StatCard icon={MessageCircle} label="Novas Mensagens" value={trainerInsights.unreadMsgs} color="#f59e0b" onClick={() => navigate('/chat')} />
                    </>
                ) : (
                    <>
                        <StatCard icon={UserCheck} label="Trainers Pendentes" value={adminStats.pendingTrainers} color="#f59e0b" onClick={() => navigate('/admin/trainers')} />
                        <StatCard icon={ClipboardList} label="Pedidos de Mudança" value={adminStats.pendingRequests} color="#3b82f6" onClick={() => navigate('/admin/requests')} />
                        <StatCard icon={Users} label="Total Trainers" value={adminStats.totalTrainers} color="#10b981" onClick={() => navigate('/admin/trainers')} />
                    </>
                )}
            </div>

            {user.role === 'trainer' && (
                <div className="trainer-dashboard-grid">
                    <div className="glass section-card">
                        <div className="card-header">
                            <h3><Clock size={20} /> Atividade Recente</h3>
                            <button className="btn-text" onClick={() => navigate('/trainer/clients')}>Ver Todos</button>
                        </div>
                        <div className="activity-list">
                            {data.clients?.length > 0 ? data.clients.slice(0, 4).map(client => (
                                <div key={client._id} className="activity-item" onClick={() => navigate(`/trainer/dashboard/${client._id}`)}>
                                    <div className="user-avatar">
                                        {client.avatar ? <img src={getAvatarUrl(client.avatar)} alt={client.firstName} /> : client.firstName[0]}
                                    </div>
                                    <div className="item-info">
                                        <h4>{client.firstName} {client.lastName}</h4>
                                        <span>Último treino: Há 2 horas</span>
                                    </div>
                                    <div className="item-status success">
                                        <CheckCircle2 size={16} />
                                    </div>
                                    <ChevronRight size={16} className="arrow" />
                                </div>
                            )) : <p className="empty-info">Sem clientes atribuídos.</p>}
                        </div>
                    </div>

                    <div className="glass section-card">
                        <div className="card-header">
                            <h3><Calendar size={20} /> Planos a Expirar</h3>
                        </div>
                        <div className="expiring-list">
                            {trainerInsights.expiringPlans.length > 0 ? (
                                trainerInsights.expiringPlans.map(plan => (
                                    <div key={plan._id} className="activity-item danger">
                                        <div className="user-avatar">
                                            {plan.clientAvatar ? <img src={getAvatarUrl(plan.clientAvatar)} alt={plan.clientName} /> : plan.clientName[0]}
                                        </div>
                                        <div className="item-info">
                                            <h4>{plan.clientName}</h4>
                                            <span>Expira em {plan.daysLeft} dias</span>
                                        </div>
                                        <button className="btn-action" onClick={() => navigate(`/trainer/plans/${plan.clientId}`)}>Renovar</button>
                                    </div>
                                ))
                            ) : (
                                <p className="empty-info">Nenhum plano a expirar em breve.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {user.role === 'client' && (
                <div className="charts-grid">
                    <div className="glass chart-card">
                        <h3>Evolução dos Treinos</h3>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={clientStats.length > 0 ? clientStats : [{ name: 'Jan', treinos: 0 }]}>
                                    <defs>
                                        <linearGradient id="colorTreinosCyan" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#64748b"
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="#64748b"
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                        dx={-10}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}
                                        itemStyle={{ color: '#22d3ee' }}
                                        cursor={{ stroke: '#06b6d4', strokeWidth: 1, strokeDasharray: '5 5' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="treinos"
                                        stroke="#06b6d4"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorTreinosCyan)"
                                        activeDot={{ r: 8, strokeWidth: 0, fill: '#22d3ee', boxShadow: '0 0 15px #22d3ee' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .home-container { display: flex; flex-direction: column; gap: 2rem; }
                .page-header { display: flex; justify-content: space-between; align-items: center; }
                .validation-alert { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1.25rem; border: 1px solid #f59e0b; font-size: 0.85rem; color: #f59e0b; font-weight: 500; }
                .stats-grid { display: flex; flex-wrap: wrap; gap: 1.5rem; }
                
                /* ✅ NOVO: Banner CTA para clientes sem trainer */
                .cta-banner {
                    padding: 2rem;
                    border: 2px solid var(--accent-primary);
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(96, 165, 250, 0.05) 100%);
                    margin-bottom: 1rem;
                }
                
                .banner-content {
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                }
                
                .banner-icon {
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    flex-shrink: 0;
                }
                
                .banner-text {
                    flex: 1;
                }
                
                .banner-text h2 {
                    margin: 0 0 0.5rem 0;
                    font-size: 1.5rem;
                    color: var(--text-primary);
                }
                
                .banner-text p {
                    margin: 0;
                    color: var(--text-secondary);
                    font-size: 1rem;
                }
                
                .btn-banner {
                    background: var(--accent-primary);
                    color: white;
                    border: none;
                    padding: 1rem 2rem;
                    border-radius: 0.75rem;
                    font-weight: 600;
                    font-size: 1rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.3s ease;
                    white-space: nowrap;
                }
                
                .btn-banner:hover {
                    background: var(--accent-secondary);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
                }
                
                .trainer-dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
                @media (max-width: 1000px) { 
                    .trainer-dashboard-grid { grid-template-columns: 1fr; }
                    .banner-content { flex-direction: column; text-align: center; }
                    .btn-banner { width: 100%; justify-content: center; }
                }
                
                .section-card { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
                .card-header { display: flex; justify-content: space-between; align-items: center; }
                .card-header h3 { display: flex; align-items: center; gap: 0.5rem; margin: 0; font-size: 1.1rem; }
                .btn-text { background: transparent; border: none; color: var(--accent-primary); cursor: pointer; font-weight: 600; font-size: 0.85rem; }
                
                .activity-list, .expiring-list { display: flex; flex-direction: column; gap: 0.75rem; }
                .activity-item { background: var(--bg-primary); padding: 1rem; border-radius: 0.75rem; display: flex; align-items: center; gap: 1rem; cursor: pointer; transition: 0.3s; border: 1px solid var(--border-color); }
                .activity-item:hover { transform: translateX(5px); border-color: var(--accent-primary); }
                .activity-item.danger { border-color: #fee2e2; }
                .user-avatar { width: 40px; height: 40px; border-radius: 10px; background: var(--bg-secondary); display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--accent-primary); overflow: hidden; }
                .user-avatar img { width: 100%; height: 100%; object-fit: cover; }
                .item-info { flex: 1; }
                .item-info h4 { margin: 0; font-size: 0.95rem; }
                .item-info span { font-size: 0.75rem; color: var(--text-secondary); }
                .item-status.success { color: #10b981; }
                .arrow { color: var(--text-secondary); opacity: 0.5; }
                
                .btn-action { background: #fef2f2; color: #ef4444; border: 1px solid #fee2e2; padding: 0.4rem 0.8rem; border-radius: 0.5rem; font-size: 0.8rem; font-weight: 700; cursor: pointer; }
                .empty-info { text-align: center; color: var(--text-secondary); opacity: 0.5; font-size: 0.85rem; padding: 1rem; }
                
                .charts-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
                .chart-card { padding: 1.5rem; }
                .chart-wrapper { width: 100%; height: 300px; }
            `}</style>
        </div>
    );
};

export default Home;