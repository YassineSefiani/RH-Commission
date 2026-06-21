import { useState, useMemo } from 'react';
import { ChevronDown, Download, FileDown, Loader2, Trash2, Search, FileSpreadsheet, CheckSquare, CheckCircle } from 'lucide-react';
import ExcelJS from 'exceljs';
import { useHistory } from '../context/HistoryContext';
import { exportHistoryPDF, exportSingleRecordPDF } from '../utils/pdfExport';
import { useLang } from '../context/LangContext';
import { toast } from 'sonner';
import { ConfirmDialog } from '../components/ConfirmDialog';

export default function HistoryPage() {
  const { history, deleteCalculation, archiveCalculation } = useHistory();
  const { t, lang } = useLang();
  const h_ = t.history;

  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  
  // États de chargement
  const [isArchivingBatch, setIsArchivingBatch] = useState(false); // Global
  const [archivingBatches, setArchivingBatches] = useState<Record<string, boolean>>({}); // Par lot
  const [isClearing, setIsClearing] = useState(false); 
  
  const [localValidations, setLocalValidations] = useState<Record<string, boolean>>({});

  const userRole = useMemo(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return String(u.superRole || u.role || '').toUpperCase().trim();
    } catch {
      return '';
    }
  }, []);

  const fc = (v: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(v);

  const mergedHistory = useMemo(() => {
    return history.map(h => ({
      ...h,
      isArchived: localValidations[h.id] !== undefined ? localValidations[h.id] : (h.isArchived || false)
    }));
  }, [history, localValidations]);

  const filtered = useMemo(() => {
    return mergedHistory.filter((h) => {
      if (userRole !== 'ADV' && !h.isArchived) {
        return false;
      }

      const d = new Date(h.date);
      const sMatch = h.employeeName.toLowerCase().includes(search.toLowerCase());
      const mMatch = !selectedMonth || String(d.getMonth()) === selectedMonth;
      const yMatch = !selectedYear || String(d.getFullYear()) === selectedYear;
      return sMatch && mMatch && yMatch;
    });
  }, [mergedHistory, search, selectedMonth, selectedYear, userRole]);

  const hasUnarchivedSimulations = useMemo(() => {
    return filtered.some(h => !h.isArchived);
  }, [filtered]);

  const unarchivedSimulationsGlobally = useMemo(() => {
    return history.filter(h => !h.isArchived);
  }, [history]);

  const archivedCalculationsGlobally = useMemo(() => {
    return history.filter(h => h.isArchived);
  }, [history]);

  const canShowClearButton = (userRole === 'ADMIN' || userRole === 'RH') 
    ? archivedCalculationsGlobally.length > 0 
    : (userRole === 'ADV' && unarchivedSimulationsGlobally.length > 0);

  // ✨ NOUVEAU REGROUPEMENT : Les calculs validés fusionnent par mois !
  const grouped = useMemo(() => {
    const map = new Map<string, { batchId: string; title: string; date: Date; items: typeof history; total: number; count: number; isArchived: boolean }>();
    
    filtered.forEach((h) => {
      const d = new Date(h.date);
      const monthKey = `month-${d.getFullYear()}-${d.getMonth()}`;
      
      // La magie est ici : si c'est archivé/validé, on l'envoie dans le dossier du mois.
      // Sinon, on le garde dans son lot de simulation (batchId).
      const k = h.isArchived ? monthKey : (h.batchId || monthKey);
      
      if (!map.has(k)) {
        const isMonthlyGroup = (k === monthKey);
        
        let rawTitle = isMonthlyGroup 
          ? d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', { month: 'long', year: 'numeric' })
          : (h.simulationName || 'Simulation');
          
        // Mettre une majuscule au mois (ex: "Juin 2026")
        if (isMonthlyGroup) {
          rawTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
        }

        map.set(k, { 
          batchId: k,
          title: rawTitle,
          date: d, 
          items: [], 
          total: 0, 
          count: 0,
          isArchived: true // Sera passé à false si on trouve un élément non archivé
        });
      }
      
      const g = map.get(k)!;
      g.items.push(h);
      g.total += h.finalSalary;
      g.count += 1;
      
      if (!h.isArchived) g.isArchived = false;
      if (d > g.date) g.date = d; // Garde la date la plus récente
    });
    
    return Array.from(map.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [filtered, lang]);

  const totalPayroll = filtered.reduce((s, h) => s + h.finalSalary, 0);
  const totalComm    = filtered.reduce((s, h) => s + h.commissions, 0);

  const handleArchiveAllFiltered = async () => {
    const unarchivedItems = filtered.filter(h => !h.isArchived);
    if (unarchivedItems.length === 0) return;

    if (!archiveCalculation) {
      toast.error("Action de validation globale non disponible");
      return;
    }

    setIsArchivingBatch(true);
    try {
      const newValidations = unarchivedItems.reduce((acc, item) => {
        acc[item.id] = true;
        return acc;
      }, {} as Record<string, boolean>);
      
      setLocalValidations(prev => ({ ...prev, ...newValidations }));
      
      await Promise.all(unarchivedItems.map(async (h) => {
        await archiveCalculation(h.id);
      }));
      
      toast.success(lang === 'en' ? 'All simulations validated successfully' : 'Toutes les simulations du groupe ont été validées !');
    } catch (error) {
      console.error("Erreur lors de la validation groupée :", error);
      toast.error("Une erreur est survenue lors de la validation globale");
    } finally {
      setIsArchivingBatch(false);
    }
  };

  const handleArchiveBatch = async (batchId: string) => {
    const itemsToArchive = filtered.filter(h => 
      (h.batchId === batchId || (!h.batchId && `month-${new Date(h.date).getFullYear()}-${new Date(h.date).getMonth()}` === batchId)) 
      && !h.isArchived
    );

    if (itemsToArchive.length === 0) return;

    if (!archiveCalculation) {
      toast.error("Action de validation non disponible");
      return;
    }

    setArchivingBatches(prev => ({ ...prev, [batchId]: true }));
    try {
      const newValidations = itemsToArchive.reduce((acc, item) => {
        acc[item.id] = true;
        return acc;
      }, {} as Record<string, boolean>);
      
      setLocalValidations(prev => ({ ...prev, ...newValidations }));
      
      await Promise.all(itemsToArchive.map(async (h) => {
        await archiveCalculation(h.id);
      }));
      
      toast.success(lang === 'en' ? 'Simulation validated successfully' : 'Lot de simulation validé avec succès !');
    } catch (error) {
      console.error("Erreur lors de la validation du lot :", error);
      toast.error("Une erreur est survenue lors de la validation du lot");
    } finally {
      setArchivingBatches(prev => ({ ...prev, [batchId]: false }));
    }
  };

  const handleExportAll = async () => {
    if (filtered.length === 0) return;
    setExporting('all');
    try {
      const suffix = search || selectedMonth || selectedYear ? 'filtre' : 'complet';
      await exportHistoryPDF(filtered, `historique-commissions-${suffix}.pdf`);
      toast.success(lang === 'en' ? 'PDF downloaded successfully' : 'PDF téléchargé avec succès');
    } catch {
      toast.error(lang === 'en' ? 'Error generating PDF' : 'Erreur lors de la génération du PDF');
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = async () => {
    if (filtered.length === 0) return;
    
    try {
      const suffix = search || selectedMonth || selectedYear ? 'filtre' : 'complet';

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(lang === 'en' ? 'History' : 'Historique');

      worksheet.columns = [
        { header: lang === 'en' ? 'Employee' : 'Employé', key: 'employee', width: 28 },
        { header: lang === 'en' ? 'Role' : 'Rôle', key: 'role', width: 22 },
        { header: lang === 'en' ? 'Date' : 'Date', key: 'date', width: 16 },
        { header: lang === 'en' ? 'Commissions' : 'Commissions', key: 'commissions', width: 18 },
        { header: lang === 'en' ? 'Bonus' : 'Bonus', key: 'bonus', width: 16 },
        { header: lang === 'en' ? 'Final Salary' : 'Salaire Final', key: 'finalSalary', width: 20 }
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.height = 28;
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEA580C' } };
        cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      filtered.forEach((h) => {
        const formattedDate = new Date(h.date).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR');
        
        const row = worksheet.addRow({
          employee: h.employeeName,
          role: h.employeeRole,
          date: formattedDate,
          commissions: h.commissions || 0,
          bonus: h.bonuses || 0,
          finalSalary: h.finalSalary || 0
        });

        row.height = 22;
        row.alignment = { vertical: 'middle' };

        row.getCell('commissions').numFmt = '#,##0" MAD"';
        row.getCell('bonus').numFmt = '#,##0" MAD"';
        row.getCell('finalSalary').numFmt = '#,##0" MAD"';
      });

      worksheet.addRow([]);

      const sumComm = filtered.reduce((acc, h) => acc + (h.commissions || 0), 0);
      const sumBonus = filtered.reduce((acc, h) => acc + (h.bonuses || 0), 0);
      const sumFinal = filtered.reduce((acc, h) => acc + (h.finalSalary || 0), 0);

      const totalsRow = worksheet.addRow({
        employee: lang === 'en' ? 'GENERAL TOTAL' : 'TOTAL GÉNÉRAL',
        role: '',
        date: '',
        commissions: sumComm,
        bonus: sumBonus,
        finalSalary: sumFinal
      });

      totalsRow.height = 26;
      
      totalsRow.getCell('commissions').numFmt = '#,##0" MAD"';
      totalsRow.getCell('bonus').numFmt = '#,##0" MAD"';
      totalsRow.getCell('finalSalary').numFmt = '#,##0" MAD"';

      totalsRow.eachCell((cell) => {
        cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF9A3412' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF7ED' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFEA580C' } },
          bottom: { style: 'double', color: { argb: 'FFEA580C' } }
        };
        cell.alignment = { vertical: 'middle' };
      });
      totalsRow.getCell('employee').alignment = { vertical: 'middle', horizontal: 'left' };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `historique-commissions-${suffix}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);

      toast.success(lang === 'en' ? 'Excel exported successfully' : 'Fichier Excel téléchargé avec succès');
    } catch (error) {
      console.error('Erreur export ExcelJS:', error);
    }
  };

  const handleExportOne = async (record: typeof history[0]) => {
    setExporting(record.id);
    try {
      await exportSingleRecordPDF(record);
      toast.success(lang === 'en' ? `PDF for ${record.employeeName} downloaded` : `PDF de ${record.employeeName} téléchargé`);
    } catch {
      toast.error(lang === 'en' ? 'Error generating PDF' : 'Erreur lors de la génération du PDF');
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
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {userRole === 'ADV' && hasUnarchivedSimulations && (
            <button
              className="abc-btn abc-btn-primary abc-btn-sm"
              style={{ backgroundColor: '#10b981', color: 'white' }}
              onClick={handleArchiveAllFiltered}
              disabled={isArchivingBatch}
              title={lang === 'en' ? 'Validate and publish selection' : 'Valider et transmettre la sélection'}
            >
              {isArchivingBatch ? <Loader2 size={13} className="animate-spin" /> : <CheckSquare size={13} />}
              <span>{lang === 'en' ? 'Validate All Pending' : 'Tout valider'}</span>
            </button>
          )}

          <button
            className="abc-btn abc-btn-secondary abc-btn-sm"
            onClick={handleExportAll}
            disabled={filtered.length === 0 || exporting === 'all'}
          >
            {exporting === 'all' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            {exporting === 'all' ? (lang === 'en' ? 'Generating…' : 'Génération…') : h_.exportPDF}
          </button>
          
          <button
            className="abc-btn abc-btn-secondary abc-btn-sm"
            onClick={handleExportExcel}
            disabled={filtered.length === 0}
            title={lang === 'en' ? 'Export to Excel' : 'Exporter vers Excel'}
          >
            <FileSpreadsheet size={13} className="text-emerald-600" />
            <span>Excel</span>
          </button>

          {canShowClearButton && (
            <ConfirmDialog
              trigger={
                <button className="abc-btn abc-btn-secondary abc-btn-sm abc-text-danger" disabled={isClearing}>
                  {isClearing ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  {userRole === 'ADV' ? (lang === 'en' ? 'Clear Simulations' : 'Purger Simulations') : (lang === 'en' ? 'Clear Validated' : 'Purger Validés')}
                </button>
              }
              title={userRole === 'ADV' 
                ? (lang === 'en' ? 'Clear all simulations?' : "Purger les simulations ?") 
                : (lang === 'en' ? 'Clear validated records?' : "Purger les calculs validés ?")}
              description={userRole === 'ADV'
                ? (lang === 'en' 
                  ? `This will delete ${unarchivedSimulationsGlobally.length} unvalidated simulation(s).` 
                  : `Cela supprimera définitivement ${unarchivedSimulationsGlobally.length} simulation(s) non validée(s).`)
                : (lang === 'en' 
                  ? `This will permanently delete ${archivedCalculationsGlobally.length} validated record(s).` 
                  : `Cela supprimera définitivement ${archivedCalculationsGlobally.length} calcul(s) validé(s).`)}
              confirmLabel={lang === 'en' ? 'Delete all' : 'Tout supprimer'}
              destructive
              onConfirm={async () => {
                setIsClearing(true);
                try {
                  if (userRole === 'ADV') {
                    await Promise.all(unarchivedSimulationsGlobally.map(h => deleteCalculation(h.id).catch(() => {})));
                    toast.success(lang === 'en' ? 'Simulations cleared' : 'Simulations purgées avec succès');
                  } else {
                    await Promise.all(archivedCalculationsGlobally.map(h => deleteCalculation(h.id).catch(() => {})));
                    toast.success(lang === 'en' ? 'Validated records cleared' : 'Calculs validés purgés avec succès');
                  }
                } finally {
                  setIsClearing(false);
                }
              }}
            />
          )}
        </div>
      </div>

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
            {filtered.length} résultat(s) — l'export PDF et Excel reprendra uniquement cette sélection
          </div>
        )}
      </div>

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
          <div key={g.batchId} className="abc-month-block">
            <div className="abc-month-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div className="abc-month-title" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="abc-eyebrow text-gray-500" style={{ display: 'block', marginBottom: '2px' }}>
                  {g.date.toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h3 className="abc-h3" style={{ margin: 0, fontSize: '1.125rem', fontWeight: 'bold' }}>{g.title}</h3>
                  {g.isArchived ? (
                    <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                      <CheckCircle size={12} /> {lang === 'en' ? 'Validated' : 'Validé'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/10">
                      {lang === 'en' ? 'Simulation Batch' : 'Lot Simulation'}
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-500 font-medium block mt-1">{g.count} {lang === 'en' ? 'employee(s)' : 'employé(s)'}</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div className="abc-month-total" style={{ textAlign: 'right' }}>
                  <span className="abc-eyebrow block mb-1 text-gray-500">{g.isArchived ? (lang === 'en' ? 'Total paid' : 'Total versé') : (lang === 'en' ? 'Batch total' : 'Total du lot')}</span>
                  <span className="abc-month-total-num text-xl font-bold text-orange-600">{fc(g.total)}</span>
                </div>

                {userRole === 'ADV' && !g.isArchived && (
                  <button
                    className="abc-btn abc-btn-primary"
                    style={{ 
                      backgroundColor: '#10b981', 
                      color: 'white', 
                      height: 'fit-content',
                      padding: '10px 20px', 
                      fontSize: '15px', 
                      fontWeight: 'bold',
                      boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
                    }}
                    onClick={() => handleArchiveBatch(g.batchId)}
                    disabled={archivingBatches[g.batchId]}
                    title={lang === 'en' ? 'Validate this specific simulation' : 'Valider spécifiquement cette simulation'}
                  >
                    {archivingBatches[g.batchId] ? <Loader2 size={20} className="animate-spin" /> : <CheckSquare size={20} />}
                    <span>{lang === 'en' ? 'Validate Simulation' : 'Valider la simulation'}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="abc-history-list">
              {g.items.map((h) => {
                const isOpen = expanded === h.id;
                const initials = getInitials(h.employeeName);
                
                const canDelete = !h.isArchived 
                  ? (userRole === 'ADV') 
                  : (userRole === 'RH' || userRole === 'ADMIN');

                return (
                  <div key={h.id} className={`abc-history-row ${isOpen ? 'is-open' : ''}`}>
                    <button
                      type="button"
                      className="abc-history-summary"
                      onClick={() => setExpanded(isOpen ? null : h.id)}
                    >
                      <div
                        className="abc-avatar abc-avatar-md"
                        style={{ background: h.isArchived ? 'var(--brand)' : '#94a3b8', color: 'white' }}
                      >
                        {initials}
                      </div>
                      <div className="abc-history-info">
                        <div className="flex items-center gap-2">
                          <span className="abc-history-name">{h.employeeName}</span>
                          
                          {h.isArchived ? (
                            <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                              <CheckCircle size={10} /> {lang === 'en' ? 'Validated' : 'Validé'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/10">
                              {lang === 'en' ? 'Pending' : 'En attente'}
                            </span>
                          )}
                        </div>
                        <span className="abc-history-meta">{formatDateLong(h.date)} · {h.employeeRole}</span>
                      </div>

                      <div className="abc-history-stats">
                        <div className="abc-history-stat">
                          <span className="abc-history-stat-lblTRANS">{lang === 'en' ? 'Sales' : 'Ventes'}</span>
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
                        <div className="abc-detail-stack">
                          <span className="abc-eyebrow">{lang === 'en' ? 'Breakdown' : 'Décomposition'}</span>
                          <div className="abc-detail-formula">
                            <span>{fc(h.baseSalary)}</span>
                            <span className="abc-formula-op">+</span>
                            <span className="abc-text-success">{fc(h.commissions)}</span>
                            <span className="abc-formula-op">+</span>
                            <span className="abc-text-success">{fc(h.bonuses)}</span>
                            <span className="abc-formula-op">=</span>
                            <strong>{fc(h.finalSalary)}</strong>
                          </div>
                        </div>

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

                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                          
                          {/* Validation d'un employé unique */}
                          {userRole === 'ADV' && !h.isArchived && (
                            <button
                              className="abc-btn abc-btn-primary abc-btn-sm"
                              style={{ backgroundColor: '#10b981', color: 'white' }}
                              onClick={async () => {
                                try {
                                  if (archiveCalculation) {
                                    setLocalValidations(prev => ({ ...prev, [h.id]: true }));
                                    await archiveCalculation(h.id);
                                    toast.success(lang === 'en' ? 'Calculation validated successfully' : 'Calcul validé avec succès !');
                                  }
                                } catch (err) {
                                  console.error(err);
                                  setLocalValidations(prev => ({ ...prev, [h.id]: false }));
                                  toast.error("Échec de la validation du calcul");
                                }
                              }}
                            >
                              <CheckCircle size={13} />
                              {lang === 'en' ? 'Validate Row' : 'Valider ce calcul'}
                            </button>
                          )}

                          <button
                            className="abc-btn abc-btn-ghost abc-btn-sm"
                            onClick={() => handleExportOne(h)}
                            disabled={exporting === h.id}
                          >
                            {exporting === h.id ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
                            {h_.exportPDF}
                          </button>

                          {canDelete ? (
                            <ConfirmDialog
                              trigger={
                                <button className="abc-btn abc-btn-danger abc-btn-sm">
                                  <Trash2 size={13} />
                                  {t.common.delete}
                                </button>
                              }
                              title={lang === 'en' ? 'Delete this calculation?' : 'Supprimer ce calcul ?'}
                              description={lang === 'en' 
                                ? `This action is permanent. Are you sure you want to delete the calculation for ${h.employeeName}?`
                                : `Cette action est irréversible. Êtes-vous sûr de vouloir supprimer définitivement le calcul de ${h.employeeName} ?`}
                              confirmLabel={lang === 'en' ? 'Delete' : 'Supprimer'}
                              destructive
                              onConfirm={() => deleteCalculation(h.id)}
                            />
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              {lang === 'en' ? 'Validated: Only HR/Admin can delete' : 'Validé : Seul le RH/Admin peut supprimer'}
                            </span>
                          )}
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