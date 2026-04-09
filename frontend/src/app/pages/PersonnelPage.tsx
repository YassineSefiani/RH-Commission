import { useState } from 'react';
import { usePersonnel } from '../context/PersonnelContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
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
  Calendar,
} from 'lucide-react';

const NATURE_CONTRATS = ['CDI', 'Int'];

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

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
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
  });

  // Liste des villes uniques pour le filtre
  const villes = Array.from(new Set(personnel.map(p => p.ville).filter(Boolean)));

  const cartes = Array.from(new Set(personnel.map(p => p.carte).filter(Boolean)));
  
  const handleOpenDialog = (person?: typeof personnel[0]) => {
    if (person) {
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
    } else {
      setEditingId(null);
      setFormData({
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
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updatePersonnel(editingId, formData);
      } else {
        await addPersonnel(formData);
      }
      handleCloseDialog();
    } catch (error) {
      // Error handled by context
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce personnel ?')) {
      try {
        await deletePersonnel(id);
      } catch (error) {
        // Error handled by context
      }
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      searchByNom(searchTerm);
    } else {
      resetFilter();
    }
  };

  const getContractBadgeVariant = (contrat: string) => {
    switch (contrat) {
      case 'CDI':
        return 'default';
      case 'CDD':
        return 'secondary';
      case 'Int':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header avec statistiques */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion du Personnel</h1>
          <p className="text-gray-600 mt-1">Gérez les employés de l'entreprise</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-[#f7a800] hover:bg-[#e09800]">
          <UserPlus className="w-4 h-4 mr-2" />
          Ajouter un Personnel
        </Button>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Personnel</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Actifs</p>
                <p className="text-2xl font-bold text-green-600">{stats.actifs}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <UserX className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Inactifs</p>
                <p className="text-2xl font-bold text-gray-600">{stats.inactifs}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Barre de recherche et filtres */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Rechercher par nom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} variant="outline">
              <Search className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Select onValueChange={(value) => filterByContrat(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type contrat" />
              </SelectTrigger>
              <SelectContent>
                {NATURE_CONTRATS.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {cartes.length > 0 && (
              <Select onValueChange={(value) => filterByCarte(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Carte" />
                </SelectTrigger>
                <SelectContent>
                  {cartes.map((carte) => (
                    <SelectItem key={carte} value={carte || ''}>
                      {carte}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {villes.length > 0 && (
              <Select onValueChange={(value) => filterByVille(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Ville" />
                </SelectTrigger>
                <SelectContent>
                  {villes.map((ville) => (
                    <SelectItem key={ville} value={ville || ''}>
                      {ville}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button onClick={showActifsOnly} variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Actifs
            </Button>

            <Button onClick={resetFilter} variant="outline">
              Réinitialiser
            </Button>
          </div>
        </div>
      </Card>

      {/* Table du personnel */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matricule</TableHead>
                <TableHead>Nom Complet</TableHead>
                <TableHead>Carte</TableHead>
                <TableHead>Fonction</TableHead>
                <TableHead>Contrat</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : personnel.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    Aucun personnel trouvé
                  </TableCell>
                </TableRow>
              ) : (
                personnel.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell className="font-medium">{person.matricule}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{person.prenom} {person.nom}</p>
                        {person.role && (
                          <p className="text-sm text-gray-500">{person.role}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {person.carte && (
                        <Badge variant="outline">
                          {person.carte}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {person.fonction && (
                        <div className="flex items-center gap-1 text-sm">
                          <Briefcase className="w-3 h-3 text-gray-400" />
                          {person.fonction}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getContractBadgeVariant(person.natureContrat)}>
                        {person.natureContrat}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {person.numero && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {person.numero}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {person.ville && (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {person.ville}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={person.actif ? 'default' : 'secondary'}>
                        {person.actif ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePersonnel(person.id)}
                        >
                          {person.actif ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(person)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(person.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Dialog d'ajout/édition */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Modifier le Personnel' : 'Ajouter un Personnel'}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations du personnel
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="matricule">Matricule *</Label>
                <Input
                  id="matricule"
                  value={formData.matricule}
                  onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                  required
                  placeholder="EMP001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="natureContrat">Type de Contrat *</Label>
                <Select
                  value={formData.natureContrat}
                  onValueChange={(value) => setFormData({ ...formData, natureContrat: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NATURE_CONTRATS.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  required
                  placeholder="Dupont"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  required
                  placeholder="Jean"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carte">Carte</Label>
                <Select
                  value={formData.carte}
                  onValueChange={(value) => setFormData({ ...formData, carte: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une carte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Coca Cola">Coca Cola</SelectItem>
                    <SelectItem value="Ferrero Rocher">Ferrero Rocher</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fonction">Fonction</Label>
                <Input
                  id="fonction"
                  value={formData.fonction}
                  onChange={(e) => setFormData({ ...formData, fonction: e.target.value })}
                  placeholder="Commercial Senior"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rôle</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="Vendeur"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero">Téléphone</Label>
                <Input
                  id="numero"
                  type="tel"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  placeholder="0612345678"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ville">Ville</Label>
                <Input
                  id="ville"
                  value={formData.ville}
                  onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                  placeholder="Paris"
                />
              </div>

            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annuler
              </Button>
              <Button type="submit" className="bg-[#f7a800] hover:bg-[#e09800]">
                {editingId ? 'Mettre à jour' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
