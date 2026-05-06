import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { toast } from 'sonner';

export interface User {
  id: number;
  email: string;
  superRole: string;
  nom: string;
  prenom: string;
}

// Liste des utilisateurs disponibles pour la connexion rapide
export const AVAILABLE_USERS = [
  { email: 'yassinesefiani@gmail.com', password: '123456', superRole: 'ADMIN' },
  { email: 'adv@abcdis.com', password: '123456', superRole: 'ADV' },
  { email: 'rh@abcdis.com', password: '123456', superRole: 'RH' },
  { email: 'dispatcher@abcdis.com', password: '123456', superRole: 'DISPATCHER' },
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Email ou mot de passe incorrect');
        return false;
      }

      const data = await response.json();
      
      // Stocker les données de base pour l'authentification
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', email);

      // Valider le token et récupérer les infos utilisateur complètes
      const validateResponse = await fetch(`${API_URL}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: data.token }),
      });

      if (validateResponse.ok) {
        const validateData = await validateResponse.json();
        if (validateData.valid && validateData.user) {
          setUser(validateData.user);
          
          // --- STOCKAGE CRUCIAL POUR LE ROUTER ---
          localStorage.setItem('user', JSON.stringify(validateData.user));
          localStorage.setItem('userRole', validateData.user.superRole); // Nécessaire pour requireAuth()
          
          toast.success('Connexion réussie');
          return true;
        }
      }

      toast.error('Erreur lors de la validation');
      return false;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      toast.error('Impossible de se connecter au serveur');
      return false;
    }
  };

  const logout = () => {
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
        const data = await response.json();
        if (data.valid && data.user) {
          setUser(data.user);
          // Garder le localStorage à jour
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('userRole', data.user.superRole);
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