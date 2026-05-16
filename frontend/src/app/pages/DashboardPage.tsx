import { useMemo } from 'react';
import { Users, TrendingUp, DollarSign, Calculator, Award, BarChart2 } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useHistory } from '../context/HistoryContext';

export default function DashboardPage() {
  const { history } = useHistory();

  const fc = (v: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(v);

  const kpi = useMemo(() => {
    if (history.length === 0) return { totalCalcs: 0, totalSales: 0, totalPayroll: 0, totalCommissions: 0, uniqueEmps: 0 };
    return {
      totalCalcs:       history.length,
      totalSales:       history.reduce((s, h) => s + h.totalSales, 0),
      totalPayroll:     history.reduce((s, h) => s + h.finalSalary, 0),
      totalCommissions: history.reduce((s, h) => s + h.commissions, 0),
      uniqueEmps:       new Set(history.map(h => h.employeeName)).size,
    };
  }, [history]);

  const monthlyData = useMemo(() => {
    const map = new Map<string, { sales: number; commissions: number; payroll: number; count: number; date: Date }>();
    history.forEach(h => {
      const d = new Date(h.date);
      const k = d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      const ex = map.get(k) || { sales: 0, commissions: 0, payroll: 0, count: 0, date: d };
      map.set(k, { ...ex, sales: ex.sales + h.totalSales, commissions: ex.commissions + h.commissions, payroll: ex.payroll + h.finalSalary, count: ex.count + 1 });
    });
    return [...map.entries()]
      .sort(([, a], [, b]) => a.date.getTime() - b.date.getTime())
      .slice(-6)
      .map(([month, d]) => ({ month, ...d }));
  }, [history]);

  const topPerformers = useMemo(() => {
    const map = new Map<string, { name: string; role: string; commissions: number; finalSalary: number; count: number }>();
    history.forEach(h => {
      const ex = map.get(h.employeeName) || { name: h.employeeName, role: h.employeeRole, commissions: 0, finalSalary: 0, count: 0 };
      map.set(h.employeeName, { ...ex, commissions: ex.commissions + h.commissions, finalSalary: ex.finalSalary + h.finalSalary, count: ex.count + 1 });
    });
    return [...map.values()].sort((a, b) => b.commissions - a.commissions).slice(0, 5);
  }, [history]);

  const recentActivity = history.slice(0, 5);
  const maxComm = topPerformers[0]?.commissions || 1;

  const kpiCards = [
    { label: 'Masse salariale', value: fc(kpi.totalPayroll), icon: DollarSign, tone: 'amber' },
    { label: 'Total ventes',    value: fc(kpi.totalSales),   icon: TrendingUp, tone: 'blue' },
    { label: 'Commissions',     value: fc(kpi.totalCommissions), icon: Award, tone: 'emerald' },
    { label: 'Calculs',         value: String(kpi.totalCalcs),   icon: BarChart2, tone: 'violet' },
  ];

  return (
    <div className="abc-page-inner abc-stack-lg">
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

      {history.length === 0 ? (
        <div className="abc-card abc-empty-card">
          <Calculator size={36} strokeWidth={1.5} />
          <p>Aucune donnée disponible. Effectuez des calculs pour voir les statistiques.</p>
        </div>
      ) : (
        <>
          {/* Charts row */}
          <div className="abc-grid-2-3">
            <div className="abc-card">
              <div className="abc-sechead">
                <div>
                  <h3 className="abc-h3">Évolution des ventes</h3>
                  <p className="abc-sub abc-sub-tight">6 derniers mois</p>
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
                  <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} name="Ventes" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="commissions" stroke="var(--brand)" strokeWidth={2} name="Commissions" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="abc-card no-pad">
              <div className="abc-top-card-head">
                <div>
                  <h3 className="abc-h3">Activité récente</h3>
                  <p className="abc-sub abc-sub-tight">Derniers calculs</p>
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
                        style={{ background: 'var(--brand)', color: 'var(--brand-fg)', width: 30, height: 30, fontSize: 11 }}
                      >
                        {initials}
                      </div>
                      <div className="abc-activity-info">
                        <span className="abc-activity-name">{h.employeeName}</span>
                        <span className="abc-activity-meta">{date} · {h.employeeRole}</span>
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
                  <h3 className="abc-h3">Commissions par mois</h3>
                  <p className="abc-sub abc-sub-tight">Tendance des versements</p>
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
                  <Bar dataKey="commissions" fill="var(--brand)" radius={[6, 6, 0, 0]} name="Commissions" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {topPerformers.length > 0 && (
              <div className="abc-card no-pad">
                <div className="abc-top-card-head">
                  <div>
                    <h3 className="abc-h3">Top performers</h3>
                    <p className="abc-sub abc-sub-tight">Par commissions totales</p>
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
                          style={{ background: colors[i], color: i === 0 ? 'var(--brand-fg)' : '#fff', width: 36, height: 36, fontSize: 12 }}
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
              <span className="abc-stat-lbl">employés uniques</span>
            </div>
            <span className="abc-stat-sep" />
            <div className="abc-stat-item is-amber">
              <span className="abc-stat-dot" style={{ background: 'var(--brand)' }} />
              <span className="abc-stat-num">{kpi.totalCalcs}</span>
              <span className="abc-stat-lbl">calculs effectués</span>
            </div>
            <span className="abc-stat-sep" />
            <div className="abc-stat-item">
              <span className="abc-stat-num">
                {kpi.totalCalcs > 0 ? fc(kpi.totalCommissions / kpi.totalCalcs) : '—'}
              </span>
              <span className="abc-stat-lbl">commission moyenne / calcul</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
