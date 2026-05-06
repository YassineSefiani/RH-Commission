import { useState, useEffect } from 'react';
import { usePersonnel } from '../context/PersonnelContext';
import { Personnel } from '../services/personnelApi';
import { usePresence } from '../context/PresenceContext';
import { useUser } from '../context/UserContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  UserPlus,
  Search,
  Filter,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  Users,
  MapPin,
  Briefcase,
  Phone,
  ChevronRight,
  RotateCcw,
  Calendar,
} from 'lucide-react';

const NATURE_CONTRATS = ['CDI', 'Int'];

function getInitials(prenom: string, nom: string) {
  return `${prenom?.[0] ?? ''}${nom?.[0] ?? ''}`.toUpperCase();
}

function getCarteColor(carte?: string) {
  if (!carte) return 'bg-gray-400';
  if (carte.toLowerCase().includes('coca')) return 'bg-red-500';
  if (carte.toLowerCase().includes('magnum') || carte.toLowerCase().includes('wall')) return 'bg-blue-600';
  if (carte.toLowerCase().includes('ferrero')) return 'bg-amber-500';
  return 'bg-gray-500';
}

function getCarteBorderColor(carte?: string) {
  if (!carte) return 'border-gray-200';
  if (carte.toLowerCase().includes('coca')) return 'hover:border-red-300';
  if (carte.toLowerCase().includes('magnum') || carte.toLowerCase().includes('wall')) return 'hover:border-blue-300';
  if (carte.toLowerCase().includes('ferrero')) return 'hover:border-amber-300';
  return 'hover:border-gray-300';
}

const emptyForm = {
  matricule: '',
  nom: '',
  prenom: '',
  carte: '',
  fonction: '',
  role: '',
  numero: '',
  natureContrat: 'CDI',
  ville: '',
  actif: true,
};

const emptyPresenceForm = {
  date: new Date().toISOString().split('T')[0],
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

export default function PersonnelPage() {
  const {
    personnel,
    stats,
    isLoading,
    addPersonnel,
    updatePersonnel,
    deletePersonnel,
    togglePersonnel,
    searchByNom,
    filterByVille,
    filterByCarte,
    filterByContrat,
    showActifsOnly,
    resetFilter,
  } = usePersonnel();

  const { user } = useUser();
  const { addPresenceRecord } = usePresence();

  const [selectedPerson, setSelectedPerson] = useState<Personnel | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const [isPresenceDialogOpen, setIsPresenceDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [contractFilter, setContractFilter] = useState('');
  const [carteFilter, setCarteFilter] = useState('');
  const [villeFilter, setVilleFilter] = useState('');
  const [availableCartes, setAvailableCartes] = useState<string[]>([]);
  const [availableVilles, setAvailableVilles] = useState<string[]>([]);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [presenceForm, setPresenceForm] = useState({ ...emptyPresenceForm });

  useEffect(() => {
    setAvailableCartes(prev => {
      const next = new Set([...prev, ...personnel.map(p => p.carte).filter(Boolean) as string[]]);
      return Array.from(next).sort();
    });
    setAvailableVilles(prev => {
      const next = new Set([...prev, ...personnel.map(p => p.ville).filter(Boolean) as string[]]);
      return Array.from(next).sort();
    });
    if (selectedPerson) {
      const updated = personnel.find(p => p.id === selectedPerson.id);
      if (updated) setSelectedPerson(updated);
    }
  }, [personnel]);

  const openAdd = () => {
    setEditingId(null);
    setFormData({ ...emptyForm });
    setIsFormOpen(true);
  };

  const openEdit = (person: Personnel) => {
    setEditingId(person.id);
    setFormData({
      matricule: person.matricule,
      nom: person.nom,
      prenom: person.prenom,
      carte: person.carte || '',
      fonction: person.fonction || '',
      role: person.role || '',
      numero: person.numero || '',
      natureContrat: person.natureContrat,
      ville: person.ville || '',
      actif: person.actif,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updatePersonnel(editingId, formData);
      } else {
        await addPersonnel(formData);
      }
      setIsFormOpen(false);
    } catch {
      // handled by context
    }
  };

  const askDelete = (id: string) => {
    setIdToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (idToDelete) {
      try {
        await deletePersonnel(idToDelete);
        if (selectedPerson?.id === idToDelete) setSelectedPerson(null);
      } catch {
        // handled by context
      }
    }
    setDeleteConfirmOpen(false);
    setIdToDelete(null);
  };

  const handlePresenceSelect = (field: 'livreur1' | 'livreur2' | 'livreur3', id: string) => {
    if (id === 'none') {
      setPresenceForm(prev => ({
        ...prev,
        [`${field}Id`]: '',
        [`${field}Matricule`]: '',
        [`${field}Nom`]: '',
        [`${field}Prenom`]: '',
      }));
      return;
    }
    const person = personnel.find(p => p.id === id);
    setPresenceForm(prev => ({
      ...prev,
      [`${field}Id`]: id,
      [`${field}Matricule`]: person?.matricule || '',
      [`${field}Nom`]: person?.nom || '',
      [`${field}Prenom`]: person?.prenom || '',
    }));
  };

  const handlePresenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addPresenceRecord({
      date: presenceForm.date,
      matriculeCamion: presenceForm.matriculeCamion,
      canal: presenceForm.canal,
      livreur1Id: presenceForm.livreur1Id,
      livreur1Matricule: presenceForm.livreur1Matricule,
      livreur1Nom: presenceForm.livreur1Nom,
      livreur1Prenom: presenceForm.livreur1Prenom,
      livreur2Id: presenceForm.livreur2Id,
      livreur2Matricule: presenceForm.livreur2Matricule,
      livreur2Nom: presenceForm.livreur2Nom,
      livreur2Prenom: presenceForm.livreur2Prenom,
      livreur3Id: presenceForm.livreur3Id,
      livreur3Matricule: presenceForm.livreur3Matricule,
      livreur3Nom: presenceForm.livreur3Nom,
      livreur3Prenom: presenceForm.livreur3Prenom,
    });
    setIsPresenceDialogOpen(false);
    setPresenceForm({ ...emptyPresenceForm });
  };

  const handleSearch = () => {
    if (searchTerm.trim()) searchByNom(searchTerm);
    else resetFilter();
  };

  const handleContractChange = (value: string) => {
    if (value === 'all') { resetFilter(); setContractFilter(''); }
    else { setContractFilter(value); setCarteFilter(''); setVilleFilter(''); filterByContrat(value); }
  };

  const handleCarteChange = (value: string) => {
    if (value === 'all') { resetFilter(); setCarteFilter(''); }
    else { setCarteFilter(value); setContractFilter(''); setVilleFilter(''); filterByCarte(value); }
  };

  const handleVilleChange = (value: string) => {
    if (value === 'all') { resetFilter(); setVilleFilter(''); }
    else { setVilleFilter(value); setContractFilter(''); setCarteFilter(''); filterByVille(value); }
  };

  const handleReset = () => {
    setSearchTerm('');
    setContractFilter('');
    setCarteFilter('');
    setVilleFilter('');
    resetFilter();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion du Personnel</h1>
          <p className="text-gray-500 text-sm mt-1">Gérez et consultez les profils de l'équipe</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          {user?.superRole === 'DISPATCHER' && (
            <button
              onClick={() => setIsPresenceDialogOpen(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Fiche de Présence
            </button>
          )}
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Ajouter un profil
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Total</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Actifs</p>
              <p className="text-xl font-bold text-green-600">{stats.actifs}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <UserX className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Inactifs</p>
              <p className="text-xl font-bold text-gray-500">{stats.inactifs}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex gap-2 flex-1 min-w-[200px]">
            <Input
              placeholder="Rechercher par nom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <button onClick={handleSearch} className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Search className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <Select value={contractFilter} onValueChange={handleContractChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Contrat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              {NATURE_CONTRATS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          {availableCartes.length > 0 && (
            <Select value={carteFilter} onValueChange={handleCarteChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Carte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {availableCartes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {availableVilles.length > 0 && (
            <Select value={villeFilter} onValueChange={handleVilleChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Ville" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {availableVilles.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <button onClick={showActifsOnly} className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" /> Actifs
          </button>
          <button onClick={handleReset} className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <RotateCcw className="w-4 h-4" /> Réinitialiser
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Chargement...</div>
      ) : personnel.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Aucun personnel trouvé</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {personnel.map(person => (
            <div
              key={person.id}
              onClick={() => setSelectedPerson(person)}
              className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 cursor-pointer transition-all hover:shadow-md ${getCarteBorderColor(person.carte)} hover:-translate-y-0.5`}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-11 h-11 rounded-full ${getCarteColor(person.carte)} flex items-center justify-center text-white font-bold text-base shrink-0`}>
                  {getInitials(person.prenom, person.nom)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{person.prenom} {person.nom}</p>
                  <p className="text-xs text-gray-400 font-mono">{person.matricule}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${person.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {person.actif ? 'Actif' : 'Inactif'}
                </span>
              </div>

              {person.role && (
                <p className="text-sm text-gray-600 font-medium mb-3 truncate">{person.role}</p>
              )}

              <div className="flex flex-wrap gap-1.5 mb-3">
                {person.carte && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-100 font-medium">
                    {person.carte}
                  </span>
                )}
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                  {person.natureContrat}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                {person.ville ? (
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{person.ville}</span>
                ) : <span />}
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Detail Modal ─────────────────────────────────────────────────────── */}
      <Dialog open={!!selectedPerson} onOpenChange={(open) => !open && setSelectedPerson(null)}>
        <DialogContent className="max-w-md">
          {selectedPerson && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full ${getCarteColor(selectedPerson.carte)} flex items-center justify-center text-white font-bold text-xl`}>
                    {getInitials(selectedPerson.prenom, selectedPerson.nom)}
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{selectedPerson.prenom} {selectedPerson.nom}</DialogTitle>
                    <p className="text-sm text-gray-500 font-mono">{selectedPerson.matricule}</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3 py-4">
                {[
                  { icon: <Briefcase className="w-4 h-4" />, label: 'Rôle', value: selectedPerson.role },
                  { icon: <Briefcase className="w-4 h-4" />, label: 'Fonction', value: selectedPerson.fonction },
                  { icon: null, label: 'Carte', value: selectedPerson.carte },
                  { icon: null, label: 'Contrat', value: selectedPerson.natureContrat },
                  { icon: <MapPin className="w-4 h-4" />, label: 'Ville', value: selectedPerson.ville },
                  { icon: <Phone className="w-4 h-4" />, label: 'Téléphone', value: selectedPerson.numero },
                ].map(({ icon, label, value }) => value ? (
                  <div key={label} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 uppercase font-semibold mb-1">{label}</p>
                    <p className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                      {icon && <span className="text-gray-400">{icon}</span>}
                      {value}
                    </p>
                  </div>
                ) : null)}
                <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Statut</p>
                  <span className={`text-sm font-semibold ${selectedPerson.actif ? 'text-green-600' : 'text-gray-500'}`}>
                    {selectedPerson.actif ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>

              <DialogFooter className="flex gap-2 sm:justify-between">
                <button
                  onClick={() => togglePersonnel(selectedPerson.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {selectedPerson.actif ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  {selectedPerson.actif ? 'Désactiver' : 'Activer'}
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => { openEdit(selectedPerson); setSelectedPerson(null); }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Pencil className="w-4 h-4" /> Modifier
                  </button>
                  <button
                    onClick={() => { askDelete(selectedPerson.id); setSelectedPerson(null); }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Supprimer
                  </button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ────────────────────────────────────────────────────── */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce profil ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le profil sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <DialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </DialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Fiche de Présence (DISPATCHER) ───────────────────────────────────── */}
      <Dialog open={isPresenceDialogOpen} onOpenChange={setIsPresenceDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fiche de Présence</DialogTitle>
            <DialogDescription>
              Enregistrez la présence des livreurs pour la tournée du jour.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePresenceSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input value={presenceForm.date} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Matricule du Camion</Label>
                <Input
                  value={presenceForm.matriculeCamion}
                  onChange={(e) => setPresenceForm({ ...presenceForm, matriculeCamion: e.target.value })}
                  placeholder="EX: TRK123"
                />
              </div>
              <div className="space-y-2">
                <Label>Canal</Label>
                <Input
                  value={presenceForm.canal}
                  onChange={(e) => setPresenceForm({ ...presenceForm, canal: e.target.value })}
                  placeholder="Ex: Retail"
                />
              </div>
            </div>

            {(['livreur1', 'livreur2', 'livreur3'] as const).map((field, index) => {
              const label = index === 0 ? 'Livreur' : `Aide Livreur ${index}`;
              const selectedId = presenceForm[`${field}Id`];
              const selectedMatricule = presenceForm[`${field}Matricule`];
              return (
                <div key={field} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>{label}</Label>
                    <Select value={selectedId} onValueChange={(v) => handlePresenceSelect(field, v)}>
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
                    <Input value={selectedMatricule} readOnly placeholder="Auto" />
                  </div>
                </div>
              );
            })}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPresenceDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Add / Edit Form ───────────────────────────────────────────────────── */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modifier le profil' : 'Ajouter un profil'}</DialogTitle>
            <DialogDescription>Remplissez les informations du personnel</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Matricule *</Label>
                <Input value={formData.matricule}
                  onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                  required placeholder="P001" />
              </div>
              <div className="space-y-2">
                <Label>Type de Contrat *</Label>
                <Select value={formData.natureContrat}
                  onValueChange={(v) => setFormData({ ...formData, natureContrat: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NATURE_CONTRATS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  required placeholder="Dupont" />
              </div>
              <div className="space-y-2">
                <Label>Prénom *</Label>
                <Input value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  required placeholder="Jean" />
              </div>
              <div className="space-y-2">
                <Label>Carte</Label>
                <Select value={formData.carte}
                  onValueChange={(v) => setFormData({ ...formData, carte: v })}>
                  <SelectTrigger><SelectValue placeholder="Choisir une carte" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Coca Cola">Coca Cola</SelectItem>
                    <SelectItem value="Wall's">Wall's</SelectItem>
                    <SelectItem value="Ferrero Rocher">Ferrero Rocher</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fonction</Label>
                <Input value={formData.fonction}
                  onChange={(e) => setFormData({ ...formData, fonction: e.target.value })}
                  placeholder="Commercial Senior" />
              </div>
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Input value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="Vendeur" />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input type="tel" value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  placeholder="0612345678" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Ville</Label>
                <Input value={formData.ville}
                  onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                  placeholder="Casablanca" />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Annuler</Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                {editingId ? 'Mettre à jour' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
