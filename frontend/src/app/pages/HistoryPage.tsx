import { useState } from 'react';
import { Search, Trash2, Calendar, User, DollarSign, Download, FileDown } from 'lucide-react';
import { useHistory } from '../context/HistoryContext';
import { exportHistoryPDF, exportSingleRecordPDF } from '../utils/pdfExport';

export default function HistoryPage() {
  const { history, deleteCalculation, clearHistory } = useHistory();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const filteredHistory = history.filter(record => {
    const date = new Date(record.date);
    const matchesSearch = record.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMonth = !selectedMonth || date.toLocaleDateString('fr-FR', { month: 'long' }) === selectedMonth.toLowerCase();
    const matchesYear = !selectedYear || date.getFullYear().toString() === selectedYear;
    return matchesSearch && matchesMonth && matchesYear;
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(value);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const handleExportAll = () => {
    if (filteredHistory.length === 0) return;
    const suffix = searchTerm || selectedMonth || selectedYear ? 'filtre' : 'complet';
    exportHistoryPDF(filteredHistory, `historique-commissions-${suffix}.pdf`);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historique des Calculs</h1>
          <p className="text-gray-600 mt-1">
            {history.length} calcul{history.length > 1 ? 's' : ''} enregistré{history.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex gap-2">
          {/* Export tout (filtré) */}
          <button
            onClick={handleExportAll}
            disabled={filteredHistory.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Exporter PDF
            {filteredHistory.length > 0 && (
              <span className="bg-orange-400 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {filteredHistory.length}
              </span>
            )}
          </button>

          {/* Vider l'historique */}
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 font-semibold rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Vider
            </button>
          )}
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
            {['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
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

        {/* Indicateur filtre actif */}
        {(searchTerm || selectedMonth || selectedYear) && (
          <p className="text-xs text-orange-600 mt-2 font-medium">
            {filteredHistory.length} résultat(s) — l'export PDF reprendra uniquement cette sélection
          </p>
        )}
      </div>

      {/* History Cards */}
      {filteredHistory.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">
            {history.length === 0
              ? "Aucun calcul enregistré. Effectuez un calcul dans la page Calcul pour voir l'historique."
              : "Aucun résultat trouvé pour ces filtres."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredHistory.map((record) => (
            <div key={record.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
              <div className="p-6">

                {/* En-tête card */}
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

                  {/* Actions */}
                  <div className="flex items-center gap-1 ml-4">
                    <button
                      onClick={() => exportSingleRecordPDF(record)}
                      title="Exporter en PDF"
                      className="p-2 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition"
                    >
                      <FileDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Supprimer ce calcul de l'historique ?")) {
                          deleteCalculation(record.id);
                        }
                      }}
                      title="Supprimer"
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Stats */}
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
                  <div className="p-3 rounded-lg bg-orange-50">
                    <p className="text-xs text-orange-600 mb-1">Salaire de base</p>
                    <p className="font-bold text-orange-700">{formatCurrency(record.baseSalary)}</p>
                  </div>
                </div>

                {/* Détail commissions */}
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

                {/* Contraintes */}
                {record.constraintsApplied && record.constraintsApplied.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-600 mb-2">Contraintes appliquées :</p>
                    <div className="flex flex-wrap gap-2">
                      {record.constraintsApplied.map((c, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{c}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Salaire final */}
                <div className="pt-4 border-t-2 border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-orange-500" />
                      <span className="text-lg font-bold text-gray-900">SALAIRE FINAL</span>
                    </div>
                    <span className="text-2xl font-bold text-orange-500">
                      {formatCurrency(record.finalSalary)}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
