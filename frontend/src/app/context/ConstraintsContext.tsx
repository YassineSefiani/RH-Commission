import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface Constraint {
  id: string;
  name: string;
  type: 'commission' | 'performance_bonus' | 'delivery_bonus' | 'penalty';
  value: number;
  valueType: 'percentage' | 'fixed';
  condition: string;
  active: boolean;
  ruleGroups?: any;
}

interface ConstraintsContextType {
  constraints: Constraint[];
  addConstraint: (constraint: Omit<Constraint, 'id'>) => void;
  updateConstraint: (id: string, constraint: Partial<Constraint>) => void;
  deleteConstraint: (id: string) => void;
  toggleConstraint: (id: string) => void;
}

const ConstraintsContext = createContext<ConstraintsContextType | undefined>(undefined);

const INITIAL_CONSTRAINTS: Constraint[] = [
  {
    id: '1',
    name: 'Commission Produit A',
    type: 'commission',
    value: 5,
    valueType: 'percentage',
    condition: 'Ventes > 0',
    active: true,
  },
  {
    id: '2',
    name: 'Bonus Performance Élevée',
    type: 'performance_bonus',
    value: 500,
    valueType: 'fixed',
    condition: 'Ventes > 100',
    active: true,
  },
  {
    id: '3',
    name: 'Bonus Livraison Rapide',
    type: 'delivery_bonus',
    value: 10,
    valueType: 'percentage',
    condition: 'Livraisons > 50',
    active: true,
  },
  {
    id: '4',
    name: 'Pénalité Retour Produit',
    type: 'penalty',
    value: 50,
    valueType: 'fixed',
    condition: 'Retours > 5',
    active: true,
  },
];

export function ConstraintsProvider({ children }: { children: ReactNode }) {
  const [constraints, setConstraints] = useState<Constraint[]>(() => {
    // Charger depuis localStorage si disponible
    const saved = localStorage.getItem('abc_dis_constraints');
    return saved ? JSON.parse(saved) : INITIAL_CONSTRAINTS;
  });

  // Sauvegarder dans localStorage à chaque modification
  useEffect(() => {
    localStorage.setItem('abc_dis_constraints', JSON.stringify(constraints));
  }, [constraints]);

  const addConstraint = (constraint: Omit<Constraint, 'id'>) => {
    const newConstraint: Constraint = {
      ...constraint,
      id: Date.now().toString(),
    };
    setConstraints(prev => [...prev, newConstraint]);
  };

  const updateConstraint = (id: string, updates: Partial<Constraint>) => {
    setConstraints(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const deleteConstraint = (id: string) => {
    setConstraints(prev => prev.filter(c => c.id !== id));
  };

  const toggleConstraint = (id: string) => {
    setConstraints(prev =>
      prev.map(c => (c.id === id ? { ...c, active: !c.active } : c))
    );
  };

  return (
    <ConstraintsContext.Provider
      value={{
        constraints,
        addConstraint,
        updateConstraint,
        deleteConstraint,
        toggleConstraint,
      }}
    >
      {children}
    </ConstraintsContext.Provider>
  );
}

export function useConstraints() {
  const context = useContext(ConstraintsContext);
  if (context === undefined) {
    throw new Error('useConstraints must be used within a ConstraintsProvider');
  }
  return context;
}
