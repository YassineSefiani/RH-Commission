import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, User, Calendar, History, ArrowRight } from 'lucide-react';
import { useHistory } from '../context/HistoryContext';
import { useConstraints } from '../context/ConstraintsContext';

export default function ConstraintsHistoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  // Utilisation de la nouvelle propriété constraintHistory du contexte
  const { constraintHistory } = useHistory();
  const { constraints } = useConstraints();

  // On récupère la contrainte pour le titre
  const constraint = constraints.find(c => c.id === id);
  
  // On filtre l'historique pour cet ID spécifique et on trie du plus récent au plus ancien
  const filteredHistory = constraintHistory
    .filter(h => h.constraintId === id)
    .sort((a, b) => new Date(b.modificationDate).getTime() - new Date(a.modificationDate).getTime());

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 hover:bg-gray-100 rounded-full transition"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historique des modifications</h1>
          <p className="text-gray-600">
            Règle : <span className="font-semibold text-orange-600">{constraint?.name || `ID: ${id}`}</span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun historique disponible pour cette règle.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredHistory.map((entry, index) => (
              <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${entry.changeType === 'CREATE' ? 'bg-green-100' : 'bg-blue-100'}`}>
                      <History className={`w-5 h-5 ${entry.changeType === 'CREATE' ? 'text-green-600' : 'text-blue-600'}`} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">
                        {entry.changeType === 'CREATE' ? 'Création de la règle' : 'Mise à jour de la règle'}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" /> {entry.modifiedBy}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {new Date(entry.modificationDate).toLocaleString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-lg">
                    {entry.oldValue && (
                      <>
                        <span className="text-sm font-medium text-gray-500 line-through">{entry.oldValue}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </>
                    )}
                    <span className="text-sm font-bold text-gray-900">{entry.newValue}</span>
                  </div>
                </div>
                
                {entry.changeType === 'UPDATE' && entry.oldValue !== entry.newValue && (
                  <div className="mt-4 ml-14 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-xs text-blue-700">
                      Changement de valeur détecté : La commission est passée de <strong>{entry.oldValue}</strong> à <strong>{entry.newValue}</strong>.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}