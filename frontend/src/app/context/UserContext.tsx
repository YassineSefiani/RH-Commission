import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { toast } from 'sonner';
import { logAudit } from '../services/auditApi';

export interface User {
  id: number;
  email: string;
  superRole: string;
  nom: string;
  prenom: string;
}

// Liste des utilisateurs disponibles pour la connexion rapide
// Mots de passe alignés sur DataInitializer du service-auth.
export const AVAILABLE_USERS = [
  { email: 'yassine.admin@abcdis.com', password: 'Admin1234!', superRole: 'ADMIN',      label: 'ADMIN' },
  { email: 'admin@abcdis.com',         password: 'Admin2024!', superRole: 'ADMIN',      label: 'SUPER ADMIN' },
  { email: 'adv@abcdis.com',           password: 'Adv1234!',   superRole: 'ADV',        label: 'ADV' },
  { email: 'rh@abcdis.com',            password: 'Rh1234!',    superRole: 'RH',         label: 'RH' },
  { email: 'dispatcher@abcdis.com',    password: 'Dispatch1!', superRole: 'DISPATCHER', label: 'DISPATCHER' },
];

interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const API_URL = 'http://localhost:8080/api/users';

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        try {
          const error = await response.json();
          toast.error(error.message || error.error || 'Email ou mot de passe incorrect');
        } catch {
          toast.error('Email ou mot de passe incorrect');
        }
        return false;
      }

      // Backend renvoie LoginResponse: { token, email, prenom, nom, superRole }
      const data = await response.json();

      const authedUser: User = {
        id: 0,
        email: data.email,
        prenom: data.prenom,
        nom: data.nom,
        superRole: data.superRole,
      };

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', authedUser.email);
      localStorage.setItem('user', JSON.stringify(authedUser));
      localStorage.setItem('userRole', authedUser.superRole);

      setUser(authedUser);
      logAudit({ action: 'LOGIN', entity: 'Utilisateur', entityId: authedUser.email, details: authedUser.superRole });
      toast.success('Connexion réussie');
      return true;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      toast.error('Impossible de se connecter au serveur');
      return false;
    }
  };

  const logout = () => {
    const emailBefore = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}').email; } catch { return null; } })();
    logAudit({ action: 'LOGOUT', entity: 'Utilisateur', entityId: emailBefore ?? undefined });
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole'); // Nettoyer le rôle à la déconnexion
    toast.info('Déconnexion réussie');
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('authToken');
    const isAuth = localStorage.getItem('isAuthenticated');

    if (!token || !isAuth) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        // Backend renvoie LoginResponse plat : { token, email, prenom, nom, superRole }
        const data = await response.json();
        if (data && data.email && data.superRole) {
          const restored: User = {
            id: 0,
            email: data.email,
            prenom: data.prenom,
            nom: data.nom,
            superRole: data.superRole,
          };
          setUser(restored);
          localStorage.setItem('user', JSON.stringify(restored));
          localStorage.setItem('userRole', restored.superRole);
        } else {
          logout();
        }
      } else {
        logout();
      }
    } catch (error) {
      console.error('Erreur lors de la vérification auth:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    // Re-validate token toutes les 5 min — détecte les tokens expirés en cours de session
    const interval = window.setInterval(() => {
      if (localStorage.getItem('authToken')) checkAuth();
    }, 5 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}