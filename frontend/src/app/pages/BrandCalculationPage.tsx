import { useState, useEffect } from 'react';
import { ArrowLeft, Calculator, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useConstraints } from '../context/ConstraintsContext';
import { useHistory } from '../context/HistoryContext'; // Import de l'historique

interface Employee {
  id: string;
  nom: string;
  prenom: string;
  role: string;
  carte: string;
  natureContrat: string;
  actif: boolean;
}

type CalculationDetail = {
  name: string;
  amount: number;
  type: 'commission' | 'bonus' | 'penalty';
};

type EmployeeCalculationResult = {
  employee: Employee;
  commissions: number;
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
  const [selectedConstraints, setSelectedConstraints] = useState<string[]>([]);
  const [volumeLivre, setVolumeLivre] = useState<number>(0);
  const [returnRate, setReturnRate] = useState<number>(0);
  const [triageRate, setTriageRate] = useState<number>(0);
  const [commissionType, setCommissionType] = useState<'quantitative' | 'retour' | 'triage' | 'all'>('all');
  const [results, setResults] = useState<EmployeeCalculationResult[]>([]);

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
      } finally {
        setLoading(false);
      }
    };
    fetchEmployeesByBrand();
  }, [decodedBrand]);

  const filteredConstraints = constraints.filter(c => {
    if (!c.active) return false;
    if (commissionType === 'all') return true;
    return c.type === `commission_${commissionType}`;
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(value);

  const handleConstraintToggle = (id: string) => {
    setSelectedConstraints(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const calculateResultForEmployee = (employee: Employee): EmployeeCalculationResult => {
    let commissions = 0;
    const details: CalculationDetail[] = [];

    selectedConstraints.forEach(constraintId => {
      const constraint = constraints.find(c => c.id === constraintId);
      if (!constraint || !constraint.active) return;

      let amount = 0;
      if (constraint.type === 'commission_quantitative') {
        amount = constraint.valueType === 'percentage'
          ? (volumeLivre * constraint.value) / 100
          : constraint.value;
      } else if (constraint.type === 'commission_retour') {
        if (returnRate < 1) amount = 250;
        else if (returnRate >= 1 && returnRate <= 2) amount = 150;
        else amount = 0;
      } else if (constraint.type === 'commission_triage') {
        amount = triageRate > 70 ? 200 : 0;
      }

      if (amount > 0) {
        commissions += amount;
        details.push({ name: constraint.name, amount, type: 'commission' });
      }
    });

    return { employee, commissions, details };
  };

  const handleCalculateAll = () => {
    const brandResults = brandEmployees.map(employee => {
      const result = calculateResultForEmployee(employee);

      // --- AJOUT À L'HISTORIQUE ---
      addCalculation({
        employeeName: `${employee.prenom} ${employee.nom}`,
        employeeRole: employee.role,
        baseSalary: 0,
        totalSales: volumeLivre,
        deliveries: 0, // Optionnel selon vos besoins
        returns: returnRate,
        commissions: result.commissions,
        bonuses: 0,
        penalties: 0,
        finalSalary: result.commissions,
        constraintsApplied: selectedConstraints
          .map(id => constraints.find(c => c.id === id)?.name)
          .filter(Boolean) as string[],
        details: result.details,
      });
      // ----------------------------

      return result;
    });

    setResults(brandResults);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Membres de l'équipe</h2>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full uppercase">
                {brandEmployees.length} Actif(s)
              </span>
            </div>

            {loading ? (
              <div className="py-10 text-center text-gray-500">Chargement...</div>
            ) : (
              <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2">
                {brandEmployees.map(emp => (
                  <div key={emp.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <div className="font-bold text-gray-900">{emp.prenom} {emp.nom}</div>
                      <div className="text-xs text-gray-500 uppercase font-semibold">{emp.role} • {emp.natureContrat}</div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs">
                      {emp.prenom[0]}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            <h3 className="text-lg font-bold text-gray-900">Paramètres de calcul</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Volume livré</label>
                <input type="number" value={volumeLivre} onChange={e => setVolumeLivre(Number(e.target.value))} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Retour (%)</label>
                <input type="number" value={returnRate} onChange={e => setReturnRate(Number(e.target.value))} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Triage (%)</label>
                <input type="number" value={triageRate} onChange={e => setTriageRate(Number(e.target.value))} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-gray-900 uppercase tracking-wider">Commissions</label>
                <select value={commissionType} onChange={(e) => setCommissionType(e.target.value as any)} className="text-sm border-none bg-gray-100 rounded-lg px-3 py-1 outline-none">
                  <option value="all">Tout</option>
                  <option value="quantitative">Quantitative</option>
                  <option value="retour">Retour</option>
                  <option value="triage">Triage</option>
                </select>
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2">
                {filteredConstraints.map(c => (
                  <label key={c.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${selectedConstraints.includes(c.id) ? 'bg-orange-50 border-orange-200' : 'hover:bg-gray-50'}`}>
                    <input type="checkbox" checked={selectedConstraints.includes(c.id)} onChange={() => handleConstraintToggle(c.id)} className="w-4 h-4 accent-orange-500" />
                    <div className="flex-1">
                      <div className="text-sm font-bold text-gray-900">{c.name}</div>
                      <div className="text-xs text-gray-500">{c.valueType === 'percentage' ? `${c.value}%` : `${c.value} MAD`}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleCalculateAll}
              disabled={brandEmployees.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50 transition-all shadow-lg"
            >
              <Calculator className="w-5 h-5" />
              Lancer le calcul groupé et sauvegarder
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-hidden">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Résultats</h3>
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
              <Calculator className="w-12 h-12 mb-4 opacity-20" />
              <p>Aucun calcul généré.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
              {results.map(res => (
                <div key={res.employee.id} className="p-4 border rounded-2xl bg-gray-50 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-gray-900">{res.employee.prenom} {res.employee.nom}</div>
                      <div className="text-xs text-gray-500">{res.employee.role}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-orange-600">{formatCurrency(res.commissions)}</div>
                      <div className="text-[10px] uppercase font-bold text-gray-400">Total</div>
                    </div>
                  </div>
                  {res.details.length > 0 && (
                    <div className="pt-3 border-t border-dashed border-gray-200 space-y-1">
                      {res.details.map((d, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-gray-600">{d.name}</span>
                          <span className="font-bold text-green-600">+{formatCurrency(d.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}