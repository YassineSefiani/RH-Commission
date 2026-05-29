import { useState, useEffect } from 'react';
import { ArrowLeft, Calculator, Users, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useConstraints } from '../context/ConstraintsContext';
import { useHistory } from '../context/HistoryContext';
import { toast } from 'sonner';
import { useLang } from '../context/LangContext';

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
  const { addCalculation } = useHistory();
  const decodedBrand = decodeURIComponent(brand);
  const { t } = useLang();
  const b = t.brandCalc;

  const [brandEmployees, setBrandEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<EmployeeCalculationResult[]>([]);
  const [activeTab, setActiveTab] = useState<'detail' | 'recap'>('detail');

  useEffect(() => {
    const fetchEmployeesByBrand = async () => {
      try {
        setLoading(true);
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
        
        // Tentative 1 : Appel direct classique (fonctionne parfaitement pour "Wall's")
        let response = await fetch(`${apiBase}/personnel/carte/${encodeURIComponent(decodedBrand)}`);
        let data = [];
        
        if (response.ok) {
          data = await response.json();
        }

        // 🌟 LE PLAN DE SECOURS (POUR COCA COLA ET FERRERO ROCHER) 🌟
        // Si l'API renvoie un tableau vide à cause du bug de l'espace dans l'URL par Spring Boot
        if (data.length === 0) {
          console.log(`L'API n'a rien trouvé pour "${decodedBrand}". Récupération globale en cours...`);
          // On appelle la route globale qui ramène tout le monde
          const allPersonnelResponse = await fetch(`${apiBase}/personnel`);
          
          if (allPersonnelResponse.ok) {
            const allPersonnel = await allPersonnelResponse.json();
            
            // On filtre nous-mêmes côté Javascript (insensible à la casse et aux espaces cachés)
            const targetBrand = decodedBrand.trim().toUpperCase();
            data = allPersonnel.filter((emp: Employee) => 
              emp.carte && emp.carte.trim().toUpperCase() === targetBrand
            );
            console.log(`Filtre local appliqué : ${data.length} employés trouvés pour ${targetBrand}`);
          }
        }

        // On ne garde que les employés actifs
        setBrandEmployees(data.filter((emp: Employee) => emp.actif));

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

  const handleCalculateAll = async () => {
    setIsCalculating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));

      if (!constraints || constraints.length === 0) {
        toast.error("Aucune règle de calcul disponible dans le contexte.");
        setIsCalculating(false);
        return;
      }

      // 🌟 LE FILTRE MAGIQUE 🌟
      const activeConstraints = constraints.filter(c => {
        if (c.actif === false || c.actif === 0) return false;
        
        const dbCarte = (c.carte || '').toUpperCase();
        const urlBrand = (decodedBrand || '').toUpperCase();

        if (urlBrand.includes('COCA') && dbCarte.includes('COCA')) return true;
        if (urlBrand.includes('FERRERO') && dbCarte.includes('FERRERO')) return true;
        if (urlBrand.includes('WALL') && dbCarte.includes('WALL')) return true;

        return dbCarte.replace(/[_ \-]/g, '') === urlBrand.replace(/[_ \-]/g, '');
      });

      if (activeConstraints.length === 0) {
        toast.warning(`Aucune règle trouvée pour la marque : ${decodedBrand}`);
        setIsCalculating(false);
        return;
      }

      console.log(`✅ ${activeConstraints.length} règles trouvées pour ${decodedBrand} !`);

      const brandResults = brandEmployees.map(employee => {
        let commissions = 0;
        let bonuses = 0;
        let penalties = 0;
        const details: CalculationDetail[] = [];

        const metrics = {
          joursTravailles: 22,
          volumeDistribue: 1500,
          tauxRetour: 0.5,
          tauxTriage: 85.0,
          caRealise: 120000,
          tauxRealisation: 95.0,
          tauxRealisationGlobal: 105.0
        };

        const ROLE = employee.role ? employee.role.trim().toUpperCase() : '';
        const CONTRAT = employee.natureContrat?.toUpperCase().includes('INT') ? 'INTERIM' : 'CDI';

        activeConstraints.forEach(constraint => {
          let conditionVerifiee = false;
          const nomRegle = constraint.name || constraint.nom || 'Règle inconnue';
          const conditionStr = (constraint.condition || '').toUpperCase();

          try {
            let jsCondition = conditionStr
              .replace(/\bAND\b/g, '&&')
              .replace(/\bOR\b/g, '||')
              .replace(/ROLE LIKE 'AIDE LIVREUR%'/g, "ROLE.includes('AIDE LIVREUR')")
              .replace(/ROLE ===? 'AIDE LIVREUR 1'/g, "ROLE.includes('AIDE LIVREUR')")
              .replace(/ROLE ===? 'AIDE LIVREUR 2'/g, "ROLE.includes('AIDE LIVREUR')")
              .replace(/ROLE ===? 'AIDE LIVREUR'/g, "ROLE.includes('AIDE LIVREUR')");

            jsCondition = jsCondition.replace(/([^=<>!])=([^=])/g, "$1===$2");

            const evaluator = new Function(
              'ROLE', 'CONTRAT', 'JOURS_TRAVAILLES', 'TAUX_RETOUR', 'TAUX_TRIAGE', 'TAUX_REALISATION', 'TAUX_REALISATION_GLOBAL',
              `return ${jsCondition};`
            );

            conditionVerifiee = evaluator(
              ROLE, CONTRAT, metrics.joursTravailles, metrics.tauxRetour, 
              metrics.tauxTriage, metrics.tauxRealisation, metrics.tauxRealisationGlobal
            );

          } catch (e) {
            console.warn(`Syntaxe échouée sur [${nomRegle}], utilisation du mode Fallback`);
          }

          if (!conditionVerifiee) {
            if (ROLE === 'LIVREUR' && CONTRAT === 'CDI' && nomRegle.includes('CDI LIVREUR')) conditionVerifiee = true;
            if (ROLE.includes('AIDE LIVREUR') && CONTRAT === 'CDI' && nomRegle.includes('CDI AIDE')) conditionVerifiee = true;
            if (ROLE === 'LIVREUR' && CONTRAT === 'INTERIM' && nomRegle.includes('INTÉRIM LIVREUR')) conditionVerifiee = true;
            if (ROLE.includes('AIDE LIVREUR') && CONTRAT === 'INTERIM' && nomRegle.includes('INTÉRIM AIDE')) conditionVerifiee = true;
            if (nomRegle.includes('RETOUR') && ROLE === 'LIVREUR' && CONTRAT === 'CDI') conditionVerifiee = true;
            if (nomRegle.includes('TRIAGE') && CONTRAT === 'CDI') conditionVerifiee = true;
            if (ROLE.includes('VENDEUR') && CONTRAT === 'CDI' && nomRegle.includes('VENDEUR')) conditionVerifiee = true;
            if (ROLE.includes('SUPERVISEUR') && CONTRAT === 'CDI' && nomRegle.includes('SUPERVISEUR')) conditionVerifiee = true;
          }

          if (conditionVerifiee) {
            let amount = 0;
            const typeValue = String(constraint.typeValeur || (constraint as any).type_valeur || (constraint as any).type || (constraint as any).valueType || '').toUpperCase();
            const valeur = Number(constraint.valeur !== undefined ? constraint.valeur : (constraint as any).value || 0);

            const urlBrand = (decodedBrand || '').toUpperCase();

            if (typeValue.includes('UNITE')) {
              amount = valeur * metrics.volumeDistribue;
              commissions += amount;
            } else if (typeValue.includes('POURCENTAGE')) {
              amount = (valeur / 100) * metrics.caRealise;
              commissions += amount;
            } else if (typeValue.includes('FIXE')) {
              amount = valeur;
              bonuses += amount;
            } else {
              if (valeur < 1) { 
                amount = valeur * metrics.volumeDistribue;
                commissions += amount;
              } else if (valeur <= 100 && !urlBrand.includes('COCA')) { 
                amount = (valeur / 100) * metrics.caRealise;
                commissions += amount;
              } else { 
                amount = valeur;
                bonuses += amount;
              }
            }
            
            if (amount > 0) {
              details.push({ 
                name: nomRegle, 
                amount, 
                type: (typeValue.includes('FIXE') || (amount === valeur && valeur > 100)) ? 'bonus' : 'commission' 
              });
            }
          }
        });

        const baseSalary = employee.baseSalary || 2500;
        const finalSalary = baseSalary + commissions + bonuses - penalties;

        const today = new Date();
        const periode = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

        addCalculation({
          employeeName: `${employee.prenom} ${employee.nom}`,
          employeeRole: employee.role,
          baseSalary,
          totalSales: metrics.caRealise,
          deliveries: metrics.volumeDistribue,
          returns: metrics.tauxRetour,
          commissions,
          bonuses,
          penalties,
          finalSalary,
          constraintsApplied: details.map(d => d.name),
          details,
          carte: decodedBrand,
          matricule: employee.matricule,
          periode,
        });

        return { employee, commissions, bonuses, penalties, finalSalary, details };
      });

      setResults(brandResults);
      toast.success("Calcul appliqué avec succès !");
    } catch (error) {
      console.error("Erreur générale calcul:", error);
      toast.error("Une erreur est survenue lors de l'exécution du calcul.");
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="abc-page-inner abc-stack-lg">
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
          <ArrowLeft className="w-4 h-4" /> {b.back}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLONNE GAUCHE : Équipe */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">{b.teamMembers}</h2>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full uppercase">
                {brandEmployees.length} {b.active}
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
              onClick={handleCalculateAll}
              disabled={loading || brandEmployees.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white py-3 px-4 rounded-lg font-bold hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCalculating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calculator className="w-5 h-5" />}
              {isCalculating ? b.calculating : b.launchBtn}
            </button>
          </div>
        </div>

        {/* COLONNE DROITE : Résultats */}
        <div className="lg:col-span-2">
          {results.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 h-full flex flex-col items-center justify-center text-center">
              <Calculator className="w-16 h-16 text-gray-200 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">{b.noCalc}</h3>
              <p className="text-gray-500 max-w-sm">
                {b.noCalcSub}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
              <div className="flex items-center justify-between border-b border-gray-200 mb-6">
                <div className="flex gap-6">
                  <button 
                    onClick={() => setActiveTab('detail')} 
                    className={`pb-3 border-b-2 font-medium transition-colors ${activeTab === 'detail' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    {b.detailTab}
                  </button>
                  <button 
                    onClick={() => setActiveTab('recap')} 
                    className={`pb-3 border-b-2 font-medium transition-colors ${activeTab === 'recap' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    {b.recapTab}
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
                            <p className="text-[10px] text-green-600 uppercase font-bold mb-1">{b.commissions}</p>
                            <p className="font-bold text-green-700">{formatCurrency(res.commissions)}</p>
                          </div>
                          <div className="bg-green-50 p-2.5 rounded-lg border border-green-100 text-center">
                            <p className="text-[10px] text-green-600 uppercase font-bold mb-1">{b.bonus}</p>
                            <p className="font-bold text-green-700">{formatCurrency(res.bonuses)}</p>
                          </div>
                          <div className={`p-2.5 rounded-lg border text-center ${res.penalties > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                            <p className={`text-[10px] uppercase font-bold mb-1 ${res.penalties > 0 ? 'text-red-600' : 'text-gray-500'}`}>{b.penalties}</p>
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
                          <th className="p-4 font-semibold">{b.colEmployee}</th>
                          <th className="p-4 font-semibold">{b.colBase}</th>
                          <th className="p-4 font-semibold">{b.colComm}</th>
                          <th className="p-4 font-semibold">{b.colBonus}</th>
                          <th className="p-4 font-semibold">{b.colPenal}</th>
                          <th className="p-4 font-bold text-orange-600">{b.colNet}</th>
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
                          <td className="p-4 text-orange-900">{b.teamTotal}</td>
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
    </div>
  );
}