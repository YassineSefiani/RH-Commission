// Configuration de l'API Backend Spring Boot
declare global {
  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

import { getAuthHeaders } from './authHeaders';

// Helper pour obtenir le rôle de l'utilisateur
function getUserRole(): string {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.superRole || '';
    } catch (e) {
      return '';
    }
  }
  return '';
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
  };
  const role = getUserRole();
  if (role) {
    headers['X-User-Role'] = role;
  }
  return headers;
}

export interface ApiConstraint {
  id?: number;
  name: string;
  type: 'commission_quantitative' | 'commission_retour';
  carte: "Coca Cola" | "Wall's" | "Ferrero Rocher";
  value: number;
  valueType: 'percentage' | 'fixed';
  condition: string;
  active: boolean;
  ruleGroups?: string; 
}

export interface ApiCalculationHistory {
  id?: number;
  date?: string; 
  employeeName: string;
  employeeRole: string;
  baseSalary: number;
  totalSales: number;
  deliveries: number;
  returnRate: number;
  commissions: number;
  bonuses: number;
  penalties: number;
  finalSalary: number;
  constraintsApplied: string; 
  details: string; 
  carte?: string;
  matricule?: string;        
  periode?: string;          
  forcerRecalcul?: boolean;  
  isArchived?: boolean; 
  batchId?: string; // ✨ NOUVEAU
  simulationName?: string; // ✨ NOUVEAU
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }
  if (response.status === 204) return {} as T;
  const contentLength = response.headers.get('content-length');
  if (contentLength === '0' || response.bodyUsed) return {} as T;
  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text);
}

// ============================================
// CONSTRAINTS API
// ============================================
export const constraintsApi = {
  getAll: async (): Promise<ApiConstraint[]> => {
    const response = await fetch(`${API_BASE_URL}/constraints`, { headers: getHeaders() });
    return handleResponse<ApiConstraint[]>(response);
  },
  getById: async (id: number): Promise<ApiConstraint> => {
    const response = await fetch(`${API_BASE_URL}/constraints/${id}`, { headers: getHeaders() });
    return handleResponse<ApiConstraint>(response);
  },
  create: async (constraint: Omit<ApiConstraint, 'id'>): Promise<ApiConstraint> => {
    const response = await fetch(`${API_BASE_URL}/constraints`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(constraint),
    });
    return handleResponse<ApiConstraint>(response);
  },
  update: async (id: number, constraint: Partial<ApiConstraint>): Promise<ApiConstraint> => {
    const response = await fetch(`${API_BASE_URL}/constraints/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(constraint),
    });
    return handleResponse<ApiConstraint>(response);
  },
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/constraints/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    await handleResponse<void>(response);
  },
  toggle: async (id: number): Promise<ApiConstraint> => {
    const response = await fetch(`${API_BASE_URL}/constraints/${id}/toggle`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse<ApiConstraint>(response);
  },
};

// ============================================
// HISTORY API
// ============================================
export const historyApi = {
  getAll: async (): Promise<ApiCalculationHistory[]> => {
    const response = await fetch(`${API_BASE_URL}/historique`, { headers: getHeaders() });
    return handleResponse<ApiCalculationHistory[]>(response);
  },
  getById: async (id: number): Promise<ApiCalculationHistory> => {
    const response = await fetch(`${API_BASE_URL}/historique/${id}`, { headers: getHeaders() });
    return handleResponse<ApiCalculationHistory>(response);
  },
  create: async (history: Omit<ApiCalculationHistory, 'id' | 'date'>): Promise<ApiCalculationHistory> => {
    const response = await fetch(`${API_BASE_URL}/historique`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(history),
    });
    return handleResponse<ApiCalculationHistory>(response);
  },
  archive: async (id: string | number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/historique/${id}/archive`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.message || "Impossible d'archiver côté serveur");
    }
  },
  purgerValide: async (carte: string, mois: number, annee: number): Promise<{ supprimes: number }> => {
    const response = await fetch(`${API_BASE_URL}/historique/purge?carte=${encodeURIComponent(carte)}&mois=${mois}&annee=${annee}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.message || "Impossible de purger les calculs validés");
    }
    return response.json();
  },
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/historique/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    await handleResponse<void>(response);
  },
  clearAll: async (): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/historique/vider`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    await handleResponse<void>(response);
  },
};

export function mapApiConstraintToFrontend(apiConstraint: ApiConstraint) {
  return {
    id: apiConstraint.id?.toString() || '',
    name: apiConstraint.name,
    type: apiConstraint.type,
    carte: (apiConstraint.carte || 'Coca Cola') as "Coca Cola" | "Wall's" | "Ferrero Rocher",
    value: apiConstraint.value,
    valueType: apiConstraint.valueType,
    condition: apiConstraint.condition,
    active: apiConstraint.active,
    ruleGroups: apiConstraint.ruleGroups ? JSON.parse(apiConstraint.ruleGroups) : undefined,
  };
}

export function mapFrontendConstraintToApi(frontendConstraint: any): Omit<ApiConstraint, 'id'> {
  return {
    name: frontendConstraint.name,
    type: frontendConstraint.type,
    carte: frontendConstraint.carte as "Coca Cola" | "Wall's" | "Ferrero Rocher",
    value: frontendConstraint.value,
    valueType: frontendConstraint.valueType,
    condition: frontendConstraint.condition,
    active: frontendConstraint.active,
    ruleGroups: frontendConstraint.ruleGroups ? JSON.stringify(frontendConstraint.ruleGroups) : undefined,
  };
}

function safeJsonParseArray(raw: unknown): any[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw;
  const s = String(raw).trim();
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    if (s.startsWith('[') && s.endsWith(']')) {
      return s.slice(1, -1).split(',').map(t => t.trim()).filter(Boolean);
    }
    return [s];
  }
}

export function mapApiHistoryToFrontend(apiHistory: ApiCalculationHistory) {
  return {
    id: apiHistory.id?.toString() || '',
    date: apiHistory.date || new Date().toISOString(),
    employeeName: apiHistory.employeeName,
    employeeRole: apiHistory.employeeRole,
    baseSalary: apiHistory.baseSalary,
    totalSales: apiHistory.totalSales,
    deliveries: apiHistory.deliveries ?? 0,
    returns: apiHistory.returnRate ?? 0,
    commissions: apiHistory.commissions,
    bonuses: apiHistory.bonuses,
    penalties: apiHistory.penalties,
    finalSalary: apiHistory.finalSalary,
    constraintsApplied: safeJsonParseArray(apiHistory.constraintsApplied),
    details: safeJsonParseArray(apiHistory.details),
    carte: apiHistory.carte,
    matricule: apiHistory.matricule,
    periode: apiHistory.periode,
    isArchived: apiHistory.isArchived ?? false, 
    batchId: apiHistory.batchId, // ✨ MAPPED
    simulationName: apiHistory.simulationName, // ✨ MAPPED
  };
}

export function mapFrontendHistoryToApi(frontendHistory: any): Omit<ApiCalculationHistory, 'id' | 'date'> {
  return {
    employeeName: frontendHistory.employeeName,
    employeeRole: frontendHistory.employeeRole,
    baseSalary: frontendHistory.baseSalary,
    totalSales: frontendHistory.totalSales,
    deliveries: frontendHistory.deliveries,
    returnRate: frontendHistory.returns,
    commissions: frontendHistory.commissions,
    bonuses: frontendHistory.bonuses,
    penalties: frontendHistory.penalties,
    finalSalary: frontendHistory.finalSalary,
    constraintsApplied: JSON.stringify(frontendHistory.constraintsApplied || []),
    details: JSON.stringify(frontendHistory.details || []),
    carte: frontendHistory.carte,
    matricule: frontendHistory.matricule,
    periode: frontendHistory.periode,
    forcerRecalcul: frontendHistory.forcerRecalcul ?? false,
    isArchived: frontendHistory.isArchived ?? false, 
    batchId: frontendHistory.batchId, // ✨ MAPPED
    simulationName: frontendHistory.simulationName, // ✨ MAPPED
  };
}