import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Settings,
  Calculator,
  History,
  FileText,
  ClipboardList,
  LogOut,
  Menu,
  X,
  Users
} from 'lucide-react';
import logo from '../assets/logo-on-black.png';
import { BackendStatus } from './BackendStatus';
import { useUser } from '../context/UserContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useUser();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { path: '/dashboard',   label: 'Dashboard',       icon: LayoutDashboard },
    { path: '/personnel',   label: 'Personnel',        icon: Users },
    { path: '/presence',    label: 'Fiches Présence',  icon: ClipboardList },
    { path: '/constraints', label: 'Contraintes',      icon: FileText,    allowedRoles: ['ADMIN', 'ADV'] },
    { path: '/calculation', label: 'Calcul',           icon: Calculator,  allowedRoles: ['ADMIN', 'ADV'] },
    { path: '/history',     label: 'Historique',       icon: History },
    { path: '/settings',    label: 'Paramètres',       icon: Settings },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.allowedRoles) return true;
    return user && item.allowedRoles.includes(user.superRole);
  });

  const currentLabel = filteredMenuItems.find(item => item.path === location.pathname)?.label || 'ABC DIS';

  const initials = user
    ? `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}`.toUpperCase() || user.email?.charAt(0).toUpperCase()
    : 'U';

  const Sidebar = () => (
    <aside className="abc-sidebar">
      <div className="abc-sidebar-brand">
        <div className="abc-logo-wrap">
          <img src={logo} alt="ABC DIS" />
        </div>
        <div className="abc-brand-text">
          <span className="abc-brand-name">ABC DIS</span>
          <span className="abc-brand-tagline">Gestion RH</span>
        </div>
      </div>

      <div className="abc-sidebar-section-label">Menu</div>
      <nav className="abc-sidebar-nav">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`abc-navitem ${isActive ? 'is-active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="abc-sidebar-foot">
        <div className="abc-userchip">
          <div
            className="abc-avatar abc-avatar-sm"
            style={{ background: 'var(--brand)', color: 'var(--brand-fg)', width: 32, height: 32, fontSize: 12 }}
          >
            {initials}
          </div>
          <div className="abc-userchip-text">
            <span className="abc-userchip-name">
              {user ? `${user.prenom} ${user.nom}` : 'Utilisateur'}
            </span>
            <span className="abc-userchip-mail">{user?.email || ''}</span>
          </div>
        </div>
        <button className="abc-iconbtn" onClick={handleLogout} title="Déconnexion">
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );

  return (
    <div className="abc-app">
      <Sidebar />

      {/* Mobile scrim */}
      {mobileOpen && (
        <div className="abc-mobile-scrim" onClick={() => setMobileOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <Sidebar />
          </div>
          <button
            style={{ position: 'absolute', top: 16, right: 16, color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => setMobileOpen(false)}
          >
            <X size={22} />
          </button>
        </div>
      )}

      <div className="abc-main">
        <header className="abc-topbar">
          <button className="abc-iconbtn abc-mobile-only" onClick={() => setMobileOpen(true)}>
            <Menu size={18} />
          </button>
          <span className="abc-topbar-title">{currentLabel}</span>
          <div className="abc-topbar-right">
            {/* placeholder for future actions */}
          </div>
        </header>

        <main className="abc-page">
          {children}
        </main>
      </div>

      <BackendStatus />
    </div>
  );
}
