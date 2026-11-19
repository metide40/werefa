export type Priority = 'EMERGENCY' | 'URGENT' | 'NORMAL';

export type QueueStatus = 
  | 'WAITING' 
  | 'ALMOST_TURN' 
  | 'CALLED' 
  | 'COMPLETED' 
  | 'NO_SHOW' 
  | 'CANCELLED';

export type ConnectionState = 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'SYNCED';

export type SyncState = 'synced' | 'pending_sync';

export interface Department {
  id: string;
  name: string;
  nameAm: string;
  nameOm: string;
  code: string;
  roomNumber: string;
  currentServingNumber: string | null;
  waitingCount: number;
  avgWaitMins: number;
  iconName: string;
}

export interface Clinic {
  id: string;
  name: string;
  nameAm: string;
  nameOm: string;
  city: string;
  region: string;
  location: string;
  phone: string;
  type: 'Referral & Teaching Hospital' | 'Specialized Hospital' | 'Primary Hospital' | 'Health Center';
  departments: Department[];
  activeDoctors: number;
  subscriptionStatus: 'active' | 'trial' | 'partner';
  isPartner: boolean;
}

export interface QueueTicket {
  id: string;
  ticketNumber: string;
  patientName: string;
  phoneNumber: string;
  clinicId: string;
  clinicName: string;
  departmentId: string;
  departmentName: string;
  priority: Priority;
  status: QueueStatus;
  joinedAt: string;
  calledAt?: string;
  completedAt?: string;
  estimatedWaitMins: number;
  notes?: string;
  isOfflineCreated?: boolean;
  syncState: SyncState;
  position: number;
  peopleAhead: number;
}

export interface OfflineQueueRequest {
  id: string;
  temporaryId: string;
  patientName: string;
  phoneNumber: string;
  clinicId: string;
  departmentId: string;
  priority: Priority;
  createdAt: string;
  notes?: string;
  status: 'pending_sync' | 'synced';
}

export interface DemoNotification {
  id: string;
  type: 'join' | 'approaching' | 'called' | 'completed' | 'offline_pending' | 'sync_success';
  titleKey: string;
  messageKey: string;
  params?: Record<string, string | number>;
  timestamp: string;
  read: boolean;
}

export interface PitchStep {
  step: number;
  title: string;
  description: string;
  actionRoute: string;
  highlightTarget?: string;
  speakerNotes: string;
}
