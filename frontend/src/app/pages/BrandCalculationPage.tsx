import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useConstraints } from '../context/ConstraintsContext';

type Employee = {
  id: string;
  name: string;
  role: string;
  baseSalary: number;
  zone: string;
  brand: string;
};

type CalculationDetail = {
  name: string;
  amount: number;
  type: 'commission' | 'bonus' | 'penalty';
};

type EmployeeCalculationResult = {
  employee: Employee;
  baseSalary: number;
  commissions: number;
  bonuses: number;
  penalties: number;
  finalSalary: number;
  details: CalculationDetail[];
};

const employees: Employee[] = [
  { id: '1', name: 'Sophie Martin', role: 'Commercial Senior', baseSalary: 2500, zone: 'Nord', brand: 'Coca Cola' },
  { id: '2', name: 'Pierre Dubois', role: 'Commercial', baseSalary: 2200, zone: 'Sud', brand: 'Ferrero Rocher' },
  { id: '3', name: 'Marie Lefebvre', role: 'Commercial Senior', baseSalary: 2600, zone: 'Est', brand: 'Magnum' },
  { id: '4', name: 'Jean Rousseau', role: 'Manager Commercial', baseSalary: 3000, zone: 'Ouest', brand: 'Coca Cola' },
  { id: '5', name: 'Lucie Bernard', role: 'Commercial', baseSalary: 2100, zone: 'Nord', brand: 'Magnum' },
  { id: '6', name: 'Antoine Petit', role: 'Commercial', baseSalary: 2300, zone: 'Sud', brand: 'Ferrero Rocher' },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

export default function BrandCalculationPage() {
  const { brand = '' } = useParams();
  const navigate = useNavigate();
  const { constraints } = useConstraints();
  const decodedBrand = decodeURIComponent(brand);

  const brandEmployees = useMemo(
    () => employees.filter(e => e.brand.toLowerCase() === decodedBrand.toLowerCase()),
    [decodedBrand]
  );

  const [selectedConstraints, setSelectedConstraints] = useState<string[]>([]);
  const [volumeLivre, setVolumeLivre] = useState<number>(0);
  const [deliveries, setDeliveries] = useState<number>(0);
  const [returnRate, setReturnRate] = useState<number>(0);
  const [triageRate, setTriageRate] = useState<number>(0);
  const [commissionType, setCommissionType] = useState<'quantitative' | 'retour' | 'triage' | 'all'>('all');
  const [results, setResults] = useState<EmployeeCalculationResult[]>([]);

  const filteredConstraints = constraints.filter(c => {
    if (!c.active) return false;
    if (commissionType === 'all') {
      return true; // Show all active constraints
    } else if (commissionType === 'quantitative') {
      return c.type === 'commission_quantitative';
    } else if (commissionType === 'retour') {
      return c.type === 'commission_retour';
    } else {
      return c.type === 'commission_triage';
    }
  });

  const handleConstraintToggle = (id: string) => {
    setSelectedConstraints(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const calculateResultForEmployee = (employee: Employee): EmployeeCalculationResult => {
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
          ? (volumeLivre * constraint.value) / 100
          : constraint.value;
        commissions += amount;
        details.push({ name: constraint.name, amount, type: 'commission' });
      } else if (constraint.type === 'commission_retour') {
        // Utiliser le taux de retour directement
        if (returnRate < 1) {
          amount = 250; // DH
        } else if (returnRate >= 1 && returnRate <= 2) {
          amount = 150; // DH
        } else {
          amount = 0; // Pas de commission si taux > 2%
        }
        
        commissions += amount;
        details.push({ name: constraint.name, amount, type: 'commission' });
      } else if (constraint.type === 'commission_triage') {
        // Commission triage : taux > 70% = 200 DH
        if (triageRate > 70) {
          amount = 200; // DH
        } else {
          amount = 0; // Pas de commission si taux <= 70%
        }
        
        commissions += amount;
        details.push({ name: constraint.name, amount, type: 'commission' });
      }
    });

    return {
      employee,
      baseSalary: employee.baseSalary,
      commissions,
      bonuses,
      penalties,
      finalSalary: employee.baseSalary + commissions + bonuses - penalties,
      details,
    };
  };

  const handleCalculateAll = () => {
    const brandResults = brandEmployees.map(calculateResultForEmployee);
    setResults(brandResults);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Carte {decodedBrand}</h1>
          <p className="text-gray-600 mt-1">Calcul des commissions pour tous les personnels affectés à cette carte.</p>
        </div>
        <button
          onClick={() => navigate('/calculation')}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" /> Retour au calcul global
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_1fr] gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Personnel de la carte</h2>
                <p className="text-sm text-gray-500">{brandEmployees.length} employé{brandEmployees.length > 1 ? 's' : ''} trouvés</p>
              </div>
              <button
                onClick={handleCalculateAll}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
              >
                Calculer les commissions
              </button>
            </div>

            {brandEmployees.length === 0 ? (
              <p className="mt-6 text-sm text-gray-500">Aucun employé n'est affecté à cette carte.</p>
            ) : (
              <div className="mt-6 grid gap-3">
                {brandEmployees.map(employee => (
                  <div key={employee.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-semibold text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-500">{employee.role}</div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(employee.baseSalary)}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                      <span className="rounded-full bg-white px-3 py-1 shadow-sm">Zone {employee.zone}</span>
                      <span className="rounded-full bg-white px-3 py-1 shadow-sm">{employee.brand}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Commissions Applicables
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({filteredConstraints.length} active{filteredConstraints.length > 1 ? 's' : ''})
              </span>
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrer par Type de Commission
              </label>
              <select
                value={commissionType}
                onChange={(e) => setCommissionType(e.target.value as 'quantitative' | 'retour' | 'triage' | 'all')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              >
                <option value="all">Toutes les commissions</option>
                <option value="quantitative">Commission Quantitative</option>
                <option value="retour">Commission Retour</option>
                <option value="triage">Commission Triage</option>
              </select>
            </div>
            <div className="space-y-3">
              {filteredConstraints.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">
                  Aucune commission {commissionType === 'quantitative' ? 'quantitative' : commissionType === 'retour' ? 'retour' : commissionType === 'triage' ? 'triage' : ''} active. Retournez à la page Contraintes pour en créer.
                </p>
              ) : (
                filteredConstraints.map(constraint => (
                  <label key={constraint.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedConstraints.includes(constraint.id)}
                      onChange={() => handleConstraintToggle(constraint.id)}
                      className="h-4 w-4 rounded border-gray-300 focus:ring-orange-500"
                      style={{ accentColor: '#f7a800' }}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{constraint.name}</div>
                      <div className="text-xs text-gray-500">
                        {constraint.valueType === 'percentage' ? `${constraint.value}%` : `${constraint.value}MAD`} • {constraint.condition}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Données d'entrée</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Volume livré</label>
                <input
                  type="number"
                  value={volumeLivre}
                  onChange={(e) => setVolumeLivre(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-orange-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Taux de retour (%)</label>
                <input
                  type="number"
                  value={returnRate}
                  onChange={(e) => setReturnRate(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-orange-500"
                  placeholder="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Taux de triage (%)</label>
                <input
                  type="number"
                  value={triageRate}
                  onChange={(e) => setTriageRate(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-orange-500"
                  placeholder="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Résumé des résultats</h3>
            {results.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-gray-500">
                Cliquez sur « Calculer les commissions » pour afficher les résultats de la carte.
              </div>
            ) : (
              <div className="space-y-4">
                {results.map(result => (
                  <div key={result.employee.id} className="rounded-2xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-semibold text-gray-900">{result.employee.name}</div>
                        <div className="text-sm text-gray-500">{result.employee.role}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Salaire final</div>
                        <div className="text-lg font-bold text-orange-600">{formatCurrency(result.finalSalary)}</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-gray-700">
                        <div className="font-medium">
                          Commission {commissionType === 'quantitative' ? 'Quantitative' : 'Retour'}
                        </div>
                        <div className="mt-1 text-lg font-bold text-orange-600">{formatCurrency(result.commissions)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
