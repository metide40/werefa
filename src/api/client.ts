/**
 * Werfa API client — talks to Django backend.
 * Set VITE_API_BASE_URL in .env (default http://127.0.0.1:8000/api)
 */

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export function getToken(): string | null {
  return localStorage.getItem('werfa_token');
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('werfa_token', token);
  else localStorage.removeItem('werfa_token');
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Token ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new ApiError('Network error — is the Django server running?', 0);
  }

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    if (res.status === 401) {
      setToken(null);
    }
    const d = data as any;
    let msg =
      (typeof d?.detail === 'string' && d.detail) ||
      (Array.isArray(d?.detail) && d.detail[0]) ||
      (Array.isArray(d?.non_field_errors) && d.non_field_errors[0]) ||
      (typeof d?.username?.[0] === 'string' && d.username[0]) ||
      (typeof d?.password?.[0] === 'string' && d.password[0]) ||
      `Request failed (${res.status})`;
    if (res.status === 500 && String(msg).startsWith('Request failed')) {
      msg = 'Server error during login. Check that Django is running and demo data is seeded.';
    }
    throw new ApiError(String(msg), res.status, data);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
};

// --- Auth ---
export async function login(username: string, password: string) {
  const data = await api.post<{ token: string; user: any }>('/auth/login/', { username, password });
  setToken(data.token);
  return data;
}

export async function register(payload: {
  username: string;
  password: string;
  full_name: string;
  phone_number?: string;
  preferred_language?: string;
}) {
  const data = await api.post<{ token: string; user: any }>('/auth/register/', payload);
  setToken(data.token);
  return data;
}

export async function logout() {
  try {
    await api.post('/auth/logout/');
  } finally {
    setToken(null);
  }
}

// --- Clinics ---
export async function fetchClinics() {
  return api.get<any[]>('/clinics/');
}

// --- Queue ---
export async function joinQueue(payload: {
  clinic_id: number | string;
  department_id: number | string;
  full_name: string;
  phone_number?: string;
  notes?: string;
  preferred_language?: string;
}) {
  return api.post<any>('/queues/join/', payload);
}

export async function fetchClinicQueue(params?: { department_id?: string; status?: string }) {
  const q = new URLSearchParams();
  if (params?.department_id) q.set('department_id', params.department_id);
  if (params?.status) q.set('status', params.status);
  const qs = q.toString();
  return api.get<any[]>(`/queues/clinic/${qs ? `?${qs}` : ''}`);
}

export async function fetchClinicOverview() {
  return api.get<any>('/queues/clinic/overview/');
}

export async function callNext(payload?: { clinic_id?: number; department_id?: number }) {
  return api.post<any>('/queues/clinic/call-next/', payload || {});
}

export async function completeTicket(id: number | string) {
  return api.post<any>(`/queues/clinic/${id}/complete/`);
}

export async function noShowTicket(id: number | string) {
  return api.post<any>(`/queues/clinic/${id}/no-show/`);
}

export async function cancelTicket(id: number | string) {
  return api.post<any>(`/queues/tickets/${id}/cancel/`);
}

export async function fetchAdminOverview() {
  return api.get<any>('/admin/overview/');
}

export async function fetchAdminClinics() {
  return api.get<any[]>('/admin/clinics/');
}

export { API_BASE };

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'PATIENT' | 'CLINIC_STAFF' | 'ADMIN';
  staff_clinic: number | null;
  staff_clinic_name: string | null;
};

export async function fetchMe() {
  return api.get<AuthUser>('/auth/me/');
}

export async function fetchAdminQueues(params?: {
  clinic_id?: string;
  status?: string;
  priority?: string;
}) {
  const q = new URLSearchParams();
  if (params?.clinic_id) q.set('clinic_id', params.clinic_id);
  if (params?.status) q.set('status', params.status);
  if (params?.priority) q.set('priority', params.priority);
  const qs = q.toString();
  return api.get<{ count: number; results: any[] }>(`/admin/queues/${qs ? `?${qs}` : ''}`);
}

export async function fetchAdminActivity() {
  return api.get<any[]>('/admin/activity/');
}

export async function fetchAdminHealth() {
  return api.get<any>('/admin/health/');
}

export async function fetchAdminClinic(id: string | number) {
  return api.get<any>(`/admin/clinics/${id}/`);
}

export async function updateAdminClinic(id: string | number, body: Record<string, unknown>) {
  return api.patch<any>(`/admin/clinics/${id}/`, body);
}

export async function createAdminClinic(body: Record<string, unknown>) {
  return api.post<any>('/admin/clinics/', body);
}

export async function changePassword(old_password: string, new_password: string) {
  return api.post<{ detail: string }>('/auth/change-password/', { old_password, new_password });
}
