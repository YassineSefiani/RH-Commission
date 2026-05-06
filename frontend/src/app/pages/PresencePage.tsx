import { useMemo } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { usePresence } from '../context/PresenceContext';
import { Trash2, Calendar, Users, Truck } from 'lucide-react';

export default function PresencePage() {
  const { presenceRecords, deletePresenceRecord, clearPresenceRecords } = usePresence();

  const recordCountLabel = useMemo(() => {
    return presenceRecords.length > 1 ? `${presenceRecords.length} fiches` : `${presenceRecords.length} fiche`;
  }, [presenceRecords.length]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fiches de Présence</h1>
          <p className="text-gray-600 mt-1">
            {presenceRecords.length === 0
              ? 'Aucune fiche de présence enregistrée pour l’instant.'
              : `Consulter toutes les fiches enregistrées (${recordCountLabel}).`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={presenceRecords.length === 0}
            onClick={clearPresenceRecords}
          >
            Supprimer toutes
          </Button>
        </div>
      </div>

      {presenceRecords.length === 0 ? (
        <Card className="p-8 text-center text-gray-500 border border-dashed border-gray-200">
          <div className="flex flex-col items-center justify-center gap-4">
            <Calendar className="w-14 h-14 text-gray-300" />
            <p>Aucune fiche de présence à afficher.</p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Camion</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Livreur</TableHead>
                <TableHead>Aide Livreur 1</TableHead>
                <TableHead>Aide Livreur 2</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {presenceRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{new Date(record.date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="w-4 h-4 text-gray-400" />
                      {record.matriculeCamion || '-'}
                    </div>
                  </TableCell>
                  <TableCell>{record.canal || '-'}</TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div className="font-medium">{record.livreur1Prenom} {record.livreur1Nom}</div>
                      <div className="text-gray-500">{record.livreur1Matricule || '-'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div className="font-medium">{record.livreur2Prenom} {record.livreur2Nom}</div>
                      <div className="text-gray-500">{record.livreur2Matricule || '-'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div className="font-medium">{record.livreur3Prenom} {record.livreur3Nom}</div>
                      <div className="text-gray-500">{record.livreur3Matricule || '-'}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePresenceRecord(record.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
