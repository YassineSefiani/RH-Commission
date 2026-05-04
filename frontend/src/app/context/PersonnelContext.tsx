import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { 
  personnelApi, 
  mapApiPersonnelToFrontend, 
  mapFrontendPersonnelToApi,
  Personnel,
  PersonnelStats
} from '../services/personnelApi';
import { toast } from 'sonner';
import { useUser } from '../context/UserContext'; // Import crucial

let personnelInitPromise: Promise<void> | null = null;

const INITIAL_PERSONNEL: Omit<Personnel, 'id'>[] = [
  {
    matricule: 'P001',
    nom: 'Bennani',
    prenom: 'Youssef',
    carte: 'Coca Cola',
    fonction: 'Livreur',
    role: 'Livreur',
    numero: '0600000001',
    natureContrat: 'CDI',
    ville: 'Casablanca',
    actif: true,
  },
  {
    matricule: 'P002',
    nom: 'El Idrissi',
    prenom: 'Sara',
    carte: 'Coca Cola',
    fonction: 'Livreur',
    role: 'Aide Livreur',
    numero: '0600000002',
    natureContrat: 'CDI',
    ville: 'Rabat',
    actif: true,
  },
  {
    matricule: 'P003',
    nom: 'Moussaoui',
    prenom: 'Karim',
    carte: 'Coca Cola',
    fonction: 'Livreur',
    role: 'Livreur',
    numero: '0600000003',
    natureContrat: 'Int',
    ville: 'Marrakech',
    actif: true,
  },
  {
    matricule: 'P004',
    nom: 'Novo',
    prenom: 'Ahmed',
    carte: "Wall's",
    fonction: 'Livreur',
    role: 'Aide Livreur',
    numero: '0600000004',
    natureContrat: 'CDI',
    ville: 'Fès',
    actif: true,
  },
  {
    matricule: 'P005',
    nom: 'Sidi',
    prenom: 'Fatima',
    carte: "Wall's",
    fonction: 'Livreur',
    role: 'Livreur',
    numero: '0600000005',
    natureContrat: 'CDI',
    ville: 'Tanger',
    actif: true,
  },
  {
    matricule: 'P006',
    nom: 'Belaid',
    prenom: 'Mohammed',
    carte: "Wall's",
    fonction: 'Livreur',
    role: 'Aide Livreur',
    numero: '0600000006',
    natureContrat: 'Int',
    ville: 'Agadir',
    actif: true,
  },
  {
    matricule: 'P007',
    nom: 'Radi',
    prenom: 'Laila',
    carte: 'Ferrero Rocher',
    fonction: 'Livreur',
    role: 'Livreur',
    numero: '0600000007',
    natureContrat: 'CDI',
    ville: 'Meknes',
    actif: true,
  },
  {
    matricule: 'P008',
    nom: 'Tazi',
    prenom: 'Ismail',
    carte: 'Ferrero Rocher',
    fonction: 'Livreur',
    role: 'Aide Livreur',
    numero: '0600000008',
    natureContrat: 'CDI',
    ville: 'Oujda',
    actif: true,
  },
  {
    matricule: 'P009',
    nom: 'Karim',
    prenom: 'Nadia',
    carte: 'Ferrero Rocher',
    fonction: 'Livreur',
    role: 'Livreur',
    numero: '0600000009',
    natureContrat: 'Int',
    ville: 'Tétouan',
    actif: true,
  },
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

  // Récupération de l'état d'authentification
  const { isAuthenticated, isLoading: isAuthLoading } = useUser();

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      // On n'initialise QUE si l'utilisateur est authentifié OU si c'est le premier chargement
      if (!mounted) return;

      try {
        setIsLoading(true);
        const apiPersonnel = await personnelApi.getAll();

        if (!mounted) return;

        if (apiPersonnel.length === 0) {
          console.log('🏗️ Initialisation du personnel par défaut...');
          await initializeDefaultPersonnel();
          if (mounted) {
            await reloadPersonnel();
          }
        } else {
          const mappedPersonnel = apiPersonnel.map(mapApiPersonnelToFrontend);
          if (mounted) {
            setPersonnel(mappedPersonnel);
            await loadStats(); // Charger les stats si des données existent
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement du personnel:', error);
        if (mounted && isAuthenticated) {
          toast.error('Impossible de charger le personnel');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Initialiser immédiatement, indépendamment de l'authentification
    initialize();

    return () => {
      mounted = false;
    };
  }, []); // Retirer les dépendances pour initialiser au premier rendu

  const loadPersonnel = async () => {
    try {
      setIsLoading(true);
      const apiPersonnel = await personnelApi.getAll();
      const mappedPersonnel = apiPersonnel.map(mapApiPersonnelToFrontend);
      setPersonnel(mappedPersonnel);

      if (mappedPersonnel.length === 0) {
        await initializeDefaultPersonnel();
        await reloadPersonnel();
      }
    } catch (error) {
      console.error('Erreur lors du chargement du personnel:', error);
      toast.error('Erreur de chargement du personnel.');
      setPersonnel([]);
    } finally {
      setIsLoading(false);
    }
  };

  const reloadPersonnel = async () => {
    try {
      const apiPersonnel = await personnelApi.getAll();
      const mappedPersonnel = apiPersonnel.map(mapApiPersonnelToFrontend);
      setPersonnel(mappedPersonnel);
    } catch (error) {
      console.error('Erreur lors du rechargement du personnel:', error);
    }
  };

  const initializeDefaultPersonnel = async () => {
    if (personnelInitPromise) {
      return personnelInitPromise;
    }

    personnelInitPromise = (async () => {
      try {
        const existing = await personnelApi.getAll();
        if (existing.length > 0) return;

        console.log('🏗️ Création du personnel par défaut...');
        await Promise.all(
          INITIAL_PERSONNEL.map(person =>
            personnelApi.create(mapFrontendPersonnelToApi(person))
          )
        );
        await loadStats();
        toast.success('Personnel initialisé avec succès');
      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        throw error;
      } finally {
        personnelInitPromise = null;
      }
    })();

    return personnelInitPromise;
  };

  const loadStats = async () => {
    try {
      const statsData = await personnelApi.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  const addPersonnel = async (newPersonnel: Omit<Personnel, 'id'>) => {
    try {
      const apiPersonnel = mapFrontendPersonnelToApi(newPersonnel);
      const created = await personnelApi.create(apiPersonnel);
      const mappedPersonnel = mapApiPersonnelToFrontend(created);
      setPersonnel(prev => [...prev, mappedPersonnel]);
      await loadStats();
      toast.success(`${newPersonnel.prenom} ${newPersonnel.nom} ajouté(e)`);
    } catch (error) {
      toast.error('Impossible d\'ajouter le personnel');
      throw error;
    }
  };

  const updatePersonnel = async (id: string, updates: Partial<Personnel>) => {
    try {
      const numericId = parseInt(id, 10);
      const currentPersonnel = personnel.find(p => p.id === id);
      if (!currentPersonnel) throw new Error('Personnel non trouvé');
      
      const updatedPersonnel = { ...currentPersonnel, ...updates };
      const apiPersonnel = mapFrontendPersonnelToApi(updatedPersonnel);
      const updated = await personnelApi.update(numericId, apiPersonnel);
      const mappedPersonnel = mapApiPersonnelToFrontend(updated);
      
      setPersonnel(prev =>
        prev.map(p => (p.id === id ? mappedPersonnel : p))
      );
      toast.success('Mise à jour réussie');
    } catch (error) {
      toast.error('Erreur de mise à jour');
      throw error;
    }
  };

  const deletePersonnel = async (id: string) => {
    const previousPersonnel = personnel;
    try {
      const numericId = parseInt(id, 10);
      setPersonnel(prev => prev.filter(p => p.id !== id));
      await personnelApi.delete(numericId);
      await loadStats();
      toast.success('Personnel supprimé');
    } catch (error) {
      setPersonnel(previousPersonnel);
      toast.error('Erreur lors de la suppression');
      throw error;
    }
  };

  const togglePersonnel = async (id: string) => {
    try {
      const numericId = parseInt(id, 10);
      const toggled = await personnelApi.toggle(numericId);
      const mappedPersonnel = mapApiPersonnelToFrontend(toggled);
      
      setPersonnel(prev =>
        prev.map(p => (p.id === id ? mappedPersonnel : p))
      );
      await loadStats();
      toast.success(`Personnel ${mappedPersonnel.actif ? 'activé' : 'désactivé'}`);
    } catch (error) {
      toast.error('Erreur de changement d\'état');
      throw error;
    }
  };

  const searchByNom = async (nom: string) => {
    if (!nom.trim()) {
      await loadPersonnel();
      return;
    }
    try {
      setIsLoading(true);
      const apiPersonnel = await personnelApi.searchByNom(nom);
      setPersonnel(apiPersonnel.map(mapApiPersonnelToFrontend));
    } catch (error) {
      toast.error('Erreur de recherche');
    } finally {
      setIsLoading(false);
    }
  };

  const filterByVille = async (ville: string) => {
    try {
      setIsLoading(true);
      const apiPersonnel = await personnelApi.getByVille(ville);
      setPersonnel(apiPersonnel.map(mapApiPersonnelToFrontend));
    } finally {
      setIsLoading(false);
    }
  };

  const filterByContrat = async (type: string) => {
    try {
      setIsLoading(true);
      const apiPersonnel = await personnelApi.getByContrat(type);
      setPersonnel(apiPersonnel.map(mapApiPersonnelToFrontend));
    } finally {
      setIsLoading(false);
    }
  };

  const filterByCarte = async (carte: string) => {
    try {
      setIsLoading(true);
      const apiPersonnel = await personnelApi.getByCarte(carte);
      setPersonnel(apiPersonnel.map(mapApiPersonnelToFrontend));
    } finally {
      setIsLoading(false);
    }
  };

  const showActifsOnly = async () => {
    try {
      setIsLoading(true);
      const apiPersonnel = await personnelApi.getActifs();
      setPersonnel(apiPersonnel.map(mapApiPersonnelToFrontend));
    } finally {
      setIsLoading(false);
    }
  };

  const resetFilter = async () => {
    await loadPersonnel();
    toast.info('Filtres réinitialisés');
  };

  const refreshStats = async () => {
    await loadStats();
  };

  return (
    <PersonnelContext.Provider
      value={{
        personnel,
        stats,
        isLoading,
        addPersonnel,
        updatePersonnel,
        deletePersonnel,
        togglePersonnel,
        searchByNom,
        filterByCarte,
        filterByVille,
        filterByContrat,
        showActifsOnly,
        resetFilter,
        refreshStats,
      }}
    >
      {children}
    </PersonnelContext.Provider>
  );
}

export function usePersonnel() {
  const context = useContext(PersonnelContext);
  if (context === undefined) {
    throw new Error('usePersonnel must be used within a PersonnelProvider');
  }
  return context;
}