import { useState, useMemo, useEffect } from 'react';
import { Users, TrendingUp, DollarSign, Calculator, Award, BarChart2, Filter, ClipboardList, Truck, CalendarCheck } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useHistory } from '../context/HistoryContext';
import { useLang } from '../context/LangContext';
import { useUser } from '../context/UserContext';
import { presenceApi, ApiFichePresence } from '../services/presenceApi';

// Dashboard restreint pour le rôle DISPATCHER : son travail se limite aux fiches
// de présence, il n'a pas besoin de voir le chiffre d'affaires, les commissions
// ou la masse salariale de l'entreprise.
function DispatcherDashboard() {
  const [stats, setStats] = useState<{ totalFiches: number; livreursPrésents: number; totalVoyages: number } | null>(null);
  const [recentFiches, setRecentFiches] = useState<ApiFichePresence[]>([]);

  useEffect(() => {
    const now = new Date();
    presenceApi.getStatistiques(now.getMonth() + 1, now.getFullYear())
      .then((s) => setStats(s as any))
      .catch(() => setStats(null));
    presenceApi.getAll()
      .then((list) => setRecentFiches(
        [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
      ))
      .catch(() => setRecentFiches([]));
  }, []);

  const cards = [
    { label: 'Fiches ce mois', value: stats?.totalFiches ?? '—', icon: ClipboardList, tone: 'violet' },
    { label: 'Livreurs présents', value: stats?.livreursPrésents ?? '—', icon: Users, tone: 'blue' },
    { label: 'Voyages ce mois', value: stats?.totalVoyages ?? '—', icon: Truck, tone: 'emerald' },
  ];

  return (
    <div className="abc-page-inner abc-stack-lg">
      <div className="abc-kpi-grid">
        {cards.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="abc-card abc-kpi">
              <div className="abc-kpi-head">
                <span className="abc-kpi-label">{k.label}</span>
                <span className={`abc-kpi-icon abc-kpi-icon-${k.tone}`}>
                  <Icon size={14} />
                </span>
              </div>
              <div className="abc-kpi-value">{k.value}</div>
            </div>
          );
        })}
      </div>

      <div className="abc-card no-pad">
        <div className="abc-top-card-head">
          <div>
            <h3 className="abc-h3">Dernières fiches saisies</h3>
            <p className="abc-sub abc-sub-tight">Vos 5 fiches de présence les plus récentes</p>
          </div>
        </div>
        {recentFiches.length === 0 ? (
          <div className="text-center py-10 text-gray-400">Aucune fiche pour le moment.</div>
        ) : (
          <ul className="abc-activity-list">
            {recentFiches.map((f) => (
              <li key={f.id} className="abc-activity-row">
                <div className="abc-avatar abc-avatar-sm" style={{ background: 'var(--brand)', color: 'white', width: 30, height: 30, fontSize: 11 }}>
                  <CalendarCheck size={14} />
                </div>
                <div className="abc-activity-info">
                  <span className="abc-activity-name">{f.matriculeCamion} · {f.canal}</span>
                  <span className="abc-activity-meta">{new Date(f.date).toLocaleDateString('fr-FR')} · {f.livreur1Prenom} {f.livreur1Nom}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useUser();
  const { history } = useHistory();
  const { t, lang } = useLang();
  const d = t.dashboard;

  // États pour les filtres
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const fc = (v: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(v);

  // ✨ On ne conserve QUE les calculs validés (isArchived === true)
  const validatedHistory = useMemo(() => {
    return history.filter(h => h.isArchived);
  }, [history]);

  // --- LISTES DYNAMIQUES POUR LES DROPDOWNS DES FILTRES (Basées sur les validés) ---
  const uniqueBrands = useMemo(() => {
    return [...new Set(validatedHistory.map(h => h.carte).filter(Boolean))];
  }, [validatedHistory]);

  const uniqueChannels = useMemo(() => {
    return [...new Set(validatedHistory.map(h => h.employeeRole?.split(' ')[0]).filter(Boolean))];
  }, [validatedHistory]);

  const uniqueEmployees = useMemo(() => {
    return [...new Set(validatedHistory.map(h => h.employeeName).filter(Boolean))];
  }, [validatedHistory]);

  // --- LOGIQUE DE FILTRAGE COMMUNE ---
  const filteredHistory = useMemo(() => {
    return validatedHistory.filter(h => {
      const dateObj = new Date(h.date);
      const brandMatch = !selectedBrand || h.carte === selectedBrand;
      const channelMatch = !selectedChannel || h.employeeRole?.toUpperCase().includes(selectedChannel.toUpperCase());
      const employeeMatch = !selectedEmployee || h.employeeName === selectedEmployee;
      const monthMatch = !selectedMonth || String(dateObj.getMonth()) === selectedMonth;
      const yearMatch = !selectedYear || String(dateObj.getFullYear()) === selectedYear;

      return brandMatch && channelMatch && employeeMatch && monthMatch && yearMatch;
    });
  }, [validatedHistory, selectedBrand, selectedChannel, selectedEmployee, selectedMonth, selectedYear]);

  // --- KPIS SUR DONNÉES FILTRÉES ---
  const kpi = useMemo(() => {
    if (filteredHistory.length === 0) return { totalCalcs: 0, totalSales: 0, totalPayroll: 0, totalCommissions: 0, uniqueEmps: 0 };
    return {
      totalCalcs:       filteredHistory.length,
      totalSales:       filteredHistory.reduce((s, h) => s + h.totalSales, 0),
      totalPayroll:     filteredHistory.reduce((s, h) => s + h.finalSalary, 0),
      totalCommissions: filteredHistory.reduce((s, h) => s + h.commissions, 0),
      uniqueEmps:       new Set(filteredHistory.map(h => h.employeeName)).size,
    };
  }, [filteredHistory]);

  // --- ÉVOLUTION MENSUELLE ---
  const monthlyData = useMemo(() => {
    const map = new Map<string, { sales: number; commissions: number; payroll: number; count: number; date: Date }>();
    filteredHistory.forEach(h => {
      const d = new Date(h.date);
      const k = d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', { month: 'short', year: 'numeric' });
      const ex = map.get(k) || { sales: 0, commissions: 0, payroll: 0, count: 0, date: d };
      map.set(k, { ...ex, sales: ex.sales + h.totalSales, commissions: ex.commissions + h.commissions, payroll: ex.payroll + h.finalSalary, count: ex.count + 1 });
    });
    return [...map.entries()]
      .sort(([, a], [, b]) => a.date.getTime() - b.date.getTime())
      .slice(-6)
      .map(([month, d]) => ({ month, ...d }));
  }, [filteredHistory, lang]);

  // --- TOP PERFORMERS ---
  const topPerformers = useMemo(() => {
    const map = new Map<string, { name: string; role: string; commissions: number; finalSalary: number; count: number }>();
    filteredHistory.forEach(h => {
      const ex = map.get(h.employeeName) || { name: h.employeeName, role: h.employeeRole, commissions: 0, finalSalary: 0, count: 0 };
      map.set(h.employeeName, { ...ex, commissions: ex.commissions + h.commissions, finalSalary: ex.finalSalary + h.finalSalary, count: ex.count + 1 });
    });
    return [...map.values()].sort((a, b) => b.commissions - a.commissions).slice(0, 5);
  }, [filteredHistory]);

  const recentActivity = filteredHistory.slice(0, 5);
  const maxComm = topPerformers[0]?.commissions || 1;

  const kpiCards = [
    { label: d.payroll,      value: fc(kpi.totalPayroll),      icon: DollarSign, tone: 'amber' },
    { label: d.sales,        value: fc(kpi.totalSales),        icon: TrendingUp, tone: 'blue' },
    { label: d.commissions,  value: fc(kpi.totalCommissions),  icon: Award,      tone: 'emerald' },
    { label: d.calculations, value: String(kpi.totalCalcs),    icon: BarChart2,  tone: 'violet' },
  ];

  const monthsFr = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const monthsEn = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const resetFilters = () => {
    setSelectedBrand('');
    setSelectedChannel('');
    setSelectedEmployee('');
    setSelectedMonth('');
    setSelectedYear('');
  };

  if (user?.superRole === 'DISPATCHER') {
    return <DispatcherDashboard />;
  }

  return (
    <div className="abc-page-inner abc-stack-lg">
      
      {/* 🛠️ BARRE DE FILTRES DYNAMIQUE MULTI-CRITÈRES */}
      <div className="abc-card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: 'var(--brand-deep)', fontWeight: 'bold', fontSize: '14px' }}>
          <Filter size={16} />
          <span>Filtres analytiques du tableau de bord</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          
          {/* Filtre Marque (Carte) */}
          <div className="abc-stack-xs">
            <select className="abc-mini-select" style={{ width: '100%' }} value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)}>
              <option value="">{lang === 'en' ? 'All brands' : 'Toutes les cartes'}</option>
              {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Filtre Canal */}
          <div className="abc-stack-xs">
            <select className="abc-mini-select" style={{ width: '100%' }} value={selectedChannel} onChange={e => setSelectedChannel(e.target.value)}>
              <option value="">{lang === 'en' ? 'All channels' : 'Tous les canaux'}</option>
              {uniqueChannels.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Filtre Personnel / Vendeur */}
          <div className="abc-stack-xs">
            <select className="abc-mini-select" style={{ width: '100%' }} value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)}>
              <option value="">{lang === 'en' ? 'All personnel' : 'Tous les vendeurs'}</option>
              {uniqueEmployees.map(emp => <option key={emp} value={emp}>{emp}</option>)}
            </select>
          </div>

          {/* Filtre Période - Mois */}
          <div className="abc-stack-xs">
            <select className="abc-mini-select" style={{ width: '100%' }} value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
              <option value="">{lang === 'en' ? 'All months' : 'Tous les mois'}</option>
              {(lang === 'en' ? monthsEn : monthsFr).map((m, i) => (
                <option key={i} value={String(i)}>{m}</option>
              ))}
            </select>
          </div>

          {/* Filtre Période - Année */}
          <div className="abc-stack-xs">
            <select className="abc-mini-select" style={{ width: '100%' }} value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
              <option value="">{lang === 'en' ? 'All years' : 'Toutes les années'}</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          {/* Bouton Réinitialiser */}
          {(selectedBrand || selectedChannel || selectedEmployee || selectedMonth || selectedYear) && (
            <button className="abc-btn abc-btn-ghost abc-btn-sm" onClick={resetFilters} style={{ alignSelf: 'center', height: '32px' }}>
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* KPI grid */}
      <div className="abc-kpi-grid">
        {kpiCards.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="abc-card abc-kpi">
              <div className="abc-kpi-head">
                <span className="abc-kpi-label">{k.label}</span>
                <span className={`abc-kpi-icon abc-kpi-icon-${k.tone}`}>
                  <Icon size={14} />
                </span>
              </div>
              <div className="abc-kpi-value">{k.value}</div>
            </div>
          );
        })}
      </div>

      {filteredHistory.length === 0 ? (
        <div className="abc-card abc-empty-card">
          <Calculator size={36} strokeWidth={1.5} />
          <p>{lang === 'en' ? 'No validated data matching the filters.' : 'Aucun calcul validé ne correspond aux critères sélectionnés.'}</p>
        </div>
      ) : (
        <>
          {/* Charts row */}
          <div className="abc-grid-2-3">
            <div className="abc-card">
              <div className="abc-sechead">
                <div>
                  <h3 className="abc-h3">{d.salesEvol}</h3>
                  <p className="abc-sub abc-sub-tight">{lang === 'en' ? 'Filtered Trend' : 'Tendance filtrée de la période'}</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v: number) => fc(v)}
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  />
                  <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} name={lang === 'en' ? 'Sales' : 'Ventes'} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="commissions" stroke="var(--brand)" strokeWidth={2} name={d.commissions} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="abc-card no-pad">
              <div className="abc-top-card-head">
                <div>
                  <h3 className="abc-h3">{d.recentActivity}</h3>
                  <p className="abc-sub abc-sub-tight">{lang === 'en' ? 'Latest validated calculations' : 'Derniers calculs validés'}</p>
                </div>
              </div>
              <ul className="abc-activity-list">
                {recentActivity.map((h) => {
                  const initials = h.employeeName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                  const date = new Date(h.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                  return (
                    <li key={h.id} className="abc-activity-row">
                      <div
                        className="abc-avatar abc-avatar-sm"
                        style={{ background: 'var(--brand)', color: 'white', width: 30, height: 30, fontSize: 11 }}
                      >
                        {initials}
                      </div>
                      <div className="abc-activity-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="abc-activity-name">{h.employeeName}</span>
                        </div>
                        <span className="abc-activity-meta">{date} · {h.employeeRole} • <strong style={{ color: 'var(--brand-deep)' }}>{h.carte}</strong></span>
                      </div>
                      <span className="abc-mono abc-activity-amount">{fc(h.finalSalary)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Commissions bar chart + Top performers */}
          <div className="abc-grid-1-2">
            <div className="abc-card">
              <div className="abc-sechead">
                <div>
                  <h3 className="abc-h3">{d.commissionsMonth}</h3>
                  <p className="abc-sub abc-sub-tight">{lang === 'en' ? 'Payment trend' : 'Tendance des versements'}</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v: number) => fc(v)}
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="commissions" fill="var(--brand)" radius={[6, 6, 0, 0]} name={d.commissions} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {topPerformers.length > 0 && (
              <div className="abc-card no-pad">
                <div className="abc-top-card-head">
                  <div>
                    <h3 className="abc-h3">{d.topPerformers}</h3>
                    <p className="abc-sub abc-sub-tight">{lang === 'en' ? 'By total commissions' : 'Par commissions totales'}</p>
                  </div>
                </div>
                <div className="abc-top-list">
                  {topPerformers.map((p, i) => {
                    const initials = p.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                    const pct = (p.commissions / maxComm) * 100;
                    const colors = ['var(--brand)', '#3b82f6', '#10b981', '#8b5cf6', '#f43f5e'];
                    return (
                      <div key={p.name} className="abc-top-row">
                        <span className="abc-top-rank">{String(i + 1).padStart(2, '0')}</span>
                        <div
                          className="abc-avatar"
                          style={{ background: colors[i], color: '#fff', width: 36, height: 36, fontSize: 12 }}
                        >
                          {initials}
                        </div>
                        <div className="abc-top-info">
                          <span className="abc-top-name">{p.name}</span>
                          <span className="abc-top-role">{p.role}</span>
                        </div>
                        <div className="abc-top-bar">
                          <span style={{ width: `${pct}%`, background: colors[i] }} />
                        </div>
                        <div className="abc-top-value">
                          <span className="abc-mono abc-top-value-amount">{fc(p.commissions)}</span>
                          <span className="abc-top-value-label">{p.count} calcul{p.count > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Summary row */}
          <div className="abc-stat-strip">
            <div className="abc-stat-item">
              <span className="abc-stat-num">{kpi.uniqueEmps}</span>
              <span className="abc-stat-lbl">{lang === 'en' ? 'unique employees' : 'employés uniques'}</span>
            </div>
            <span className="abc-stat-sep" />
            <div className="abc-stat-item is-amber">
              <span className="abc-stat-dot" style={{ background: 'var(--brand)' }} />
              <span className="abc-stat-num">{kpi.totalCalcs}</span>
              <span className="abc-stat-lbl">{lang === 'en' ? 'calculations done' : 'calculs effectués'}</span>
            </div>
            <span className="abc-stat-sep" />
            <div className="abc-stat-item">
              <span className="abc-stat-num">
                {kpi.totalCalcs > 0 ? fc(kpi.totalCommissions / kpi.totalCalcs) : '—'}
              </span>
              <span className="abc-stat-lbl">{lang === 'en' ? 'avg commission / calc' : 'commission moyenne / calcul'}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}