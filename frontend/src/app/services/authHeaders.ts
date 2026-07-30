// Attache le token JWT stocké après connexion (voir UserContext.tsx) à un appel API.
// Sans ça, les services backend (une fois protégés par un filtre JWT) rejettent tout.
export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}
