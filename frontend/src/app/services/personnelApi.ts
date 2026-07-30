// API Service pour la gestion du Personnel
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

import { getAuthHeaders } from './authHeaders';

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

// Helper pour obtenir le rôle de l'utilisateur
function getUserRole(): string {
  const userStr = localStorage.getItem('user');
  console.log('🔍 [personnelApi] user from localStorage:', userStr);
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      console.log('🔍 [personnelApi] parsed user:', user);
      return user.superRole || '';
    } catch (e) {
      console.error('🔍 [personnelApi] error parsing user:', e);
      return '';
    }
  }
  console.log('🔍 [personnelApi] no user in localStorage');
  return '';
}

// Helper pour les headers avec rôle utilisateur
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
// PERSONNEL API
// ============================================

export const personnelApi = {
  // GET /api/personnel
  getAll: async (): Promise<ApiPersonnel[]> => {
    const response = await fetch(`${API_BASE_URL}/personnel`, { headers: getHeaders() });
    return handleResponse<ApiPersonnel[]>(response);
  },

  // GET /api/personnel/{id}
  getById: async (id: number): Promise<ApiPersonnel> => {
    const response = await fetch(`${API_BASE_URL}/personnel/${id}`, { headers: getHeaders() });
    return handleResponse<ApiPersonnel>(response);
  },

  // GET /api/personnel/matricule/{matricule}
  getByMatricule: async (matricule: string): Promise<ApiPersonnel> => {
    const response = await fetch(`${API_BASE_URL}/personnel/matricule/${matricule}`, { headers: getHeaders() });
    return handleResponse<ApiPersonnel>(response);
  },

  // GET /api/personnel/actifs
  getActifs: async (): Promise<ApiPersonnel[]> => {
    const response = await fetch(`${API_BASE_URL}/personnel/actifs`, { headers: getHeaders() });
    return handleResponse<ApiPersonnel[]>(response);
  },

  // GET /api/personnel/ville/{ville}
  getByVille: async (ville: string): Promise<ApiPersonnel[]> => {
    const response = await fetch(`${API_BASE_URL}/personnel/ville/${ville}`, { headers: getHeaders() });
    return handleResponse<ApiPersonnel[]>(response);
  },

  // GET /api/personnel/contrat/{type}
  getByContrat: async (type: string): Promise<ApiPersonnel[]> => {
    const response = await fetch(`${API_BASE_URL}/personnel/contrat/${type}`, { headers: getHeaders() });
    return handleResponse<ApiPersonnel[]>(response);
  },

  getByCarte: async (carte: string): Promise<ApiPersonnel[]> => {
    const response = await fetch(`${API_BASE_URL}/personnel/carte/${encodeURIComponent(carte)}`, { headers: getHeaders() });
    return handleResponse<ApiPersonnel[]>(response);
  },

  // GET /api/personnel/search?nom=xxx
  searchByNom: async (nom: string): Promise<ApiPersonnel[]> => {
    const response = await fetch(`${API_BASE_URL}/personnel/search?nom=${encodeURIComponent(nom)}`, { headers: getHeaders() });
    return handleResponse<ApiPersonnel[]>(response);
  },

  // GET /api/personnel/stats
  getStats: async (): Promise<PersonnelStats> => {
    const response = await fetch(`${API_BASE_URL}/personnel/stats`, { headers: getHeaders() });
    return handleResponse<PersonnelStats>(response);
  },

  // POST /api/personnel
  create: async (personnel: Omit<ApiPersonnel, 'id'>): Promise<ApiPersonnel> => {
    const response = await fetch(`${API_BASE_URL}/personnel`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(personnel),
    });
    return handleResponse<ApiPersonnel>(response);
  },

  // PUT /api/personnel/{id}
  update: async (id: number, personnel: Partial<ApiPersonnel>): Promise<ApiPersonnel> => {
    const response = await fetch(`${API_BASE_URL}/personnel/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(personnel),
    });
    return handleResponse<ApiPersonnel>(response);
  },

  // PATCH /api/personnel/{id}/toggle
  toggle: async (id: number): Promise<ApiPersonnel> => {
    const response = await fetch(`${API_BASE_URL}/personnel/${id}/toggle`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse<ApiPersonnel>(response);
  },

  // DELETE /api/personnel/{id}
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/personnel/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    await handleResponse<void>(response);
  },

  // POST /api/personnel/import
  importExcel: async (file: File): Promise<ApiPersonnel[]> => {
    // Lecture brute des octets du fichier
    const arrayBuffer = await file.arrayBuffer();

    const response = await fetch(`${API_BASE_URL}/personnel/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream', // On indique au serveur que ce sont des données brutes
        'X-File-Name': encodeURIComponent(file.name), // On passe le nom via un header personnalisé
        ...getAuthHeaders(),
      },
      body: arrayBuffer,
    });
    
    return handleResponse<ApiPersonnel[]>(response);
  },
}; // <-- L'objet personnelApi est fermé ici

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