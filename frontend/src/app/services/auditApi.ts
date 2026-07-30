// Service léger pour journaliser les actions utilisateur (audit log).
// POST vers le service-auth via la gateway : /api/audit
// Le serveur enregistre : qui (email + rôle), quand, quelle action, sur quelle entité, détails libres.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

import { getAuthHeaders } from './authHeaders';

export interface AuditEvent {
  action: string;       // ex: "LOGIN", "CONSTRAINT_CREATE", "PERSONNEL_DELETE"
  entity?: string;      // ex: "Contrainte", "Personnel"
  entityId?: string;    // ex: "12"
  details?: string;     // libre (résumé JSON, message court)
}

function readUser(): { email?: string; role?: string } {
  try {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    if (!u) return {};
    return { email: u.email, role: u.superRole };
  } catch {
    return {};
  }
}

export async function logAudit(event: AuditEvent): Promise<void> {
  const { email, role } = readUser();
  const payload = {
    userEmail: email ?? 'anonymous',
    userRole: role ?? 'GUEST',
    action: event.action,
    entity: event.entity ?? null,
    entityId: event.entityId ?? null,
    details: event.details ?? null,
  };
  try {
    // Fire-and-forget : on n'attend pas et on n'échoue pas l'UI si l'audit casse.
    await fetch(`${API_BASE_URL}/audit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(role ? { 'X-User-Role': role } : {}),
        ...(email ? { 'X-User-Email': email } : {}),
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch (e) {
    console.warn('audit log failed', e);
  }
}

export async function fetchAuditLog(limit = 200): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/audit?limit=${limit}`, { headers: getAuthHeaders() });
  if (!res.ok) return [];
  return res.json();
}
