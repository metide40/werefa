/**
 * Offline triage emergency assessments — IndexedDB + sync with idempotency keys.
 * Never claims remote patients were notified until server confirms.
 */

const DB_NAME = 'werfa_triage_offline';
const STORE = 'pending_assessments';
const DB_VERSION = 1;

export type PendingStatus = 'PENDING' | 'SYNCING' | 'FAILED' | 'SYNCED';

export type PendingAssessment = {
  client_request_id: string;
  payload: Record<string, unknown>;
  created_at: string;
  status: PendingStatus;
  last_error?: string;
  synced_at?: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'client_request_id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function putRecord(record: PendingAssessment): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function savePendingAssessment(payload: Record<string, unknown>): Promise<PendingAssessment> {
  const client_request_id =
    (payload.client_request_id as string) ||
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `local-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const record: PendingAssessment = {
    client_request_id,
    payload: { ...payload, client_request_id, confirm_priority: true },
    created_at: new Date().toISOString(),
    status: 'PENDING',
  };
  await putRecord(record);
  return record;
}

export async function listPendingAssessments(): Promise<PendingAssessment[]> {
  const db = await openDb();
  const rows = await new Promise<PendingAssessment[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as PendingAssessment[]) || []);
    req.onerror = () => reject(req.error);
  });
  db.close();
  // Only return non-synced local work items
  return rows.filter((r) => r.status !== 'SYNCED');
}

export async function removePendingAssessment(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function syncPendingAssessments(
  submitFn: (body: Record<string, unknown>) => Promise<unknown>
): Promise<{ synced: number; failed: number; results: { id: string; ok: boolean; error?: string }[] }> {
  const pending = await listPendingAssessments();
  let synced = 0;
  let failed = 0;
  const results: { id: string; ok: boolean; error?: string }[] = [];

  for (const item of pending) {
    const syncing: PendingAssessment = { ...item, status: 'SYNCING' };
    await putRecord(syncing);
    try {
      await submitFn(item.payload);
      await removePendingAssessment(item.client_request_id);
      synced += 1;
      results.push({ id: item.client_request_id, ok: true });
    } catch (e: unknown) {
      failed += 1;
      const msg = e instanceof Error ? e.message : 'sync failed';
      await putRecord({
        ...item,
        status: 'FAILED',
        last_error: msg,
      });
      results.push({ id: item.client_request_id, ok: false, error: msg });
    }
  }
  return { synced, failed, results };
}

/** Register one online listener for triage sync (call once from triage shell). */
export function registerTriageOnlineSync(
  submitFn: (body: Record<string, unknown>) => Promise<unknown>,
  onDone?: (r: { synced: number; failed: number }) => void
): () => void {
  const handler = () => {
    if (!navigator.onLine) return;
    syncPendingAssessments(submitFn)
      .then((r) => onDone?.(r))
      .catch(() => {
        /* keep failed records */
      });
  };
  window.addEventListener('online', handler);
  return () => window.removeEventListener('online', handler);
}
