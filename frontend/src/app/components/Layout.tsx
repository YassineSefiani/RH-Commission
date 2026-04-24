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
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile
  const [isHovered, setIsHovered] = useState(false); // Desktop Hover
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
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar Desktop */}
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`hidden md:flex md:flex-col fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out border-r shadow-2xl ${
          isHovered ? 'w-64' : 'w-20'
        }`}
        style={{ backgroundColor: '#18324B' }}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center px-4 overflow-hidden border-b flex-shrink-0" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <div className="flex items-center gap-4 min-w-[200px]">
            <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center p-1.5 bg-white border-2" style={{ borderColor: '#f7a800' }}>
              <img src={logo} alt="ABC DIS" className="w-full h-full object-contain" />
            </div>
            <div className={`transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
              <h1 className="font-bold text-white whitespace-nowrap">ABC DIS</h1>
              <p className="text-xs text-gray-400 whitespace-nowrap">Gestion RH</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto overflow-x-hidden">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-3 py-3 rounded-lg text-sm font-medium transition-all group ${
                  isActive ? 'text-white' : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
                style={{
                  backgroundColor: isActive ? '#f7a800' : 'transparent',
                }}
              >
                <Icon className={`w-6 h-6 flex-shrink-0 transition-transform ${!isActive && 'group-hover:scale-110'}`} />
                <span className={`transition-all duration-300 whitespace-nowrap ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t flex-shrink-0" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <div className="flex items-center gap-4 overflow-hidden mb-3">
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-medium" style={{ backgroundColor: '#f7a800' }}>
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className={`transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
              <p className="text-sm font-medium text-gray-200 truncate w-32">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-2 py-2 text-sm text-gray-300 rounded-lg transition-colors hover:text-white hover:bg-white/10"
          >
            <LogOut className="w-6 h-6 flex-shrink-0" />
            <span className={`transition-opacity duration-300 whitespace-nowrap ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
              Déconnexion
            </span>
          </button>
        </div>
      </aside>

      {/* Spacer Desktop : empêche le contenu de passer sous le sidebar fixe */}
      <div className={`hidden md:block transition-all duration-300 flex-shrink-0 ${isHovered ? 'w-64' : 'w-20'}`} />

      {/* Sidebar Mobile (Full Overlay) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 flex flex-col shadow-xl" style={{ backgroundColor: '#18324B' }}>
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

            <nav className="flex-1 px-3 py-4 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium ${
                      isActive ? 'text-white' : 'text-gray-300'
                    }`}
                    style={{ backgroundColor: isActive ? '#f7a800' : 'transparent' }}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 text-sm text-gray-300 rounded-lg bg-white/5">
                <LogOut className="w-5 h-5" />
                Déconnexion
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Top Navbar */}
        <header className="h-16 border-b flex items-center px-4 md:px-6 flex-shrink-0 z-40" style={{ backgroundColor: '#18324B', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <button
            className="md:hidden mr-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6 text-gray-300" />
          </button>
          <h2 className="text-xl font-bold text-white">
            {menuItems.find(item => item.path === location.pathname)?.label || 'ABC DIS'}
          </h2>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50 relative">
          {children}
        </main>
      </div>

      {/* Backend Status Indicator */}
      <BackendStatus />
    </div>
  );
}