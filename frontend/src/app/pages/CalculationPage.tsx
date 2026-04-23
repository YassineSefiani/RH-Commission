import { useRef, useState, type ChangeEvent } from 'react';
import { Calculator } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useConstraints } from '../context/ConstraintsContext';
import { useHistory } from '../context/HistoryContext';
import { usePersonnel } from '../context/PersonnelContext';

interface Employee {
  id: string;
  name: string;
  prenom: string;
  role: string;
  carte: string;
  natureContrat: string;
}

const brandCards = [
  { id: 'coca-cola', name: 'Coca Cola', accent: '#ef4444', bg: 'bg-red-50' },
  { id: 'ferrero-rocher', name: 'Ferrero Rocher', accent: '#d97706', bg: 'bg-amber-50' },
  { id: 'magnum', name: 'Magnum', accent: '#0f172a', bg: 'bg-slate-50' },
  { id: 'red-bull', name: 'Red Bull', accent: '#0ea5e9', bg: 'bg-sky-50' },
];

export default function CalculationPage() {
  const { constraints } = useConstraints();
  const { addCalculation } = useHistory();
  const { personnel } = usePersonnel();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importedFileName, setImportedFileName] = useState<string>('');

  // Convertir le personnel en format Employee (uniquement les actifs)
  const employees: Employee[] = personnel
    .filter(p => p.actif)
    .map(p => ({
      id: p.id,
      name: p.nom,
      prenom: p.prenom,
      role: p.role || '',
      carte: p.carte || '',
      natureContrat: p.natureContrat || 'CDI',
    }));

  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedConstraints, setSelectedConstraints] = useState<string[]>([]);
  const [volumeLivre, setVolumeLivre] = useState<number>(0);
  const [deliveries, setDeliveries] = useState<number>(0);
  const [returnRate, setReturnRate] = useState<number>(0);
  const [triageRate, setTriageRate] = useState<number>(0);
  const [commissionType, setCommissionType] = useState<'quantitative' | 'retour' | 'triage' | 'all'>('all');
  const [result, setResult] = useState<any>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportedFileName(file.name);
    }
  };

  const handleBrandClick = (brand: string) => {
    navigate(`/calculation/brand/${encodeURIComponent(brand)}`);
  };

  const handleConstraintToggle = (id: string) => {
    setSelectedConstraints(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const autoSelectConstraints = () => {
    const employee = employees.find(e => e.id === selectedEmployee);
    if (!employee) return;

    const selectedIds: string[] = [];
    const searchKey = `${employee.role} ${employee.natureContrat}`;

    console.log('=== Auto Select Constraints ===');
    console.log('Employee:', employee);
    console.log('Search Key:', searchKey);
    console.log('All Constraints:', constraints);

    // Sélectionner les contraintes appropriées
    constraints.forEach(constraint => {
      if (!constraint.active) return;

      console.log(`Checking constraint: ${constraint.name}, type: ${constraint.type}`);

      if (constraint.type === 'commission_quantitative') {
        // Chercher "- Rôle Contrat" pour éviter les faux positifs
        // Ex: "- Livreur CDI" ne doit pas matcher "- Aide Livreur CDI"
        const pattern = `- ${employee.role} ${employee.natureContrat}`;
        const regex = new RegExp(pattern, 'i');
        
        console.log(`  Pattern: "${pattern}", constraint: "${constraint.name}"`);
        
        if (regex.test(constraint.name)) {
          console.log(`  ✓ MATCH!`);
          selectedIds.push(constraint.id);
        } else {
          console.log(`  ✗ No match`);
        }
      } else if (constraint.type === 'commission_retour') {
        // Vérifier si la contrainte correspond à la carte
        if (constraint.name.includes(employee.carte)) {
          console.log(`  ✓ MATCH (carte)!`);
          selectedIds.push(constraint.id);
        }
      } else if (constraint.type === 'commission_triage') {
        // Vérifier si la contrainte correspond à la carte
        if (constraint.name.includes(employee.carte)) {
          console.log(`  ✓ MATCH (carte)!`);
          selectedIds.push(constraint.id);
        }
      }
    });

    console.log('Selected IDs:', selectedIds);
    setSelectedConstraints(selectedIds);
  };

  const handleAutoCalculate = () => {
    autoSelectConstraints();
    // Utiliser un setTimeout pour laisser le state se mettre à jour
    setTimeout(handleSimulate, 0);
  };

  const handleSimulate = () => {
    const employee = employees.find(e => e.id === selectedEmployee);
    if (!employee) return;

    let commissions = 0;
    const details: any[] = [];

    selectedConstraints.forEach(constraintId => {
      const constraint = constraints.find(c => c.id === constraintId);
      if (!constraint || !constraint.active) return;

      let amount = 0;
      
      if (constraint.type === 'commission_quantitative') {
        if (constraint.valueType === 'percentage') {
          amount = (volumeLivre * constraint.value) / 100;
        } else {
          amount = constraint.value;
        }
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

    const calculationResult = {
      employee,
      commissions,
      details,
    };

    setResult(calculationResult);

    // Enregistrer dans l'historique
    addCalculation({
      employeeName: `${employee.prenom} ${employee.name}`,
      employeeRole: employee.role,
      baseSalary: 0,
      totalSales: volumeLivre,
      deliveries,
      returns: returnRate,
      commissions,
      bonuses: 0,
      penalties: 0,
      finalSalary: commissions,
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
      currency: 'MAD',
    }).format(value);
  };

  const selectedEmployeeData = employees.find(e => e.id === selectedEmployee);

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

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calcul des Commissions</h1>
          <p className="text-gray-600 mt-1">Calculer les commissions d'un employé ou basculer vers une carte de marque.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleImportClick}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Importer un fichier Excel
          </button>
          {importedFileName && (
            <span className="text-sm text-gray-600">Fichier sélectionné : {importedFileName}</span>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFileSelected}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {brandCards.map(card => (
          <button
            key={card.id}
            type="button"
            onClick={() => handleBrandClick(card.name)}
            className={`rounded-3xl border border-gray-200 ${card.bg} p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg`}
          >
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Carte</div>
            <div className="text-lg font-semibold text-gray-900">{card.name}</div>
            <div className="mt-4 text-sm text-gray-600">Tous les personnels affectés à cette carte seront disponibles sur la page dédiée.</div>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium" style={{ color: card.accent }}>
              Ouvrir la carte
            </div>
          </button>
        ))}
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
                  {emp.prenom} {emp.name} - {emp.role} ({emp.natureContrat})
                </option>
              ))}
            </select>

            {selectedEmployeeData && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Rôle:</span>
                    <span className="text-sm font-semibold text-gray-900">{selectedEmployeeData.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Type de Contrat:</span>
                    <span className="text-sm font-semibold text-gray-900">{selectedEmployeeData.natureContrat}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Carte:</span>
                    <span className="text-sm font-semibold text-gray-900">{selectedEmployeeData.carte}</span>
                  </div>
                </div>
                <button
                  onClick={handleAutoCalculate}
                  className="w-full px-4 py-2 text-white rounded-lg hover:opacity-90 transition font-medium"
                  style={{ backgroundColor: '#f7a800' }}
                >
                  Appliquer les règles et calculer
                </button>
              </div>
            )}
          </div>

          {/* Constraints Selection */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
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
                  Aucune commission active pour ce filtre. Créez des commissions depuis la page Contraintes.
                </p>
              ) : (
                filteredConstraints.map(constraint => (
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
                        {constraint.valueType === 'percentage' ? `${constraint.value}%` : `${constraint.value}MAD`}
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
                  Volume livré
                </label>
                <input
                  type="number"
                  value={volumeLivre}
                  onChange={(e) => setVolumeLivre(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taux de retour (%)
                </label>
                <input
                  type="number"
                  value={returnRate}
                  onChange={(e) => setReturnRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  placeholder="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taux de triage (%)
                </label>
                <input
                  type="number"
                  value={triageRate}
                  onChange={(e) => setTriageRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  placeholder="0"
                  step="0.01"
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
                <h3 className="text-lg font-bold text-gray-900">Résultat du Calcul de Commission</h3>
                <p className="text-sm text-gray-600 mt-1">{result.employee.prenom} {result.employee.name}</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Detail Breakdown */}
                <div className="space-y-3">
                  {result.details.map((detail: any, index: number) => (
                    <div key={index} className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <div>
                        <div className="text-gray-700">{detail.name}</div>
                        <span className="text-xs text-orange-600">Commission</span>
                      </div>
                      <span className="font-semibold text-green-600">+ {formatCurrency(detail.amount)}</span>
                    </div>
                  ))}

                  {result.commissions > 0 && (
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="font-medium text-gray-700">Total Commissions</span>
                      <span className="font-semibold text-green-600">{formatCurrency(result.commissions)}</span>
                    </div>
                  )}
                </div>

                {/* Final Commission */}
                <div className="p-6 rounded-xl" style={{ backgroundColor: '#f7a80010' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">COMMISSION TOTALE</span>
                    <span className="text-3xl font-bold" style={{ color: '#f7a800' }}>
                      {formatCurrency(result.commissions)}
                    </span>
                  </div>
                </div>

                {/* Summary */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Récapitulatif:</strong> La commission totale de {result.employee.prenom} {result.employee.name} 
                    ({result.employee.role}) est de <strong>{formatCurrency(result.commissions)}</strong>.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <Calculator className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Sélectionnez un employé et cliquez sur "Simuler" pour calculer sa commission</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}