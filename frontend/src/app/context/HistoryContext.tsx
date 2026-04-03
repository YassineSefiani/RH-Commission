import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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
  const [history, setHistory] = useState<CalculationHistory[]>(() => {
    // Charger depuis localStorage si disponible
    const saved = localStorage.getItem('abc_dis_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Sauvegarder dans localStorage à chaque modification
  useEffect(() => {
    localStorage.setItem('abc_dis_history', JSON.stringify(history));
  }, [history]);

  const addCalculation = (calculation: Omit<CalculationHistory, 'id' | 'date'>) => {
    const newCalculation: CalculationHistory = {
      ...calculation,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    setHistory(prev => [newCalculation, ...prev]); // Ajouter au début pour avoir les plus récents en premier
  };

  const deleteCalculation = (id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  const clearHistory = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer tout l\'historique ?')) {
      setHistory([]);
    }
  };

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
