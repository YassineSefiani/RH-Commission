import { useState, useEffect } from 'react';
import { ArrowLeft, Calculator, Users, X, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useConstraints } from '../context/ConstraintsContext';
import { useHistory } from '../context/HistoryContext';
import { Dialog } from '@headlessui/react';
import { toast } from 'sonner';

interface Employee {
  id: string;
  nom: string;
  prenom: string;
  role: string;
  carte: string;
  natureContrat: string;
  actif: boolean;
  baseSalary?: number;
}

type CalculationDetail = {
  name: string;
  amount: number;
  type: 'commission' | 'bonus' | 'penalty';
};

type EmployeeCalculationResult = {
  employee: Employee;
  commissions: number;
  bonuses: number;
  penalties: number;
  finalSalary: number;
  details: CalculationDetail[];
};

export default function BrandCalculationPage() {
  const { brand = '' } = useParams();
  const navigate = useNavigate();
  const { constraints } = useConstraints();
  const { addCalculation } = useHistory(); // Initialisation de l'historique
  const decodedBrand = decodeURIComponent(brand);

  const [brandEmployees, setBrandEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedConstraints, setSelectedConstraints] = useState<string[]>([]);
  const [volumeLivre, setVolumeLivre] = useState<number>(0);
  const [returnRate, setReturnRate] = useState<number>(0);
  const [triageRate, setTriageRate] = useState<number>(0);
  const [results, setResults] = useState<EmployeeCalculationResult[]>([]);
  const [activeTab, setActiveTab] = useState<'detail' | 'recap'>('detail');

  useEffect(() => {
    const fetchEmployeesByBrand = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8080/api/personnel/carte/${decodedBrand}`);
        if (response.ok) {
          const data = await response.json();
          setBrandEmployees(data.filter((emp: Employee) => emp.actif));
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des employés:", error);
        toast.error("Impossible de charger les employés");
      } finally {
        setLoading(false);
      }
    };
    fetchEmployeesByBrand();
  }, [decodedBrand]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(value);

  const handleConstraintToggle = (id: string) => {
    setSelectedConstraints(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSelectAllConstraints = () => {
    if (selectedConstraints.length === constraints.length) {
      setSelectedConstraints([]);
    } else {
      setSelectedConstraints(constraints.map(c => c.id));
    }
  };

  const handleCalculateAll = async () => {
    setIsCalculating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const brandResults = brandEmployees.map(employee => {
        let commissions = 0;
        let bonuses = 0;
        let penalties = 0;
        const details: CalculationDetail[] = [];

        selectedConstraints.forEach(constraintId => {
          const constraint = constraints.find(c => c.id === constraintId);
          if (!constraint || !constraint.active) return;

          let amount = 0;
          if (constraint.type === 'commission_quantitative') {
            amount = constraint.valueType === 'percentage'
              ? volumeLivre * (constraint.value / 100)
              : constraint.value;
          } else if (constraint.type === 'commission_retour') {
            if (returnRate < 1) amount = 250;
            else if (returnRate >= 1 && returnRate <= 2) amount = 150;
            else amount = 0;
          } else if (constraint.type === 'commission_triage') {
            if (triageRate > 70) amount = 200;
            else amount = 0;
          }

          if (amount > 0) {
            commissions += amount;
            details.push({ name: constraint.name, amount, type: 'commission' });
          }
        });

        const baseSalary = employee.baseSalary || 2500;
        const finalSalary = baseSalary + commissions + bonuses - penalties;

        const result: EmployeeCalculationResult = { 
          employee, commissions, bonuses, penalties, finalSalary, details 
        };

        addCalculation({
          employeeName: `${employee.prenom} ${employee.nom}`,
          employeeRole: employee.role,
          baseSalary,
          totalSales: volumeLivre,
          deliveries: 0,
          returns: returnRate,
          commissions: result.commissions,
          bonuses: result.bonuses,
          penalties: result.penalties,
          finalSalary: result.finalSalary,
          constraintsApplied: selectedConstraints
            .map(id => constraints.find(c => c.id === id)?.name)
            .filter(Boolean) as string[],
          details: JSON.stringify(result.details) as any,
        });

        return result;
      });

      setResults(brandResults);
      toast.success("Calcul groupé sauvegardé avec succès !");
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Erreur de calcul, veuillez réessayer");
    } finally {
      setIsCalculating(false);
    }
  };

  const animationStyles = `
    @keyframes slideUpFade {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-slide-up-fade {
      animation: slideUpFade 0.5s ease-out forwards;
    }
  `;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <style>{animationStyles}</style>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Carte {decodedBrand}</h1>
            <p className="text-gray-600">Gestion et calcul groupé pour le personnel {decodedBrand}.</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/calculation')}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLONNE GAUCHE : Équipe */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Membres de l'équipe</h2>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full uppercase">
                {brandEmployees.length} Actif(s)
              </span>
            </div>

            {loading ? (
              <div className="py-10 text-center text-gray-500">Chargement...</div>
            ) : (
              <div className="grid gap-3 flex-1 overflow-y-auto pr-2 mb-6">
                {brandEmployees.map(emp => (
                  <div key={emp.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-orange-200 transition-colors">
                    <div>
                      <div className="font-bold text-gray-900">{emp.prenom} {emp.nom}</div>
                      <div className="text-xs text-gray-500 uppercase font-semibold mt-1">
                        {emp.role} • {emp.natureContrat}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setIsModalOpen(true)}
              disabled={loading || brandEmployees.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white py-3 px-4 rounded-lg font-bold hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calculator className="w-5 h-5" /> Lancer le calcul groupé
            </button>
          </div>
        </div>

        {/* COLONNE DROITE : Résultats */}
        <div className="lg:col-span-2">
          {results.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 h-full flex flex-col items-center justify-center text-center">
              <Calculator className="w-16 h-16 text-gray-200 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun calcul effectué</h3>
              <p className="text-gray-500 max-w-sm">
                Utilisez le bouton "Lancer le calcul groupé" pour simuler les commissions de tous les membres de la carte {decodedBrand}.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col animate-slide-up-fade">
              <div className="flex items-center justify-between border-b border-gray-200 mb-6">
                <div className="flex gap-6">
                  <button 
                    onClick={() => setActiveTab('detail')} 
                    className={`pb-3 border-b-2 font-medium transition-colors ${activeTab === 'detail' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    Détail par employé
                  </button>
                  <button 
                    onClick={() => setActiveTab('recap')} 
                    className={`pb-3 border-b-2 font-medium transition-colors ${activeTab === 'recap' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    Récapitulatif global
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2">
                {activeTab === 'detail' ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {results.map((res, idx) => (
                      <div key={idx} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="mb-4">
                          <h4 className="font-bold text-gray-900 text-lg">{res.employee.prenom} {res.employee.nom}</h4>
                          <p className="text-xs text-gray-500 mt-1 uppercase font-semibold">{res.employee.role} • {res.employee.natureContrat}</p>
                        </div>
                        <div className="text-3xl font-black text-orange-500 mb-6">
                          {formatCurrency(res.finalSalary)}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-green-50 p-2.5 rounded-lg border border-green-100 text-center">
                            <p className="text-[10px] text-green-600 uppercase font-bold mb-1">Commissions</p>
                            <p className="font-bold text-green-700">{formatCurrency(res.commissions)}</p>
                          </div>
                          <div className="bg-green-50 p-2.5 rounded-lg border border-green-100 text-center">
                            <p className="text-[10px] text-green-600 uppercase font-bold mb-1">Bonus</p>
                            <p className="font-bold text-green-700">{formatCurrency(res.bonuses)}</p>
                          </div>
                          <div className={`p-2.5 rounded-lg border text-center ${res.penalties > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                            <p className={`text-[10px] uppercase font-bold mb-1 ${res.penalties > 0 ? 'text-red-600' : 'text-gray-500'}`}>Pénalités</p>
                            <p className={`font-bold ${res.penalties > 0 ? 'text-red-700' : 'text-gray-700'}`}>{formatCurrency(res.penalties)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                      <thead className="bg-gray-50">
                        <tr className="border-b border-gray-200 text-xs text-gray-600 uppercase tracking-wider">
                          <th className="p-4 font-semibold">Employé</th>
                          <th className="p-4 font-semibold">Sal. Base</th>
                          <th className="p-4 font-semibold">Comm.</th>
                          <th className="p-4 font-semibold">Bonus</th>
                          <th className="p-4 font-semibold">Pénal.</th>
                          <th className="p-4 font-bold text-orange-600">Net</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {results.map((r, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors text-sm">
                            <td className="p-4 font-medium text-gray-900">{r.employee.prenom} {r.employee.nom}</td>
                            <td className="p-4 text-gray-600">{formatCurrency(r.employee.baseSalary || 2500)}</td>
                            <td className="p-4 text-green-600 font-medium">+{formatCurrency(r.commissions)}</td>
                            <td className="p-4 text-green-600 font-medium">+{formatCurrency(r.bonuses)}</td>
                            <td className="p-4 text-red-500 font-medium">-{formatCurrency(r.penalties)}</td>
                            <td className="p-4 font-bold text-orange-600">{formatCurrency(r.finalSalary)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-orange-50 font-bold border-t-2 border-orange-200">
                        <tr>
                          <td className="p-4 text-orange-900">TOTAL ÉQUIPE</td>
                          <td className="p-4">{formatCurrency(results.reduce((acc, r) => acc + (r.employee.baseSalary || 2500), 0))}</td>
                          <td className="p-4 text-green-700">+{formatCurrency(results.reduce((acc, r) => acc + r.commissions, 0))}</td>
                          <td className="p-4 text-green-700">+{formatCurrency(results.reduce((acc, r) => acc + r.bonuses, 0))}</td>
                          <td className="p-4 text-red-600">-{formatCurrency(results.reduce((acc, r) => acc + r.penalties, 0))}</td>
                          <td className="p-4 text-orange-700 text-lg">{formatCurrency(results.reduce((acc, r) => acc + r.finalSalary, 0))}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="fixed z-10 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
<div className="fixed inset-0 bg-black/40" aria-hidden="true" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 md:p-8 overflow-hidden">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <Dialog.Title className="text-xl font-bold text-gray-900 mb-2">
              Sélectionner les conditions de calcul
            </Dialog.Title>
            <p className="text-sm text-gray-600 mb-6">
              Ces conditions et paramètres seront appliqués à l'ensemble des {brandEmployees.length} employés de la carte {decodedBrand}.
            </p>

            {/* SECTION A : Paramètres de calcul */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Paramètres de calcul</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Volume livré</label>
                  <input 
                    type="number" 
                    value={volumeLivre} 
                    onChange={(e) => setVolumeLivre(Number(e.target.value) || 0)} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Retour (%)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={returnRate} 
                    onChange={(e) => setReturnRate(Number(e.target.value) || 0)} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Triage (%)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={triageRate} 
                    onChange={(e) => setTriageRate(Number(e.target.value) || 0)} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* SECTION B : Commissions disponibles */}
            <div>
              <div className="flex items-center justify-between mb-4 border-b pb-2">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Commissions disponibles</h3>
                <button 
                  onClick={handleSelectAllConstraints}
                  className="text-sm font-medium text-orange-600 hover:text-orange-700 hover:underline transition-colors"
                >
                  {selectedConstraints.length === constraints.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              </div>
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                {constraints.map(c => (
                  <label 
                    key={c.id} 
                    className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                      selectedConstraints.includes(c.id) 
                        ? 'border-orange-500 bg-[#fff7f0] shadow-sm' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedConstraints.includes(c.id)}
                      onChange={() => handleConstraintToggle(c.id)}
                      className="mt-1 w-4.5 h-4.5 accent-orange-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-bold text-gray-900 leading-none mb-1.5">{c.name}</div>
                      <div className="text-xs text-gray-500 leading-snug">
                        <span className="font-semibold text-gray-700">
                          {c.valueType === 'percentage' ? `${c.value}%` : `${c.value} MAD`}
                        </span> 
                        {' '}• {c.condition}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isCalculating}
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors w-full sm:w-auto"
              >
                Annuler
              </button>
              <button
                onClick={handleCalculateAll}
                disabled={isCalculating}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-all shadow-md w-full sm:w-auto disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isCalculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                {isCalculating ? "Calcul en cours..." : "Confirmer & Calculer"}
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}