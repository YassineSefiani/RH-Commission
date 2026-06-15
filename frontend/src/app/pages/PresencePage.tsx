import { useState, useMemo } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { usePresence } from '../context/PresenceContext';
import { usePersonnel } from '../context/PersonnelContext';
import { Trash2, Pencil, Calendar, Users, Truck, MapPin } from 'lucide-react'; // Ajout de MapPin
import { ConfirmDialog } from '../components/ConfirmDialog';

const today = new Date().toISOString().split('T')[0];

const emptyPresenceForm = {
  id: '',
  date: today,
  ville: '', // NOUVEAU : Champ Ville
  matriculeCamion: '',
  canal: '',
  livreur1Id: '',
  livreur1Matricule: '',
  livreur1Nom: '',
  livreur1Prenom: '',
  livreur2Id: '',
  livreur2Matricule: '',
  livreur2Nom: '',
  livreur2Prenom: '',
  livreur3Id: '',
  livreur3Matricule: '',
  livreur3Nom: '',
  livreur3Prenom: '',
};

export default function PresencePage() {
  const { presenceRecords, deletePresenceRecord, updatePresenceRecord, clearPresenceRecords } = usePresence();
  const { personnel } = usePersonnel(); 

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(emptyPresenceForm);

  const recordCountLabel = useMemo(() => {
    return presenceRecords.length > 1 ? `${presenceRecords.length} fiches` : `${presenceRecords.length} fiche`;
  }, [presenceRecords.length]);

  const openEditModal = (record: any) => {
    // S'assurer que ville ne soit pas undefined si la donnée est ancienne
    setEditForm({ ...emptyPresenceForm, ...record, ville: record.ville || '' });
    setIsEditOpen(true);
  };

  const handlePresenceSelect = (field: 'livreur1' | 'livreur2' | 'livreur3', id: string) => {
    if (id === 'none') {
      setEditForm(prev => ({
        ...prev,
        [`${field}Id`]: '',
        [`${field}Matricule`]: '',
        [`${field}Nom`]: '',
        [`${field}Prenom`]: '',
      }));
      return;
    }
    const person = personnel.find(p => p.id === id);
    setEditForm(prev => ({
      ...prev,
      [`${field}Id`]: id,
      [`${field}Matricule`]: person?.matricule || '',
      [`${field}Nom`]: person?.nom || '',
      [`${field}Prenom`]: person?.prenom || '',
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (updatePresenceRecord) {
      await updatePresenceRecord(editForm.id, editForm);
    }
    setIsEditOpen(false);
  };

  return (
    <div className="abc-page-inner abc-stack-lg">
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
          <ConfirmDialog
            trigger={
              <Button
                type="button"
                variant="outline"
                disabled={presenceRecords.length === 0}
              >
                Supprimer toutes
              </Button>
            }
            title="Supprimer toutes les fiches de présence ?"
            description={`Cela supprimera ${presenceRecords.length} fiche(s) — action irréversible.`}
            confirmLabel="Tout supprimer"
            destructive
            onConfirm={clearPresenceRecords}
          />
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
                <TableHead>Ville</TableHead> {/* NOUVEAU */}
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
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {record.ville || '-'}
                    </div>
                  </TableCell>
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
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(record)}
                      >
                        <Pencil className="w-4 h-4 text-gray-500" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePresenceRecord(record.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* ── Modale de Modification ───────────────────────────────────────────── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        {/* MODIFIÉ : max-w-3xl pour plus d'espace */}
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la Fiche de Présence</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'équipe pour cette journée.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-6"> {/* Espacement vertical augmenté */}
            
            {/* Ligne 1 : Date, Ville, Camion, Canal en 2 colonnes par ligne */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input 
                  type="date"
                  value={editForm.date} 
                  max={today}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Ville</Label>
                <Input
                  value={editForm.ville}
                  onChange={(e) => setEditForm({ ...editForm, ville: e.target.value })}
                  placeholder="Ex: Casablanca"
                />
              </div>
              <div className="space-y-2">
                <Label>Matricule Camion</Label>
                <Input
                  value={editForm.matriculeCamion}
                  onChange={(e) => setEditForm({ ...editForm, matriculeCamion: e.target.value })}
                  placeholder="EX: TRK123"
                />
              </div>
              <div className="space-y-2">
                <Label>Canal</Label>
                <Select 
                  value={editForm.canal} 
                  onValueChange={(v) => setEditForm({ ...editForm, canal: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRADI">TRADI</SelectItem>
                    <SelectItem value="GMS">GMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <hr className="border-gray-100" /> {/* Ligne de séparation */}

            <div className="space-y-4">
              {(['livreur1', 'livreur2', 'livreur3'] as const).map((field, index) => {
                const label = index === 0 ? "Livreur" : `Aide Livreur ${index}`;
                const selectedId = editForm[`${field}Id`];
                const selectedMatricule = editForm[`${field}Matricule`];
                return (
                  <div key={field} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label>{label}</Label>
                      <Select value={selectedId || "none"} onValueChange={(v) => handlePresenceSelect(field, v)}>
                        <SelectTrigger>
                          <SelectValue placeholder={`Sélectionner ${label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucun</SelectItem>
                          {personnel.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.prenom} {p.nom}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Matricule</Label>
                      <Input value={selectedMatricule} readOnly placeholder="Auto" className="bg-gray-50" />
                    </div>
                  </div>
                );
              })}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">
                Mettre à jour
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}