import { useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { useLang } from '../context/LangContext';
import { logAudit } from '../services/auditApi';

// Import des images selon tes chemins
import cocaBg from '../assets/coca cola.png';
import ferreroBg from '../assets/ferrero rocher.png';
import wallsBg from '../assets/walls.jpg';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export default function CalculationPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importedFileName, setImportedFileName] = useState<string>('');
  const { t } = useLang();
  const c = t.calculation;

  // État visuel : marque mise en surbrillance (n'affecte pas la navigation).
  const [highlightedBrand, setHighlightedBrand] = useState<string>('coca-cola');

  // État visuel : période sélectionnée dans la barre d'onglets.
  const periods = ['Mai 2026', 'Avril 2026', 'Mars 2026', 'Février 2026'];
  const [selectedPeriod, setSelectedPeriod] = useState<string>(periods[0]);

  // Métadonnées d'affichage par marque (visuel uniquement).
  const brandCards = [
    {
      id: 'coca-cola',
      name: 'Coca Cola',
      image: cocaBg,
      description: c.brandDescCoca,
      sector: 'Boissons',
      unitPrice: '12 €',
      rate: '6%',
      units: 320,
      sellers: 12,
      commission: '240 €',
      accent: 'border-orange-400 ring-2 ring-orange-200',
    },
    {
      id: 'walls',
      name: "Wall's",
      image: wallsBg,
      description: c.brandDescWalls,
      sector: 'Glaces',
      unitPrice: '8 €',
      rate: '5%',
      units: 180,
      sellers: 7,
      commission: '144 €',
      accent: 'border-sky-400 ring-2 ring-sky-200',
    },
    {
      id: 'ferrero-rocher',
      name: 'Ferrero Rocher',
      image: ferreroBg,
      description: c.brandDescFerrero,
      sector: 'Chocolats',
      unitPrice: '15 €',
      rate: '7%',
      units: 95,
      sellers: 5,
      commission: '96 €',
      accent: 'border-amber-400 ring-2 ring-amber-200',
    },
  ];

  const [importing, setImporting] = useState(false);
  const [importStats, setImportStats] = useState<{ objectifs: number; realisations: number; triage: number } | null>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  /** Lit le xlsx, parse les 3 feuilles et POST en batch vers le backend. */
  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportedFileName(file.name);
    setImporting(true);
    setImportStats(null);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });

      const sheetObj = wb.Sheets[wb.SheetNames.find(n => n.toLowerCase().startsWith('objectif')) || 'Objectifs'];
      const sheetReal = wb.Sheets[wb.SheetNames.find(n => n.toLowerCase().startsWith('realisation')) || 'Realisations'];
      const sheetTri  = wb.Sheets[wb.SheetNames.find(n => n.toLowerCase().includes('triage')) || 'NotesTriage'];

      const objectifs = sheetObj ? XLSX.utils.sheet_to_json<any>(sheetObj) : [];
      const realisations = sheetReal ? XLSX.utils.sheet_to_json<any>(sheetReal) : [];
      const triages = sheetTri ? XLSX.utils.sheet_to_json<any>(sheetTri) : [];

      const objPayload = objectifs.map(r => ({
        periode: String(r.periode ?? r.Periode ?? r.PERIODE ?? ''),
        carte: String(r.carte ?? r.Carte ?? r.CARTE ?? ''),
        matricule: String(r.matricule ?? r.Matricule ?? r.MATRICULE ?? ''),
        target: Number(r.target ?? r.Target ?? r.objectif ?? r.OBJECTIF ?? 0),
      })).filter(r => r.periode && r.matricule && r.carte);

      const realPayload = realisations.map(r => ({
        periode: String(r.periode ?? r.Periode ?? r.PERIODE ?? ''),
        carte: String(r.carte ?? r.Carte ?? r.CARTE ?? ''),
        matricule: String(r.matricule ?? r.Matricule ?? r.MATRICULE ?? ''),
        caRealise: Number(r.ca_realise ?? r.caRealise ?? r.CA_REALISE ?? 0),
      })).filter(r => r.periode && r.matricule && r.carte);

      const triPayload = triages.map(r => ({
        periode: String(r.periode ?? r.Periode ?? r.PERIODE ?? ''),
        matricule: String(r.matricule ?? r.Matricule ?? r.MATRICULE ?? ''),
        note: Number(r.note ?? r.Note ?? r.NOTE ?? 0),
      })).filter(r => r.periode && r.matricule);

      const role = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}').superRole || ''; } catch { return ''; } })();
      const commonHeaders: HeadersInit = { 'Content-Type': 'application/json', ...(role ? { 'X-User-Role': role } : {}) };

      async function postBatch(path: string, body: any[]) {
        if (body.length === 0) return { ok: true, inserted: 0 };
        const res = await fetch(`${API_BASE_URL}/import/${path}/batch`, {
          method: 'POST',
          headers: commonHeaders,
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`${path} : HTTP ${res.status} — ${txt}`);
        }
        const json = await res.json();
        return { ok: true, inserted: Array.isArray(json) ? json.length : body.length };
      }

      const [oRes, rRes, tRes] = await Promise.all([
        postBatch('objectifs', objPayload),
        postBatch('realisations', realPayload),
        postBatch('triage', triPayload),
      ]);

      setImportStats({ objectifs: oRes.inserted, realisations: rRes.inserted, triage: tRes.inserted });

      logAudit({
        action: 'IMPORT_EXCEL',
        entity: 'Calcul',
        details: `${file.name} → objectifs:${oRes.inserted}, realisations:${rRes.inserted}, triage:${tRes.inserted}`,
      });

      toast.success(`Import OK : ${oRes.inserted} objectifs, ${rRes.inserted} réalisations, ${tRes.inserted} notes triage`);
    } catch (err: any) {
      console.error('Erreur import Excel:', err);
      toast.error(err?.message ?? 'Échec de l\'import Excel');
      logAudit({
        action: 'IMPORT_EXCEL_FAILED',
        entity: 'Calcul',
        details: `${file.name} → ${err?.message ?? 'inconnu'}`,
      });
    } finally {
      setImporting(false);
      if (event.target) event.target.value = ''; // reset pour permettre ré-import du même fichier
    }
  };

  const handleBrandClick = (brand: string) => {
    logAudit({ action: 'BRAND_OPEN', entity: 'Calcul', entityId: brand });
    navigate(`/calculation/brand/${encodeURIComponent(brand)}`);
  };

  // Stats de l'import — uniquement réelles, pas de placeholder trompeur
  const hasImport = !!importStats && !!importedFileName;
  const importedRowsCount = importStats
    ? importStats.objectifs + importStats.realisations + importStats.triage
    : 0;
  const lastImportAuthor = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return [u.prenom, u.nom].filter(Boolean).join(' ') || u.email || '—';
    } catch { return '—'; }
  })();
  const lastImportDate = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const lastImportFile = importedFileName || '';

  return (
    <div className="abc-page-inner abc-stack-lg">
      {/* Page header */}
      <div>
        <h1 className="abc-h2">{c.title}</h1>
        <p className="abc-sub abc-sub-tight">{c.subtitle}</p>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 01 — Source des données                                          */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <div className="flex items-baseline gap-3">
          <span className="text-xs font-semibold tracking-[0.2em] text-gray-400">
            01
          </span>
          <h2 className="text-lg font-semibold text-gray-900">
            Source des données
          </h2>
        </div>

        {/* Hidden file input — handler intact */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileSelected}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Colonne gauche — Drag & Drop */}
          <button
            type="button"
            onClick={handleImportClick}
            disabled={importing}
            className="group relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-white px-6 py-12 text-center transition-all hover:border-gray-900 hover:bg-gray-50 disabled:cursor-wait disabled:opacity-70"
          >
            <div className="rounded-full bg-gray-100 p-4 transition-colors group-hover:bg-gray-900 group-hover:text-white">
              {importing
                ? <Loader2 className="h-7 w-7 animate-spin" strokeWidth={1.5} />
                : <UploadCloud className="h-7 w-7" strokeWidth={1.5} />}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-900">
                {importing ? 'Import en cours…' : 'Importer un fichier Excel'}
              </p>
              <p className="text-xs text-gray-500">
                {importing
                  ? 'Lecture et envoi au serveur'
                  : 'Glissez votre fichier .xlsx ici, ou cliquez pour parcourir'}
              </p>
            </div>
          </button>

          {/* Colonne droite — Dernier import (vide tant qu'aucun import effectif) */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-[0.18em] text-gray-400">
                DERNIER IMPORT
              </span>
              {hasImport && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-100">
                  <CheckCircle2 className="h-3 w-3" />
                  Traité
                </span>
              )}
            </div>

            {hasImport ? (
              <>
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                    <FileSpreadsheet className="h-6 w-6" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {lastImportFile}
                    </p>
                    <p className="text-xs text-gray-500">
                      {importedRowsCount} lignes · {lastImportDate}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      Importé par {lastImportAuthor}
                    </p>
                    {importStats && (
                      <p className="mt-1 text-[11px] text-gray-500">
                        {importStats.objectifs} objectifs · {importStats.realisations} réalisations · {importStats.triage} triage
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 border-t border-dashed border-gray-200 pt-3">
                  <button
                    type="button"
                    onClick={() => navigate('/history')}
                    className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900"
                  >
                    Voir tous les imports
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex h-32 flex-col items-center justify-center text-center">
                <FileSpreadsheet className="h-8 w-8 text-gray-200" strokeWidth={1.5} />
                <p className="mt-2 text-xs text-gray-400">
                  Aucun import pour le moment.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Barre de période */}
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {periods.map((p) => {
              const active = selectedPeriod === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPeriod(p)}
                  className={
                    'rounded-full px-3 py-1.5 text-xs font-medium transition-colors ' +
                    (active
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900')
                  }
                >
                  {p}
                </button>
              );
            })}
          </div>
          <div className="text-xs font-medium text-gray-500">
            {hasImport
              ? <>{importedRowsCount} lignes</>
              : <span className="text-gray-300">—</span>}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 02 — Produit à calculer                                          */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="text-xs font-semibold tracking-[0.2em] text-gray-400">
              02
            </span>
            <h2 className="text-lg font-semibold text-gray-900">
              Produit à calculer
            </h2>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Choisissez la marque pour laquelle calculer les commissions.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {brandCards.map((card) => {
            const selected = highlightedBrand === card.id;
            return (
              <div
                key={card.id}
                onClick={() => {
                  setHighlightedBrand(card.id);
                  handleBrandClick(card.name);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setHighlightedBrand(card.id);
                    handleBrandClick(card.name);
                  }
                }}
                className={
                  'group cursor-pointer rounded-2xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ' +
                  (selected
                    ? card.accent
                    : 'border-gray-200 hover:border-gray-300')
                }
              >
                {/* En-tête : logo + titre + secteur */}
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 shrink-0">
                    <img
                      src={card.image}
                      alt={card.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-gray-900">
                      {card.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {card.sector}
                      <span className="mx-1.5 text-gray-300">·</span>
                      {card.unitPrice}/unité
                      <span className="mx-1.5 text-gray-300">·</span>
                      {card.rate}
                    </p>
                  </div>
                </div>

                {/* Séparateur pointillé */}
                <div className="my-4 border-t border-dashed border-gray-200" />

                {/* 3 colonnes de stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Unités
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-900">
                      {card.units}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Vendeurs
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-900">
                      {card.sellers}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Commission
                    </p>
                    <p className="mt-0.5 text-base font-bold text-gray-900">
                      {card.commission}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
