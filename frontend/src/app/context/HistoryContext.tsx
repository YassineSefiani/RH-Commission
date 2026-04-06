import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { historyApi, mapApiHistoryToFrontend, mapFrontendHistoryToApi } from '../services/api';
import { toast } from 'sonner';

export interface CalculationHistory {
  id: string;
  date: string;
  employeeName: string;
  employeeRole: string;
  baseSalary: number;
  totalSales: number;
  deliveries: number;
  returns: number;
  commissions: number;
  bonuses: number;
  penalties: number;
  finalSalary: number;
  constraintsApplied: string[];
  details: any[];
}

interface HistoryContextType {
  history: CalculationHistory[];
  addCalculation: (calculation: Omit<CalculationHistory, 'id' | 'date'>) => void;
  deleteCalculation: (id: string) => void;
  clearHistory: () => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<CalculationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger l'historique depuis l'API au démarrage
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const apiHistory = await historyApi.getAll();
      const mappedHistory = apiHistory.map(mapApiHistoryToFrontend);
      setHistory(mappedHistory);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      toast.error('Impossible de charger l\'historique. Vérifiez que le backend est démarré.');
      // En cas d'erreur, utiliser un historique vide
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addCalculation = async (calculation: Omit<CalculationHistory, 'id' | 'date'>) => {
    try {
      const apiHistory = mapFrontendHistoryToApi(calculation);
      const created = await historyApi.create(apiHistory);
      const newCalculation = mapApiHistoryToFrontend(created);
      setHistory(prev => [newCalculation, ...prev]); // Ajouter au début pour avoir les plus récents en premier
      toast.success('Calcul ajouté à l\'historique');
    } catch (error) {
      console.error('Erreur lors de l\'ajout du calcul:', error);
      toast.error('Impossible d\'ajouter le calcul à l\'historique');
      throw error;
    }
  };

  const deleteCalculation = async (id: string) => {
    try {
      const numericId = parseInt(id, 10);
      await historyApi.delete(numericId);
      setHistory(prev => prev.filter(h => h.id !== id));
      toast.success('Calcul supprimé de l\'historique');
    } catch (error) {
      console.error('Erreur lors de la suppression du calcul:', error);
      toast.error('Impossible de supprimer le calcul');
      throw error;
    }
  };

  const clearHistory = async () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer tout l\'historique ?')) {
      try {
        await historyApi.clearAll();
        setHistory([]);
        toast.success('Historique supprimé avec succès');
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'historique:', error);
        toast.error('Impossible de supprimer l\'historique');
        throw error;
      }
    }
  };

  // Afficher un loader pendant le chargement initial
  if (isLoading) {
    return (
      <HistoryContext.Provider
        value={{
          history: [],
          addCalculation,
          deleteCalculation,
          clearHistory,
        }}
      >
        {children}
      </HistoryContext.Provider>
    );
  }

  return (
    <HistoryContext.Provider
      value={{
        history,
        addCalculation,
        deleteCalculation,
        clearHistory,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
}