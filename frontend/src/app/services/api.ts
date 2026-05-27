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

// Helper pour obtenir le rôle de l'utilisateur
function getUserRole(): string {
  const userStr = localStorage.getItem('user');
  console.log('🔍 [api] user from localStorage:', userStr);
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      console.log('🔍 [api] parsed user:', user);
      return user.superRole || '';
    } catch (e) {
      console.error('🔍 [api] error parsing user:', e);
      return '';
    }
  }
  console.log('🔍 [api] no user in localStorage');
  return '';
}

// Helper pour les headers avec rôle utilisateur
function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const role = getUserRole();
  console.log('🔍 [api] getHeaders - role:', role);
  if (role) {
    headers['X-User-Role'] = role;
  }
  console.log('🔍 [api] headers:', headers);
  return headers;
}

// Types pour l'API
export interface ApiConstraint {
  id?: number;
  name: string;
  type: 'commission_quantitative' | 'commission_retour';
  carte: "Coca Cola" | "Wall's" | "Ferrero Rocher";
  value: number;
  valueType: 'percentage' | 'fixed';
  condition: string;
  active: boolean;
  ruleGroups?: string; // JSON string
}

export interface ApiCalculationHistory {
  id?: number;
  date?: string; // LocalDateTime géré par le backend
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
  constraintsApplied: string; // JSON array
  details: string; // JSON array
  carte?: string;
  matricule?: string;        // clé anti-redondance (1 calcul/mois/employé/marque)
  periode?: string;          // YYYY-MM
  forcerRecalcul?: boolean;  // si true, écrase l'existant
}

// Helper pour gérer les erreurs
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }
  
  // Si pas de contenu (204 No Content ou réponse vide)
  if (response.status === 204) {
    return {} as T;
  }
  
  // Vérifier si la réponse est vide
  const contentLength = response.headers.get('content-length');
  if (contentLength === '0' || response.bodyUsed) {
    return {} as T;
  }
  
  // Essayer de parser le JSON
  const text = await response.text();
  if (!text) {
    return {} as T;
  }
  
  return JSON.parse(text);
}

// ============================================
// CONSTRAINTS API
// ============================================

export const constraintsApi = {
  // GET /api/constraints
  getAll: async (): Promise<ApiConstraint[]> => {
    const response = await fetch(`${API_BASE_URL}/constraints`);
    return handleResponse<ApiConstraint[]>(response);
  },

  // GET /api/constraints/{id}
  getById: async (id: number): Promise<ApiConstraint> => {
    const response = await fetch(`${API_BASE_URL}/constraints/${id}`);
    return handleResponse<ApiConstraint>(response);
  },

  // POST /api/constraints
  create: async (constraint: Omit<ApiConstraint, 'id'>): Promise<ApiConstraint> => {
    const response = await fetch(`${API_BASE_URL}/constraints`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(constraint),
    });
    return handleResponse<ApiConstraint>(response);
  },

  // PUT /api/constraints/{id}
  update: async (id: number, constraint: Partial<ApiConstraint>): Promise<ApiConstraint> => {
    const response = await fetch(`${API_BASE_URL}/constraints/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(constraint),
    });
    return handleResponse<ApiConstraint>(response);
  },

  // DELETE /api/constraints/{id}
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/constraints/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    await handleResponse<void>(response);
  },

  // PATCH /api/constraints/{id}/toggle
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
  // GET /api/history
  getAll: async (): Promise<ApiCalculationHistory[]> => {
    const response = await fetch(`${API_BASE_URL}/history`);
    return handleResponse<ApiCalculationHistory[]>(response);
  },

  // GET /api/history/{id}
  getById: async (id: number): Promise<ApiCalculationHistory> => {
    const response = await fetch(`${API_BASE_URL}/history/${id}`);
    return handleResponse<ApiCalculationHistory>(response);
  },

  // POST /api/history
  create: async (history: Omit<ApiCalculationHistory, 'id' | 'date'>): Promise<ApiCalculationHistory> => {
    const response = await fetch(`${API_BASE_URL}/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(history),
    });
    return handleResponse<ApiCalculationHistory>(response);
  },

  // DELETE /api/history/{id}
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/history/${id}`, {
      method: 'DELETE',
    });
    await handleResponse<void>(response);
  },

  // DELETE /api/history (clear all)
  clearAll: async (): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/history`, {
      method: 'DELETE',
    });
    await handleResponse<void>(response);
  },
};

// ============================================
// MAPPERS - Conversion entre API et Frontend
// ============================================

// Convertir une contrainte API vers le format frontend
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

// Convertir une contrainte frontend vers le format API
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

// Tolère les anciens enregistrements stockés via Java toString() (ex: "[Commission A, Commission B]")
function safeJsonParseArray(raw: unknown): any[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw;
  const s = String(raw).trim();
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    // Fallback : "[a, b, c]" style Java → split sur les virgules
    if (s.startsWith('[') && s.endsWith(']')) {
      return s.slice(1, -1)
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
    }
    return [s];
  }
}

// Convertir un historique API vers le format frontend
// Note : deliveries/returnRate ne sont pas persistés côté backend → default 0
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
  };
}

// Convertir un historique frontend vers le format API
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
  };
}