import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { 
  personnelApi, 
  mapApiPersonnelToFrontend, 
  mapFrontendPersonnelToApi,
  Personnel,
  PersonnelStats
} from '../services/personnelApi';
import { toast } from 'sonner';

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

  // Charger le personnel et les stats depuis l'API au démarrage
  useEffect(() => {
    loadPersonnel();
    loadStats();
  }, []);

  const loadPersonnel = async () => {
    try {
      setIsLoading(true);
      const apiPersonnel = await personnelApi.getAll();
      const mappedPersonnel = apiPersonnel.map(mapApiPersonnelToFrontend);
      setPersonnel(mappedPersonnel);
    } catch (error) {
      console.error('Erreur lors du chargement du personnel:', error);
      toast.error('Impossible de charger le personnel. Vérifiez que le backend est démarré.');
      setPersonnel([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await personnelApi.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const addPersonnel = async (newPersonnel: Omit<Personnel, 'id'>) => {
    try {
      const apiPersonnel = mapFrontendPersonnelToApi(newPersonnel);
      const created = await personnelApi.create(apiPersonnel);
      const mappedPersonnel = mapApiPersonnelToFrontend(created);
      setPersonnel(prev => [...prev, mappedPersonnel]);
      await loadStats(); // Rafraîchir les stats
      toast.success(`${newPersonnel.prenom} ${newPersonnel.nom} ajouté(e) avec succès`);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du personnel:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      if (errorMessage.includes('existe déjà')) {
        toast.error('Ce matricule existe déjà');
      } else {
        toast.error('Impossible d\'ajouter le personnel');
      }
      throw error;
    }
  };

  const updatePersonnel = async (id: string, updates: Partial<Personnel>) => {
    try {
      const numericId = parseInt(id, 10);
      const currentPersonnel = personnel.find(p => p.id === id);
      if (!currentPersonnel) {
        throw new Error('Personnel non trouvé');
      }
      
      const updatedPersonnel = { ...currentPersonnel, ...updates };
      const apiPersonnel = mapFrontendPersonnelToApi(updatedPersonnel);
      const updated = await personnelApi.update(numericId, apiPersonnel);
      const mappedPersonnel = mapApiPersonnelToFrontend(updated);
      
      setPersonnel(prev =>
        prev.map(p => (p.id === id ? mappedPersonnel : p))
      );
      toast.success('Personnel mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du personnel:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      if (errorMessage.includes('existe déjà')) {
        toast.error('Ce matricule existe déjà');
      } else {
        toast.error('Impossible de mettre à jour le personnel');
      }
      throw error;
    }
  };

  const deletePersonnel = async (id: string) => {
    try {
      const numericId = parseInt(id, 10);
      const person = personnel.find(p => p.id === id);
      await personnelApi.delete(numericId);
      setPersonnel(prev => prev.filter(p => p.id !== id));
      await loadStats(); // Rafraîchir les stats
      if (person) {
        toast.success(`${person.prenom} ${person.nom} supprimé(e) avec succès`);
      } else {
        toast.success('Personnel supprimé avec succès');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du personnel:', error);
      toast.error('Impossible de supprimer le personnel');
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
      await loadStats(); // Rafraîchir les stats
      toast.success(`Personnel ${mappedPersonnel.actif ? 'activé' : 'désactivé'}`);
    } catch (error) {
      console.error('Erreur lors du changement d\'état du personnel:', error);
      toast.error('Impossible de changer l\'état du personnel');
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
      const mappedPersonnel = apiPersonnel.map(mapApiPersonnelToFrontend);
      setPersonnel(mappedPersonnel);
      toast.success(`${mappedPersonnel.length} résultat(s) trouvé(s)`);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      toast.error('Erreur lors de la recherche');
    } finally {
      setIsLoading(false);
    }
  };

  const filterByVille = async (ville: string) => {
    try {
      setIsLoading(true);
      const apiPersonnel = await personnelApi.getByVille(ville);
      const mappedPersonnel = apiPersonnel.map(mapApiPersonnelToFrontend);
      setPersonnel(mappedPersonnel);
      toast.success(`${mappedPersonnel.length} personnel(s) à ${ville}`);
    } catch (error) {
      console.error('Erreur lors du filtrage par ville:', error);
      toast.error('Erreur lors du filtrage');
    } finally {
      setIsLoading(false);
    }
  };

  const filterByContrat = async (type: string) => {
    try {
      setIsLoading(true);
      const apiPersonnel = await personnelApi.getByContrat(type);
      const mappedPersonnel = apiPersonnel.map(mapApiPersonnelToFrontend);
      setPersonnel(mappedPersonnel);
      toast.success(`${mappedPersonnel.length} personnel(s) en ${type}`);
    } catch (error) {
      console.error('Erreur lors du filtrage par contrat:', error);
      toast.error('Erreur lors du filtrage');
    } finally {
      setIsLoading(false);
    }
  };

  const filterByCarte = async (carte: string) => {
    try {
        setIsLoading(true);
        const apiPersonnel = await personnelApi.getByCarte(carte);
        const mappedPersonnel = apiPersonnel.map(mapApiPersonnelToFrontend);
        setPersonnel(mappedPersonnel);
        toast.success(`${mappedPersonnel.length} personnel(s) pour ${carte}`);
    } catch (error) {
        console.error('Erreur lors du filtrage par carte:', error);
        toast.error('Erreur lors du filtrage');
    } finally {
        setIsLoading(false);
    }
    };

  const showActifsOnly = async () => {
    try {
      setIsLoading(true);
      const apiPersonnel = await personnelApi.getActifs();
      const mappedPersonnel = apiPersonnel.map(mapApiPersonnelToFrontend);
      setPersonnel(mappedPersonnel);
      toast.success(`${mappedPersonnel.length} personnel(s) actif(s)`);
    } catch (error) {
      console.error('Erreur lors du filtrage des actifs:', error);
      toast.error('Erreur lors du filtrage');
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
