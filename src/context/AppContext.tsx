import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Clinic, QueueTicket, DemoNotification, ConnectionState } from '../types';
import { INITIAL_CLINICS, INITIAL_TICKETS } from '../data/demoData';
import {
  listPendingJoins,
  savePendingJoin,
  removePendingJoin,
  type PendingJoin,
} from '../lib/offlineStore';
import {
  joinQueue as apiJoinQueue,
  fetchClinicQueue,
  callNext as apiCallNext,
  completeTicket as apiComplete,
  noShowTicket as apiNoShow,
  getToken,
  login,
  fetchTicketPosition,
} from '../api/client';

interface AppContextProps {
  clinics: Clinic[];
  tickets: QueueTicket[];
  notifications: DemoNotification[];
  connectionState: ConnectionState;
  setConnectionState: React.Dispatch<React.SetStateAction<ConnectionState>>;
  pendingJoins: PendingJoin[];
  refreshPendingJoins: () => Promise<void>;
  addTicket: (ticket: QueueTicket) => void;
  updateTicket: (id: string, updates: Partial<QueueTicket>) => void;
  addNotification: (notif: DemoNotification) => void;
  callNextPatient: (clinicId: string) => Promise<void>;
  markCompleted: (ticketId: string) => Promise<void>;
  markNoShow: (ticketId: string) => Promise<void>;
  /** Online join via API; throws on failure */
  joinQueueOnline: (payload: {
    clinicId: string;
    clinicName: string;
    departmentId: string;
    departmentName: string;
    fullName: string;
    phoneNumber?: string;
    notes?: string;
    preferredLanguage?: string;
  }) => Promise<QueueTicket>;
  /** Offline: store pending request only — no confirmed ticket number */
  joinQueueOffline: (payload: {
    clinicId: string;
    clinicName: string;
    departmentId: string;
    departmentName: string;
    fullName: string;
    phoneNumber?: string;
    notes?: string;
    preferredLanguage?: string;
  }) => Promise<PendingJoin>;
  syncPendingJoins: () => Promise<{ synced: number; failed: number }>;
  apiAvailable: boolean;
  lastApiError: string | null;
}

export const AppContext = createContext<AppContextProps | undefined>(undefined);

function mapApiTicket(r: any): QueueTicket {
  return {
    id: String(r.id),
    ticketNumber: r.ticketNumber,
    patientName: r.patientName,
    phoneNumber: r.phoneNumber || '',
    clinicId: String(r.clinicId),
    clinicName: r.clinicName,
    departmentId: String(r.departmentId),
    departmentName: r.departmentName,
    priority: r.priority || 'NORMAL',
    status: r.status === 'SERVING' ? 'CALLED' : r.status,
    joinedAt: r.joinedAt,
    calledAt: r.calledAt,
    completedAt: r.completedAt,
    estimatedWaitMins: r.estimatedWaitMins ?? 0,
    notes: r.notes,
    syncState: 'synced',
    position: r.position ?? 0,
    queueInterrupted: r.queueInterrupted ?? false,
    interruptionMessage: r.interruptionMessage ?? null,
    peopleAhead: r.peopleAhead ?? 0,
  };
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('ONLINE');
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [notifications, setNotifications] = useState<DemoNotification[]>([]);
  const [pendingJoins, setPendingJoins] = useState<PendingJoin[]>([]);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [lastApiError, setLastApiError] = useState<string | null>(null);
  const syncingRef = useRef(false);

  useEffect(() => {
    const storedClinics = localStorage.getItem('werfa_clinics');
    const storedTickets = localStorage.getItem('werfa_tickets');
    const storedNotifs = localStorage.getItem('werfa_notifications');
    const parsedClinics = storedClinics ? JSON.parse(storedClinics) : null;
    setClinics(parsedClinics && parsedClinics.length > 0 ? parsedClinics : INITIAL_CLINICS);
    setTickets(storedTickets ? JSON.parse(storedTickets) : INITIAL_TICKETS);
    setNotifications(storedNotifs ? JSON.parse(storedNotifs) : []);
    listPendingJoins().then(setPendingJoins).catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem('werfa_clinics', JSON.stringify(clinics));
  }, [clinics]);
  useEffect(() => {
    localStorage.setItem('werfa_tickets', JSON.stringify(tickets));
  }, [tickets]);
  useEffect(() => {
    localStorage.setItem('werfa_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Browser online/offline
  useEffect(() => {
    const goOnline = () => setConnectionState((s) => (s === 'OFFLINE' ? 'ONLINE' : s));
    const goOffline = () => setConnectionState('OFFLINE');
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    if (!navigator.onLine) setConnectionState('OFFLINE');
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const refreshPendingJoins = useCallback(async () => {
    const list = await listPendingJoins();
    setPendingJoins(list);
  }, []);

  const addTicket = useCallback((ticket: QueueTicket) => {
    setTickets((prev) => {
      if (prev.some((t) => t.id === ticket.id)) {
        return prev.map((t) => (t.id === ticket.id ? { ...t, ...ticket } : t));
      }
      return [...prev, ticket];
    });
  }, []);

  const updateTicket = useCallback((id: string, updates: Partial<QueueTicket>) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const addNotification = useCallback((notif: DemoNotification) => {
    setNotifications((prev) => [...prev, notif]);
  }, []);

  const joinQueueOnline = useCallback(
    async (payload: {
      clinicId: string;
      clinicName: string;
      departmentId: string;
      departmentName: string;
      fullName: string;
      phoneNumber?: string;
      notes?: string;
      preferredLanguage?: string;
    }) => {
      const result = await apiJoinQueue({
        clinic_id: payload.clinicId,
        department_id: payload.departmentId,
        full_name: payload.fullName,
        phone_number: payload.phoneNumber,
        notes: payload.notes,
        preferred_language: payload.preferredLanguage,
      });
      const ticket = mapApiTicket(result);
      addTicket(ticket);
      setApiAvailable(true);
      setLastApiError(null);
      addNotification({
        id: crypto.randomUUID(),
        type: 'join',
        titleKey: 'notifications.joinTitle',
        messageKey: 'notifications.join',
        params: { ticketNumber: ticket.ticketNumber },
        timestamp: new Date().toISOString(),
        read: false,
      });
      return ticket;
    },
    [addTicket, addNotification]
  );

  const joinQueueOffline = useCallback(
    async (payload: {
      clinicId: string;
      clinicName: string;
      departmentId: string;
      departmentName: string;
      fullName: string;
      phoneNumber?: string;
      notes?: string;
      preferredLanguage?: string;
    }) => {
      const join: PendingJoin = {
        localId: crypto.randomUUID(),
        patientName: payload.fullName,
        phoneNumber: payload.phoneNumber || '',
        clinicId: payload.clinicId,
        clinicName: payload.clinicName,
        departmentId: payload.departmentId,
        departmentName: payload.departmentName,
        notes: payload.notes,
        preferredLanguage: payload.preferredLanguage,
        createdAt: new Date().toISOString(),
        status: 'pending',
      };
      await savePendingJoin(join);
      await refreshPendingJoins();
      addNotification({
        id: crypto.randomUUID(),
        type: 'offline_pending',
        titleKey: 'notifications.offlinePendingTitle',
        messageKey: 'notifications.offlinePending',
        timestamp: new Date().toISOString(),
        read: false,
      });
      return join;
    },
    [refreshPendingJoins, addNotification]
  );

  const syncPendingJoins = useCallback(async () => {
    if (syncingRef.current) return { synced: 0, failed: 0 };
    syncingRef.current = true;
    setConnectionState('SYNCING');
    let synced = 0;
    let failed = 0;
    try {
      const list = await listPendingJoins();
      for (const join of list) {
        if (join.status === 'syncing') continue;
        try {
          await savePendingJoin({ ...join, status: 'syncing' });
          const ticket = await joinQueueOnline({
            clinicId: join.clinicId,
            clinicName: join.clinicName,
            departmentId: join.departmentId,
            departmentName: join.departmentName,
            fullName: join.patientName,
            phoneNumber: join.phoneNumber,
            notes: join.notes,
            preferredLanguage: join.preferredLanguage,
          });
          await removePendingJoin(join.localId);
          synced += 1;
          addNotification({
            id: crypto.randomUUID(),
            type: 'sync_success',
            titleKey: 'notifications.syncSuccessTitle',
            messageKey: 'notifications.syncSuccess',
            params: { ticketNumber: ticket.ticketNumber },
            timestamp: new Date().toISOString(),
            read: false,
          });
        } catch (e: any) {
          failed += 1;
          await savePendingJoin({
            ...join,
            status: 'failed',
            lastError: e?.message || 'Sync failed',
          });
          setLastApiError(e?.message || 'Sync failed');
        }
      }
      await refreshPendingJoins();
      setConnectionState(failed > 0 && synced === 0 ? 'ONLINE' : 'SYNCED');
      setTimeout(() => setConnectionState('ONLINE'), 2000);
    } finally {
      syncingRef.current = false;
    }
    return { synced, failed };
  }, [joinQueueOnline, refreshPendingJoins, addNotification]);

  // Auto-sync when back online
  useEffect(() => {
    if (connectionState === 'ONLINE' && pendingJoins.length > 0) {
      syncPendingJoins();
    }
  }, [connectionState]); // eslint-disable-line react-hooks/exhaustive-deps

  const callNextPatient = useCallback(
    async (clinicId: string) => {
      try {
        if (!getToken()) {
          const demo =
            (import.meta as any).env?.VITE_DEMO_AUTO_LOGIN === 'true' ||
            (import.meta as any).env?.VITE_DEMO_AUTO_LOGIN === '1';
          if (demo) await login('clinic_staff', 'werfa-staff-demo');
        }
        const r = await apiCallNext({ clinic_id: Number(clinicId) || undefined });
        const ticket = mapApiTicket(r);
        addTicket(ticket);
        updateTicket(ticket.id, { status: 'CALLED', calledAt: ticket.calledAt });
        addNotification({
          id: crypto.randomUUID(),
          type: 'called',
          titleKey: 'notifications.calledTitle',
          messageKey: 'notifications.called',
          params: { patientName: ticket.patientName },
          timestamp: new Date().toISOString(),
          read: false,
        });
        setApiAvailable(true);
      } catch (e: any) {
        // Local fallback only for demo when API unreachable
        setLastApiError(e?.message || 'Call next failed');
        const priorityOrder: Record<string, number> = { EMERGENCY: 1, URGENT: 2, NORMAL: 3 };
        const candidates = tickets
          .filter(
            (t) =>
              String(t.clinicId) === String(clinicId) &&
              t.status === 'WAITING' &&
              t.syncState === 'synced'
          )
          .sort((a, b) => {
            const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (pDiff !== 0) return pDiff;
            return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
          });
        const next = candidates[0];
        if (next) {
          updateTicket(next.id, { status: 'CALLED', calledAt: new Date().toISOString() });
        }
      }
    },
    [tickets, addTicket, updateTicket, addNotification]
  );

  const markCompleted = useCallback(
    async (ticketId: string) => {
      try {
        await apiComplete(ticketId);
        setApiAvailable(true);
      } catch (e: any) {
        setLastApiError(e?.message || 'Complete failed');
      }
      updateTicket(ticketId, { status: 'COMPLETED', completedAt: new Date().toISOString() });
      addNotification({
        id: crypto.randomUUID(),
        type: 'completed',
        titleKey: 'notifications.completedTitle',
        messageKey: 'notifications.completed',
        timestamp: new Date().toISOString(),
        read: false,
      });
    },
    [updateTicket, addNotification]
  );

  const markNoShow = useCallback(
    async (ticketId: string) => {
      try {
        await apiNoShow(ticketId);
      } catch (e: any) {
        setLastApiError(e?.message || 'No-show failed');
      }
      updateTicket(ticketId, { status: 'NO_SHOW' });
    },
    [updateTicket]
  );

  // Poll public ticket position for patient view (ETA + emergency delay notices)
  useEffect(() => {
    if (connectionState === 'OFFLINE') return;
    let cancelled = false;
    async function poll() {
      try {
        const current = JSON.parse(localStorage.getItem('werfa_tickets') || '[]') as { id: string; syncState?: string }[];
        const ids = current.filter((t) => t.syncState !== 'pending').map((t) => t.id);
        if (!ids.length) return;
        for (const id of ids.slice(0, 5)) {
          try {
            const r = await fetchTicketPosition(id);
            if (cancelled) return;
            setApiAvailable(true);
            setTickets((prev) => {
              const idx = prev.findIndex((t) => t.id === String(r.id));
              if (idx === -1) return prev;
              const next = [...prev];
              next[idx] = {
                ...next[idx],
                status: r.status === 'SERVING' ? 'CALLED' : r.status,
                position: r.position ?? next[idx].position,
                peopleAhead: r.peopleAhead ?? next[idx].peopleAhead,
                estimatedWaitMins: r.estimatedWaitMins ?? next[idx].estimatedWaitMins,
                queueInterrupted: r.queueInterrupted ?? false,
                interruptionMessage: r.interruptionMessage ?? null,
              };
              return next;
            });
          } catch {
            /* ignore single ticket failures */
          }
        }
      } catch {
        /* keep local state */
      }
    }
    poll();
    const id = setInterval(poll, 8000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [connectionState]);

  return (
    <AppContext.Provider
      value={{
        clinics,
        tickets,
        notifications,
        addTicket,
        updateTicket,
        addNotification,
        connectionState,
        setConnectionState,
        pendingJoins,
        refreshPendingJoins,
        callNextPatient,
        markCompleted,
        markNoShow,
        joinQueueOnline,
        joinQueueOffline,
        syncPendingJoins,
        apiAvailable,
        lastApiError,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
