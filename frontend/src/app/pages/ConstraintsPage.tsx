import { useState } from 'react';
import { Plus, Edit2, Trash2, Search, History } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useConstraints } from '../context/ConstraintsContext';
import { useLang } from '../context/LangContext';
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
  const { t } = useLang();
  const c_ = t.constraints;

  const [searchTerm, setSearchTerm] = useState('');
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
    const matchesCarte = filterCarte === 'all' || c.carte === filterCarte;
    return matchesSearch && matchesCarte;
  });

  return (
    <div className="abc-page-inner abc-stack-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{c_.title}</h1>
          <p className="text-gray-600 mt-1">{c_.subtitle}</p>
        </div>
        <button
          onClick={() => navigate('/constraints/new')}
          className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition shadow-sm"
          style={{ backgroundColor: '#f7a800' }}
        >
          <Plus className="w-5 h-5" />
          {c_.newRule}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={c_.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <select
            value={filterCarte}
            onChange={(e) => setFilterCarte(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white transition-all"
          >
            <option value="all">{c_.allCards}</option>
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
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">{c_.colName}</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">{c_.colCard}</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">{c_.colValue}</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">{c_.colCondition}</th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">{c_.colStatus}</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">{c_.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredConstraints.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    {c_.noRules}
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
                      <span className="text-sm text-gray-600 line-clamp-1" title={constraint.condition}>
                        {constraint.condition}
                      </span>
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
                      <div className="flex items-center justify-end gap-1">
                        {/* Bouton Historique */}
                        <button
                          onClick={() => navigate(`/constraints/history/${constraint.id}`)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title={c_.historyTooltip}
                        >
                          <History className="w-4 h-4" />
                        </button>
                        
                        {/* Bouton Modifier */}
                        <button
                          onClick={() => navigate('/constraints/new', { state: { constraint } })}
                          className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                          title={c_.editTooltip}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Bouton Supprimer */}
                        <button
                          onClick={() => handleDelete(constraint.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title={c_.deleteTooltip}
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
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{c_.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {c_.deleteDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <AlertDialogCancel className="rounded-lg border-gray-200">{c_.cancel}</AlertDialogCancel>
            <AlertDialogAction 
                onClick={confirmDelete} 
                className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 transition-colors"
            >
              {c_.confirmDelete}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}