import { useRef, useState, useEffect, useMemo, useCallback, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router';
import {
  UploadCloud,
  Loader2,
  Target,
  AlertCircle,
  History,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { useLang } from '../context/LangContext';
import { useConstraints } from '../context/ConstraintsContext';
import { logAudit, fetchAuditLog } from '../services/auditApi';
import { importApi, type ApiObjectif, type ApiRealisation, type ApiTriage, type ApiVolume } from '../services/importApi';
import { MONTHS_FR, toPeriodeKey, toPeriodeLabel } from '../utils/periode';
import { parseExcelDate } from '../utils/excelDate';
import { matchesBrand } from '../utils/brandMatch';

import cocaBg from '../assets/coca cola.png';
import ferreroBg from '../assets/Ferrero Rocher.png';
import wallsBg from '../assets/walls.jpg';

// Utilitaire de normalisation des périodes pour correspondre au format attendu YYYY-MM
const formatPeriodeToYYYYMM = (raw: string, fallbackPeriod: string) => {
  const s = String(raw).toUpperCase().trim();

  // Déjà au format normalisé
  const isoMatch = s.match(/^(\d{4})-(\d{2})$/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}`;

  const yearMatch = s.match(/\d{4}/);
  let year = fallbackPeriod.match(/\d{4}/)?.[0] ?? "2026";
  if (yearMatch) year = yearMatch[0];

  // On retire l'année avant de chercher le mois : sinon ses propres chiffres
  // (ex. "2026" contient "02") se faisaient passer pour un mois de février.
  const withoutYear = yearMatch ? s.replace(yearMatch[0], '') : s;

  let month = '';
  if (withoutYear.includes('JAN')) month = '01';
  else if (withoutYear.includes('FEV') || withoutYear.includes('FÉV')) month = '02';
  else if (withoutYear.includes('MAR')) month = '03';
  else if (withoutYear.includes('AVR')) month = '04';
  else if (withoutYear.includes('MAI')) month = '05';
  else if (withoutYear.includes('JUN') || withoutYear.includes('JUIN')) month = '06';
  else if (withoutYear.includes('JUL') || withoutYear.includes('JUIL')) month = '07';
  else if (withoutYear.includes('AOU') || withoutYear.includes('AOÛ')) month = '08';
  else if (withoutYear.includes('SEP')) month = '09';
  else if (withoutYear.includes('OCT')) month = '10';
  else if (withoutYear.includes('NOV')) month = '11';
  else if (withoutYear.includes('DEC') || withoutYear.includes('DÉC')) month = '12';

  if (!month) {
    const numMatch = withoutYear.match(/\b(0?[1-9]|1[0-2])\b/);
    month = numMatch ? numMatch[1].padStart(2, '0') : (fallbackPeriod.match(/-(\d{2})$/)?.[1] ?? '01');
  }

  return `${year}-${month}`;
};

export default function CalculationPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objFileInputRef = useRef<HTMLInputElement | null>(null);

  const { t } = useLang();
  const c = t.calculation;
  const { constraints } = useConstraints();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const periodeKey = useMemo(() => toPeriodeKey(selectedMonth, selectedYear), [selectedMonth, selectedYear]);
  const periodeLabel = useMemo(() => toPeriodeLabel(selectedMonth, selectedYear), [selectedMonth, selectedYear]);

  const [highlightedBrand, setHighlightedBrand] = useState<string>('coca-cola');

  const brandCards = [
    {
      id: 'coca-cola',
      name: 'Coca Cola',
      image: cocaBg,
      sector: 'Boissons',
      accent: 'border-orange-400 ring-2 ring-orange-200',
    },
    {
      id: 'walls',
      name: "Wall's",
      image: wallsBg,
      sector: 'Glaces',
      accent: 'border-sky-400 ring-2 ring-sky-200',
    },
    {
      id: 'ferrero-rocher',
      name: 'Ferrero',
      image: ferreroBg,
      sector: 'Chocolats',
      accent: 'border-amber-400 ring-2 ring-amber-200',
    },
  ];

  const [importing, setImporting] = useState(false);
  const [importingObj, setImportingObj] = useState(false);

  // ─── Statut d'import (source de vérité = base de données, pas la session) ──
  const [statusLoading, setStatusLoading] = useState(false);
  const [objectifsStatus, setObjectifsStatus] = useState<ApiObjectif[]>([]);
  const [realisationsStatus, setRealisationsStatus] = useState<ApiRealisation[]>([]);
  const [triageStatus, setTriageStatus] = useState<ApiTriage[]>([]);
  const [volumesStatus, setVolumesStatus] = useState<ApiVolume[]>([]);
  const [statusError, setStatusError] = useState<string[]>([]);

  const refreshStatus = useCallback(async () => {
    setStatusLoading(true);
    const [objRes, realRes, triRes, volRes] = await Promise.allSettled([
      importApi.getObjectifsByPeriode(periodeKey),
      importApi.getRealisationsByPeriode(periodeKey),
      importApi.getTriageByPeriode(periodeKey),
      importApi.getVolumesByPeriode(periodeKey),
    ]);

    const failedSources: string[] = [];

    if (objRes.status === 'fulfilled') setObjectifsStatus(objRes.value);
    else { setObjectifsStatus([]); failedSources.push('Objectifs'); }

    if (realRes.status === 'fulfilled') setRealisationsStatus(realRes.value);
    else { setRealisationsStatus([]); failedSources.push('Réalisations'); }

    if (triRes.status === 'fulfilled') setTriageStatus(triRes.value);
    else { setTriageStatus([]); failedSources.push('Triage'); }

    if (volRes.status === 'fulfilled') setVolumesStatus(volRes.value);
    else { setVolumesStatus([]); failedSources.push('Volumes'); }

    setStatusError(failedSources);
    setStatusLoading(false);
  }, [periodeKey]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // ─── Historique des fichiers importés (qui/quand/quoi, toutes périodes) ───
  interface ImportHistoryEntry {
    id: number;
    userEmail: string;
    action: string;
    details?: string;
    timestamp: string;
  }
  const [importHistory, setImportHistory] = useState<ImportHistoryEntry[]>([]);
  const [importHistoryLoading, setImportHistoryLoading] = useState(false);

  const refreshImportHistory = useCallback(async () => {
    setImportHistoryLoading(true);
    try {
      const entries = await fetchAuditLog(200);
      const importEntries = (entries as ImportHistoryEntry[])
        .filter(e => e.action === 'IMPORT_OBJECTIFS_SQL' || e.action === 'IMPORT_EXCEL_SIMULATION')
        .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
        .slice(0, 10);
      setImportHistory(importEntries);
    } finally {
      setImportHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshImportHistory();
  }, [refreshImportHistory]);

  const carteStatusCounts = useMemo(() => {
    const cartes = ['Coca Cola', "Wall's", 'Ferrero'];
    const map: Record<string, { objectifs: number; realisations: number }> = {};
    cartes.forEach(carteName => {
      map[carteName] = {
        objectifs: objectifsStatus.filter(o => matchesBrand(o.carte, carteName)).length,
        realisations: realisationsStatus.filter(r => matchesBrand(r.carte, carteName)).length,
      };
    });
    return map;
  }, [objectifsStatus, realisationsStatus]);

  const lastUpdated = useMemo(() => {
    const dates = [...objectifsStatus, ...realisationsStatus, ...triageStatus, ...volumesStatus]
      .map(x => x.derniereMaj)
      .filter((d): d is string => Boolean(d));
    if (dates.length === 0) return null;
    return dates.reduce((max, d) => (d > max ? d : max), dates[0]);
  }, [objectifsStatus, realisationsStatus, triageStatus, volumesStatus]);

  const activeConstraintsCount = (carteName: string) => {
    return constraints.filter(cst => cst.active !== false && matchesBrand(cst.carte, carteName)).length;
  };

  const getVal = (row: any, keyword: string) => {
    const key = Object.keys(row).find(k =>
      k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(keyword)
    );
    return key ? row[key] : undefined;
  };

  // ─── 1. IMPORTATION ET SAUVEGARDE STRICTE DES OBJECTIFS (BDD) ──────────
  const handleObjImportClick = () => {
    objFileInputRef.current?.click();
  };

  const handleObjFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setImportingObj(true);
    try {
      const file = files[0];
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const dataJson = XLSX.utils.sheet_to_json<any>(sheet);

      const objPayload = dataJson.map(r => {
        const rawPeriode = getVal(r, 'periode');
        return {
          periode: rawPeriode ? formatPeriodeToYYYYMM(rawPeriode, periodeKey) : periodeKey,
          carte: String(getVal(r, 'carte') ?? ''),
          matricule: String(getVal(r, 'matricule') ?? '').replace(/\.0$/, ''),
          nomComplet: String(getVal(r, 'nom complet') ?? getVal(r, 'nom') ?? ''),
          target: Number(getVal(r, 'target') ?? getVal(r, 'objectif') ?? 0),
        };
      }).filter(r => r.matricule && r.carte);

      await importApi.postObjectifsBatch(objPayload);

      toast.success(`${objPayload.length} objectifs synchronisés avec succès pour ${periodeLabel} !`);
      logAudit({
        action: 'IMPORT_OBJECTIFS_SQL',
        entity: 'Calcul',
        details: `${file.name} — ${objPayload.length} objectifs pour ${periodeLabel}`,
      });
      await refreshStatus();
      await refreshImportHistory();
    } catch (err: any) {
      console.error('Erreur import Objectifs:', err);
      toast.error(err?.message ?? 'Échec de la sauvegarde des objectifs');
    } finally {
      setImportingObj(false);
      if (objFileInputRef.current) objFileInputRef.current.value = '';
    }
  };

  // ─── 2. IMPORTATION CLASSIQUE POUR SIMULATION (Réal, Triage, Volumes) ───
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setImporting(true);

    try {
      let allRealisations: any[] = [];
      let allTriages: any[] = [];
      let allVolumes: any[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name.toLowerCase();
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const dataJson = XLSX.utils.sheet_to_json<any>(sheet);

        if (fileName.includes('real') || fileName.includes('réal')) allRealisations.push(...dataJson);
        else if (fileName.includes('tri')) allTriages.push(...dataJson);
        else if (fileName.includes('vol') || fileName.includes('coke')) allVolumes.push(...dataJson);
      }

      let hasMismatch = false;

      const realPayload = allRealisations.map(r => {
        const rawPeriode = getVal(r, 'periode');
        const rowPeriode = rawPeriode ? formatPeriodeToYYYYMM(rawPeriode, periodeKey) : periodeKey;
        if (rawPeriode && rowPeriode !== periodeKey) hasMismatch = true;

        return {
          periode: rowPeriode,
          carte: String(getVal(r, 'carte') ?? ''),
          // Ajout du nettoyage pour le matricule (.0)
          matricule: String(getVal(r, 'matricule') ?? '').replace(/\.0$/, ''),
          // Ajout de 'realisation' pour attraper votre colonne Excel "REALISATIONS" ou "TARGET" et la mettre dans caRealise
          caRealise: Number(getVal(r, 'realisation') ?? getVal(r, 'realise') ?? getVal(r, 'target') ?? 0),
        };
      }).filter(r => r.matricule);

      const triPayload = allTriages.map(r => {
        let noteStr = String(getVal(r, 'note') ?? '0').replace('%', '');
        let note = Number(noteStr);
        if (note < 1 && note > 0) note = note * 100;
        
        const rawPeriode = getVal(r, 'periode');
        const rowPeriode = rawPeriode ? formatPeriodeToYYYYMM(rawPeriode, periodeKey) : periodeKey;
        if (rawPeriode && rowPeriode !== periodeKey) hasMismatch = true;

        return {
          periode: rowPeriode,
          // Ajout du nettoyage pour le matricule (.0)
          matricule: String(getVal(r, 'matricule') ?? '').replace(/\.0$/, ''),
          note: note,
        };
      }).filter(r => r.matricule);

      const volPayload = allVolumes.map(r => {
        // 1. On force la conversion en vrai chiffre, et si c'est vide on met 0
        const rawCharge = getVal(r, 'charge') ?? r['Volume chargé (En CP)'] ?? 0;
        const rawRetourne = getVal(r, 'retourne') ?? r['Volume retourné (en CP)'] ?? 0;
        
        let charge = parseFloat(String(rawCharge).replace(',', '.'));
        if (isNaN(charge)) charge = 0;
        
        let retourne = parseFloat(String(rawRetourne).replace(',', '.'));
        if (isNaN(retourne)) retourne = 0;

        // 2. Nettoyage du matricule
        const matricule = String(getVal(r, 'matricule') ?? '').replace(/\.0$/, '');
        const roleExtrait = String(getVal(r, 'role') ?? r.Role ?? r.role ?? '');
        
        // 3. Gestion de la date
        const rawDate = getVal(r, 'date') ?? r.Date ?? r.date ?? r['Date'] ?? '';
        const isoDate = parseExcelDate(rawDate);
        
        if (isoDate && !isoDate.startsWith(periodeKey)) {
          hasMismatch = true;
        }

        return {
          date: isoDate,
          matricule,
          role: roleExtrait,
          volumeCharge: charge,
          volumeRetourne: retourne,
        };
      }).filter(r => r.matricule && r.date);

      // --- BLOCAGE SI MAUVAISE PÉRIODE ---
      if (hasMismatch) {
        toast.error(`Un ou plusieurs fichiers contiennent des données qui ne correspondent pas à la période sélectionnée (${periodeLabel}). Import annulé.`);
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const [realResult, triResult, volResult] = await Promise.allSettled([
        importApi.postRealisationsBatch(realPayload),
        importApi.postTriageBatch(triPayload),
        importApi.postVolumesBatch(volPayload),
      ]);

      const failed: string[] = [];
      if (realResult.status === 'rejected') failed.push('Réalisations');
      if (triResult.status === 'rejected') failed.push('Triage');
      if (volResult.status === 'rejected') failed.push('Volumes');

      if (failed.length > 0) {
        toast.error(`Échec de l'import pour : ${failed.join(', ')}`);
      }
      if (failed.length < 3) {
        const okCount = [
          realResult.status === 'fulfilled' ? realPayload.length : null,
          triResult.status === 'fulfilled' ? triPayload.length : null,
          volResult.status === 'fulfilled' ? volPayload.length : null,
        ];
        toast.success(`Import ${periodeLabel} : ${okCount[0] ?? 0} réal, ${okCount[1] ?? 0} tri, ${okCount[2] ?? 0} volumes`);
      }

      const fileNames = Array.from(files).map(f => f.name).join(', ');
      logAudit({
        action: 'IMPORT_EXCEL_SIMULATION',
        entity: 'Calcul',
        details: `${fileNames} — pour ${periodeLabel}`,
      });

      await refreshStatus();
      await refreshImportHistory();
    } catch (err: any) {
      console.error('Erreur import Excel:', err);
      toast.error(err?.message ?? "Échec de l'import Excel");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleBrandClick = (brandName: string) => {
    navigate(`/calculation/brand/${encodeURIComponent(brandName)}`, { state: { periode: periodeKey, periodeLabel } });
  };

  return (
    <div className="abc-page-inner abc-stack-lg">
      <div>
        <h1 className="abc-h2">{c.title}</h1>
        <p className="abc-sub abc-sub-tight">{c.subtitle}</p>
      </div>

      <section className="space-y-4">
        <div className="flex items-baseline gap-3">
          <span className="text-xs font-semibold tracking-[0.2em] text-gray-400">01</span>
          <h2 className="text-lg font-semibold text-gray-900">Source des données</h2>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Période active :</span>
            <select
              className="abc-mini-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {MONTHS_FR.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
            <select
              className="abc-mini-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {[now.getFullYear() + 1, now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Inputs masqués pour la gestion de fichiers Excel */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          multiple
          className="hidden"
          onChange={handleFileSelected}
        />
        <input
          ref={objFileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleObjFileSelected}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            type="button"
            onClick={handleObjImportClick}
            disabled={importingObj}
            className="group relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50/10 px-6 py-12 text-center transition-all hover:border-orange-500 hover:bg-orange-50/40 disabled:cursor-wait disabled:opacity-70"
          >
            <div className="rounded-full bg-orange-100 p-4 transition-colors group-hover:bg-orange-600 group-hover:text-white">
              {importingObj ? <Loader2 className="h-7 w-7 text-orange-600 animate-spin" /> : <Target className="h-7 w-7 text-orange-600 group-hover:text-white" strokeWidth={1.5} />}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-gray-900">1. Importer les Objectifs Annuels</p>
              <p className="text-xs text-gray-500">Persiste et met à jour définitivement le référentiel des cibles</p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleImportClick}
            disabled={importing}
            className="group relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-white px-6 py-12 text-center transition-all hover:border-gray-900 hover:bg-gray-50 disabled:cursor-wait disabled:opacity-70"
          >
            <div className="rounded-full bg-gray-100 p-4 transition-colors group-hover:bg-gray-900 group-hover:text-white">
              {importing ? <Loader2 className="h-7 w-7 animate-spin" strokeWidth={1.5} /> : <UploadCloud className="h-7 w-7" strokeWidth={1.5} />}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-gray-900">2. Importer les Métriques ({periodeLabel})</p>
              <p className="text-xs text-gray-500">Réalisations, Triage, Volumes — glissez-déposez vos fichiers</p>
            </div>
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-[0.18em] text-gray-400">STATUT D'IMPORT — {periodeLabel.toUpperCase()}</span>
            {statusLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
          </div>

          {statusError.length > 0 && (
            <p className="mb-3 flex items-center gap-1.5 text-xs text-red-600">
              <AlertCircle className="h-3.5 w-3.5" /> Impossible de charger : {statusError.join(', ')}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl bg-gray-50 p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{objectifsStatus.length}</p>
              <p className="text-[11px] text-gray-500">Objectifs</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{realisationsStatus.length}</p>
              <p className="text-[11px] text-gray-500">Réalisations</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{triageStatus.length}</p>
              <p className="text-[11px] text-gray-500">Triage</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{volumesStatus.length}</p>
              <p className="text-[11px] text-gray-500">Volumes</p>
            </div>
          </div>

          <p className="mt-4 text-xs text-gray-400">
            {lastUpdated
              ? `Dernière mise à jour : ${new Date(lastUpdated).toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
              : `Aucune donnée importée pour ${periodeLabel}.`}
          </p>
        </div>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <History className="h-4 w-4 text-gray-400" />
            <span className="text-[10px] font-semibold tracking-[0.18em] text-gray-400">HISTORIQUE DES FICHIERS IMPORTÉS</span>
            {importHistoryLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
          </div>

          {importHistory.length === 0 ? (
            <p className="text-xs text-gray-400">Aucun import enregistré pour l'instant.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {importHistory.map((entry) => (
                <li key={entry.id} className="flex flex-col gap-0.5 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <span className="min-w-0 flex-1 truncate text-gray-700" title={entry.details}>{entry.details || '—'}</span>
                  <span className="whitespace-nowrap text-gray-400">
                    {entry.userEmail} · {new Date(entry.timestamp).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="text-xs font-semibold tracking-[0.2em] text-gray-400">02</span>
            <h2 className="text-lg font-semibold text-gray-900">Produit à calculer</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {brandCards.map((card) => {
            const selected = highlightedBrand === card.id;
            const counts = carteStatusCounts[card.name] || { objectifs: 0, realisations: 0 };
            return (
              <div
                key={card.id}
                onClick={() => {
                  setHighlightedBrand(card.id);
                  handleBrandClick(card.name);
                }}
                className={'group cursor-pointer rounded-2xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ' + (selected ? card.accent : 'border-gray-200 hover:border-gray-300')}
              >
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 shrink-0">
                    <img src={card.image} alt={card.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-gray-900">{card.name}</h3>
                    <p className="text-xs text-gray-400 truncate">{card.sector} · {activeConstraintsCount(card.name)} règle(s) active(s)</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[11px] font-medium">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">{counts.objectifs} objectif(s)</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">{counts.realisations} réalisation(s)</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
