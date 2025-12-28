import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, QrCode } from 'lucide-react';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '', token: '' });
    const [show2FA, setShow2FA] = useState(false);
    const [error, setError] = useState('');
    const [useQR, setUseQR] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(formData);
            navigate('/');
        } catch (err) {
            if (err.response?.status === 401 && err.response?.data?.message?.toLowerCase().includes('token')) {
                setShow2FA(true);
            } else {
                setError(err.response?.data?.message || 'Erro ao fazer login');
            }
        }
    };

    return (
        <div className="login-container animate-fade">
            <div className="glass login-card">
                <h1>Fitness Platform</h1>
                <p className="subtitle">Bem-vindo de volta!</p>

                <div className="tab-container">
                    <button className={!useQR ? 'active' : ''} onClick={() => setUseQR(false)}>Password</button>
                    <button className={useQR ? 'active' : ''} onClick={() => setUseQR(true)}>QR Code</button>
                </div>

                {error && <div className="error-message">{error}</div>}

                {!useQR ? (
                    <form onSubmit={handleSubmit}>
                        {!show2FA ? (
                            <>
                                <div className="input-group">
                                    <label>Username</label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Senha</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="input-group animate-slide-up">
                                <label>Código 2FA</label>
                                <input
                                    type="text"
                                    placeholder="000000"
                                    value={formData.token}
                                    onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                                    required
                                    autoFocus
                                />
                                <p className="helper-text">Insira o código do seu autenticador.</p>
                            </div>
                        )}
                        <button type="submit" className="btn-primary full-width">
                            <LogIn size={20} /> Entrar
                        </button>
                    </form>
                ) : (
                    <div className="qr-login-section">
                        <div className="qr-placeholder">
                            <QrCode size={120} />
                        </div>
                        <p>Aponte sua câmera para o QR Code para entrar automaticamente.</p>
                    </div>
                )}

                <p className="footer-text">
                    Não tem uma conta? <Link to="/register">Registe-se agora</Link>
                </p>
            </div>

            <style jsx>{`
        .login-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 2rem;
        }
        .login-card {
          width: 100%;
          max-width: 400px;
          padding: 2.5rem;
          text-align: center;
        }
        h1 { margin-bottom: 0.5rem; }
        .subtitle { color: var(--text-secondary); margin-bottom: 2rem; }
        .tab-container {
          display: flex;
          background: var(--bg-primary);
          border-radius: 0.5rem;
          margin-bottom: 2rem;
          padding: 0.25rem;
        }
        .tab-container button {
          flex: 1;
          background: transparent;
          border: none;
          padding: 0.5rem;
          border-radius: 0.4rem;
          cursor: pointer;
          color: var(--text-secondary);
          transition: var(--transition);
        }
        .tab-container button.active {
          background: var(--bg-secondary);
          color: var(--text-primary);
          box-shadow: var(--shadow-sm);
        }
        .input-group { text-align: left; margin-bottom: 1.5rem; }
        .input-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
        .input-group input {
          width: 100%;
          padding: 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid var(--border-color);
          background: var(--bg-primary);
          color: var(--text-primary);
        }
        .full-width { width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 1rem; }
        .error-message { color: #ef4444; background: #fee2e2; padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 1.5rem; font-size: 0.9rem; }
        .qr-placeholder { margin: 1.5rem auto; padding: 2rem; background: white; border-radius: 1rem; display: inline-block; color: black; }
        .footer-text { margin-top: 2rem; font-size: 0.9rem; color: var(--text-secondary); }
        .footer-text a { color: var(--accent-primary); text-decoration: none; font-weight: 600; }
        .helper-text { font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.4rem; }
      `}</style>
        </div>
    );
};

export default Login;
