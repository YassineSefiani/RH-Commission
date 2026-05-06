import { useState } from 'react';
import { useNavigate } from 'react-router';
import { LogIn } from 'lucide-react';
import logo from '../assets/logo-on-black.png';
import { useUser, AVAILABLE_USERS } from '../context/UserContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const success = await login(email, password);
    
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Email ou mot de passe incorrect');
    }
    setIsLoading(false);
  };

  const handleQuickLogin = (userEmail: string, userPassword: string) => {
    setEmail(userEmail);
    setPassword(userPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white">
      <div className="w-full max-w-md p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo et titre */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
              <img src={logo} alt="ABC DIS Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="font-bold text-gray-900 text-[24px]">Systeme de Gestion RH</h1>
            
          </div>

          {/* Formulaire de connexion */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                placeholder="votre.email@abcdis.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
              style={{ backgroundColor: '#f7a800' }}
            >
              <LogIn className="w-5 h-5" />
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          {/* Quick Login Buttons */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-gray-500 text-center mb-3">Connexion rapide</p>
            <div className="flex flex-wrap justify-center gap-2">
              {AVAILABLE_USERS.map((user) => (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => handleQuickLogin(user.email, user.password)}
                  className="px-3 py-1.5 text-xs font-medium rounded-full border transition-colors hover:bg-gray-50"
                  style={{ borderColor: '#e5e7eb' }}
                >
                  <span className="font-semibold">{user.superRole}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}