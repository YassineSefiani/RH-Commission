import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Calculator, Users, Loader2 } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { useConstraints } from '../context/ConstraintsContext';
import { useHistory } from '../context/HistoryContext';
import { usePresence } from '../context/PresenceContext';
import { toast } from 'sonner';
import { useLang } from '../context/LangContext';
import { getAuthHeaders } from '../services/authHeaders';
import { importApi } from '../services/importApi';
import { currentMonthYear, toPeriodeKey, toPeriodeLabel } from '../utils/periode';
import { matchesBrand } from '../utils/brandMatch';

interface Employee {
  id: string;
  matricule?: string;
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
  bonuses: number;
  finalSalary: number;
  details: CalculationDetail[];
};

export default function BrandCalculationPage() {
  const { brand = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { constraints } = useConstraints();

  const { history = [], addCalculation } = useHistory();

  const { presenceRecords } = usePresence();
  const decodedBrand = decodeURIComponent(brand);
  const { t } = useLang();
  const b = t.brandCalc;

  const routeState = location.state as { periode?: string; periodeLabel?: string } | null;
  const { periode: periodeKey, periodeLabel } = useMemo(() => {
    if (routeState?.periode) {
      return { periode: routeState.periode, periodeLabel: routeState.periodeLabel || routeState.periode };
    }
    const { month, year } = currentMonthYear();
    return { periode: toPeriodeKey(month, year), periodeLabel: toPeriodeLabel(month, year) };
  }, [routeState]);

  const [brandEmployees, setBrandEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<EmployeeCalculationResult[]>([]);
  const [activeTab, setActiveTab] = useState<'detail' | 'recap'>('detail');
  const [calcNotice, setCalcNotice] = useState<{ type: 'error' | 'warning'; message: string } | null>(null);

  useEffect(() => {
    const fetchEmployeesByBrand = async () => {
      try {
        setLoading(true);
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
        const targetBrand = decodedBrand.trim().toUpperCase();

        let response = await fetch(`${apiBase}/personnel`, { headers: getAuthHeaders() });
        let data = [];

        if (response.ok) {
          const allPersonnel = await response.json();
          data = allPersonnel.filter((emp: Employee) => {
            if (!emp.carte) return false;
            const empCarte = emp.carte.trim().toUpperCase();

            if (targetBrand.includes('FERRERO') && empCarte.includes('FERRERO')) return true;
            if (targetBrand.includes('COCA') && empCarte.includes('COCA')) return true;
            if (targetBrand.includes('WALL') && empCarte.includes('WALL')) return true;

            return empCarte === targetBrand;
          });
        }

        setBrandEmployees(data.filter((emp: Employee) => emp.actif));
      } catch (error) {
        console.error("Erreur récupération du personnel:", error);
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
    setCalcNotice(null);
    try {
      if (!constraints || constraints.length === 0) {
        const message = "Aucune règle de calcul disponible dans le contexte.";
        toast.error(message);
        setCalcNotice({ type: 'error', message });
        setIsCalculating(false);
        return;
      }

      const activeConstraints = constraints.filter(c => {
        if (c.actif === false || c.actif === 0) return false;
        const dbCarte = (c.carte || '').toUpperCase();
        const urlBrand = (decodedBrand || '').toUpperCase();
        if (urlBrand.includes('COCA') && dbCarte.includes('COCA')) return true;
        if (urlBrand.includes('FERRERO') && dbCarte.includes('FERRERO')) return true;
        if (urlBrand.includes('WALL') && dbCarte.includes('WALL')) return true;
        return dbCarte.replace(/[_ \-']/g, '') === urlBrand.replace(/[_ \-']/g, '');
      });

      if (activeConstraints.length === 0) {
        const message = `Aucune règle trouvée pour la marque : ${decodedBrand}`;
        toast.warning(message);
        setCalcNotice({ type: 'warning', message });
        setIsCalculating(false);
        return;
      }

      const brandHistory = history.filter(h => (h.carte || '').toUpperCase() === decodedBrand.toUpperCase());
      const uniqueBatches = new Set(brandHistory.map(h => h.batchId).filter(Boolean));
      const simNumber = uniqueBatches.size + 1;

      const currentBatchId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
      const simulationName = `Simulation ${simNumber} - ${decodedBrand}`;

      const [objectifsRes, realisationsRes, triageRes, volumesRes] = await Promise.allSettled([
        importApi.getObjectifsByPeriode(periodeKey),
        importApi.getRealisationsByPeriode(periodeKey),
        importApi.getTriageByPeriode(periodeKey),
        importApi.getVolumesByPeriode(periodeKey),
      ]);

      const missingSources: string[] = [];
      const fetchedObjectifs = objectifsRes.status === 'fulfilled' ? objectifsRes.value.filter(o => matchesBrand(o.carte, decodedBrand)) : [];
      if (objectifsRes.status === 'rejected') missingSources.push('Objectifs');
      const realPayload = realisationsRes.status === 'fulfilled' ? realisationsRes.value.filter(r => matchesBrand(r.carte, decodedBrand)) : [];
      if (realisationsRes.status === 'rejected') missingSources.push('Réalisations');
      const triPayload = triageRes.status === 'fulfilled' ? triageRes.value : [];
      if (triageRes.status === 'rejected') missingSources.push('Triage');
      const volPayload = volumesRes.status === 'fulfilled' ? volumesRes.value : [];
      if (volumesRes.status === 'rejected') missingSources.push('Volumes');

      if (missingSources.length > 0) {
        const message = `Impossible de récupérer : ${missingSources.join(', ')} — calcul annulé.`;
        toast.error(message);
        setCalcNotice({ type: 'error', message });
        setIsCalculating(false);
        return;
      }

      if (fetchedObjectifs.length === 0 || realPayload.length === 0) {
        const message = `Aucune donnée importée pour ${periodeLabel} / ${decodedBrand} — le calcul utilisera 0 pour les employés concernés.`;
        toast.warning(message);
        setCalcNotice({ type: 'warning', message });
      }

      const brandResults = brandEmployees.map(employee => {
        let commissions = 0;
        let bonuses = 0;
        const details: CalculationDetail[] = [];

        const empMatricule = String(employee.matricule || employee.id).trim().toUpperCase();

        const empObjectif = fetchedObjectifs.find((o) => String(o.matricule).trim().toUpperCase() === empMatricule) || { target: 0 };
        const empRealisation = realPayload.find((r) => String(r.matricule).trim().toUpperCase() === empMatricule) || { caRealise: 0 };
        const empTriage = triPayload.find((tr) => String(tr.matricule).trim().toUpperCase() === empMatricule) || { note: 0 };

        const empVolumeRecords = volPayload.filter((v) => String(v.matricule).trim().toUpperCase() === empMatricule);

        const roleSegments: Record<string, { volume: number }> = {};
        let totalVolume = 0;
        let globalTauxRetour = 0;

        if (empVolumeRecords.length > 0) {
          const first = empVolumeRecords[0];
          globalTauxRetour = first.volumeCharge > 0 ? (first.volumeRetourne / first.volumeCharge) * 100 : 0;

          empVolumeRecords.forEach((record) => {
            let dailyRole = String(employee.role || '').trim().toUpperCase();
            const dailyVol = (record.volumeCharge || 0) - (record.volumeRetourne || 0);

            const dailyPresence = presenceRecords.find(p => p.date === record.date);

            if (dailyPresence) {
              const mat1 = (dailyPresence.livreur1Matricule || '').trim().toUpperCase();
              const mat2 = (dailyPresence.livreur2Matricule || '').trim().toUpperCase();
              const mat3 = (dailyPresence.livreur3Matricule || '').trim().toUpperCase();

              if (empMatricule === mat1) {
                dailyRole = 'LIVREUR';
              } else if (empMatricule === mat2 || empMatricule === mat3) {
                dailyRole = 'AIDE LIVREUR';
              }

              if (decodedBrand.toUpperCase().includes('COCA') && dailyPresence.canal?.trim().toUpperCase() === 'GMS') {
                dailyRole = `${dailyRole} GMS`;
              }
            }

            if (!roleSegments[dailyRole]) {
              roleSegments[dailyRole] = { volume: 0 };
            }
            roleSegments[dailyRole].volume += dailyVol;
            totalVolume += dailyVol;
          });
        } else {
          let fallbackRole = String(employee.role || '').trim().toUpperCase();

          if (decodedBrand.toUpperCase().includes('COCA')) {
            const hasGmsPresenceThisMonth = presenceRecords.some(p => {
              const mat1 = (p.livreur1Matricule || '').trim().toUpperCase();
              const mat2 = (p.livreur2Matricule || '').trim().toUpperCase();
              const mat3 = (p.livreur3Matricule || '').trim().toUpperCase();
              return p.canal?.trim().toUpperCase() === 'GMS' && (empMatricule === mat1 || empMatricule === mat2 || empMatricule === mat3);
            });
            if (hasGmsPresenceThisMonth) {
              fallbackRole = `${fallbackRole} GMS`;
            }
          }

          roleSegments[fallbackRole] = { volume: 0 };
        }

        const tauxRea = empObjectif.target > 0 ? (empRealisation.caRealise / empObjectif.target) * 100 : 0;
        const CONTRAT = employee.natureContrat?.toUpperCase().includes('INT') ? 'INTERIM' : 'CDI';

        const metrics = {
          joursTravailles: 22,
          volumeDistribue: totalVolume,
          tauxRetour: globalTauxRetour,
          tauxTriage: empTriage.note,
          caRealise: empRealisation.caRealise,
          tauxRealisation: tauxRea,
          tauxRealisationGlobal: 105.0
        };

        activeConstraints.forEach(constraint => {
          const nomRegle = String(constraint.name || constraint.nom || 'Règle inconnue').toUpperCase();
          const conditionStr = String(constraint.condition || '').toUpperCase();
          const typeValue = String(constraint.typeValeur || (constraint as any).type_valeur || (constraint as any).type || (constraint as any).valueType || '').toUpperCase();
          const valeur = Number(constraint.valeur !== undefined ? constraint.valeur : (constraint as any).value || 0);
          const urlBrandUp = (decodedBrand || '').toUpperCase();

          let jsCondition = conditionStr
            .replace(/\bAND\b/g, '&&')
            .replace(/\bOR\b/g, '||')
            .replace(/ROLE LIKE 'AIDE LIVREUR%'/g, "ROLE.includes('AIDE LIVREUR')")
            .replace(/ROLE ===? 'AIDE LIVREUR 1'/g, "ROLE.includes('AIDE LIVREUR')")
            .replace(/ROLE ===? 'AIDE LIVREUR 2'/g, "ROLE.includes('AIDE LIVREUR')")
            .replace(/ROLE ===? 'AIDE LIVREUR'/g, "ROLE.includes('AIDE LIVREUR')")
            .replace(/==+/g, "===");

          const isVolumeRule = typeValue.includes('UNITE') || typeValue.includes('UNITÉ') || typeValue.includes('UNIT') || (valeur < 1 && !typeValue.includes('POURCENTAGE'));

          let amountGeneratedForRule = 0;
          let ruleApplied = false;

          if (isVolumeRule) {
            Object.entries(roleSegments).forEach(([roleJoue, stats]) => {
              let conditionVerifiee = false;
              try {
                const evaluator = new Function(
                  'ROLE', 'CONTRAT', 'JOURS_TRAVAILLES', 'TAUX_RETOUR', 'TAUX_TRIAGE', 'TAUX_REALISATION', 'TAUX_REALISATION_GLOBAL',
                  `return ${jsCondition};`
                );
                conditionVerifiee = evaluator(
                  roleJoue, CONTRAT, metrics.joursTravailles, metrics.tauxRetour,
                  metrics.tauxTriage, metrics.tauxRealisation, metrics.tauxRealisationGlobal
                );
              } catch (e) {}

              if (conditionVerifiee && stats.volume > 0) {
                const segmentAmount = valeur * stats.volume;
                commissions += segmentAmount;
                amountGeneratedForRule += segmentAmount;
                ruleApplied = true;
              }
            });
          } else {
            let conditionVerifiee = false;
            for (const roleJoue of Object.keys(roleSegments)) {
              try {
                const evaluator = new Function(
                  'ROLE', 'CONTRAT', 'JOURS_TRAVAILLES', 'TAUX_RETOUR', 'TAUX_TRIAGE', 'TAUX_REALISATION', 'TAUX_REALISATION_GLOBAL',
                  `return ${jsCondition};`
                );
                if (evaluator(
                    roleJoue, CONTRAT, metrics.joursTravailles, metrics.tauxRetour,
                    metrics.tauxTriage, metrics.tauxRealisation, metrics.tauxRealisationGlobal
                )) {
                  conditionVerifiee = true;
                  break;
                }
              } catch (e) {}
            }

            if (conditionVerifiee) {
              if (typeValue.includes('POURCENTAGE') || (valeur <= 100 && !urlBrandUp.includes('COCA'))) {
                amountGeneratedForRule = (valeur / 100) * metrics.caRealise;
                commissions += amountGeneratedForRule;
              } else {
                amountGeneratedForRule = valeur;
                bonuses += amountGeneratedForRule;
              }
              ruleApplied = true;
            }
          }

          if (ruleApplied && amountGeneratedForRule > 0) {
            details.push({
              name: nomRegle,
              amount: amountGeneratedForRule,
              type: (typeValue.includes('FIXE') || (!isVolumeRule && !typeValue.includes('POURCENTAGE') && valeur > 100)) ? 'bonus' : 'commission'
            });
          }
        });

        const finalSalary = commissions + bonuses;

        addCalculation({
          employeeName: `${employee.prenom} ${employee.nom}`,
          employeeRole: employee.role,
          totalSales: metrics.caRealise,
          deliveries: metrics.volumeDistribue,
          returns: metrics.tauxRetour,
          commissions,
          bonuses,
          finalSalary,
          constraintsApplied: details.map(d => d.name),
          details,
          carte: decodedBrand,
          matricule: employee.matricule || employee.id,
          periode: periodeKey,
          forcerRecalcul: true,
          batchId: currentBatchId,
          simulationName: simulationName,
        });

        return { employee, commissions, bonuses, finalSalary, details };
      });

      setResults(brandResults);
      toast.success(`${simulationName} exécutée avec succès !`);
    } catch (error) {
      console.error("Erreur générale calcul:", error);
      const message = "Une erreur est survenue lors de l'exécution du calcul.";
      toast.error(message);
      setCalcNotice({ type: 'error', message });
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
            <p className="text-gray-600">Gestion et calcul groupé pour le personnel {decodedBrand} — période : {periodeLabel}.</p>
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
                        {emp.matricule || emp.id} • {emp.role} • {emp.natureContrat}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleCalculateAll}
              disabled={loading || brandEmployees.length === 0 || isCalculating}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white py-3 px-4 rounded-lg font-bold hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCalculating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calculator className="w-5 h-5" />}
              {isCalculating ? b.calculating : b.launchBtn}
            </button>

            {calcNotice && (
              <p className={`mt-3 text-xs rounded-lg px-3 py-2 ${calcNotice.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                {calcNotice.message}
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {results.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 h-full flex flex-col items-center justify-center text-center">
              <Calculator className="w-16 h-16 text-gray-200 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">{b.noCalc}</h3>
              <p className="text-gray-500 max-w-sm">{b.noCalcSub}</p>
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
                      <div key={idx} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                        <div className="mb-4">
                          <h4 className="font-bold text-gray-900 text-lg">{res.employee.prenom} {res.employee.nom}</h4>
                          <p className="text-xs text-gray-500 mt-1 uppercase font-semibold">{res.employee.role} • {res.employee.natureContrat}</p>
                        </div>
                        <div className="text-3xl font-black text-orange-500 mb-6">
                          {formatCurrency(res.finalSalary)}
                        </div>
                        <div className="grid grid-cols-2 gap-3 w-full">
                          <div className="bg-green-50 p-3 rounded-xl border border-green-100 text-center">
                            <p className="text-[10px] text-green-600 uppercase font-bold mb-1">{b.commissions}</p>
                            <p className="font-bold text-green-700 text-sm">{formatCurrency(res.commissions)}</p>
                          </div>
                          <div className="bg-green-50 p-3 rounded-xl border border-green-100 text-center">
                            <p className="text-[10px] text-green-600 uppercase font-bold mb-1">{b.bonus}</p>
                            <p className="font-bold text-green-700 text-sm">{formatCurrency(res.bonuses)}</p>
                          </div>
                        </div>

                        {res.details && res.details.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <h5 className="text-xs font-bold text-gray-500 uppercase mb-3">Règles appliquées</h5>
                            <ul className="space-y-2">
                              {res.details.map((detail, dIdx) => (
                                <li key={dIdx} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-700 flex-1 truncate pr-2" title={detail.name}>
                                    • {detail.name}
                                  </span>
                                  <span className="font-semibold whitespace-nowrap text-green-600">
                                    +{formatCurrency(detail.amount)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                      <thead className="bg-gray-50">
                        <tr className="border-b border-gray-200 text-xs text-gray-600 uppercase tracking-wider">
                          <th className="p-4 font-semibold">{b.colEmployee}</th>
                          <th className="p-4 font-semibold">{b.colComm}</th>
                          <th className="p-4 font-semibold">{b.colBonus}</th>
                          <th className="p-4 font-bold text-orange-600">{b.colNet}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {results.map((r, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors text-sm">
                            <td className="p-4 font-medium text-gray-900">{r.employee.prenom} {r.employee.nom}</td>
                            <td className="p-4 text-green-600 font-medium">+{formatCurrency(r.commissions)}</td>
                            <td className="p-4 text-green-600 font-medium">+{formatCurrency(r.bonuses)}</td>
                            <td className="p-4 font-bold text-orange-600">{formatCurrency(r.finalSalary)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-orange-50 font-bold border-t-2 border-orange-200">
                        <tr>
                          <td className="p-4 text-orange-900">{b.teamTotal}</td>
                          <td className="p-4 text-green-700">+{formatCurrency(results.reduce((acc, r) => acc + r.commissions, 0))}</td>
                          <td className="p-4 text-green-700">+{formatCurrency(results.reduce((acc, r) => acc + r.bonuses, 0))}</td>
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
