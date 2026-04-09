// API Service pour la gestion du Personnel
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Types pour l'API Personnel
export interface ApiPersonnel {
  id?: number;
  matricule: string;
  nom: string;
  prenom: string;
  carte?: string;
  fonction?: string;
  role?: string;
  numero?: string; // Numéro de téléphone
  natureContrat: string; // CDI, Int, CDD, etc.
  ville?: string;
  actif?: boolean;
}

export interface PersonnelStats {
  total: number;
  actifs: number;
  inactifs: number;
}

// Helper pour gérer les erreurs
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }
  
  // Si pas de contenu (204 No Content)
  if (response.status === 204) {
    return {} as T;
  }
  
  return response.json();
}

// ============================================
// PERSONNEL API
// ============================================

export const personnelApi = {
  // GET /api/personnel
  getAll: async (): Promise<ApiPersonnel[]> => {
    const response = await fetch(`${API_BASE_URL}/personnel`);
    return handleResponse<ApiPersonnel[]>(response);
  },

  // GET /api/personnel/{id}
  getById: async (id: number): Promise<ApiPersonnel> => {
    const response = await fetch(`${API_BASE_URL}/personnel/${id}`);
    return handleResponse<ApiPersonnel>(response);
  },

  // GET /api/personnel/matricule/{matricule}
  getByMatricule: async (matricule: string): Promise<ApiPersonnel> => {
    const response = await fetch(`${API_BASE_URL}/personnel/matricule/${matricule}`);
    return handleResponse<ApiPersonnel>(response);
  },

  // GET /api/personnel/actifs
  getActifs: async (): Promise<ApiPersonnel[]> => {
    const response = await fetch(`${API_BASE_URL}/personnel/actifs`);
    return handleResponse<ApiPersonnel[]>(response);
  },

  // GET /api/personnel/ville/{ville}
  getByVille: async (ville: string): Promise<ApiPersonnel[]> => {
    const response = await fetch(`${API_BASE_URL}/personnel/ville/${ville}`);
    return handleResponse<ApiPersonnel[]>(response);
  },

  // GET /api/personnel/contrat/{type}
  getByContrat: async (type: string): Promise<ApiPersonnel[]> => {
    const response = await fetch(`${API_BASE_URL}/personnel/contrat/${type}`);
    return handleResponse<ApiPersonnel[]>(response);
  },

  getByCarte: async (carte: string): Promise<ApiPersonnel[]> => {
    const response = await fetch(`${API_BASE_URL}/personnel/carte/${encodeURIComponent(carte)}`);
    return handleResponse<ApiPersonnel[]>(response);
  },

  // GET /api/personnel/search?nom=xxx
  searchByNom: async (nom: string): Promise<ApiPersonnel[]> => {
    const response = await fetch(`${API_BASE_URL}/personnel/search?nom=${encodeURIComponent(nom)}`);
    return handleResponse<ApiPersonnel[]>(response);
  },

  // GET /api/personnel/stats
  getStats: async (): Promise<PersonnelStats> => {
    const response = await fetch(`${API_BASE_URL}/personnel/stats`);
    return handleResponse<PersonnelStats>(response);
  },

  // POST /api/personnel
  create: async (personnel: Omit<ApiPersonnel, 'id'>): Promise<ApiPersonnel> => {
    const response = await fetch(`${API_BASE_URL}/personnel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(personnel),
    });
    return handleResponse<ApiPersonnel>(response);
  },

  // PUT /api/personnel/{id}
  update: async (id: number, personnel: Partial<ApiPersonnel>): Promise<ApiPersonnel> => {
    const response = await fetch(`${API_BASE_URL}/personnel/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(personnel),
    });
    return handleResponse<ApiPersonnel>(response);
  },

  // PATCH /api/personnel/{id}/toggle
  toggle: async (id: number): Promise<ApiPersonnel> => {
    const response = await fetch(`${API_BASE_URL}/personnel/${id}/toggle`, {
      method: 'PATCH',
    });
    return handleResponse<ApiPersonnel>(response);
  },

  // DELETE /api/personnel/{id}
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/personnel/${id}`, {
      method: 'DELETE',
    });
    await handleResponse<void>(response);
  },
};

// ============================================
// MAPPERS - Conversion entre API et Frontend
// ============================================

// Type Frontend
export interface Personnel {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  carte?: string;
  fonction?: string;
  role?: string;
  numero?: string;
  natureContrat: string;
  ville?: string;
  actif: boolean;
}

// Convertir un personnel API vers le format frontend
export function mapApiPersonnelToFrontend(apiPersonnel: ApiPersonnel): Personnel {
  return {
    id: apiPersonnel.id?.toString() || '',
    matricule: apiPersonnel.matricule,
    nom: apiPersonnel.nom,
    prenom: apiPersonnel.prenom,
    carte: apiPersonnel.carte,
    fonction: apiPersonnel.fonction,
    role: apiPersonnel.role,
    numero: apiPersonnel.numero,
    natureContrat: apiPersonnel.natureContrat,
    ville: apiPersonnel.ville,
    actif: apiPersonnel.actif ?? true,
  };
}

// Convertir un personnel frontend vers le format API
export function mapFrontendPersonnelToApi(frontendPersonnel: Partial<Personnel>): Omit<ApiPersonnel, 'id'> {
  return {
    matricule: frontendPersonnel.matricule || '',
    nom: frontendPersonnel.nom || '',
    prenom: frontendPersonnel.prenom || '',
    carte: frontendPersonnel.carte,
    fonction: frontendPersonnel.fonction,
    role: frontendPersonnel.role,
    numero: frontendPersonnel.numero,
    natureContrat: frontendPersonnel.natureContrat || 'CDI',
    ville: frontendPersonnel.ville,
    actif: frontendPersonnel.actif ?? true,
  };
}
