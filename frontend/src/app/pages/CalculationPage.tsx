import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { useConstraints } from '../context/ConstraintsContext';
import { useHistory } from '../context/HistoryContext';

interface Employee {
  id: string;
  name: string;
  role: string;
  baseSalary: number;
  zone: string;
}

export default function CalculationPage() {
  const { constraints } = useConstraints();
  const { addCalculation } = useHistory();

  const [employees] = useState<Employee[]>([
    { id: '1', name: 'Sophie Martin', role: 'Commercial Senior', baseSalary: 2500, zone: 'Nord' },
    { id: '2', name: 'Pierre Dubois', role: 'Commercial', baseSalary: 2200, zone: 'Sud' },
    { id: '3', name: 'Marie Lefebvre', role: 'Commercial Senior', baseSalary: 2600, zone: 'Est' },
    { id: '4', name: 'Jean Rousseau', role: 'Manager Commercial', baseSalary: 3000, zone: 'Ouest' },
  ]);

  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedConstraints, setSelectedConstraints] = useState<string[]>([]);
  const [totalSales, setTotalSales] = useState<number>(0);
  const [deliveries, setDeliveries] = useState<number>(0);
  const [returns, setReturns] = useState<number>(0);
  const [result, setResult] = useState<any>(null);

  const handleConstraintToggle = (id: string) => {
    setSelectedConstraints(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSimulate = () => {
    const employee = employees.find(e => e.id === selectedEmployee);
    if (!employee) return;

    let baseSalary = employee.baseSalary;
    let commissions = 0;
    let bonuses = 0;
    let penalties = 0;

    const details: any[] = [];

    selectedConstraints.forEach(constraintId => {
      const constraint = constraints.find(c => c.id === constraintId);
      if (!constraint || !constraint.active) return;

      let amount = 0;
      
      if (constraint.type === 'commission') {
        if (constraint.valueType === 'percentage') {
          amount = (totalSales * constraint.value) / 100;
        } else {
          amount = constraint.value;
        }
        commissions += amount;
        details.push({ name: constraint.name, amount, type: 'commission' });
      } 
      else if (constraint.type === 'performance_bonus' || constraint.type === 'delivery_bonus') {
        if (constraint.valueType === 'percentage') {
          const base = constraint.type === 'delivery_bonus' ? deliveries * 100 : totalSales;
          amount = (base * constraint.value) / 100;
        } else {
          amount = constraint.value;
        }
        bonuses += amount;
        details.push({ name: constraint.name, amount, type: 'bonus' });
      }
      else if (constraint.type === 'penalty') {
        if (constraint.valueType === 'percentage') {
          amount = (returns * constraint.value);
        } else {
          amount = constraint.value * returns;
        }
        penalties += amount;
        details.push({ name: constraint.name, amount, type: 'penalty' });
      }
    });

    const finalSalary = baseSalary + commissions + bonuses - penalties;

    const calculationResult = {
      employee,
      baseSalary,
      commissions,
      bonuses,
      penalties,
      finalSalary,
      details,
    };

    setResult(calculationResult);

    // Enregistrer dans l'historique
    addCalculation({
      employeeName: employee.name,
      employeeRole: employee.role,
      baseSalary,
      totalSales,
      deliveries,
      returns,
      commissions,
      bonuses,
      penalties,
      finalSalary,
      constraintsApplied: selectedConstraints.map(id => {
        const c = constraints.find(con => con.id === id);
        return c ? c.name : '';
      }).filter(Boolean),
      details,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const selectedEmployeeData = employees.find(e => e.id === selectedEmployee);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calcul des Salaires et Commissions</h1>
        <p className="text-gray-600 mt-1">Simuler le calcul du salaire d'un employé</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Section */}
        <div className="space-y-6">
          {/* Employee Selection */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Sélection de l'employé</h3>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            >
              <option value="">-- Sélectionner un employé --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} - {emp.role}
                </option>
              ))}
            </select>

            {selectedEmployeeData && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Rôle:</span>
                  <span className="text-sm font-semibold text-gray-900">{selectedEmployeeData.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Salaire de base:</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(selectedEmployeeData.baseSalary)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Zone:</span>
                  <span className="text-sm font-semibold text-gray-900">{selectedEmployeeData.zone}</span>
                </div>
              </div>
            )}
          </div>

          {/* Constraints Selection */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Contraintes applicables
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({constraints.filter(c => c.active).length} active{constraints.filter(c => c.active).length > 1 ? 's' : ''})
              </span>
            </h3>
            <div className="space-y-3">
              {constraints.filter(c => c.active).length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">
                  Aucune contrainte active. Créez des contraintes depuis la page Contraintes.
                </p>
              ) : (
                constraints.filter(c => c.active).map(constraint => (
                  <label key={constraint.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedConstraints.includes(constraint.id)}
                      onChange={() => handleConstraintToggle(constraint.id)}
                      className="w-4 h-4 rounded border-gray-300 focus:ring-orange-500"
                      style={{ accentColor: '#f7a800' }}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{constraint.name}</div>
                      <div className="text-xs text-gray-500">
                        {constraint.valueType === 'percentage' ? `${constraint.value}%` : `${constraint.value}€`}
                        {' - '}
                        {constraint.condition}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Inputs */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Données d'entrée</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total des ventes (€)
                </label>
                <input
                  type="number"
                  value={totalSales}
                  onChange={(e) => setTotalSales(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de livraisons
                </label>
                <input
                  type="number"
                  value={deliveries}
                  onChange={(e) => setDeliveries(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de retours
                </label>
                <input
                  type="number"
                  value={returns}
                  onChange={(e) => setReturns(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Simulate Button */}
          <button
            onClick={handleSimulate}
            disabled={!selectedEmployee}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#f7a800' }}
          >
            <Calculator className="w-5 h-5" />
            Simuler
          </button>
        </div>

        {/* Result Section */}
        <div>
          {result ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200" style={{ backgroundColor: '#f7a80010' }}>
                <h3 className="text-lg font-bold text-gray-900">Résultat du Calcul</h3>
                <p className="text-sm text-gray-600 mt-1">{result.employee.name}</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Detail Breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-gray-700">Salaire de base</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(result.baseSalary)}</span>
                  </div>

                  {result.details.map((detail: any, index: number) => (
                    <div key={index} className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <div>
                        <div className="text-gray-700">{detail.name}</div>
                        <span className={`text-xs ${
                          detail.type === 'commission' ? 'text-orange-600' :
                          detail.type === 'bonus' ? 'text-green-600' :
                          'text-red-600'
                        }`}>
                          {detail.type === 'commission' ? 'Commission' :
                           detail.type === 'bonus' ? 'Bonus' : 'Pénalité'}
                        </span>
                      </div>
                      <span className={`font-semibold ${
                        detail.type === 'penalty' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {detail.type === 'penalty' ? '-' : '+'} {formatCurrency(detail.amount)}
                      </span>
                    </div>
                  ))}

                  {result.commissions > 0 && (
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="font-medium text-gray-700">Total Commissions</span>
                      <span className="font-semibold text-green-600">+ {formatCurrency(result.commissions)}</span>
                    </div>
                  )}

                  {result.bonuses > 0 && (
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="font-medium text-gray-700">Total Bonus</span>
                      <span className="font-semibold text-green-600">+ {formatCurrency(result.bonuses)}</span>
                    </div>
                  )}

                  {result.penalties > 0 && (
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="font-medium text-gray-700">Total Pénalités</span>
                      <span className="font-semibold text-red-600">- {formatCurrency(result.penalties)}</span>
                    </div>
                  )}
                </div>

                {/* Final Salary */}
                <div className="p-6 rounded-xl" style={{ backgroundColor: '#f7a80010' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">SALAIRE FINAL</span>
                    <span className="text-3xl font-bold" style={{ color: '#f7a800' }}>
                      {formatCurrency(result.finalSalary)}
                    </span>
                  </div>
                </div>

                {/* Summary */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Récapitulatif:</strong> Le salaire final de {result.employee.name} est calculé à partir 
                    du salaire de base ({formatCurrency(result.baseSalary)}) 
                    {result.commissions > 0 && ` avec des commissions de ${formatCurrency(result.commissions)}`}
                    {result.bonuses > 0 && ` et des bonus de ${formatCurrency(result.bonuses)}`}
                    {result.penalties > 0 && `, moins des pénalités de ${formatCurrency(result.penalties)}`}.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <Calculator className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Sélectionnez un employé et cliquez sur "Simuler" pour voir le résultat</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}