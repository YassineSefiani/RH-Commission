import { getAuthHeaders } from './authHeaders';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

function getHeaders(): HeadersInit {
  const role = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}').superRole || ''; } catch { return ''; }
  })();
  return {
    'Content-Type': 'application/json',
    ...(role ? { 'X-User-Role': role } : {}),
    ...getAuthHeaders(),
  };
}

export interface ApiObjectif {
  id?: number;
  periode: string;
  carte: string;
  matricule: string;
  nomComplet?: string;
  target: number;
  derniereMaj?: string;
}

export interface ApiRealisation {
  id?: number;
  periode: string;
  carte: string;
  matricule: string;
  caRealise: number;
  derniereMaj?: string;
}

export interface ApiTriage {
  id?: number;
  periode: string;
  matricule: string;
  note: number;
  derniereMaj?: string;
}

export interface ApiVolume {
  id?: number;
  date: string;
  matricule: string;
  role?: string;
  volumeCharge: number;
  volumeRetourne: number;
  periode?: string;
  derniereMaj?: string;
}

async function getByPeriode<T>(resource: string, periode: string): Promise<T[]> {
  const res = await fetch(`${API_BASE_URL}/import/${resource}/periode/${encodeURIComponent(periode)}`, {
    headers: getHeaders(),
  });
  
  if (!res.ok) throw new Error(`Impossible de récupérer ${resource} pour la période ${periode}`);
  
  // On extrait les données JSON dans une variable
  const data = await res.json();
  
  // On affiche un log clair dans la console avec la ressource (objectifs, realisations, etc.)
  console.log(`📥 [DB FETCH] Données récupérées pour ${resource.toUpperCase()} (${periode}) :`, data);
  
  // On retourne les données pour que le reste de l'application puisse les utiliser
  return data;
}

async function postBatch<T>(resource: string, payload: unknown[]): Promise<T[]> {
  if (payload.length === 0) return [];

  // Découpage en paquets de 200 lignes pour éviter le timeout de la passerelle
  const CHUNK_SIZE = 200;
  let allResults: T[] = [];

  for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
    const chunk = payload.slice(i, i + CHUNK_SIZE);
    
    console.log(`📤 [IMPORT BATCH] Envoi du lot (${i + 1} à ${Math.min(i + CHUNK_SIZE, payload.length)}) pour ${resource.toUpperCase()}...`);

    const res = await fetch(`${API_BASE_URL}/import/${resource}/batch`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(chunk),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message || `Échec de l'import ${resource} (lot ${i + 1}-${i + chunk.length})`);
    }

    const chunkResult = await res.json();
    allResults = allResults.concat(chunkResult);
  }

  console.log(`✅ [IMPORT SUCCÈS] Total de ${allResults.length} lignes importées pour ${resource.toUpperCase()}`);
  return allResults;
}

export const importApi = {
  getObjectifsByPeriode: (periode: string) => getByPeriode<ApiObjectif>('objectifs', periode),
  postObjectifsBatch: (payload: Omit<ApiObjectif, 'id' | 'derniereMaj'>[]) => postBatch<ApiObjectif>('objectifs', payload),

  getRealisationsByPeriode: (periode: string) => getByPeriode<ApiRealisation>('realisations', periode),
  postRealisationsBatch: (payload: Omit<ApiRealisation, 'id' | 'derniereMaj'>[]) => postBatch<ApiRealisation>('realisations', payload),

  getTriageByPeriode: (periode: string) => getByPeriode<ApiTriage>('triage', periode),
  postTriageBatch: (payload: Omit<ApiTriage, 'id' | 'derniereMaj'>[]) => postBatch<ApiTriage>('triage', payload),

  getVolumesByPeriode: (periode: string) => getByPeriode<ApiVolume>('volumes', periode),
  postVolumesBatch: (payload: Omit<ApiVolume, 'id' | 'derniereMaj' | 'periode'>[]) => postBatch<ApiVolume>('volumes', payload),
};
