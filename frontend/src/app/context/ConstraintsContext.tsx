import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { constraintsApi, mapApiConstraintToFrontend, mapFrontendConstraintToApi } from '../services/api';
import { toast } from 'sonner';

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
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les contraintes depuis l'API au démarrage
  useEffect(() => {
    loadConstraints();
  }, []);

  const loadConstraints = async () => {
    try {
      setIsLoading(true);
      const apiConstraints = await constraintsApi.getAll();
      const mappedConstraints = apiConstraints.map(mapApiConstraintToFrontend);
      setConstraints(mappedConstraints);
      
      // Si aucune contrainte n'existe, créer les contraintes initiales
      if (mappedConstraints.length === 0) {
        await initializeDefaultConstraints();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des contraintes:', error);
      toast.error('Impossible de charger les contraintes. Vérifiez que le backend est démarré.');
      // En cas d'erreur, utiliser les contraintes par défaut en local
      setConstraints(INITIAL_CONSTRAINTS);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeDefaultConstraints = async () => {
    try {
      const createdConstraints = await Promise.all(
        INITIAL_CONSTRAINTS.map(constraint => 
          constraintsApi.create(mapFrontendConstraintToApi(constraint))
        )
      );
      const mappedConstraints = createdConstraints.map(mapApiConstraintToFrontend);
      setConstraints(mappedConstraints);
      toast.success('Contraintes initiales créées avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des contraintes:', error);
    }
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