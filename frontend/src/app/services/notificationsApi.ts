// Notifie l'ADV quand le dispatcher modifie une fiche de présence liée
// à un calcul de commission déjà effectué (voir PresenceContext.tsx).
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

import { getAuthHeaders } from './authHeaders';

export interface ApiNotification {
  id: number;
  matricule: string;
  mois: number;
  annee: number;
  message: string;
  lue: boolean;
  dateCreation: string;
}

export interface NotificationRequest {
  matricule: string;
  mois: number;
  annee: number;
  message: string;
}

export const notificationsApi = {
  create: async (payload: NotificationRequest): Promise<void> => {
    await fetch(`${API_BASE_URL}/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });
  },

  getAll: async (): Promise<ApiNotification[]> => {
    const res = await fetch(`${API_BASE_URL}/notifications`, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  markRead: async (id: number): Promise<void> => {
    await fetch(`${API_BASE_URL}/notifications/${id}/lue`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
  },
};
