import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Home,
    Users,
    Calendar,
    MessageSquare,
    Settings,
    ShieldCheck,
    UserCircle,
    ClipboardList,
    Dumbbell
} from 'lucide-react';

import api from '../services/api';

const Sidebar = () => {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = React.useState(0);

    React.useEffect(() => {
        if (!user || user.role === 'admin') return;

        const interval = setInterval(async () => {
            try {
                const res = await api.get('/messages/unread');
                // res.data.data should be array of unread messages or count
                // Let's assume endpoint returns list of unread messages
                setUnreadCount(res.data.data?.length || 0);
            } catch (err) {
                console.error("Silent poll error", err);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [user]);


    const menuItems = [
        { icon: <Home size={20} />, label: 'Início', path: '/', roles: ['admin', 'trainer', 'client'] },

        // Admin Specific
        { icon: <Home size={20} />, label: 'Dashboard', path: '/admin', roles: ['admin'] },
        { icon: <ShieldCheck size={20} />, label: 'Gestão Trainers', path: '/trainers', roles: ['admin'] },
        { icon: <ClipboardList size={20} />, label: 'Pedidos Mudança', path: '/requests', roles: ['admin'] },

        // Trainer Specific
        { icon: <Users size={20} />, label: 'Meus Clientes', path: '/trainer/clients', roles: ['trainer'] },
        { icon: <Dumbbell size={20} />, label: 'Exercícios', path: '/trainer/exercises', roles: ['trainer'] },

        // Client Specific
        { icon: <Calendar size={20} />, label: 'Meus Treinos', path: '/client', roles: ['client'] },

        // General
        {
            icon: (
                <div style={{ position: 'relative' }}>
                    <MessageSquare size={20} />
                    {unreadCount > 0 && <span className="nav-badge"></span>}
                </div>
            ), label: 'Chat', path: '/chat', roles: ['trainer', 'client']
        },
        { icon: <UserCircle size={20} />, label: 'Perfil', path: '/profile', roles: ['admin', 'trainer', 'client'] },
    ];

    const filteredMenu = menuItems.filter(item => {
        if (!item.roles.includes(user?.role)) return false;

        // Hide specific trainer links if not validated
        if (user?.role === 'trainer' && !user.isValidated) {
            // Only allow 'Perfil' and maybe 'Home' (which redirects logic)
            // Actually, for PendingApproval page we might not even use Sidebar
            // But if we do, hide function links.
            if (['/trainer/clients', '/trainer/exercises', '/chat', '/'].includes(item.path)) return false;
        }
        return true;
    });

    return (
        <aside className="sidebar glass">
            <div className="logo">
                <h2>Fitness+</h2>
            </div>
            <nav>
                {filteredMenu.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <style jsx>{`
        .sidebar {
          width: 260px;
          height: calc(100vh - 2rem);
          margin: 1rem;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
        }
        .logo { margin-bottom: 3rem; text-align: center; color: var(--accent-primary); }
        nav { display: flex; flex-direction: column; gap: 0.5rem; }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1rem;
          text-decoration: none;
          color: var(--text-secondary);
          border-radius: 0.5rem;
          transition: var(--transition);
        }
        .nav-item:hover { background: var(--glass-bg); color: var(--text-primary); }
        .nav-item.active { background: var(--accent-primary); color: white; }
        .nav-badge { position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; background: #ef4444; border-radius: 50%; border: 1px solid var(--bg-secondary); }
      `}</style>
        </aside>
    );
};

export default Sidebar;
