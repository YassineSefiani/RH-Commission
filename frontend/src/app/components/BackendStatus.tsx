import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
// Health check public (pas besoin de token) — /constraints exige désormais une
// authentification, ce qui faisait faussement remonter "déconnecté".
const HEALTH_URL = API_BASE_URL.replace(/\/api\/?$/, '') + '/actuator/health';

export function BackendStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const response = await fetch(HEALTH_URL, {
        method: 'GET',
      });
      setIsConnected(response.ok);
    } catch (error) {
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Vérifier la connexion au démarrage
    checkConnection();

    // Vérifier la connexion toutes les 30 secondes
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  if (isConnected === null) {
    return null; // Ne rien afficher pendant le premier check
  }

  return (
    <div
      className={`fixed bottom-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-sm font-medium transition-all ${
        isConnected
          ? 'bg-green-500 text-white'
          : 'bg-red-500 text-white'
      } ${isChecking ? 'opacity-50' : 'opacity-100'}`}
    >
      {isConnected ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>Backend connecté</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Backend déconnecté</span>
        </>
      )}
    </div>
  );
}