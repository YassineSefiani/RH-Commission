import { useState } from 'react';
import { Search, Trash2, Calendar, User, DollarSign } from 'lucide-react';
import { useHistory } from '../context/HistoryContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

export default function HistoryPage() {
  const { history, deleteCalculation, clearHistory } = useHistory();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  const filteredHistory = history.filter(record => {
    const date = new Date(record.date);
    const matchesSearch = record.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMonth = !selectedMonth || date.toLocaleDateString('fr-FR', { month: 'long' }) === selectedMonth.toLowerCase();
    const matchesYear = !selectedYear || date.getFullYear().toString() === selectedYear;
    return matchesSearch && matchesMonth && matchesYear;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historique des Calculs</h1>
          <p className="text-gray-600 mt-1">
            Consulter les calculs passés ({history.length} calcul{history.length > 1 ? 's' : ''})
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un employé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            />
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
          >
            <option value="">Tous les mois</option>
            <option value="Janvier">Janvier</option>
            <option value="Février">Février</option>
            <option value="Mars">Mars</option>
            <option value="Avril">Avril</option>
            <option value="Mai">Mai</option>
            <option value="Juin">Juin</option>
            <option value="Juillet">Juillet</option>
            <option value="Août">Août</option>
            <option value="Septembre">Septembre</option>
            <option value="Octobre">Octobre</option>
            <option value="Novembre">Novembre</option>
            <option value="Décembre">Décembre</option>
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
          >
            <option value="">Toutes les années</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>
      </div>

      {/* History Cards */}
      {filteredHistory.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">
            {history.length === 0 
              ? "Aucun calcul enregistré. Effectuez un calcul dans la page Calcul pour voir l'historique."
              : "Aucun résultat trouvé pour ces filtres."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredHistory.map((record) => (
            <div key={record.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-5 h-5 text-gray-400" />
                      <h3 className="text-lg font-bold text-gray-900">{record.employeeName}</h3>
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {record.employeeRole}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {formatDate(record.date)}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIdToDelete(record.id);
                      setDeleteConfirmOpen(true);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-600 mb-1">Ventes</p>
                    <p className="font-bold text-blue-900">{formatCurrency(record.totalSales)}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-600 mb-1">Livraisons</p>
                    <p className="font-bold text-green-900">{record.deliveries}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-xs text-red-600 mb-1">Retours</p>
                    <p className="font-bold text-red-900">{record.returns}</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: '#f7a80010' }}>
                    <p className="text-xs mb-1" style={{ color: '#f7a800' }}>Salaire de base</p>
                    <p className="font-bold" style={{ color: '#f7a800' }}>{formatCurrency(record.baseSalary)}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  {record.commissions > 0 && (
                    <div className="flex justify-between items-center py-2 border-t border-gray-100">
                      <span className="text-sm text-gray-700">Commissions</span>
                      <span className="font-semibold text-green-600">+ {formatCurrency(record.commissions)}</span>
                    </div>
                  )}
                  {record.bonuses > 0 && (
                    <div className="flex justify-between items-center py-2 border-t border-gray-100">
                      <span className="text-sm text-gray-700">Bonus</span>
                      <span className="font-semibold text-green-600">+ {formatCurrency(record.bonuses)}</span>
                    </div>
                  )}
                  {record.penalties > 0 && (
                    <div className="flex justify-between items-center py-2 border-t border-gray-100">
                      <span className="text-sm text-gray-700">Pénalités</span>
                      <span className="font-semibold text-red-600">- {formatCurrency(record.penalties)}</span>
                    </div>
                  )}
                </div>

                {/* Constraints Applied */}
                {record.constraintsApplied && record.constraintsApplied.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-600 mb-2">Contraintes appliquées:</p>
                    <div className="flex flex-wrap gap-2">
                      {record.constraintsApplied.map((constraint, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {constraint}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Final Salary */}
                <div className="pt-4 border-t-2 border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" style={{ color: '#f7a800' }} />
                      <span className="text-lg font-bold text-gray-900">SALAIRE FINAL</span>
                    </div>
                    <span className="text-2xl font-bold" style={{ color: '#f7a800' }}>
                      {formatCurrency(record.finalSalary)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le calcul</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce calcul de l'historique ? Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (idToDelete) {
                  deleteCalculation(idToDelete);
                }
                setDeleteConfirmOpen(false);
                setIdToDelete(null);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
