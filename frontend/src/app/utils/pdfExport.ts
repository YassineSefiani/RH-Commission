import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CalculationHistory } from '../context/HistoryContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + ' MAD';
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateShort(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ─── Couleurs ──────────────────────────────────────────────────────────────────
const ORANGE  = [247, 168,   0] as [number, number, number];
const NAVY    = [ 24,  50,  75] as [number, number, number];
const GRAY_BG = [248, 249, 250] as [number, number, number];
const WHITE   = [255, 255, 255] as [number, number, number];
const GREEN   = [ 22, 163,  74] as [number, number, number];
const RED     = [220,  38,  38] as [number, number, number];

// ─── En-tête commun ────────────────────────────────────────────────────────────
function drawHeader(doc: jsPDF, subtitle: string) {
  const pageW = doc.internal.pageSize.getWidth();

  // Bande navy
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageW, 28, 'F');

  // Titre
  doc.setTextColor(...WHITE);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ABCDIS — Rapport des Commissions', 14, 12);

  // Sous-titre
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, 14, 21);

  // Date d'export (droite)
  doc.setFontSize(8);
  const now = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  doc.text(`Exporté le ${now}`, pageW - 14, 21, { align: 'right' });

  // Ligne orange
  doc.setFillColor(...ORANGE);
  doc.rect(0, 28, pageW, 2, 'F');
}

// ─── Pied de page ──────────────────────────────────────────────────────────────
function drawFooter(doc: jsPDF) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const total = (doc.internal as any).getNumberOfPages();

  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFillColor(...GRAY_BG);
    doc.rect(0, pageH - 10, pageW, 10, 'F');
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('ABCDIS — Document confidentiel', 14, pageH - 3.5);
    doc.text(`Page ${i} / ${total}`, pageW - 14, pageH - 3.5, { align: 'right' });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT 1 : Tableau récapitulatif de tout l'historique (ou filtré)
// ═══════════════════════════════════════════════════════════════════════════════
export function exportHistoryPDF(records: CalculationHistory[], filename = 'historique-commissions.pdf') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  drawHeader(doc, `Historique complet — ${records.length} calcul(s)`);

  // Totaux
  const totalComm    = records.reduce((s, r) => s + r.commissions, 0);
  const totalBonus   = records.reduce((s, r) => s + r.bonuses, 0);
  const totalPenal   = records.reduce((s, r) => s + r.penalties, 0);
  const totalFinal   = records.reduce((s, r) => s + r.finalSalary, 0);

  // Tableau principal
  autoTable(doc, {
    startY: 36,
    head: [[
      'Employé', 'Rôle', 'Date', 'Commissions', 'Bonus', 'Pénalités', 'Salaire Final',
    ]],
    body: records.map(r => [
      r.employeeName,
      r.employeeRole,
      formatDateShort(r.date),
      formatCurrency(r.commissions),
      formatCurrency(r.bonuses),
      r.penalties > 0 ? formatCurrency(r.penalties) : '—',
      formatCurrency(r.finalSalary),
    ]),
    foot: [[
      { content: 'TOTAL', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: formatCurrency(totalComm),  styles: { fontStyle: 'bold', textColor: GREEN } },
      { content: formatCurrency(totalBonus), styles: { fontStyle: 'bold', textColor: GREEN } },
      { content: totalPenal > 0 ? formatCurrency(totalPenal) : '—', styles: { fontStyle: 'bold', textColor: RED } },
      { content: formatCurrency(totalFinal), styles: { fontStyle: 'bold', textColor: ORANGE, fontSize: 11 } },
    ]],
    headStyles: {
      fillColor: NAVY,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 9,
    },
    footStyles: {
      fillColor: GRAY_BG,
      fontSize: 9,
    },
    bodyStyles: { fontSize: 8.5 },
    alternateRowStyles: { fillColor: [252, 252, 252] },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 38 },
      2: { cellWidth: 28 },
      3: { halign: 'right', cellWidth: 36 },
      4: { halign: 'right', cellWidth: 30 },
      5: { halign: 'right', cellWidth: 30 },
      6: { halign: 'right', cellWidth: 38, fontStyle: 'bold', textColor: ORANGE },
    },
    margin: { left: 14, right: 14 },
    showFoot: 'lastPage',
  });

  // Encadré résumé en bas
  const finalY = (doc as any).lastAutoTable.finalY + 8;
  const boxH = 22;
  if (finalY + boxH < doc.internal.pageSize.getHeight() - 14) {
    doc.setFillColor(...GRAY_BG);
    doc.roundedRect(14, finalY, pageW - 28, boxH, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...NAVY);
    doc.setFont('helvetica', 'bold');
    doc.text('Résumé', 20, finalY + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    const cols = [
      { label: 'Nb calculs',    value: String(records.length) },
      { label: 'Total Comm.',   value: formatCurrency(totalComm),   color: GREEN  },
      { label: 'Total Bonus',   value: formatCurrency(totalBonus),  color: GREEN  },
      { label: 'Total Pénal.',  value: formatCurrency(totalPenal),  color: RED    },
      { label: 'MASSE SALARIALE', value: formatCurrency(totalFinal), color: ORANGE },
    ];
    const colW = (pageW - 28) / cols.length;
    cols.forEach((col, i) => {
      const x = 14 + i * colW + colW / 2;
      doc.setTextColor(120, 120, 120);
      doc.setFont('helvetica', 'normal');
      doc.text(col.label, x, finalY + 13, { align: 'center' });
      doc.setTextColor(...(col.color ?? NAVY));
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(col.value, x, finalY + 19, { align: 'center' });
      doc.setFontSize(8);
    });
  }

  drawFooter(doc);
  doc.save(filename);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT 2 : Fiche individuelle d'un seul employé
// ═══════════════════════════════════════════════════════════════════════════════
export function exportSingleRecordPDF(record: CalculationHistory) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  drawHeader(doc, `Fiche de commission — ${record.employeeName}`);

  let y = 38;

  // ── Identité employé ──
  doc.setFillColor(...GRAY_BG);
  doc.roundedRect(14, y, pageW - 28, 24, 3, 3, 'F');

  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(record.employeeName, 22, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(record.employeeRole || 'N/A', 22, y + 16);
  doc.text(`Date du calcul : ${formatDate(record.date)}`, 22, y + 22);

  y += 32;

  // ── Tableau de détail ──
  const details: [string, string][] = [];

  if (record.commissions > 0)
    details.push(['Commissions', formatCurrency(record.commissions)]);
  if (record.bonuses > 0)
    details.push(['Bonus', formatCurrency(record.bonuses)]);
  if (record.penalties > 0)
    details.push(['Pénalités', '- ' + formatCurrency(record.penalties)]);

  // Détail règles si disponible
  if (Array.isArray(record.details) && record.details.length > 0) {
    record.details.forEach((d: any) => {
      const label = d.code ? `${d.code} — ${d.libelle ?? d.name ?? ''}` : (d.libelle ?? d.name ?? 'Règle');
      const amount = d.montant ?? d.amount ?? 0;
      details.push([`  ${label}`, formatCurrency(amount)]);
    });
  }

  autoTable(doc, {
    startY: y,
    head: [['Élément de rémunération', 'Montant']],
    body: details,
    headStyles: {
      fillColor: NAVY,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [252, 252, 252] },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { halign: 'right', cellWidth: 50 },
    },
    margin: { left: 14, right: 14 },
  });

  const afterTable = (doc as any).lastAutoTable.finalY + 10;

  // ── Encadré salaire final ──
  doc.setFillColor(...ORANGE);
  doc.roundedRect(14, afterTable, pageW - 28, 18, 3, 3, 'F');

  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('SALAIRE FINAL (COMMISSIONS)', 22, afterTable + 8);
  doc.setFontSize(14);
  doc.text(formatCurrency(record.finalSalary), pageW - 22, afterTable + 11, { align: 'right' });

  // ── Contraintes appliquées ──
  if (record.constraintsApplied && record.constraintsApplied.length > 0) {
    const cY = afterTable + 28;
    doc.setTextColor(...NAVY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Contraintes appliquées :', 14, cY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8);
    const tags = record.constraintsApplied.join('   •   ');
    doc.text(tags, 14, cY + 6, { maxWidth: pageW - 28 });
  }

  drawFooter(doc);
  const safeName = record.employeeName.replace(/\s+/g, '_');
  doc.save(`commission_${safeName}_${formatDateShort(record.date).replace(/\//g, '-')}.pdf`);
}
