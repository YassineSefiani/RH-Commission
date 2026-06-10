import { useState, useEffect } from 'react';
import { User, Palette, Save } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LangContext';
import { useUser } from '../context/UserContext';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { lang, setLang, t } = useLang();
  const s = t.settings;
  
  const { user } = useUser();

  const [userSettings, setUserSettings] = useState({
    nomComplet: 'Chargement...',
    email: 'Chargement...',
    role: 'Chargement...',
  });

  const [originalEmail, setOriginalEmail] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const getAuthToken = () => {
    try {
      const contextUser = user as any;
      if (contextUser && contextUser.token) return contextUser.token;

      const keys = ['token', 'auth_token', 'jwt', 'access_token'];
      for (const key of keys) {
        const t = localStorage.getItem(key) || sessionStorage.getItem(key);
        if (t) return t;
      }

      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        if (userObj && userObj.token) return userObj.token;
        if (userObj && userObj.jwt) return userObj.jwt;
      }

      return '';
    } catch (e) {
      return '';
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const localUserStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        const localUser = localUserStr ? JSON.parse(localUserStr) : {};
        
        const currentUserEmail = (user as any)?.email || localUser.email || localStorage.getItem('userEmail');

        if (!currentUserEmail) return;
        setOriginalEmail(currentUserEmail);

        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
        const token = getAuthToken();

        const fetchHeaders: HeadersInit = {};
        if (token) {
          fetchHeaders['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/users`, {
          method: 'GET',
          headers: fetchHeaders
        });
        
        if (response.ok) {
          const users = await response.json();
          const dbUser = users.find((u: any) => u.email === currentUserEmail);
          
          if (dbUser) {
            setUserSettings({
              nomComplet: `${dbUser.prenom || ''} ${dbUser.nom || ''}`.trim(),
              email: dbUser.email || '',
              role: dbUser.superRole || dbUser.super_role || 'Utilisateur',
            });
          } else {
            setUserSettings({
              nomComplet: `${localUser.prenom || ''} ${localUser.nom || ''}`.trim() || 'Inconnu',
              email: localUser.email || '',
              role: localUser.superRole || 'Utilisateur',
            });
          }
        } else {
          console.error("Erreur serveur lors du chargement des données:", response.status);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération:", error);
      }
    };

    fetchUserData();
  }, [user]);

  const handleSave = async () => {
    setError('');
    try {
      const nameParts = userSettings.nomComplet.trim().split(' ');
      const prenom = nameParts[0] || '';
      const nom = nameParts.slice(1).join(' ') || '';

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
      const token = getAuthToken();

      const fetchHeaders: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // On attache le token seulement s'il existe, sinon la requête part sans
      if (token) {
        fetchHeaders['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/auth/users/${encodeURIComponent(originalEmail)}`, {
        method: 'PUT',
        headers: fetchHeaders,
        body: JSON.stringify({
          email: userSettings.email,
          prenom: prenom,
          nom: nom,
          superRole: userSettings.role,
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        
        const localUserStr = localStorage.getItem('user');
        const localUser = localUserStr ? JSON.parse(localUserStr) : {};
        
        localUser.email = updatedUser.email;
        localUser.prenom = updatedUser.prenom;
        localUser.nom = updatedUser.nom;
        localUser.superRole = updatedUser.superRole;
        
        localStorage.setItem('user', JSON.stringify(localUser));
        localStorage.setItem('userEmail', updatedUser.email);
        
        setOriginalEmail(updatedUser.email);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errData = await response.json();
          setError(errData.message || "Erreur lors de la sauvegarde du profil");
        } else {
          setError(`Erreur ${response.status} : Accès refusé ou serveur injoignable.`);
        }
      }
    } catch (err) {
      console.error("Erreur Save:", err);
      setError("Impossible de joindre le serveur");
    }
  };

  return (
    <div className="abc-page-inner abc-stack-lg">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{s.title}</h1>
        <p className="text-gray-600 mt-1">{s.subtitle}</p>
      </div>

      {/* Messages de retour */}
      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <Save className="w-5 h-5" />
          <span>{s.savedMsg || 'Modifications enregistrées avec succès !'}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings (Modifiable) */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f7a80020' }}>
              <User className="w-5 h-5" style={{ color: '#f7a800' }} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{s.profile}</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {s.fullName || 'Nom complet'}
              </label>
              <input
                type="text"
                value={userSettings.nomComplet}
                onChange={(e) => setUserSettings({ ...userSettings, nomComplet: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {s.email}
              </label>
              <input
                type="email"
                value={userSettings.email}
                onChange={(e) => setUserSettings({ ...userSettings, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {s.role}
              </label>
              <select
                value={userSettings.role}
                onChange={(e) => setUserSettings({ ...userSettings, role: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all bg-white"
              >
                <option value="ADMIN">Administrateur</option>
                <option value="DISPATCHER">Dispatcher</option>
                <option value="MANAGER">Manager</option>
                <option value="RH">RH</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
              <Palette className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{s.appearance}</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {s.theme}
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              >
                <option value="light">{s.themeLight}</option>
                <option value="dark">{s.themeDark}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {s.language}
              </label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as 'fr' | 'en')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Company Info */}
      <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl shadow-sm p-6 border border-orange-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center p-2" style={{ backgroundColor: '#f7a800' }}>
            <span className="text-white font-bold">ABC</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">ABC DIS</h3>
            <p className="text-sm text-gray-600">Système de Gestion RH</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">{s.version}</p>
            <p className="font-semibold text-gray-900">2.5.0</p>
          </div>
          <div>
            <p className="text-gray-600">{s.lastUpdate}</p>
            <p className="font-semibold text-gray-900">27 Mars 2026</p>
          </div>
          <div>
            <p className="text-gray-600">{s.licence}</p>
            <p className="font-semibold text-gray-900">Entreprise</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 text-white rounded-lg hover:opacity-90 transition"
          style={{ backgroundColor: '#f7a800' }}
        >
          <Save className="w-5 h-5" />
          {s.saveBtn}
        </button>
      </div>
    </div>
  );
}