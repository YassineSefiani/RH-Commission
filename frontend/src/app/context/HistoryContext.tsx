import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { historyApi, mapApiHistoryToFrontend, mapFrontendHistoryToApi } from '../services/api';
import { toast } from 'sonner';
import { logAudit } from '../services/auditApi';

// --- TYPES POUR LES CALCULS ---
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
  // Champs anti-redondance (optionnels, propagés au backend)
  carte?: string;
  matricule?: string;
  periode?: string;
  forcerRecalcul?: boolean;
}

// --- TYPES POUR LES MODIFICATIONS DE CONTRAINTES ---
export interface ConstraintHistoryEntry {
  constraintId: string;
  modifiedBy: string;
  modificationDate: string;
  oldValue?: string;
  newValue: string;
  changeType: 'CREATE' | 'UPDATE' | 'TOGGLE' | 'DELETE';
}

// --- INTERFACE DU CONTEXTE ---
interface HistoryContextType {
  // Calculs
  history: CalculationHistory[];
  addCalculation: (calculation: Omit<CalculationHistory, 'id' | 'date'>) => void;
  deleteCalculation: (id: string) => void;
  clearHistory: () => void;
  
  // Contraintes
  constraintHistory: ConstraintHistoryEntry[];
  addHistoryEntry: (entry: ConstraintHistoryEntry) => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export function HistoryProvider({ children }: { children: ReactNode }) {
  // États
  const [history, setHistory] = useState<CalculationHistory[]>([]);
  const [constraintHistory, setConstraintHistory] = useState<ConstraintHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les historiques au démarrage
  useEffect(() => {
    // Chargement de l'historique des contraintes depuis le localStorage
    const savedConstraintHistory = localStorage.getItem('constraintHistory');
    if (savedConstraintHistory) {
      setConstraintHistory(JSON.parse(savedConstraintHistory));
    }
    
    // Chargement de l'historique des calculs via API
    loadHistory();
  }, []);

  // --- LOGIQUE DES CALCULS (API) ---
  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const apiHistory = await historyApi.getAll();
      const mappedHistory = apiHistory.map(mapApiHistoryToFrontend);
      setHistory(mappedHistory);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      toast.error('Impossible de charger l\'historique. Vérifiez que le backend est démarré.');
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
      setHistory(prev => [newCalculation, ...prev]);
      logAudit({ action: 'HISTORY_CREATE', entity: 'HistoriqueCalcul', entityId: newCalculation.id, details: newCalculation.employeeName });
      toast.success('Calcul ajouté à l\'historique');
    } catch (error) {
      console.error('Erreur lors de l\'ajout du calcul:', error);
      toast.error('Impossible d\'ajouter le calcul à l\'historique');
      throw error;
    }
  };

  const deleteCalculation = async (id: string) => {
    const previousHistory = history;
    try {
      setHistory(prev => prev.filter(h => h.id !== id));
      const numericId = parseInt(id, 10);
      await historyApi.delete(numericId);
      logAudit({ action: 'HISTORY_DELETE', entity: 'HistoriqueCalcul', entityId: id });
      toast.success('Calcul supprimé de l\'historique');
    } catch (error) {
      setHistory(previousHistory);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Impossible de supprimer le calcul: ${errorMessage}`);
      throw error;
    }
  };

  const clearHistory = async () => {
    // Pas de confirm() ici — la confirmation est gérée par ConfirmDialog côté composant.
    const count = history.length;
    try {
      await historyApi.clearAll();
      setHistory([]);
      logAudit({ action: 'HISTORY_CLEAR_ALL', entity: 'HistoriqueCalcul', details: `${count} entrées` });
      toast.success('Historique supprimé avec succès');
    } catch (error: any) {
      console.error('clearHistory failed', error);
      toast.error(`Impossible de supprimer l'historique : ${error?.message ?? 'erreur inconnue'}`);
    }
  };

  // --- LOGIQUE DES CONTRAINTES (LOCALSTORAGE) ---
  const addHistoryEntry = (entry: ConstraintHistoryEntry) => {
    setConstraintHistory(prev => {
      const newHistory = [entry, ...prev];
      localStorage.setItem('constraintHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  // --- RENDU ---
  if (isLoading) {
    return (
      <HistoryContext.Provider
        value={{
          history: [],
          addCalculation,
          deleteCalculation,
          clearHistory,
          constraintHistory, // On passe l'état actuel même si ça charge
          addHistoryEntry,
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
        constraintHistory,
        addHistoryEntry,
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