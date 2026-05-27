import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from 'sonner';
import { logAudit } from '../services/auditApi';
import { 
  presenceApi, 
  PresenceRecord, 
  mapApiToPresenceRecord, 
  mapPresenceRecordToApi 
} from '../services/presenceApi';

interface PresenceContextType {
  presenceRecords: PresenceRecord[];
  isLoading: boolean;
  addPresenceRecord: (record: Omit<PresenceRecord, 'id'>) => Promise<void>;
  deletePresenceRecord: (id: string) => Promise<void>;
  refreshRecords: () => Promise<void>;
  clearPresenceRecords: () => Promise<void>;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export function PresenceProvider({ children }: { children: ReactNode }) {
  const [presenceRecords, setPresenceRecords] = useState<PresenceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * CHARGEMENT : Récupère les données depuis le Backend
   */
  const refreshRecords = async () => {
    try {
      setIsLoading(true);
      const apiData = await presenceApi.getAll();
      // On convertit les données du format API (ID numérique) au format Frontend (ID string)
      const formattedRecords = apiData.map(mapApiToPresenceRecord);
      setPresenceRecords(formattedRecords);
    } catch (error) {
      console.error('Erreur lors du chargement des présences:', error);
      // On évite le toast d'erreur au chargement initial pour ne pas gêner l'utilisateur
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les données dès que le Provider est monté
  useEffect(() => {
    refreshRecords();
  }, []);

  /**
   * AJOUT : Envoie la fiche au serveur
   */
  const addPresenceRecord = async (record: Omit<PresenceRecord, 'id'>) => {
    try {
      // Transformation vers le format attendu par le Backend (LocalDate, etc.)
      const apiInput = mapPresenceRecordToApi(record);
      
      // Appel API POST
      const savedApiRecord = await presenceApi.create(apiInput);
      
      // Re-conversion pour l'affichage local (pour récupérer l'ID généré par la DB)
      const newRecord = mapApiToPresenceRecord(savedApiRecord);
      
      setPresenceRecords((prev) => [newRecord, ...prev]);
      logAudit({ action: 'PRESENCE_CREATE', entity: 'FichePresence', entityId: newRecord.id, details: `${newRecord.date} ${newRecord.matriculeCamion}` });
      toast.success('Fiche de présence enregistrée sur le serveur');
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout:', error);
      const message = error.message.includes('403') 
        ? "Accès refusé : Rôle insuffisant" 
        : "Erreur lors de l'enregistrement";
      toast.error(message);
      throw error; // Permet de garder le dialogue ouvert si l'enregistrement échoue
    }
  };

  /**
   * SUPPRESSION : Supprime sur le serveur
   */
  const deletePresenceRecord = async (id: string) => {
    try {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) throw new Error("ID invalide");

      await presenceApi.delete(numericId);

      setPresenceRecords((prev) => prev.filter((record) => record.id !== id));
      logAudit({ action: 'PRESENCE_DELETE', entity: 'FichePresence', entityId: id });
      toast.success('Fiche de présence supprimée du serveur');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Impossible de supprimer la fiche');
    }
  };

  /**
   * VIDER : Supprime toutes les fiches côté serveur
   */
  const clearPresenceRecords = async () => {
    try {
      const ids = presenceRecords.map(r => r.id);
      await Promise.all(ids.map(id => {
        const numericId = parseInt(id, 10);
        return isNaN(numericId) ? Promise.resolve() : presenceApi.delete(numericId);
      }));
      setPresenceRecords([]);
      toast.success('Toutes les fiches de présence ont été supprimées');
    } catch (error) {
      console.error('Erreur lors du vidage:', error);
      toast.error('Impossible de vider les fiches de présence');
    }
  };

  return (
    <PresenceContext.Provider
      value={{
        presenceRecords,
        isLoading,
        addPresenceRecord,
        deletePresenceRecord,
        refreshRecords,
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