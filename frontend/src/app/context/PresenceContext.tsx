import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from 'sonner';

export interface PresenceRecord {
  id: string;
  date: string;
  matriculeCamion: string;
  canal: string;
  livreur1Id: string;
  livreur1Matricule: string;
  livreur1Nom: string;
  livreur1Prenom: string;
  livreur2Id: string;
  livreur2Matricule: string;
  livreur2Nom: string;
  livreur2Prenom: string;
  livreur3Id: string;
  livreur3Matricule: string;
  livreur3Nom: string;
  livreur3Prenom: string;
}

interface PresenceContextType {
  presenceRecords: PresenceRecord[];
  addPresenceRecord: (record: Omit<PresenceRecord, 'id'>) => void;
  deletePresenceRecord: (id: string) => void;
  clearPresenceRecords: () => void;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

const STORAGE_KEY = 'presenceRecords';

function loadSavedRecords(): PresenceRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as PresenceRecord[];
  } catch (error) {
    console.error('Erreur lors du chargement des fiches de présence:', error);
    return [];
  }
}

export function PresenceProvider({ children }: { children: ReactNode }) {
  const [presenceRecords, setPresenceRecords] = useState<PresenceRecord[]>([]);

  useEffect(() => {
    setPresenceRecords(loadSavedRecords());
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presenceRecords));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des fiches de présence:', error);
    }
  }, [presenceRecords]);

  const addPresenceRecord = (record: Omit<PresenceRecord, 'id'>) => {
    const newRecord: PresenceRecord = {
      id: Date.now().toString(),
      ...record,
    };
    setPresenceRecords((prev) => [newRecord, ...prev]);
    toast.success('Fiche de présence enregistrée');
  };

  const deletePresenceRecord = (id: string) => {
    setPresenceRecords((prev) => prev.filter((record) => record.id !== id));
    toast.success('Fiche de présence supprimée');
  };

  const clearPresenceRecords = () => {
    if (!confirm('Supprimer toutes les fiches de présence ?')) return;
    setPresenceRecords([]);
    toast.success('Toutes les fiches de présence ont été supprimées');
  };

  return (
    <PresenceContext.Provider
      value={{
        presenceRecords,
        addPresenceRecord,
        deletePresenceRecord,
        clearPresenceRecords,
      }}
    >
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  const context = useContext(PresenceContext);
  if (context === undefined) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
}
