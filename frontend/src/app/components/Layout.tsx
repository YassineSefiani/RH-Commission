import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { 
  LayoutDashboard, 
  Settings, 
  Calculator, 
  History, 
  FileText,
  LogOut,
  Menu,
  X,
  Users
} from 'lucide-react';
import logo from '../assets/logo-on-black.png';
import { BackendStatus } from './BackendStatus';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const userEmail = localStorage.getItem('userEmail') || '';

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    navigate('/');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/personnel', label: 'Personnel', icon: Users },
    { path: '/constraints', label: 'Contraintes', icon: FileText },
    { path: '/calculation', label: 'Calcul', icon: Calculator },
    { path: '/history', label: 'Historique', icon: History },
    { path: '/settings', label: 'Paramètres', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 border-r" style={{ backgroundColor: '#18324B' }}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center p-1.5 bg-white border-2" style={{ borderColor: '#f7a800' }}>
              <img src={logo} alt="ABC DIS" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-white">ABC DIS</h1>
              <p className="text-xs text-gray-300">Gestion RH</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isHovered = hoveredItem === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onMouseEnter={() => setHoveredItem(item.path)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
                style={{
                  backgroundColor: isActive ? '#f7a800' : (isHovered ? 'rgba(247, 168, 0, 0.2)' : 'transparent'),
                }}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ backgroundColor: '#f7a800' }}>
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 rounded-lg transition-colors hover:text-white hover:bg-opacity-10 hover:bg-white"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Sidebar Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64" style={{ backgroundColor: '#18324B' }}>
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-6 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center p-1.5 bg-white border-2" style={{ borderColor: '#f7a800' }}>
                  <img src={logo} alt="ABC DIS" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="font-bold text-white">ABC DIS</h1>
                  <p className="text-xs text-gray-300">Gestion RH</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-6 h-6 text-gray-300" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                const isHovered = hoveredItem === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    onMouseEnter={() => setHoveredItem(item.path)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-white'
                        : 'text-gray-300 hover:text-white'
                    }`}
                    style={{
                      backgroundColor: isActive ? '#f7a800' : (isHovered ? 'rgba(247, 168, 0, 0.2)' : 'transparent'),
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* User section */}
            <div className="p-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ backgroundColor: '#f7a800' }}>
                  {userEmail.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{userEmail}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 rounded-lg transition-colors hover:text-white hover:bg-opacity-10 hover:bg-white"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b flex items-center px-4 md:px-6" style={{ backgroundColor: '#18324B', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <button
            className="md:hidden mr-4"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6 text-gray-300" />
          </button>
          <h2 className="text-xl font-bold text-white">
            {menuItems.find(item => item.path === location.pathname)?.label || 'ABC DIS'}
          </h2>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Backend Status Indicator */}
      <BackendStatus />
    </div>
  );
}