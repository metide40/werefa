import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Clinic, QueueTicket, DemoNotification, ConnectionState } from '../types';
import { INITIAL_CLINICS, INITIAL_TICKETS } from '../data/demoData';

interface AppContextProps {
  clinics: Clinic[];
  tickets: QueueTicket[];
  notifications: DemoNotification[];
  connectionState: ConnectionState;
  setConnectionState: React.Dispatch<React.SetStateAction<ConnectionState>>;
  addTicket: (ticket: QueueTicket) => void;
  updateTicket: (id: string, updates: Partial<QueueTicket>) => void;
  addNotification: (notif: DemoNotification) => void;
  // Clinic actions
  callNextPatient: (clinicId: string) => void;
  markCompleted: (ticketId: string) => void;
  markNoShow: (ticketId: string) => void;
}

export const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('ONLINE');
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [notifications, setNotifications] = useState<DemoNotification[]>([]);

  // Load initial demo data from localStorage or defaults
  useEffect(() => {
    const storedClinics = localStorage.getItem('werfa_clinics');
    const storedTickets = localStorage.getItem('werfa_tickets');
    const storedNotifs = localStorage.getItem('werfa_notifications');
    setClinics(storedClinics ? JSON.parse(storedClinics) : INITIAL_CLINICS);
    setTickets(storedTickets ? JSON.parse(storedTickets) : INITIAL_TICKETS);
    setNotifications(storedNotifs ? JSON.parse(storedNotifs) : []);
  }, []);

  // Persist changes
  useEffect(() => {
    localStorage.setItem('werfa_clinics', JSON.stringify(clinics));
  }, [clinics]);

  useEffect(() => {
    localStorage.setItem('werfa_tickets', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('werfa_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addTicket = (ticket: QueueTicket) => {
    setTickets((prev) => [...prev, ticket]);
  };

  const updateTicket = (id: string, updates: Partial<QueueTicket>) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const addNotification = (notif: DemoNotification) => {
    setNotifications((prev) => [...prev, notif]);
  };

  // Synchronize pending tickets when coming back online
  const syncPending = () => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.syncState === 'pending_sync') {
          const syncedTickets = prev.filter((x) => x.syncState !== 'pending_sync');
          const newNumber = `${t.clinicName?.slice(0, 2).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`;
          const position = syncedTickets.length + 1;
          const peopleAhead = syncedTickets.length;
          addNotification({
            id: crypto.randomUUID(),
            type: 'sync_success',
            titleKey: 'notifications.syncSuccessTitle',
            messageKey: 'notifications.syncSuccess',
            timestamp: new Date().toISOString(),
            read: false,
          });
          return {
            ...t,
            ticketNumber: newNumber,
            position,
            peopleAhead,
            syncState: 'synced',
          };
        }
        return t;
      })
    );
  };

  // Run sync when connection flips to ONLINE
  useEffect(() => {
    if (connectionState === 'ONLINE') {
      syncPending();
    }
  }, [connectionState]);

// Clinic actions
  const callNextPatient = (clinicId: string) => {
    const priorityOrder: Record<string, number> = { EMERGENCY: 1, URGENT: 2, NORMAL: 3 };
    const candidates = tickets
      .filter((t) => t.clinicId === clinicId && t.status === 'WAITING' && t.syncState === 'synced')
      .sort((a, b) => {
        const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (pDiff !== 0) return pDiff;
        return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
      });
    const next = candidates[0];
    if (next) {
      updateTicket(next.id, { status: 'CALLED', calledAt: new Date().toISOString() });
      addNotification({
        id: crypto.randomUUID(),
        type: 'called',
        titleKey: 'notifications.calledTitle',
        messageKey: 'notifications.called',
        params: { patientName: next.patientName },
        timestamp: new Date().toISOString(),
        read: false,
      });
    }
  };

  const markCompleted = (ticketId: string) => {
    updateTicket(ticketId, { status: 'COMPLETED', completedAt: new Date().toISOString() });
    addNotification({
      id: crypto.randomUUID(),
      type: 'completed',
      titleKey: 'notifications.completedTitle',
      messageKey: 'notifications.completed',
      timestamp: new Date().toISOString(),
      read: false,
    });
  };

  const markNoShow = (ticketId: string) => {
    updateTicket(ticketId, { status: 'NO_SHOW' });
    addNotification({
      id: crypto.randomUUID(),
      // Using 'offline_pending' as a generic notification type for no-show events
      type: 'offline_pending',
      titleKey: 'notifications.noShowTitle',
      messageKey: 'notifications.noShow',
      timestamp: new Date().toISOString(),
      read: false,
    });
  };

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
        callNextPatient,
        markCompleted,
        markNoShow,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};