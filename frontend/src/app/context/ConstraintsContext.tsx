import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { logAudit } from '../services/auditApi';
import { constraintsApi, mapApiConstraintToFrontend, mapFrontendConstraintToApi } from '../services/api';
import { toast } from 'sonner';
import { useUser } from '../context/UserContext';

let constraintsInitPromise: Promise<void> | null = null;

export interface Constraint {
  id: string;
  name: string;
  type: 'commission_quantitative' | 'commission_retour' | 'commission_triage';
  carte: 'Coca Cola' | 'Ferrero Rocher' | "Wall's";
  value: number;
  valueType: 'percentage' | 'fixed';
  condition: string;
  active: boolean;
  ruleGroups?: any;
}

interface ConstraintsContextType {
  constraints: Constraint[];
  isLoading: boolean;
  addConstraint: (constraint: Omit<Constraint, 'id'>) => Promise<void>;
  updateConstraint: (id: string, constraint: Partial<Constraint>) => Promise<void>;
  deleteConstraint: (id: string) => Promise<void>;
  toggleConstraint: (id: string) => Promise<void>;
  loadConstraints: () => Promise<void>;
}

const ConstraintsContext = createContext<ConstraintsContextType | undefined>(undefined);

const INITIAL_CONSTRAINTS: Omit<Constraint, 'id'>[] = [
  // ============================================
  // COCA COLA - COMMISSIONS QUANTITATIVES
  // ============================================
  {
    name: 'Commission Quantitative - Livreur CDI',
    type: 'commission_quantitative',
    carte: 'Coca Cola',
    value: 18,
    valueType: 'percentage',
    condition: 'Livreur CDI - 0.18 x Volume Reçu',
    active: true,
    ruleGroups: [{ id: 'rg1', logic: 'AND', rules: [{ id: 'r1', field: 'role', operator: '==', value: 'Livreur' }, { id: 'r2', field: 'contract', operator: '==', value: 'CDI' }] }]
  },
  {
    name: 'Commission Quantitative - Livreur GMS CDI',
    type: 'commission_quantitative',
    carte: 'Coca Cola',
    value: 11,
    valueType: 'percentage',
    condition: 'Livreur GMS CDI - 0.11 x Volume Reçu',
    active: true,
    ruleGroups: [{ id: 'rg2', logic: 'AND', rules: [{ id: 'r3', field: 'role', operator: '==', value: 'Livreur GMS' }, { id: 'r4', field: 'contract', operator: '==', value: 'CDI' }] }]
  },
  {
    name: 'Commission Quantitative - Aide Livreur CDI',
    type: 'commission_quantitative',
    carte: 'Coca Cola',
    value: 12,
    valueType: 'percentage',
    condition: 'Aide Livreur CDI - 0.12 x Volume Reçu',
    active: true,
    ruleGroups: [{ id: 'rg3', logic: 'AND', rules: [{ id: 'r5', field: 'role', operator: '==', value: 'Aide Livreur' }, { id: 'r6', field: 'contract', operator: '==', value: 'CDI' }] }]
  },
  {
    name: 'Commission Quantitative - Livreur INT',
    type: 'commission_quantitative',
    carte: 'Coca Cola',
    value: 12,
    valueType: 'percentage',
    condition: 'Livreur INT - 0.12 x Volume Reçu',
    active: true,
    ruleGroups: [{ id: 'rg4', logic: 'AND', rules: [{ id: 'r7', field: 'role', operator: '==', value: 'Livreur' }, { id: 'r8', field: 'contract', operator: '==', value: 'INT' }] }]
  },
  {
    name: 'Commission Quantitative - Livreur GMS INT',
    type: 'commission_quantitative',
    carte: 'Coca Cola',
    value: 11,
    valueType: 'percentage',
    condition: 'Livreur GMS INT - 0.11 x Volume Reçu',
    active: true,
    ruleGroups: [{ id: 'rg5', logic: 'AND', rules: [{ id: 'r9', field: 'role', operator: '==', value: 'Livreur GMS' }, { id: 'r10', field: 'contract', operator: '==', value: 'INT' }] }]
  },
  {
    name: 'Commission Quantitative - Aide Livreur INT',
    type: 'commission_quantitative',
    carte: 'Coca Cola',
    value: 8,
    valueType: 'percentage',
    condition: 'Aide Livreur INT - 0.08 x Volume Reçu',
    active: true,
    ruleGroups: [{ id: 'rg6', logic: 'AND', rules: [{ id: 'r11', field: 'role', operator: '==', value: 'Aide Livreur' }, { id: 'r12', field: 'contract', operator: '==', value: 'INT' }] }]
  },

  // ============================================
  // COCA COLA - RETOUR & TRIAGE
  // ============================================
  {
    name: 'Commission Retour - Coca Cola',
    type: 'commission_retour',
    carte: 'Coca Cola',
    value: 250,
    valueType: 'fixed',
    condition: 'CDI - Taux retour < 1% = 250 DH, 1-2% = 150 DH',
    active: true,
    ruleGroups: [{ id: 'rg7', logic: 'AND', rules: [{ id: 'r13', field: 'returns', operator: '<', value: '1' }, { id: 'r14', field: 'contract', operator: '==', value: 'CDI' }] }]
  },
  {
    name: 'Commission Triage - Coca Cola',
    type: 'commission_triage',
    carte: 'Coca Cola',
    value: 200,
    valueType: 'fixed',
    condition: 'CDI - Taux triage > 70% = 200 DH',
    active: true,
    ruleGroups: [{ id: 'rg8', logic: 'AND', rules: [{ id: 'r15', field: 'performance', operator: '>', value: '70' }, { id: 'r16', field: 'contract', operator: '==', value: 'CDI' }] }]
  },

  // ============================================
  // WALL'S - COMMERCIALE & ENCADREMENT
  // ============================================
  {
    name: "Commission Commerciale Wall's - Vendeur",
    type: 'commission_quantitative',
    carte: "Wall's",
    value: 1.5,
    valueType: 'percentage',
    condition: "Vendeur CDI - 1.50% du CA réalisé mensuel (sans condition)",
    active: true,
    ruleGroups: [{ id: 'rg9', logic: 'AND', rules: [{ id: 'r17', field: 'role', operator: '==', value: 'Vendeur' }] }]
  },
  {
    name: "Commission Encadrement Wall's - Superviseur/Area",
    type: 'commission_quantitative',
    carte: "Wall's",
    value: 1,
    valueType: 'percentage',
    condition: "Paliers CA/Target: Retail (0.7-1%), HORECA (0.6%), Area (0.4-0.7%), MT (Fixe 4k-10k)",
    active: true,
    ruleGroups: [{ id: 'rg10', logic: 'OR', rules: [{ id: 'r18', field: 'role', operator: '==', value: 'Superviseur' }, { id: 'r19', field: 'role', operator: '==', value: 'Area Manager' }] }]
  },

  // ============================================
  // FERRERO - COMMERCIALE & FIXES
  // ============================================
  {
    name: 'Commission Commerciale Ferrero - Vendeur',
    type: 'commission_quantitative',
    carte: 'Ferrero Rocher',
    value: 2,
    valueType: 'percentage',
    condition: "Paliers CA/Target: <70% (0%), 70% (1%), 80% (1.5%), 90% (1.8%), >100% (2%)",
    active: true,
    ruleGroups: [{ id: 'rg11', logic: 'AND', rules: [{ id: 'r20', field: 'role', operator: '==', value: 'Vendeur' }, { id: 'r21', field: 'performance', operator: '>=', value: '70' }] }]
  },
  {
    name: 'Commission Commerciale Ferrero - Fixes (Gros/Sup/Area)',
    type: 'commission_quantitative',
    carte: 'Ferrero Rocher',
    value: 10000,
    valueType: 'fixed',
    condition: "Fixes selon palier CA/Target: Vendeur Gros (max 8.5k), Sup (max 7.5k), Area (max 10k)",
    active: true,
    ruleGroups: [{ id: 'rg12', logic: 'OR', rules: [{ id: 'r22', field: 'role', operator: '==', value: 'Vendeur Gros' }, { id: 'r23', field: 'role', operator: '==', value: 'Superviseur' }, { id: 'r24', field: 'role', operator: '==', value: 'Area Manager' }] }]
  }
];

export function ConstraintsProvider({ children }: { children: ReactNode }) {
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, isLoading: isAuthLoading } = useUser();

  const loadConstraints = async () => {
    try {
      setIsLoading(true);
      const apiConstraints = await constraintsApi.getAll();
      const mappedConstraints = apiConstraints.map(mapApiConstraintToFrontend);
      
      if (mappedConstraints.length === 0) {
        console.log('⚠️ Aucune contrainte trouvée, initialisation...');
        await initializeDefaultConstraints();
        const reloaded = await constraintsApi.getAll();
        setConstraints(reloaded.map(mapApiConstraintToFrontend));
      } else {
        setConstraints(mappedConstraints);
      }
    } catch (error) {
      console.error('❌ Erreur chargement contraintes:', error);
      if (isAuthenticated) toast.error('Erreur lors de la récupération des contraintes.');
      setConstraints([]); // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadConstraints();
    } else if (!isAuthLoading) {
      setIsLoading(false);
    }
  }, [isAuthenticated, isAuthLoading]);

  const initializeDefaultConstraints = async () => {
    if (constraintsInitPromise) return constraintsInitPromise;
    constraintsInitPromise = (async () => {
      try {
        for (const constraint of INITIAL_CONSTRAINTS) {
          await constraintsApi.create(mapFrontendConstraintToApi(constraint));
        }
        toast.success('Contraintes initialisées');
      } catch (error) {
        console.error('❌ Erreur initialisation:', error);
      } finally {
        constraintsInitPromise = null;
      }
    })();
    return constraintsInitPromise;
  };

  const addConstraint = async (constraint: Omit<Constraint, 'id'>) => {
    try {
      const created = await constraintsApi.create(mapFrontendConstraintToApi(constraint));
      const mapped = mapApiConstraintToFrontend(created);
      setConstraints(prev => [...prev, mapped]);
      logAudit({ action: 'CONSTRAINT_CREATE', entity: 'Contrainte', entityId: mapped.id, details: mapped.name });
      toast.success('Contrainte ajoutée');
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
      throw error;
    }
  };

  const updateConstraint = async (id: string, updates: Partial<Constraint>) => {
    try {
      const numericId = parseInt(id, 10);
      const current = constraints.find(c => c.id === id);
      if (!current) return;

      const updatedData = { ...current, ...updates };
      const updated = await constraintsApi.update(numericId, mapFrontendConstraintToApi(updatedData));

      setConstraints(prev => prev.map(c => (c.id === id ? mapApiConstraintToFrontend(updated) : c)));
      logAudit({ action: 'CONSTRAINT_UPDATE', entity: 'Contrainte', entityId: id, details: JSON.stringify(updates) });
      toast.success('Contrainte mise à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      throw error;
    }
  };

  const deleteConstraint = async (id: string) => {
    try {
      await constraintsApi.delete(parseInt(id, 10));
      setConstraints(prev => prev.filter(c => c.id !== id));
      logAudit({ action: 'CONSTRAINT_DELETE', entity: 'Contrainte', entityId: id });
      toast.success('Contrainte supprimée');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const toggleConstraint = async (id: string) => {
    try {
      const toggled = await constraintsApi.toggle(parseInt(id, 10));
      const mapped = mapApiConstraintToFrontend(toggled);
      setConstraints(prev => prev.map(c => (c.id === id ? mapped : c)));
      logAudit({ action: 'CONSTRAINT_TOGGLE', entity: 'Contrainte', entityId: id, details: `active=${mapped.active}` });
    } catch (error) {
      toast.error('Erreur de changement d\'état');
    }
  };

  return (
    <ConstraintsContext.Provider
      value={{
        constraints,
        isLoading,
        addConstraint,
        updateConstraint,
        deleteConstraint,
        toggleConstraint,
        loadConstraints,
      }}
    >
      {children}
    </ConstraintsContext.Provider>
  );
}

export function useConstraints() {
  const context = useContext(ConstraintsContext);
  if (!context) throw new Error('useConstraints must be used within a ConstraintsProvider');
  return context;
}