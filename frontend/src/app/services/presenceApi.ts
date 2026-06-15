// API Service pour la gestion des Fiches de Présence
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// ============================================
// TYPES POUR L'API PRESENCE
// ============================================

export interface ApiFichePresence {
  id?: number;
  date: string; // Format ISO: YYYY-MM-DD
  ville?: string; // NOUVEAU: Champ ville
  matriculeCamion: string;
  canal: string;
  // Livreur 1 (Chauffeur)
  livreur1Id: string;
  livreur1Matricule: string;
  livreur1Nom: string;
  livreur1Prenom: string;
  // Livreur 2 (Aide 1)
  livreur2Id?: string;
  livreur2Matricule?: string;
  livreur2Nom?: string;
  livreur2Prenom?: string;
  // Livreur 3 (Aide 2)
  livreur3Id?: string;
  livreur3Matricule?: string;
  livreur3Nom?: string;
  livreur3Prenom?: string;
}

// ============================================
// HELPERS (Identiques à personnelApi)
// ============================================

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
  };
  const role = getUserRole();
  if (role) {
    headers['X-User-Role'] = role;
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }
  if (response.status === 204) return {} as T;
  
  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}

// ============================================
// PRESENCE API
// ============================================

export const presenceApi = {
  // GET /api/fiches-presence
  getAll: async (): Promise<ApiFichePresence[]> => {
    const response = await fetch(`${API_BASE_URL}/fiches-presence`);
    return handleResponse<ApiFichePresence[]>(response);
  },

  // GET /api/fiches-presence/date/{date}
  getByDate: async (date: string): Promise<ApiFichePresence[]> => {
    const response = await fetch(`${API_BASE_URL}/fiches-presence/date/${date}`);
    return handleResponse<ApiFichePresence[]>(response);
  },

  // POST /api/fiches-presence
  create: async (fiche: Omit<ApiFichePresence, 'id'>): Promise<ApiFichePresence> => {
    const response = await fetch(`${API_BASE_URL}/fiches-presence`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(fiche),
    });
    return handleResponse<ApiFichePresence>(response);
  },

  // PUT /api/fiches-presence/{id}
  update: async (id: number, fiche: Partial<ApiFichePresence>): Promise<ApiFichePresence> => {
    const response = await fetch(`${API_BASE_URL}/fiches-presence/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(fiche),
    });
    return handleResponse<ApiFichePresence>(response);
  },

  // DELETE /api/fiches-presence/{id}
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/fiches-presence/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    await handleResponse<void>(response);
  },
};

// ============================================
// MAPPERS - Conversion entre API et Frontend
// ============================================

export interface PresenceRecord {
  id: string;
  date: string;
  ville: string; // NOUVEAU: Champ ville
  matriculeCamion: string;
  canal: string;
  livreur1Id: string;
  livreur1Matricule: string;
  livreur1Nom: string;
  livreur1Prenom: string;
  livreur2Id: string;
  livreur2Matricule: string;
  livreur2Nom: string;
  livreur2Prenom: string;
  livreur3Id: string;
  livreur3Matricule: string;
  livreur3Nom: string;
  livreur3Prenom: string;
}

export function mapApiToPresenceRecord(api: ApiFichePresence): PresenceRecord {
  return {
    id: api.id?.toString() || '',
    date: api.date,
    ville: api.ville || '', // NOUVEAU: Mapping de la ville
    matriculeCamion: api.matriculeCamion,
    canal: api.canal,
    livreur1Id: api.livreur1Id,
    livreur1Matricule: api.livreur1Matricule,
    livreur1Nom: api.livreur1Nom,
    livreur1Prenom: api.livreur1Prenom,
    livreur2Id: api.livreur2Id || '',
    livreur2Matricule: api.livreur2Matricule || '',
    livreur2Nom: api.livreur2Nom || '',
    livreur2Prenom: api.livreur2Prenom || '',
    livreur3Id: api.livreur3Id || '',
    livreur3Matricule: api.livreur3Matricule || '',
    livreur3Nom: api.livreur3Nom || '',
    livreur3Prenom: api.livreur3Prenom || '',
  };
}

export function mapPresenceRecordToApi(record: Partial<PresenceRecord>): Omit<ApiFichePresence, 'id'> {
  return {
    date: record.date || new Date().toISOString().split('T')[0],
    ville: record.ville || '', // NOUVEAU: Mapping de la ville
    matriculeCamion: record.matriculeCamion || '',
    canal: record.canal || '',
    livreur1Id: record.livreur1Id || '',
    livreur1Matricule: record.livreur1Matricule || '',
    livreur1Nom: record.livreur1Nom || '',
    livreur1Prenom: record.livreur1Prenom || '',
    livreur2Id: record.livreur2Id,
    livreur2Matricule: record.livreur2Matricule,
    livreur2Nom: record.livreur2Nom,
    livreur2Prenom: record.livreur2Prenom,
    livreur3Id: record.livreur3Id,
    livreur3Matricule: record.livreur3Matricule,
    livreur3Nom: record.livreur3Nom,
    livreur3Prenom: record.livreur3Prenom,
  };
}