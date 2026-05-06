import { useState } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useConstraints, Constraint } from '../context/ConstraintsContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

export default function ConstraintsPage() {
  const navigate = useNavigate();
  const { constraints, deleteConstraint, toggleConstraint } = useConstraints();

  const [searchTerm, setSearchTerm] = useState('');
  // Changement du filtre Type vers Carte
  const [filterCarte, setFilterCarte] = useState<string>('all');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  // Couleurs basées sur la Carte (Brand Colors)
  const carteColors: Record<string, string> = {
    'Coca Cola': 'bg-red-100 text-red-800',
    'Ferrero Rocher': 'bg-amber-100 text-amber-800',
    "Wall's": 'bg-blue-100 text-blue-800',
  };

  const handleDelete = (id: string) => {
    setIdToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (idToDelete) {
      deleteConstraint(idToDelete);
    }
    setDeleteConfirmOpen(false);
    setIdToDelete(null);
  };

  const filteredConstraints = constraints.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.condition.toLowerCase().includes(searchTerm.toLowerCase());
    // Filtrage par carte au lieu du type
    const matchesCarte = filterCarte === 'all' || c.carte === filterCarte;
    return matchesSearch && matchesCarte;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Commissions</h1>
          <p className="text-gray-600 mt-1">Gérez les règles de calcul par carte (Coca Cola, Ferrero, Wall's)</p>
        </div>
        <button
          onClick={() => navigate('/constraints/new')}
          className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition"
          style={{ backgroundColor: '#f7a800' }}
        >
          <Plus className="w-5 h-5" />
          Nouvelle Règle
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une règle ou une condition..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            />
          </div>
          {/* Sélecteur par Carte */}
          <select
            value={filterCarte}
            onChange={(e) => setFilterCarte(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
          >
            <option value="all">Toutes les Cartes</option>
            <option value="Coca Cola">Coca Cola</option>
            <option value="Ferrero Rocher">Ferrero Rocher</option>
            <option value="Wall's">Wall's</option>
          </select>
        </div>
      </div>

      {/* Constraints Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Nom</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Carte</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Valeur</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Condition</th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Statut</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredConstraints.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    Aucune règle trouvée pour cette carte
                  </td>
                </tr>
              ) : (
                filteredConstraints.map((constraint) => (
                  <tr key={constraint.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-medium text-gray-900">{constraint.name}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${carteColors[constraint.carte] || 'bg-gray-100 text-gray-800'}`}>
                        {constraint.carte}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-gray-900">
                        {constraint.valueType === 'percentage' ? `${constraint.value}%` : `${constraint.value} MAD`}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-600">{constraint.condition}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => toggleConstraint(constraint.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                          constraint.active ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            constraint.active ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate('/constraints/new', { state: { constraint } })}
                          className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(constraint.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la règle</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette règle de commission ? Cette action est irréversible et pourrait affecter les calculs futurs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3 p-4">
            <AlertDialogCancel className="rounded-lg">Annuler</AlertDialogCancel>
            <AlertDialogAction 
                onClick={confirmDelete} 
                className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2"
            >
              Confirmer la suppression
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}