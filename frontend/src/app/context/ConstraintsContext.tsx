import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { constraintsApi, mapApiConstraintToFrontend, mapFrontendConstraintToApi } from '../services/api';
import { toast } from 'sonner';

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
];

export function ConstraintsProvider({ children }: { children: ReactNode }) {
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les contraintes depuis l'API au démarrage
  useEffect(() => {
    loadConstraints();
  }, []);

  const loadConstraints = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Chargement des contraintes depuis l\'API...');
      const apiConstraints = await constraintsApi.getAll();
      console.log('📊 Contraintes reçues de l\'API:', apiConstraints.length, apiConstraints);
      const mappedConstraints = apiConstraints.map(mapApiConstraintToFrontend);
      console.log('🗺️ Contraintes mappées:', mappedConstraints.length, mappedConstraints);
      setConstraints(mappedConstraints);

      // Si aucune contrainte n'existe, créer les contraintes initiales
      if (mappedConstraints.length === 0) {
        console.log('⚠️ Aucune contrainte trouvée, création des contraintes initiales...');
        await initializeDefaultConstraints();
        const reloadedConstraints = await constraintsApi.getAll();
        const mappedReloaded = reloadedConstraints.map(mapApiConstraintToFrontend);
        setConstraints(mappedReloaded);
      } else {
        console.log('✅ Contraintes existantes chargées:', mappedConstraints.length);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des contraintes:', error);
      toast.error('Impossible de charger les contraintes. Vérifiez que le backend est démarré.');
      // En cas d'erreur, utiliser les contraintes par défaut en local
      setConstraints(INITIAL_CONSTRAINTS);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeDefaultConstraints = async () => {
    if (constraintsInitPromise) {
      return constraintsInitPromise;
    }

    constraintsInitPromise = (async () => {
      try {
        const existing = await constraintsApi.getAll();
        if (existing.length > 0) {
          console.log('⚠️ Contraintes déjà initialisées, skipping...');
          return;
        }

        console.log('🏗️ Création des contraintes initiales...');
        await Promise.all(
          INITIAL_CONSTRAINTS.map(constraint =>
            constraintsApi.create(mapFrontendConstraintToApi(constraint))
          )
        );
        toast.success('Contraintes initiales créées avec succès');
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation des contraintes:', error);
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
      console.error('Erreur lors de l\'ajout de la contrainte:', error);
      toast.error('Impossible d\'ajouter la contrainte');
      throw error;
    }
  };

  const updateConstraint = async (id: string, updates: Partial<Constraint>) => {
    try {
      const numericId = parseInt(id, 10);
      const currentConstraint = constraints.find(c => c.id === id);
      if (!currentConstraint) {
        throw new Error('Contrainte non trouvée');
      }
      
      const updatedConstraint = { ...currentConstraint, ...updates };
      const apiConstraint = mapFrontendConstraintToApi(updatedConstraint);
      const updated = await constraintsApi.update(numericId, apiConstraint);
      const mappedConstraint = mapApiConstraintToFrontend(updated);
      
      setConstraints(prev =>
        prev.map(c => (c.id === id ? mappedConstraint : c))
      );
      toast.success('Contrainte mise à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la contrainte:', error);
      toast.error('Impossible de mettre à jour la contrainte');
      throw error;
    }
  };

  const deleteConstraint = async (id: string) => {
    try {
      const numericId = parseInt(id, 10);
      await constraintsApi.delete(numericId);
      setConstraints(prev => prev.filter(c => c.id !== id));
      toast.success('Contrainte supprimée avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression de la contrainte:', error);
      toast.error('Impossible de supprimer la contrainte');
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
      console.error('Erreur lors du changement d\'état de la contrainte:', error);
      toast.error('Impossible de changer l\'état de la contrainte');
      throw error;
    }
  };

  // Afficher un loader pendant le chargement initial
  if (isLoading) {
    return (
      <ConstraintsContext.Provider
        value={{
          constraints: [],
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