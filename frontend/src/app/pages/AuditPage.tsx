import { useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw, Activity, Loader2 } from 'lucide-react';
import { fetchAuditLog } from '../services/auditApi';

interface AuditEntry {
  id: number;
  userEmail: string;
  userRole: string;
  action: string;
  entity?: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  timestamp: string;
}

const ACTION_COLOR: Record<string, string> = {
  LOGIN:                'bg-emerald-50 text-emerald-700 border-emerald-100',
  LOGOUT:               'bg-gray-100 text-gray-700 border-gray-200',
  CONSTRAINT_CREATE:    'bg-blue-50 text-blue-700 border-blue-100',
  CONSTRAINT_UPDATE:    'bg-indigo-50 text-indigo-700 border-indigo-100',
  CONSTRAINT_DELETE:    'bg-red-50 text-red-700 border-red-100',
  CONSTRAINT_TOGGLE:    'bg-amber-50 text-amber-700 border-amber-100',
  PERSONNEL_CREATE:     'bg-blue-50 text-blue-700 border-blue-100',
  PERSONNEL_UPDATE:     'bg-indigo-50 text-indigo-700 border-indigo-100',
  PERSONNEL_DELETE:     'bg-red-50 text-red-700 border-red-100',
  PERSONNEL_TOGGLE:     'bg-amber-50 text-amber-700 border-amber-100',
  PRESENCE_CREATE:      'bg-blue-50 text-blue-700 border-blue-100',
  PRESENCE_DELETE:      'bg-red-50 text-red-700 border-red-100',
  HISTORY_CREATE:       'bg-blue-50 text-blue-700 border-blue-100',
  HISTORY_DELETE:       'bg-red-50 text-red-700 border-red-100',
  HISTORY_CLEAR_ALL:    'bg-red-100 text-red-800 border-red-200',
  IMPORT_EXCEL:         'bg-purple-50 text-purple-700 border-purple-100',
  IMPORT_EXCEL_FAILED:  'bg-red-50 text-red-700 border-red-100',
  BRAND_OPEN:           'bg-gray-100 text-gray-700 border-gray-200',
};

const DEFAULT_BADGE = 'bg-gray-100 text-gray-700 border-gray-200';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAuditLog(500);
      setEntries(data as AuditEntry[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const actions = useMemo(
    () => Array.from(new Set(entries.map(e => e.action))).sort(),
    [entries]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter(e => {
      const matchAction = !actionFilter || e.action === actionFilter;
      const matchQuery = !q
        || e.userEmail?.toLowerCase().includes(q)
        || e.action?.toLowerCase().includes(q)
        || e.entity?.toLowerCase().includes(q)
        || e.details?.toLowerCase().includes(q);
      return matchAction && matchQuery;
    });
  }, [entries, search, actionFilter]);

  return (
    <div className="abc-page-inner abc-stack-lg">
      <div>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-gray-700" />
          <h1 className="abc-h2">Journal d'audit</h1>
        </div>
        <p className="abc-sub abc-sub-tight">
          Traçabilité de chaque action utilisateur (login, CRUD, import…).
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
          <Search size={14} className="text-gray-400" />
          <input
            type="search"
            placeholder="Rechercher par email, action, entité, détails…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">Toutes les actions</option>
          {actions.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Rafraîchir
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-4 py-3">Horodatage</th>
              <th className="px-4 py-3">Utilisateur</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entité</th>
              <th className="px-4 py-3">Détails</th>
              <th className="px-4 py-3">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  {loading ? 'Chargement…' : 'Aucune entrée'}
                </td>
              </tr>
            ) : filtered.map((e) => {
              const badge = ACTION_COLOR[e.action] ?? DEFAULT_BADGE;
              return (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{formatDate(e.timestamp)}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{e.userEmail}</td>
                  <td className="px-4 py-3 text-gray-500">{e.userRole}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badge}`}>
                      {e.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {e.entity}
                    {e.entityId && <span className="ml-1 text-gray-400">#{e.entityId}</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-md truncate" title={e.details ?? ''}>
                    {e.details}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{e.ipAddress}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        {filtered.length} entrée{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''} sur {entries.length}.
      </p>
    </div>
  );
}
