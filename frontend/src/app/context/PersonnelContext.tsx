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

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        setIsLoading(true);
        const data = await personnelApi.getAll();
        
        if (!mounted) return;

        // On charge simplement les données, même si le tableau est vide
        setPersonnel(data.map(mapApiPersonnelToFrontend));
        await loadStats();

      } catch (error) {
        console.error('Erreur init:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initialize();
    return () => { mounted = false; };
  }, [loadStats]);

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
    if (!carte || carte === 'all') {
      return reloadPersonnel();
    }

    setIsLoading(true);
    try {
      const allPersonnelApi = await personnelApi.getAll();
      const allPersonnel = allPersonnelApi.map(mapApiPersonnelToFrontend);

      const normalize = (str: string) => (str || '').toUpperCase().replace(/[_ \-]/g, '');
      const targetCarte = normalize(carte);

      const filtered = allPersonnel.filter(p => {
        const dbCarte = normalize(p.carte || '');
        
        if (targetCarte.includes('COCA') && dbCarte.includes('COCA')) return true;
        if (targetCarte.includes('FERRERO') && dbCarte.includes('FERRERO')) return true;
        if (targetCarte.includes('WALL') && dbCarte.includes('WALL')) return true;

        return dbCarte === targetCarte;
      });

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