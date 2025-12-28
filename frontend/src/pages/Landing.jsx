import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Dumbbell,
    Activity,
    ShieldCheck,
    ChevronRight,
    Users,
    Trophy,
    Zap
} from 'lucide-react';

const Landing = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-container">
            {/* Navbar Overlay */}
            <nav className="landing-nav glass">
                <div className="logo">
                    <Zap size={24} className="logo-icon" />
                    <h2>Fitness+</h2>
                </div>
                <div className="nav-actions">
                    <button className="btn-ghost" onClick={() => navigate('/login')}>Entrar</button>
                    <button className="btn-primary" onClick={() => navigate('/register')}>Registar</button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content animate-fade-up">
                    <div className="badge-pill">
                        <span className="dot"></span>
                        A Plataforma #1 de Fitness
                    </div>
                    <h1>
                        Transforme o seu <span className="text-gradient">Corpo</span>,<br />
                        Eleve a sua <span className="text-gradient">Mente</span>.
                    </h1>
                    <p>
                        Planos de treino personalizados, acompanhamento em tempo real e uma comunidade focada nos seus objetivos. Junte-se à revolução fitness.
                    </p>
                    <div className="hero-buttons">
                        <button className="btn-primary large" onClick={() => navigate('/register')}>
                            Começar Agora <ChevronRight size={20} />
                        </button>
                        <button className="btn-secondary large" onClick={() => navigate('/login')}>
                            Já tenho conta
                        </button>
                    </div>

                    <div className="hero-stats glass">
                        <div className="stat-item">
                            <h3>500+</h3>
                            <span>Atletas</span>
                        </div>
                        <div className="divider"></div>
                        <div className="stat-item">
                            <h3>50+</h3>
                            <span>Trainers</span>
                        </div>
                        <div className="divider"></div>
                        <div className="stat-item">
                            <h3>10k+</h3>
                            <span>Treinos</span>
                        </div>
                    </div>
                </div>

                {/* Abstract Background Shapes */}
                <div className="bg-shape shape-1"></div>
                <div className="bg-shape shape-2"></div>
            </section>

            {/* Features Section */}
            <section className="features">
                <div className="section-header">
                    <h2>Tudo o que precisa para evoluir</h2>
                    <p>Ferramentas profissionais para resultados reais.</p>
                </div>

                <div className="features-grid">
                    <div className="feature-card glass">
                        <div className="icon-wrapper blue">
                            <Activity size={32} />
                        </div>
                        <h3>Monitorização Pro</h3>
                        <p>Acompanhe o seu progresso com gráficos detalhados e estatísticas de performance em tempo real.</p>
                    </div>

                    <div className="feature-card glass">
                        <div className="icon-wrapper purple">
                            <Dumbbell size={32} />
                        </div>
                        <h3>Planos Personalizados</h3>
                        <p>Receba planos de treino adaptados aos seus objetivos, criados por personal trainers certificados.</p>
                    </div>

                    <div className="feature-card glass">
                        <div className="icon-wrapper green">
                            <ShieldCheck size={32} />
                        </div>
                        <h3>Chat Direto</h3>
                        <p>Comunicação direta e segura com o seu treinador através do nosso sistema de mensagens integrado.</p>
                    </div>
                </div>
            </section>

            <footer className="landing-footer">
                <p>&copy; {new Date().getFullYear()} Fitness+. Todos os direitos reservados.</p>
            </footer>

            <style jsx>{`
                .landing-container {
                    min-height: 100vh;
                    background: var(--bg-primary);
                    color: var(--text-primary);
                    overflow-x: hidden;
                    position: relative;
                }

                .glass {
                    background: rgba(30, 41, 59, 0.7);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                /* Navbar */
                .landing-nav {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    padding: 1rem 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    z-index: 100;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }
                .logo { display: flex; align-items: center; gap: 0.5rem; color: var(--accent-primary); }
                .logo h2 { margin: 0; font-size: 1.5rem; font-weight: 800; }
                .nav-actions { display: flex; gap: 1rem; }

                /* Hero */
                .hero {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 8rem 2rem 4rem;
                    position: relative;
                    text-align: center;
                }
                .hero-content {
                    max-width: 800px;
                    z-index: 10;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .badge-pill {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: rgba(99, 102, 241, 0.1);
                    border: 1px solid rgba(99, 102, 241, 0.2);
                    border-radius: 2rem;
                    color: var(--accent-primary);
                    font-size: 0.85rem;
                    font-weight: 600;
                    margin-bottom: 2rem;
                }
                .dot { width: 6px; height: 6px; background: var(--accent-primary); border-radius: 50%; box-shadow: 0 0 10px var(--accent-primary); }
                
                h1 {
                    font-size: 4rem;
                    line-height: 1.1;
                    margin-bottom: 1.5rem;
                    font-weight: 800;
                }
                .text-gradient {
                    background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .hero p {
                    font-size: 1.25rem;
                    color: var(--text-secondary);
                    margin-bottom: 2.5rem;
                    max-width: 600px;
                    line-height: 1.6;
                }
                
                .hero-buttons { display: flex; gap: 1rem; margin-bottom: 4rem; }
                .large { padding: 1rem 2rem; font-size: 1.1rem; }
                
                /* Stats */
                .hero-stats {
                    display: flex;
                    align-items: center;
                    padding: 1.5rem 3rem;
                    border-radius: 1rem;
                    gap: 3rem;
                    margin-top: 2rem;
                }
                .stat-item { text-align: center; }
                .stat-item h3 { font-size: 2rem; margin: 0; color: white; }
                .stat-item span { color: var(--text-secondary); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; }
                .divider { width: 1px; height: 40px; background: rgba(255,255,255,0.1); }

                /* Features */
                .features { padding: 6rem 2rem; max-width: 1200px; margin: 0 auto; }
                .section-header { text-align: center; margin-bottom: 4rem; }
                .section-header h2 { font-size: 2.5rem; margin-bottom: 1rem; }
                .section-header p { color: var(--text-secondary); font-size: 1.2rem; }
                
                .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
                .feature-card {
                    padding: 2.5rem;
                    border-radius: 1.5rem;
                    transition: transform 0.3s;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                }
                .feature-card:hover { transform: translateY(-10px); }
                
                .icon-wrapper {
                    width: 60px;
                    height: 60px;
                    border-radius: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 1.5rem;
                }
                .icon-wrapper.blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
                .icon-wrapper.purple { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
                .icon-wrapper.green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                
                .feature-card h3 { font-size: 1.5rem; margin-bottom: 1rem; }
                .feature-card p { color: var(--text-secondary); line-height: 1.6; margin: 0; }

                /* Background Effects */
                .bg-shape {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(100px);
                    opacity: 0.4;
                    z-index: 0;
                }
                .shape-1 {
                    width: 500px;
                    height: 500px;
                    background: #6366f1;
                    top: -100px;
                    right: -100px;
                    animation: float 10s ease-in-out infinite;
                }
                .shape-2 {
                    width: 400px;
                    height: 400px;
                    background: #a855f7;
                    bottom: 0;
                    left: -100px;
                    animation: float 15s ease-in-out infinite reverse;
                }
                
                .landing-footer { text-align: center; padding: 2rem; color: var(--text-secondary); border-top: 1px solid rgba(255,255,255,0.05); margin-top: 4rem; }

                @keyframes float {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(30px, 50px); }
                }

                @media (max-width: 768px) {
                    h1 { font-size: 2.5rem; }
                    .hero-stats { flex-direction: column; gap: 1.5rem; width: 100%; }
                    .divider { width: 100%; height: 1px; }
                    .hero-buttons { flex-direction: column; width: 100%; }
                    .hero-buttons button { width: 100%; }
                }
            `}</style>
        </div>
    );
};

export default Landing;
