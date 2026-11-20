/**
 * IndexedDB store for offline queue join requests.
 * Pending requests never get a confirmed server ticket number until sync succeeds.
 */

const DB_NAME = 'werfa_offline';
const DB_VERSION = 1;
const STORE = 'pending_joins';

export interface PendingJoin {
  localId: string;
  patientName: string;
  phoneNumber: string;
  clinicId: string;
  clinicName: string;
  departmentId: string;
  departmentName: string;
  notes?: string;
  preferredLanguage?: string;
  createdAt: string;
  status: 'pending' | 'syncing' | 'failed';
  lastError?: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'localId' });
      }
    };
  });
}

export async function listPendingJoins(): Promise<PendingJoin[]> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as PendingJoin[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fallback to localStorage
    const raw = localStorage.getItem('werfa_pending_joins');
    return raw ? JSON.parse(raw) : [];
  }
}

export async function savePendingJoin(join: PendingJoin): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(join);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const list = await listPendingJoins();
    const next = list.filter((j) => j.localId !== join.localId).concat(join);
    localStorage.setItem('werfa_pending_joins', JSON.stringify(next));
  }
}

export async function removePendingJoin(localId: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(localId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const list = await listPendingJoins();
    localStorage.setItem(
      'werfa_pending_joins',
      JSON.stringify(list.filter((j) => j.localId !== localId))
    );
  }
}

export async function clearPendingJoins(): Promise<void> {
  const list = await listPendingJoins();
  await Promise.all(list.map((j) => removePendingJoin(j.localId)));
}
