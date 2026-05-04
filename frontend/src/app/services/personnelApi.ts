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

export interface ApiFichePresence {
  id?: number;
  date: string;
  matriculeCamion?: string;
  canal?: string;
  livreur1Id?: number;
  livreur1Matricule?: string;
  livreur1Nom?: string;
  livreur1Prenom?: string;
  livreur2Id?: number;
  livreur2Matricule?: string;
  livreur2Nom?: string;
  livreur2Prenom?: string;
  livreur3Id?: number;
  livreur3Matricule?: string;
  livreur3Nom?: string;
  livreur3Prenom?: string;
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
  };
  const role = getUserRole();
  console.log('🔍 [personnelApi] getHeaders - role:', role);
  if (role) {
    headers['X-User-Role'] = role;
  }
  console.log('🔍 [personnelApi] headers:', headers);
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
};

// ============================================
// FICHE PRESENCE API
// ============================================

export const fichePresenceApi = {
  getAll: async (): Promise<ApiFichePresence[]> => {
    const response = await fetch(`${API_BASE_URL}/fiche-presence`);
    return handleResponse<ApiFichePresence[]>(response);
  },

  getById: async (id: number): Promise<ApiFichePresence> => {
    const response = await fetch(`${API_BASE_URL}/fiche-presence/${id}`);
    return handleResponse<ApiFichePresence>(response);
  },

  getByDate: async (date: string): Promise<ApiFichePresence[]> => {
    const response = await fetch(`${API_BASE_URL}/fiche-presence/date/${encodeURIComponent(date)}`);
    return handleResponse<ApiFichePresence[]>(response);
  },

  getByMatriculeCamion: async (matricule: string): Promise<ApiFichePresence[]> => {
    const response = await fetch(`${API_BASE_URL}/fiche-presence/camion/${encodeURIComponent(matricule)}`);
    return handleResponse<ApiFichePresence[]>(response);
  },

  getByCanal: async (canal: string): Promise<ApiFichePresence[]> => {
    const response = await fetch(`${API_BASE_URL}/fiche-presence/canal/${encodeURIComponent(canal)}`);
    return handleResponse<ApiFichePresence[]>(response);
  },

  create: async (fichePresence: Omit<ApiFichePresence, 'id'>): Promise<ApiFichePresence> => {
    const response = await fetch(`${API_BASE_URL}/fiche-presence`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(fichePresence),
    });
    return handleResponse<ApiFichePresence>(response);
  },

  update: async (id: number, fichePresence: Partial<ApiFichePresence>): Promise<ApiFichePresence> => {
    const response = await fetch(`${API_BASE_URL}/fiche-presence/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(fichePresence),
    });
    return handleResponse<ApiFichePresence>(response);
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/fiche-presence/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
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

export interface FichePresence {
  id: string;
  date: string;
  matriculeCamion?: string;
  canal?: string;
  livreur1Id?: string;
  livreur1Matricule?: string;
  livreur1Nom?: string;
  livreur1Prenom?: string;
  livreur2Id?: string;
  livreur2Matricule?: string;
  livreur2Nom?: string;
  livreur2Prenom?: string;
  livreur3Id?: string;
  livreur3Matricule?: string;
  livreur3Nom?: string;
  livreur3Prenom?: string;
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

// Convertir une fiche de présence API vers le format frontend
export function mapApiFichePresenceToFrontend(api: ApiFichePresence): FichePresence {
  return {
    id: api.id?.toString() || '',
    date: api.date,
    matriculeCamion: api.matriculeCamion,
    canal: api.canal,
    livreur1Id: api.livreur1Id?.toString(),
    livreur1Matricule: api.livreur1Matricule,
    livreur1Nom: api.livreur1Nom,
    livreur1Prenom: api.livreur1Prenom,
    livreur2Id: api.livreur2Id?.toString(),
    livreur2Matricule: api.livreur2Matricule,
    livreur2Nom: api.livreur2Nom,
    livreur2Prenom: api.livreur2Prenom,
    livreur3Id: api.livreur3Id?.toString(),
    livreur3Matricule: api.livreur3Matricule,
    livreur3Nom: api.livreur3Nom,
    livreur3Prenom: api.livreur3Prenom,
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

// Convertir une fiche de présence frontend vers le format API
export function mapFrontendFichePresenceToApi(frontendFichePresence: Partial<FichePresence>): Omit<ApiFichePresence, 'id'> {
  return {
    date: frontendFichePresence.date || '',
    matriculeCamion: frontendFichePresence.matriculeCamion,
    canal: frontendFichePresence.canal,
    livreur1Id: frontendFichePresence.livreur1Id ? parseInt(frontendFichePresence.livreur1Id, 10) : undefined,
    livreur1Matricule: frontendFichePresence.livreur1Matricule,
    livreur1Nom: frontendFichePresence.livreur1Nom,
    livreur1Prenom: frontendFichePresence.livreur1Prenom,
    livreur2Id: frontendFichePresence.livreur2Id ? parseInt(frontendFichePresence.livreur2Id, 10) : undefined,
    livreur2Matricule: frontendFichePresence.livreur2Matricule,
    livreur2Nom: frontendFichePresence.livreur2Nom,
    livreur2Prenom: frontendFichePresence.livreur2Prenom,
    livreur3Id: frontendFichePresence.livreur3Id ? parseInt(frontendFichePresence.livreur3Id, 10) : undefined,
    livreur3Matricule: frontendFichePresence.livreur3Matricule,
    livreur3Nom: frontendFichePresence.livreur3Nom,
    livreur3Prenom: frontendFichePresence.livreur3Prenom,
  };
}
