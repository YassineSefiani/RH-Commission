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

  const [highlightedBrand, setHighlightedBrand] = useState<string>('coca-cola');
  const periods = ['Mai 2026', 'Avril 2026', 'Mars 2026', 'Février 2026'];
  const [selectedPeriod, setSelectedPeriod] = useState<string>(periods[0]);

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
  const [importStats, setImportStats] = useState<{ objectifs: number; realisations: number; triage: number; volumes: number } | null>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setImportedFileName(`${files.length} fichier(s) importé(s)`);
    setImporting(true);
    setImportStats(null);
    
    try {
      let allObjectifs: any[] = [];
      let allRealisations: any[] = [];
      let allTriages: any[] = [];
      let allVolumes: any[] = [];

      // ✨ CORRECTION : Routage strict par nom de fichier pour éviter les mélanges
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name.toLowerCase();
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data, { type: 'array' });
        
        // On prend toujours la première feuille du fichier
        const sheet = wb.Sheets[wb.SheetNames[0]]; 
        const dataJson = XLSX.utils.sheet_to_json<any>(sheet);

        if (fileName.includes('obj')) allObjectifs.push(...dataJson);
        else if (fileName.includes('real') || fileName.includes('réal')) allRealisations.push(...dataJson);
        else if (fileName.includes('tri')) allTriages.push(...dataJson);
        else if (fileName.includes('vol') || fileName.includes('coke')) allVolumes.push(...dataJson);
      }

      const getVal = (row: any, keyword: string) => {
        const key = Object.keys(row).find(k => 
          k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(keyword)
        );
        return key ? row[key] : undefined;
      };

      const objPayload = allObjectifs.map(r => ({
        periode: String(getVal(r, 'periode') ?? 'AVRIL/2026'),
        carte: String(getVal(r, 'carte') ?? ''),
        matricule: String(getVal(r, 'matricule') ?? ''),
        target: Number(getVal(r, 'target') ?? getVal(r, 'objectif') ?? 0),
      })).filter(r => r.matricule);

      const realPayload = allRealisations.map(r => ({
        periode: String(getVal(r, 'periode') ?? 'AVRIL/2026'),
        carte: String(getVal(r, 'carte') ?? ''),
        matricule: String(getVal(r, 'matricule') ?? ''),
        caRealise: Number(getVal(r, 'target') ?? getVal(r, 'realise') ?? 0),
      })).filter(r => r.matricule);

      const triPayload = allTriages.map(r => {
        let noteStr = String(getVal(r, 'note') ?? '0').replace('%', '');
        let note = Number(noteStr);
        if (note < 1 && note > 0) note = note * 100;
        return {
          periode: String(getVal(r, 'periode') ?? 'AVRIL/2026'),
          matricule: String(getVal(r, 'matricule') ?? ''),
          note: note,
        };
      }).filter(r => r.matricule);

      const volPayload = allVolumes.map(r => {
        const charge = Number(getVal(r, 'charge') ?? r['Volume chargé (En CP)'] ?? 0);
        const retourne = Number(getVal(r, 'retourne') ?? r['Volume retourné (en CP)'] ?? 0);
        const matricule = String(getVal(r, 'matricule') ?? '');
        
        // ✨ NOUVEAU : On extrait explicitement le rôle depuis le fichier Excel
        const roleExtrait = String(getVal(r, 'role') ?? r.Role ?? r.role ?? '');

        return {
          date: String(getVal(r, 'date') ?? 'AVRIL/2026'),
          matricule: matricule,
          Role: roleExtrait, // Ce champ est maintenant sauvegardé pour le moteur de calcul !
          volumeCharge: charge,
          volumeRetourne: retourne,
          volumeDistribue: charge - retourne,
          tauxRetour: charge > 0 ? (retourne / charge) * 100 : 0
        };
      }).filter(r => r.matricule);

      console.log('📊 [DEBUG EXCEL] Volumes extraits avec succès :', volPayload);

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
          console.warn(`${path} API POST failed. Ignoring for simulation.`);
          return { ok: false, inserted: body.length };
        }
        const json = await res.json();
        return { ok: true, inserted: Array.isArray(json) ? json.length : body.length };
      }

      await Promise.all([
        postBatch('objectifs', objPayload).catch(() => ({ inserted: objPayload.length })),
        postBatch('realisations', realPayload).catch(() => ({ inserted: realPayload.length })),
        postBatch('triage', triPayload).catch(() => ({ inserted: triPayload.length })),
      ]);

      localStorage.setItem('simulation_metrics', JSON.stringify({
        objPayload,
        realPayload,
        triPayload,
        volPayload
      }));

      setImportStats({ 
        objectifs: objPayload.length, 
        realisations: realPayload.length, 
        triage: triPayload.length,
        volumes: volPayload.length
      });

      logAudit({
        action: 'IMPORT_EXCEL_SIMULATION',
        entity: 'Calcul',
        details: `${files.length} fichiers mis en cache pour simulation`,
      });

      toast.success(`Import Multiple OK : ${objPayload.length} obj, ${realPayload.length} réal, ${triPayload.length} tri, ${volPayload.length} vol`);
    } catch (err: any) {
      console.error('Erreur import Excel:', err);
      toast.error(err?.message ?? 'Échec de l\'import Excel');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleBrandClick = (brandName: string) => {
    navigate(`/calculation/brand/${encodeURIComponent(brandName)}`);
  };

  const hasImport = !!importStats && !!importedFileName;
  const importedRowsCount = importStats ? importStats.objectifs + importStats.realisations + importStats.triage + importStats.volumes : 0;
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
      <div>
        <h1 className="abc-h2">{c.title}</h1>
        <p className="abc-sub abc-sub-tight">{c.subtitle}</p>
      </div>

      <section className="space-y-4">
        <div className="flex items-baseline gap-3">
          <span className="text-xs font-semibold tracking-[0.2em] text-gray-400">01</span>
          <h2 className="text-lg font-semibold text-gray-900">Source des données</h2>
        </div>

        <input 
          ref={fileInputRef} 
          type="file" 
          accept=".xlsx,.xls,.csv" 
          multiple
          className="hidden" 
          onChange={handleFileSelected} 
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <p className="text-sm font-semibold text-gray-900">{importing ? 'Import en cours…' : 'Importer un ou plusieurs fichiers'}</p>
              <p className="text-xs text-gray-500">{importing ? 'Lecture et extraction' : 'Glissez vos fichiers ici, ou cliquez pour parcourir'}</p>
            </div>
          </button>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-[0.18em] text-gray-400">DERNIER IMPORT</span>
              {hasImport && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-100">
                  <CheckCircle2 className="h-3 w-3" /> Traité
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
                    <p className="truncate text-sm font-semibold text-gray-900">{lastImportFile}</p>
                    <p className="text-xs text-gray-500">{importedRowsCount} lignes · {lastImportDate}</p>
                    <p className="mt-0.5 text-xs text-gray-400">Importé par {lastImportAuthor}</p>
                    {importStats && (
                      <p className="mt-1 text-[11px] text-gray-500 font-medium">
                        {importStats.objectifs} obj · {importStats.realisations} réal · {importStats.triage} triage · {importStats.volumes} vols
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-32 flex-col items-center justify-center text-center">
                <FileSpreadsheet className="h-8 w-8 text-gray-200" strokeWidth={1.5} />
                <p className="mt-2 text-xs text-gray-400">Aucun import pour le moment.</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {periods.map((p) => {
              const active = selectedPeriod === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPeriod(p)}
                  className={'rounded-full px-3 py-1.5 text-xs font-medium transition-colors ' + (active ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900')}
                >
                  {p}
                </button>
              );
            })}
          </div>
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