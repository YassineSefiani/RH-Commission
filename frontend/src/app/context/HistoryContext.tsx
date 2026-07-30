import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { historyApi, mapApiHistoryToFrontend, mapFrontendHistoryToApi } from '../services/api';
import { toast } from 'sonner';
import { logAudit } from '../services/auditApi';

export interface CalculationHistory {
  id: string;
  date: string;
  employeeName: string;
  employeeRole: string;
  totalSales: number;
  deliveries: number;
  returns: number;
  commissions: number;
  bonuses: number;
  finalSalary: number;
  constraintsApplied: string[];
  details: any[];
  carte?: string;
  matricule?: string;
  periode?: string;
  forcerRecalcul?: boolean;
  isArchived?: boolean;
  batchId?: string; // ✨ NOUVEAU : Identifiant du lot de simulation
  simulationName?: string; // ✨ NOUVEAU : Nom affiché (ex: "Simulation 1 - COCA")
}

export interface ConstraintHistoryEntry {
  constraintId: string;
  modifiedBy: string;
  modificationDate: string;
  oldValue?: string;
  newValue: string;
  changeType: 'CREATE' | 'UPDATE' | 'TOGGLE' | 'DELETE';
}

interface HistoryContextType {
  history: CalculationHistory[];
  addCalculation: (calculation: Omit<CalculationHistory, 'id' | 'date'>) => void;
  deleteCalculation: (id: string) => void;
  clearHistory: () => void;
  archiveCalculation: (id: string) => Promise<void>;

  constraintHistory: ConstraintHistoryEntry[];
  addHistoryEntry: (entry: ConstraintHistoryEntry) => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<CalculationHistory[]>([]);
  const [constraintHistory, setConstraintHistory] = useState<ConstraintHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedConstraintHistory = localStorage.getItem('constraintHistory');
    if (savedConstraintHistory) {
      setConstraintHistory(JSON.parse(savedConstraintHistory));
    }
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
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addCalculation = async (calculation: Omit<CalculationHistory, 'id' | 'date'>) => {
    try {
      // Nouvelle simulation = toujours isArchived: false
      const payload = { ...calculation, isArchived: false };
      const apiHistory = mapFrontendHistoryToApi(payload);
      
      // 1. On envoie au backend (qui va ignorer batchId et simulationName pour le moment)
      const created = await historyApi.create(apiHistory);
      
      // 2. On récupère la réponse du backend
      const newCalculation = mapApiHistoryToFrontend(created);
      
      // ✨ LE CORRECTIF EST ICI ✨
      // On force la réinjection des données locales car le backend 
      // ne les a pas encore sauvegardées/renvoyées !
      newCalculation.batchId = calculation.batchId;
      newCalculation.simulationName = calculation.simulationName;
      
      setHistory(prev => {
        // Évite les doublons visuels si le backend nous renvoie le même ID
        const filtered = prev.filter(h => h.id !== newCalculation.id);
        return [newCalculation, ...filtered];
      });
      logAudit({ action: 'HISTORY_CREATE', entity: 'HistoriqueCalcul', entityId: newCalculation.id, details: newCalculation.employeeName });
    } catch (error) {
      console.error('Erreur lors de l\'ajout du calcul:', error);
      throw error;
    }
  };

  const deleteCalculation = async (id: string) => {
    try {
      setHistory(prev => prev.filter(h => h.id !== id));
      const numericId = parseInt(id, 10);
      await historyApi.delete(numericId);
      logAudit({ action: 'HISTORY_DELETE', entity: 'HistoriqueCalcul', entityId: id });
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const clearHistory = async () => {
    const count = history.length;
    try {
      await historyApi.clearAll();
      setHistory([]);
      logAudit({ action: 'HISTORY_CLEAR_ALL', entity: 'HistoriqueCalcul', details: `${count} entrées` });
      toast.success('Historique supprimé avec succès');
    } catch (error: any) {
      toast.error(`Impossible de supprimer l'historique`);
    }
  };

  const archiveCalculation = async (id: string) => {
    try {
      // ✨ Mise à jour instantanée de l'UI (Optimiste)
      setHistory(prev => prev.map(h => h.id === id ? { ...h, isArchived: true } : h));
      
      // Appel API en arrière-plan
      await historyApi.archive(id);
      logAudit({ action: 'HISTORY_VALIDATE', entity: 'HistoriqueCalcul', entityId: id });
    } catch (error) {
      // Annulation si le backend plante
      setHistory(prev => prev.map(h => h.id === id ? { ...h, isArchived: false } : h));
      throw error;
    }
  };

  const addHistoryEntry = (entry: ConstraintHistoryEntry) => {
    setConstraintHistory(prev => {
      const newHistory = [entry, ...prev];
      localStorage.setItem('constraintHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  if (isLoading) {
    return (
      <HistoryContext.Provider value={{ history: [], addCalculation, deleteCalculation, clearHistory, archiveCalculation, constraintHistory, addHistoryEntry }}>
        {children}
      </HistoryContext.Provider>
    );
  }

  return (
    <HistoryContext.Provider value={{ history, addCalculation, deleteCalculation, clearHistory, archiveCalculation, constraintHistory, addHistoryEntry }}>
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