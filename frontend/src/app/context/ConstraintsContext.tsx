import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { constraintsApi, mapApiConstraintToFrontend, mapFrontendConstraintToApi } from '../services/api';
import { toast } from 'sonner';
import { useUser } from '../context/UserContext'; // Import du contexte utilisateur

let constraintsInitPromise: Promise<void> | null = null;

export interface Constraint {
  id: string;
  name: string;
  type: 'commission_quantitative' | 'commission_retour' | 'commission_triage';
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
    name: 'Commission Quantitative - Livreur CDI',
    type: 'commission_quantitative',
    value: 18,
    valueType: 'percentage',
    condition: 'Livreur CDI - 0.18 x Volume Reçu',
    active: true,
  },
  {
    id: '2',
    name: 'Commission Quantitative - Livreur GMS CDI',
    type: 'commission_quantitative',
    value: 11,
    valueType: 'percentage',
    condition: 'Livreur GMS CDI - 0.11 x Volume Reçu',
    active: true,
  },
  {
    id: '3',
    name: 'Commission Quantitative - Aide Livreur CDI',
    type: 'commission_quantitative',
    value: 12,
    valueType: 'percentage',
    condition: 'Aide Livreur CDI - 0.12 x Volume Reçu',
    active: true,
  },
  {
    id: '4',
    name: 'Commission Quantitative - Livreur INT',
    type: 'commission_quantitative',
    value: 12,
    valueType: 'percentage',
    condition: 'Livreur INT - 0.12 x Volume Reçu',
    active: true,
  },
  {
    id: '5',
    name: 'Commission Quantitative - Livreur GMS INT',
    type: 'commission_quantitative',
    value: 11,
    valueType: 'percentage',
    condition: 'Livreur GMS INT - 0.11 x Volume Reçu',
    active: true,
  },
  {
    id: '6',
    name: 'Commission Quantitative - Aide Livreur INT',
    type: 'commission_quantitative',
    value: 8,
    valueType: 'percentage',
    condition: 'Aide Livreur INT - 0.08 x Volume Reçu',
    active: true,
  },
  {
    id: '7',
    name: 'Commission Retour - Coca Cola',
    type: 'commission_retour',
    value: 250,
    valueType: 'fixed',
    condition: 'CDI - Livreur/Aide livreur - Taux retour < 1% = 250 DH, 1-2% = 150 DH',
    active: true,
  },
  {
    id: '8',
    name: 'Commission Triage - Coca Cola',
    type: 'commission_triage',
    value: 200,
    valueType: 'fixed',
    condition: 'CDI - Livreur/Aide livreur - Au moins 15 jours travaillés - Taux triage > 70% = 200 DH',
    active: true,
  },
  // --- WALL'S ---
  {
    id: '9',
    name: "Commission Commerciale Wall's - Vendeur",
    type: 'commission_quantitative',
    value: 1.5,
    valueType: 'percentage',
    condition: "Vendeur CDI - 1.50% du CA réalisé mensuel (sans condition)",
    active: true,
  },
  {
    id: '10',
    name: "Commission Encadrement Wall's - Superviseur/Area",
    type: 'commission_quantitative',
    value: 1,
    valueType: 'percentage',
    condition: "Paliers CA/Target: Retail (0.7-1%), HORECA (0.6%), Area (0.4-0.7%), MT (Fixe 4k-10k)",
    active: true,
  },

  // --- FERRERO ---
  {
    id: '11',
    name: 'Commission Commerciale Ferrero - Vendeur',
    type: 'commission_quantitative',
    value: 2,
    valueType: 'percentage',
    condition: "Paliers CA/Target: <70% (0%), 70% (1%), 80% (1.5%), 90% (1.8%), >100% (2%)",
    active: true,
  },
  {
    id: '12',
    name: 'Commission Commerciale Ferrero - Fixes (Gros/Sup/Area)',
    type: 'commission_quantitative',
    value: 10000,
    valueType: 'fixed',
    condition: "Fixes selon palier CA/Target: Vendeur Gros (max 8.5k), Sup (max 7.5k), Area (max 10k)",
    active: true,
  },
];

export function ConstraintsProvider({ children }: { children: ReactNode }) {
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // On récupère l'état d'authentification
  const { isAuthenticated, isLoading: isAuthLoading } = useUser();

  // Charger les contraintes UNIQUEMENT si l'utilisateur est authentifié
  useEffect(() => {
    if (isAuthenticated) {
      loadConstraints();
    } else if (!isAuthLoading) {
      // Si on ne charge plus l'auth et qu'on n'est pas connecté, on arrête le loading local
      setIsLoading(false);
    }
  }, [isAuthenticated, isAuthLoading]);

  const loadConstraints = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Chargement des contraintes depuis l\'API...');
      const apiConstraints = await constraintsApi.getAll();
      const mappedConstraints = apiConstraints.map(mapApiConstraintToFrontend);
      
      setConstraints(mappedConstraints);

      // Si aucune contrainte n'existe côté serveur, on initialise les valeurs par défaut
      if (mappedConstraints.length === 0) {
        console.log('⚠️ Aucune contrainte trouvée, création des contraintes initiales...');
        await initializeDefaultConstraints();
        const reloadedConstraints = await constraintsApi.getAll();
        const mappedReloaded = reloadedConstraints.map(mapApiConstraintToFrontend);
        setConstraints(mappedReloaded);
      }
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des contraintes:', error);
      
      // On affiche l'erreur uniquement si l'utilisateur est connecté (évite les toasts au login)
      if (isAuthenticated) {
        toast.error('Erreur lors de la récupération des contraintes.');
      }
      
      // Fallback sur les contraintes locales
      setConstraints(INITIAL_CONSTRAINTS);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeDefaultConstraints = async () => {
    if (constraintsInitPromise) return constraintsInitPromise;

    constraintsInitPromise = (async () => {
      try {
        const existing = await constraintsApi.getAll();
        if (existing.length > 0) return;

        await Promise.all(
          INITIAL_CONSTRAINTS.map(constraint =>
            constraintsApi.create(mapFrontendConstraintToApi(constraint))
          )
        );
        toast.success('Contraintes initiales créées avec succès');
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        throw error;
      } finally {
        constraintsInitPromise = null;
      }
    })();

    return constraintsInitPromise;
  };

  const addConstraint = async (constraint: Omit<Constraint, 'id'>) => {
    try {
      const apiConstraint = mapFrontendConstraintToApi(constraint);
      const created = await constraintsApi.create(apiConstraint);
      const newConstraint = mapApiConstraintToFrontend(created);
      setConstraints(prev => [...prev, newConstraint]);
      toast.success('Contrainte ajoutée avec succès');
    } catch (error) {
      toast.error('Impossible d\'ajouter la contrainte');
      throw error;
    }
  };

  const updateConstraint = async (id: string, updates: Partial<Constraint>) => {
    try {
      const numericId = parseInt(id, 10);
      const currentConstraint = constraints.find(c => c.id === id);
      if (!currentConstraint) throw new Error('Contrainte non trouvée');
      
      const updatedConstraint = { ...currentConstraint, ...updates };
      const apiConstraint = mapFrontendConstraintToApi(updatedConstraint);
      const updated = await constraintsApi.update(numericId, apiConstraint);
      const mappedConstraint = mapApiConstraintToFrontend(updated);
      
      setConstraints(prev =>
        prev.map(c => (c.id === id ? mappedConstraint : c))
      );
      toast.success('Contrainte mise à jour');
    } catch (error) {
      toast.error('Impossible de mettre à jour');
      throw error;
    }
  };

  const deleteConstraint = async (id: string) => {
    try {
      const numericId = parseInt(id, 10);
      await constraintsApi.delete(numericId);
      setConstraints(prev => prev.filter(c => c.id !== id));
      toast.success('Contrainte supprimée');
    } catch (error) {
      toast.error('Impossible de supprimer');
      throw error;
    }
  };

  const toggleConstraint = async (id: string) => {
    try {
      const numericId = parseInt(id, 10);
      const toggled = await constraintsApi.toggle(numericId);
      const mappedConstraint = mapApiConstraintToFrontend(toggled);
      
      setConstraints(prev =>
        prev.map(c => (c.id === id ? mappedConstraint : c))
      );
      toast.success(`Contrainte ${mappedConstraint.active ? 'activée' : 'désactivée'}`);
    } catch (error) {
      toast.error('Erreur de changement d\'état');
      throw error;
    }
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
      {/* On ne bloque pas l'affichage des enfants, le loading est géré par les composants si besoin */}
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