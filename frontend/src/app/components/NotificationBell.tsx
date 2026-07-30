import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { notificationsApi, ApiNotification } from '../services/notificationsApi';

// Visible seulement par ceux qui font les calculs de commission (ADMIN/ADV) —
// c'est eux qu'on prévient quand le dispatcher touche une fiche de présence
// liée à une période déjà calculée.
export function NotificationBell() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const canSee = user?.superRole === 'ADMIN' || user?.superRole === 'ADV';

  useEffect(() => {
    if (!canSee) return;
    const load = () => notificationsApi.getAll().then(setNotifications).catch(() => {});
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [canSee]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!canSee) return null;

  const unread = notifications.filter((n) => !n.lue);

  const handleMarkRead = async (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, lue: true } : n)));
    await notificationsApi.markRead(id).catch(() => {});
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="abc-iconbtn"
        onClick={() => setOpen((o) => !o)}
        title="Notifications"
        style={{ width: 34, height: 34, position: 'relative' }}
      >
        <Bell size={16} />
        {unread.length > 0 && (
          <span
            style={{
              position: 'absolute', top: -2, right: -2, background: '#ef4444', color: 'white',
              borderRadius: 9999, fontSize: 10, minWidth: 16, height: 16, display: 'flex',
              alignItems: 'center', justifyContent: 'center', padding: '0 3px', fontWeight: 700,
            }}
          >
            {unread.length}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', right: 0, top: 40, width: 320, maxHeight: 400, overflowY: 'auto',
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 50,
          }}
        >
          {notifications.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Aucune notification
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleMarkRead(n.id)}
                style={{
                  padding: 12, borderBottom: '1px solid var(--border)', cursor: 'pointer',
                  opacity: n.lue ? 0.55 : 1,
                  background: n.lue ? 'transparent' : 'rgba(59,130,246,0.06)',
                }}
              >
                <div style={{ fontSize: 13 }}>{n.message}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Période {n.mois}/{n.annee} · matricule {n.matricule}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
