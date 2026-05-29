import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CalculationHistory } from '../context/HistoryContext';

// ─── Couleurs ────────────────────────────────────────────────────────────────
const C_DARK:   [number, number, number] = [24, 50, 75];
const C_ORANGE: [number, number, number] = [247, 168, 0];
const C_LGRAY:  [number, number, number] = [170, 184, 198];
const C_WHITE:  [number, number, number] = [255, 255, 255];
const C_GREEN:  [number, number, number] = [22, 163, 74];
const C_RED:    [number, number, number] = [220, 38, 38];
const C_BODY:   [number, number, number] = [31, 41, 55];
const C_ALT:    [number, number, number] = [248, 249, 250];
const C_FGRAY:  [number, number, number] = [240, 244, 248];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(v: number) {
  const formattedString = new Intl.NumberFormat('fr-FR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(v);

  // Remplace les espaces insécables (\u202F ou \u00A0) par un espace standard
  const safeString = formattedString.replace(/[\u202F\u00A0]/g, ' ');

  return safeString + ' MAD';
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDateLong(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function nowStr() {
  return new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function lastY(doc: jsPDF, fallback: number): number {
  return (doc as any).lastAutoTable?.finalY ?? fallback;
}

// ─── En-tête commun ───────────────────────────────────────────────────────────
function drawHeader(doc: jsPDF, subtitle: string, pageW: number, badge?: string): number {
  const h = 22;
  doc.setFillColor(...C_DARK);
  doc.rect(0, 0, pageW, h, 'F');

  doc.setTextColor(...C_WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('ABCDIS — Rapport des Commissions', 10, 9);

  doc.setTextColor(...C_ORANGE);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(subtitle, 10, 16);

  if (badge) {
    const bW = doc.getTextWidth(badge) + 8;
    const bX = pageW - 10 - bW;
    doc.setFillColor(...C_ORANGE);
    doc.roundedRect(bX, 5, bW, 6, 1.5, 1.5, 'F');
    doc.setTextColor(...C_WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(badge, bX + bW / 2, 9.2, { align: 'center' });
  }

  doc.setTextColor(...C_LGRAY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Exporté le ${nowStr()}`, pageW - 10, 17, { align: 'right' });

  return h;
}

// ─── Pied de page commun ──────────────────────────────────────────────────────
function drawFooter(doc: jsPDF, pageW: number, pageH: number, rightText?: string) {
  const fH = 10;
  const y = pageH - fH;
  doc.setFillColor(...C_DARK);
  doc.rect(0, y, pageW, fH, 'F');
  doc.setTextColor(...C_LGRAY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Document confidentiel — ABCDIS', 10, y + 6);
  if (rightText) {
    doc.setTextColor(...C_WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(rightText, pageW - 10, y + 6, { align: 'right' });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT 1 : Tableau récapitulatif (historique complet ou filtré)
// ═══════════════════════════════════════════════════════════════════════════════
export function exportHistoryPDF(records: CalculationHistory[], filename = 'historique-commissions.pdf') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = 297;
  const pageH = 210;

  const headerBottom = drawHeader(
    doc,
    'Historique complet des calculs de commissions',
    pageW,
    `${records.length} enregistrement(s)`,
  );

  const totalComm  = records.reduce((s, r) => s + r.commissions, 0);
  const totalBonus = records.reduce((s, r) => s + r.bonuses, 0);
  const totalPenal = records.reduce((s, r) => s + r.penalties, 0);
  const totalFinal = records.reduce((s, r) => s + r.finalSalary, 0);

  autoTable(doc, {
    startY: headerBottom + 4,
    margin: { left: 10, right: 10, bottom: 16 },
    head: [['Employé', 'Rôle', 'Date', 'Commissions', 'Bonus', 'Pénalités', 'Salaire Final']],
    body: records.map(r => [
      r.employeeName,
      r.employeeRole || '—',
      fmtDate(r.date),
      fmt(r.commissions),
      fmt(r.bonuses),
      r.penalties > 0 ? fmt(r.penalties) : '—',
      fmt(r.finalSalary),
    ]),
    foot: [[
      `TOTAL (${records.length} employé(s))`, '', '',
      fmt(totalComm),
      fmt(totalBonus),
      totalPenal > 0 ? fmt(totalPenal) : '—',
      fmt(totalFinal),
    ]],
    showFoot: 'lastPage',
    headStyles: { fillColor: C_DARK, textColor: C_WHITE, fontStyle: 'bold', fontSize: 8 },
    footStyles: { fillColor: C_FGRAY, textColor: C_DARK, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: C_BODY },
    alternateRowStyles: { fillColor: C_ALT },
    columnStyles: {
      3: { textColor: C_GREEN, fontStyle: 'bold', halign: 'right' },
      4: { textColor: C_GREEN, fontStyle: 'bold', halign: 'right' },
      5: { textColor: C_RED, halign: 'right' },
      6: { textColor: C_ORANGE, fontStyle: 'bold', fontSize: 9, halign: 'right' },
    },
  });

  drawFooter(doc, pageW, pageH, `MASSE SALARIALE TOTALE : ${fmt(totalFinal)}`);
  doc.save(filename);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT 2 : Fiche individuelle d'un seul employé
// ═══════════════════════════════════════════════════════════════════════════════
export function exportSingleRecordPDF(record: CalculationHistory) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const pageH = 297;

  const headerBottom = drawHeader(
    doc,
    `Fiche de commission — ${record.employeeName}`,
    pageW,
  );

  // ─── Zone identité employé ─────────────────────────────────────────────────
  const infoY = headerBottom + 4;
  const infoH = 22;
  doc.setFillColor(248, 249, 250);
  doc.rect(10, infoY, pageW - 20, infoH, 'F');

  doc.setTextColor(...C_BODY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(record.employeeName, 14, infoY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(record.employeeRole || 'N/A', 14, infoY + 14);
  doc.text(`Calcul du ${fmtDateLong(record.date)}`, 14, infoY + 20);

  // Badge salaire final
  const bW = 58;
  const bX = pageW - 12 - bW;
  doc.setFillColor(...C_DARK);
  doc.roundedRect(bX, infoY + 2, bW, 18, 3, 3, 'F');
  doc.setTextColor(...C_ORANGE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('SALAIRE FINAL', bX + bW / 2, infoY + 9, { align: 'center' });
  doc.setTextColor(...C_WHITE);
  doc.setFontSize(10);
  doc.text(fmt(record.finalSalary), bX + bW / 2, infoY + 17, { align: 'center' });

  // ─── Tableau de détail ─────────────────────────────────────────────────────
  const detailRows: string[][] = [];
  if (record.baseSalary > 0)  detailRows.push(['Salaire de base', fmt(record.baseSalary)]);
  if (record.commissions > 0) detailRows.push(['Commissions', `+ ${fmt(record.commissions)}`]);
  if (record.bonuses > 0)     detailRows.push(['Bonus', `+ ${fmt(record.bonuses)}`]);
  if (record.penalties > 0)   detailRows.push(['Pénalités', `- ${fmt(record.penalties)}`]);

  if (Array.isArray(record.details) && record.details.length > 0) {
    record.details.forEach((d: any) => {
      const label = d.code
        ? `${d.code} — ${d.libelle ?? d.name ?? 'Règle'}`
        : (d.libelle ?? d.name ?? 'Règle');
      detailRows.push([label, fmt(d.montant ?? d.amount ?? 0)]);
    });
  }

  autoTable(doc, {
    startY: infoY + infoH + 4,
    margin: { left: 10, right: 10, bottom: 16 },
    head: [['Élément de rémunération', 'Montant']],
    body: detailRows.length > 0 ? detailRows : [['Aucun détail disponible', '—']],
    headStyles: { fillColor: C_DARK, textColor: C_WHITE, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: C_BODY },
    alternateRowStyles: { fillColor: C_ALT },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
  });

  // ─── Contraintes appliquées ────────────────────────────────────────────────
  if (record.constraintsApplied?.length) {
    const cy = lastY(doc, pageH - 50) + 8;
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.setFont('helvetica', 'italic');
    doc.text(
      `Contraintes appliquées : ${record.constraintsApplied.join(', ')}`,
      10, cy,
    );
  }

  drawFooter(doc, pageW, pageH);
  const safeName = record.employeeName.replace(/[^a-zA-Z0-9\-_]/g, '_');
  doc.save(`commission_${safeName}_${fmtDate(record.date).replace(/\//g, '-')}.pdf`);
}
