import { useState, useMemo } from 'react';
import { ChevronDown, Download, FileDown, Loader2, Trash2, Search } from 'lucide-react';
import { useHistory } from '../context/HistoryContext';
import { exportHistoryPDF, exportSingleRecordPDF } from '../utils/pdfExport';
import { useLang } from '../context/LangContext';
import { toast } from 'sonner';
import { ConfirmDialog } from '../components/ConfirmDialog';

export default function HistoryPage() {
  const { history, deleteCalculation, clearHistory } = useHistory();
  const { t, lang } = useLang();
  const h_ = t.history;

  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  const fc = (v: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(v);

  const filtered = useMemo(() => {
    return history.filter((h) => {
      const d = new Date(h.date);
      const sMatch = h.employeeName.toLowerCase().includes(search.toLowerCase());
      const mMatch = !selectedMonth || String(d.getMonth()) === selectedMonth;
      const yMatch = !selectedYear || String(d.getFullYear()) === selectedYear;
      return sMatch && mMatch && yMatch;
    });
  }, [history, search, selectedMonth, selectedYear]);

  // Group by month
  const grouped = useMemo(() => {
    const map = new Map<string, { date: Date; items: typeof history; total: number; count: number }>();
    filtered.forEach((h) => {
      const d = new Date(h.date);
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map.has(k)) map.set(k, { date: d, items: [], total: 0, count: 0 });
      const g = map.get(k)!;
      g.items.push(h);
      g.total += h.finalSalary;
      g.count += 1;
    });
    return [...map.values()].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [filtered]);

  const totalPayroll = filtered.reduce((s, h) => s + h.finalSalary, 0);
  const totalComm    = filtered.reduce((s, h) => s + h.commissions, 0);

  const handleExportAll = async () => {
    if (filtered.length === 0) return;
    setExporting('all');
    try {
      const suffix = search || selectedMonth || selectedYear ? 'filtre' : 'complet';
      await exportHistoryPDF(filtered, `historique-commissions-${suffix}.pdf`);
      toast.success('PDF téléchargé avec succès');
    } catch {
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setExporting(null);
    }
  };

  const handleExportOne = async (record: typeof history[0]) => {
    setExporting(record.id);
    try {
      await exportSingleRecordPDF(record);
      toast.success(`PDF de ${record.employeeName} téléchargé`);
    } catch {
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setExporting(null);
    }
  };

  const monthsFr = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const monthsEn = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthsOpts = [
    { value: '', label: lang === 'en' ? 'All months' : 'Tous les mois' },
    ...(lang === 'en' ? monthsEn : monthsFr).map((m, i) => ({ value: String(i), label: m })),
  ];

  const formatDateLong = (d: string) =>
    new Date(d).toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="abc-page-inner abc-stack-lg">
      {/* Stat strip */}
      <div className="abc-stat-strip">
        <div className="abc-stat-item">
          <span className="abc-stat-num">{filtered.length}</span>
          <span className="abc-stat-lbl">{lang === 'en' ? 'calculations' : 'calculs'}</span>
        </div>
        <span className="abc-stat-sep" />
        <div className="abc-stat-item">
          <span className="abc-stat-num">{fc(totalPayroll)}</span>
          <span className="abc-stat-lbl">{lang === 'en' ? 'total payroll' : 'masse salariale'}</span>
        </div>
        <div className="abc-stat-item">
          <span className="abc-stat-dot" style={{ background: 'var(--brand)' }} />
          <span className="abc-stat-num">{fc(totalComm)}</span>
          <span className="abc-stat-lbl">{t.dashboard.commissions.toLowerCase()}</span>
        </div>
        <span className="abc-stat-spacer" />
        <button
          className="abc-btn abc-btn-primary abc-btn-sm"
          onClick={handleExportAll}
          disabled={filtered.length === 0 || exporting === 'all'}
        >
          {exporting === 'all' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
          {exporting === 'all' ? (lang === 'en' ? 'Generating…' : 'Génération…') : h_.exportPDF}
          {filtered.length > 0 && exporting !== 'all' && (
            <span style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 999, padding: '1px 6px', fontSize: 10 }}>
              {filtered.length}
            </span>
          )}
        </button>
        {history.length > 0 && (
          <ConfirmDialog
            trigger={
              <button className="abc-btn abc-btn-secondary abc-btn-sm">
                <Trash2 size={13} />
                {h_.clearAll}
              </button>
            }
            title={lang === 'en' ? 'Clear all history?' : "Vider tout l'historique ?"}
            description={lang === 'en'
              ? `This will permanently delete ${history.length} record(s).`
              : `Cela supprimera définitivement ${history.length} enregistrement(s).`}
            confirmLabel={lang === 'en' ? 'Delete all' : 'Tout supprimer'}
            destructive
            onConfirm={clearHistory}
          />
        )}
      </div>

      {/* Filters */}
      <div className="abc-card no-pad">
        <div className="abc-table-toolbar">
          <div className="abc-search">
            <Search size={14} />
            <input
              placeholder={h_.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="abc-toolbar-selects">
            <select
              className="abc-mini-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {monthsOpts.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              className="abc-mini-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="">{lang === 'en' ? 'All years' : 'Toutes les années'}</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
            {(search || selectedMonth || selectedYear) && (
              <button
                className="abc-btn abc-btn-ghost abc-btn-sm"
                onClick={() => { setSearch(''); setSelectedMonth(''); setSelectedYear(''); }}
              >
                {h_.reset}
              </button>
            )}
          </div>
        </div>
        {(search || selectedMonth || selectedYear) && filtered.length > 0 && (
          <div style={{ padding: '6px 18px 10px', fontSize: 12, color: 'var(--brand-deep)' }}>
            {filtered.length} résultat(s) — l'export PDF reprendra uniquement cette sélection
          </div>
        )}
      </div>

      {/* Timeline */}
      {grouped.length === 0 ? (
        <div className="abc-card abc-empty-card">
          <Download size={32} strokeWidth={1.5} />
          <p>
            {history.length === 0
              ? h_.noHistorySub
              : (lang === 'en' ? 'No results for these filters.' : 'Aucun résultat pour ces filtres.')}
          </p>
        </div>
      ) : (
        grouped.map((g) => (
          <div key={g.date.toISOString()} className="abc-month-block">
            <div className="abc-month-head">
              <div className="abc-month-title">
                <span className="abc-eyebrow">
                  {g.date.toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', { month: 'long', year: 'numeric' })}
                </span>
                <span className="abc-h3">{g.count} calcul{g.count > 1 ? 's' : ''}</span>
              </div>
              <div className="abc-month-total">
                <span className="abc-eyebrow">{lang === 'en' ? 'Total paid' : 'Total versé'}</span>
                <span className="abc-month-total-num">{fc(g.total)}</span>
              </div>
            </div>

            <div className="abc-history-list">
              {g.items.map((h) => {
                const isOpen = expanded === h.id;
                const initials = getInitials(h.employeeName);
                return (
                  <div key={h.id} className={`abc-history-row ${isOpen ? 'is-open' : ''}`}>
                    <button
                      type="button"
                      className="abc-history-summary"
                      onClick={() => setExpanded(isOpen ? null : h.id)}
                    >
                      <div
                        className="abc-avatar abc-avatar-md"
                        style={{ background: 'var(--brand)', color: 'var(--brand-fg)' }}
                      >
                        {initials}
                      </div>
                      <div className="abc-history-info">
                        <span className="abc-history-name">{h.employeeName}</span>
                        <span className="abc-history-meta">{formatDateLong(h.date)} · {h.employeeRole}</span>
                      </div>

                      <div className="abc-history-stats">
                        <div className="abc-history-stat">
                          <span className="abc-history-stat-lbl">{lang === 'en' ? 'Sales' : 'Ventes'}</span>
                          <span className="abc-mono">{fc(h.totalSales)}</span>
                        </div>
                        <div className="abc-history-stat is-amber">
                          <span className="abc-history-stat-lbl">{t.dashboard.commissions}</span>
                          <span className="abc-mono">{fc(h.commissions)}</span>
                        </div>
                        <div className="abc-history-stat is-emerald">
                          <span className="abc-history-stat-lbl">{lang === 'en' ? 'Bonus' : 'Bonus'}</span>
                          <span className="abc-mono">{fc(h.bonuses)}</span>
                        </div>
                        <div className="abc-history-stat is-rose">
                          <span className="abc-history-stat-lbl">{lang === 'en' ? 'Penalties' : 'Pénalités'}</span>
                          <span className="abc-mono">{fc(h.penalties)}</span>
                        </div>
                      </div>

                      <div className="abc-history-final">
                        <span className="abc-eyebrow">{lang === 'en' ? 'Final salary' : 'Salaire final'}</span>
                        <span className="abc-history-final-num">{fc(h.finalSalary)}</span>
                      </div>

                      <span className={`abc-history-chevron ${isOpen ? 'is-open' : ''}`}>
                        <ChevronDown size={16} />
                      </span>
                    </button>

                    {isOpen && (
                      <div className="abc-history-detail">
                        {/* Formula */}
                        <div className="abc-detail-stack">
                          <span className="abc-eyebrow">{lang === 'en' ? 'Breakdown' : 'Décomposition'}</span>
                          <div className="abc-detail-formula">
                            <span>{fc(h.baseSalary)}</span>
                            <span className="abc-formula-op">+</span>
                            <span className="abc-text-success">{fc(h.commissions)}</span>
                            <span className="abc-formula-op">+</span>
                            <span className="abc-text-success">{fc(h.bonuses)}</span>
                            <span className="abc-formula-op">−</span>
                            <span className="abc-text-danger">{fc(h.penalties)}</span>
                            <span className="abc-formula-op">=</span>
                            <strong>{fc(h.finalSalary)}</strong>
                          </div>
                        </div>

                        {/* Constraints */}
                        {h.constraintsApplied && h.constraintsApplied.length > 0 && (
                          <div className="abc-detail-applied">
                            <span className="abc-eyebrow">{lang === 'en' ? 'Applied constraints' : 'Contraintes appliquées'}</span>
                            <div className="abc-chip-row">
                              {h.constraintsApplied.map((c, i) => (
                                <span key={i} className="abc-chip is-static">{c}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button
                            className="abc-btn abc-btn-ghost abc-btn-sm"
                            onClick={() => handleExportOne(h)}
                            disabled={exporting === h.id}
                          >
                            {exporting === h.id ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
                            {h_.exportPDF}
                          </button>
                          <button
                            className="abc-btn abc-btn-danger abc-btn-sm"
                            onClick={() => { if (confirm(lang === 'en' ? 'Delete this record?' : 'Supprimer ce calcul ?')) deleteCalculation(h.id); }}
                          >
                            <Trash2 size={13} />
                            {t.common.delete}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
