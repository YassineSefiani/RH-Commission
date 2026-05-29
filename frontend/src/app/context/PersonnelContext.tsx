import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { logAudit } from '../services/auditApi';
import { 
  personnelApi, 
  mapApiPersonnelToFrontend, 
  mapFrontendPersonnelToApi,
  Personnel,
  PersonnelStats
} from '../services/personnelApi';
import { toast } from 'sonner';
import { useUser } from '../context/UserContext';

let personnelInitPromise: Promise<void> | null = null;

const INITIAL_PERSONNEL: Omit<Personnel, 'id'>[] = [
  { matricule: 'P001', nom: 'Bennani', prenom: 'Youssef', carte: 'Coca Cola', fonction: 'Livreur', role: 'Livreur', numero: '0600000001', natureContrat: 'CDI', ville: 'Casablanca', actif: true },
  { matricule: 'P002', nom: 'El Idrissi', prenom: 'Sara', carte: 'Coca Cola', fonction: 'Livreur', role: 'Aide Livreur', numero: '0600000002', natureContrat: 'CDI', ville: 'Rabat', actif: true },
  { matricule: 'P003', nom: 'Moussaoui', prenom: 'Karim', carte: 'Coca Cola', fonction: 'Livreur', role: 'Livreur', numero: '0600000003', natureContrat: 'Int', ville: 'Marrakech', actif: true },
  { matricule: 'P004', nom: 'Novo', prenom: 'Ahmed', carte: "Wall's", fonction: 'Livreur', role: 'Aide Livreur', numero: '0600000004', natureContrat: 'CDI', ville: 'Fès', actif: true },
  { matricule: 'P005', nom: 'Sidi', prenom: 'Fatima', carte: "Wall's", fonction: 'Livreur', role: 'Livreur', numero: '0600000005', natureContrat: 'CDI', ville: 'Tanger', actif: true },
  { matricule: 'P006', nom: 'Belaid', prenom: 'Mohammed', carte: "Wall's", fonction: 'Livreur', role: 'Aide Livreur', numero: '0600000006', natureContrat: 'Int', ville: 'Agadir', actif: true },
  { matricule: 'P007', nom: 'Radi', prenom: 'Laila', carte: 'Ferrero Rocher', fonction: 'Livreur', role: 'Livreur', numero: '0600000007', natureContrat: 'CDI', ville: 'Meknes', actif: true },
  { matricule: 'P008', nom: 'Tazi', prenom: 'Ismail', carte: 'Ferrero Rocher', fonction: 'Livreur', role: 'Aide Livreur', numero: '0600000008', natureContrat: 'CDI', ville: 'Oujda', actif: true },
  { matricule: 'P009', nom: 'Karim', prenom: 'Nadia', carte: 'Ferrero Rocher', fonction: 'Livreur', role: 'Livreur', numero: '0600000009', natureContrat: 'Int', ville: 'Tétouan', actif: true },
];

interface PersonnelContextType {
  personnel: Personnel[];
  stats: PersonnelStats | null;
  isLoading: boolean;
  addPersonnel: (personnel: Omit<Personnel, 'id'>) => Promise<void>;
  updatePersonnel: (id: string, personnel: Partial<Personnel>) => Promise<void>;
  deletePersonnel: (id: string) => Promise<void>;
  togglePersonnel: (id: string) => Promise<void>;
  searchByNom: (nom: string) => Promise<void>;
  filterByCarte: (carte: string) => Promise<void>;
  filterByVille: (ville: string) => Promise<void>;
  filterByContrat: (type: string) => Promise<void>;
  showActifsOnly: () => Promise<void>;
  resetFilter: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

const PersonnelContext = createContext<PersonnelContextType | undefined>(undefined);

export function PersonnelProvider({ children }: { children: ReactNode }) {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [stats, setStats] = useState<PersonnelStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useUser();

  const loadStats = useCallback(async () => {
    try {
      const statsData = await personnelApi.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  }, []);

  const reloadPersonnel = useCallback(async () => {
    try {
      const apiPersonnel = await personnelApi.getAll();
      setPersonnel(apiPersonnel.map(mapApiPersonnelToFrontend));
    } catch (error) {
      console.error('Erreur rechargement:', error);
    }
  }, []);

  const initializeDefaultPersonnel = useCallback(async () => {
    if (personnelInitPromise) return personnelInitPromise;

    personnelInitPromise = (async () => {
      try {
        // 1. On vérifie d'abord si la base est vraiment vide
        const existingData = await personnelApi.getAll();
        
        // 2. Si des données existent déjà, on arrête l'initialisation sans erreur
        if (existingData.length > 0) {
          console.log('✅ Personnel déjà présent, saut de l\'initialisation.');
          return;
        }

        console.log('🏗️ Base vide. Création du personnel par défaut...');
        // Utilisation d'une boucle simple au lieu de Promise.all pour éviter les conflits de lecture/écriture simultanés
        for (const person of INITIAL_PERSONNEL) {
          await personnelApi.create(mapFrontendPersonnelToApi(person));
        }
        
        toast.success('Données initialisées avec succès');
      } catch (error) {
        // On ne log en erreur que si c'est un vrai problème (autre que "déjà présent")
        console.warn('Note: L\'initialisation auto a été ignorée ou a échoué.');
      } finally {
        personnelInitPromise = null;
      }
    })();
    return personnelInitPromise;
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        setIsLoading(true);
        const data = await personnelApi.getAll();
        
        if (!mounted) return;

        if (data.length === 0) {
          try {
            await initializeDefaultPersonnel();
            await reloadPersonnel();
          } catch (e) {
            setPersonnel([]); // Fallback
          }
        } else {
          setPersonnel(data.map(mapApiPersonnelToFrontend));
          await loadStats();
        }
      } catch (error) {
        console.error('Erreur init:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initialize();
    return () => { mounted = false; };
  }, [initializeDefaultPersonnel, reloadPersonnel, loadStats]);

  // Actions CRUD
  const addPersonnel = async (newP: Omit<Personnel, 'id'>) => {
    const created = await personnelApi.create(mapFrontendPersonnelToApi(newP));
    const mapped = mapApiPersonnelToFrontend(created);
    setPersonnel(prev => [...prev, mapped]);
    await loadStats();
    logAudit({ action: 'PERSONNEL_CREATE', entity: 'Personnel', entityId: mapped.id, details: `${mapped.prenom} ${mapped.nom}` });
    toast.success('Ajouté avec succès');
  };

  const updatePersonnel = async (id: string, updates: Partial<Personnel>) => {
    const current = personnel.find(p => p.id === id);
    if (!current) return;
    const updated = await personnelApi.update(parseInt(id), mapFrontendPersonnelToApi({...current, ...updates}));
    setPersonnel(prev => prev.map(p => p.id === id ? mapApiPersonnelToFrontend(updated) : p));
    logAudit({ action: 'PERSONNEL_UPDATE', entity: 'Personnel', entityId: id, details: JSON.stringify(updates) });
    toast.success('Modifié');
  };

  const deletePersonnel = async (id: string) => {
    await personnelApi.delete(parseInt(id));
    setPersonnel(prev => prev.filter(p => p.id !== id));
    await loadStats();
    logAudit({ action: 'PERSONNEL_DELETE', entity: 'Personnel', entityId: id });
    toast.success('Supprimé');
  };

  const togglePersonnel = async (id: string) => {
    const toggled = await personnelApi.toggle(parseInt(id));
    const mapped = mapApiPersonnelToFrontend(toggled);
    setPersonnel(prev => prev.map(p => p.id === id ? mapped : p));
    await loadStats();
    logAudit({ action: 'PERSONNEL_TOGGLE', entity: 'Personnel', entityId: id, details: `actif=${mapped.actif}` });
  };

  // Filtres
  const searchByNom = async (nom: string) => {
    if (!nom.trim()) return reloadPersonnel();
    setIsLoading(true);
    const results = await personnelApi.searchByNom(nom);
    setPersonnel(results.map(mapApiPersonnelToFrontend));
    setIsLoading(false);
  };

  const filterByVille = async (v: string) => {
    setIsLoading(true);
    const res = await personnelApi.getByVille(v);
    setPersonnel(res.map(mapApiPersonnelToFrontend));
    setIsLoading(false);
  };

  const filterByContrat = async (t: string) => {
    setIsLoading(true);
    const res = await personnelApi.getByContrat(t);
    setPersonnel(res.map(mapApiPersonnelToFrontend));
    setIsLoading(false);
  };

  const filterByCarte = async (carte: string) => {
    // Si la chaîne est vide ou "all", on annule le filtre
    if (!carte || carte === 'all') {
      return reloadPersonnel();
    }

    setIsLoading(true);
    try {
      // 1. On récupère TOUT le personnel pour faire le tri nous-mêmes (contournement du bug Backend)
      const allPersonnelApi = await personnelApi.getAll();
      const allPersonnel = allPersonnelApi.map(mapApiPersonnelToFrontend);

      // 2. Le "Filtre Magique"
      const normalize = (str: string) => (str || '').toUpperCase().replace(/[_ \-]/g, '');
      const targetCarte = normalize(carte);

      const filtered = allPersonnel.filter(p => {
        const dbCarte = normalize(p.carte || '');
        
        // Mots-clés principaux
        if (targetCarte.includes('COCA') && dbCarte.includes('COCA')) return true;
        if (targetCarte.includes('FERRERO') && dbCarte.includes('FERRERO')) return true;
        if (targetCarte.includes('WALL') && dbCarte.includes('WALL')) return true;

        // Comparaison exacte sans espaces ni tirets
        return dbCarte === targetCarte;
      });

      // 3. On met à jour l'affichage avec setPersonnel (qui existe bien !)
      setPersonnel(filtered);
    } catch (error) {
      console.error("Erreur lors du filtrage par carte:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const showActifsOnly = async () => {
    setIsLoading(true);
    const res = await personnelApi.getActifs();
    setPersonnel(res.map(mapApiPersonnelToFrontend));
    setIsLoading(false);
  };

  return (
    <PersonnelContext.Provider value={{
      personnel, stats, isLoading, addPersonnel, updatePersonnel, 
      deletePersonnel, togglePersonnel, searchByNom, filterByCarte,
      filterByVille, filterByContrat, showActifsOnly, 
      resetFilter: reloadPersonnel, refreshStats: loadStats
    }}>
      {children}
    </PersonnelContext.Provider>
  );
}

export const usePersonnel = () => {
  const ctx = useContext(PersonnelContext);
  if (!ctx) throw new Error('usePersonnel must be used within PersonnelProvider');
  return ctx;
};