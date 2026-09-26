/**
 * Klien REST untuk backend Laravel (D:\setarakerja\backend).
 * Base URL bisa dioverride lewat VITE_API_URL.
 */

export const API_BASE: string =
  (import.meta.env?.VITE_API_URL as string | undefined) ?? 'https://setarakerja.ncr.my.id/api';

const TOKEN_KEY = 'sk_token';
const USER_KEY = 'sk_user';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'kandidat' | 'hrd' | 'admin';
  title: string;
  avatar: string;
  disabilityType?: string | null;
  companyName?: string | null;
  phone?: string | null;
}

export class ApiError extends Error {
  status: number;
  fields: Record<string, string>;

  constructor(message: string, status: number, fields: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getSessionUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: SessionUser): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* localStorage unavailable */
  }
}

export function updateSessionUser(user: Partial<SessionUser>): SessionUser | null {
  const current = getSessionUser();
  if (!current) return null;
  const next = { ...current, ...user };
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(next));
  } catch {
    /* noop */
  }
  return next;
}

export function clearSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* noop */
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  query?: Record<string, string | number | boolean | undefined | null>;
}

export async function apiFetch<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, query } = options;

  let url = `${API_BASE}${path}`;
  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body:
        body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Tidak dapat terhubung ke server. Pastikan backend berjalan.', 0);
  }

  if (response.status === 401) {
    clearSession();
  }

  const text = await response.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const fields: Record<string, string> = {};
    if (data && typeof data.errors === 'object') {
      Object.entries(data.errors).forEach(([key, value]) => {
        fields[key] = Array.isArray(value) ? String(value[0]) : String(value);
      });
    }
    const message =
      (data && (data.message as string)) ||
      Object.values(fields)[0] ||
      `Permintaan gagal (HTTP ${response.status}).`;
    throw new ApiError(message, response.status, fields);
  }

  return data as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function loginRequest(email: string, password: string): Promise<SessionUser> {
  const res = await apiFetch<{ token: string; user: SessionUser }>('/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
  });
  setSession(res.token, res.user);
  return res.user;
}

export interface RegisterPayload {
  role: 'kandidat' | 'hrd';
  email: string;
  fullName: string;
  password: string;
  password_confirmation: string;
  disabilityType?: string;
  companyName?: string;
  agreeTerms?: boolean;
}

export async function registerRequest(payload: RegisterPayload): Promise<SessionUser> {
  const res = await apiFetch<{ token: string; user: SessionUser }>('/register', {
    method: 'POST',
    auth: false,
    body: payload,
  });
  setSession(res.token, res.user);
  return res.user;
}

export async function logoutRequest(): Promise<void> {
  if (!getToken()) return;
  try {
    await apiFetch('/logout', { method: 'POST' });
  } catch {
    /* token mungkin sudah kedaluwarsa */
  } finally {
    clearSession();
  }
}

// ─── Jobs & Applications ──────────────────────────────────────────────────────

export async function fetchJobs(query: Record<string, string | number | undefined> = {}) {
  const res = await apiFetch<{ jobs: any[] }>('/jobs', { auth: false, query });
  return res.jobs;
}

export type NewJobPayload = {
  title: string;
  company?: string;
  location: string;
  type: 'remote' | 'hybrid' | 'onsite';
  salary?: string;
  skills?: string[];
  slots?: number;
  category?: string[];
  accommodations?: string[];
  description?: string;
  /** Job coach yang ditugaskan untuk lowongan ini. */
  jobCoach?: string;
  locationLat?: number | null;
  locationLng?: number | null;
};

export async function createJob(payload: NewJobPayload) {
  const res = await apiFetch<{ job: any }>('/jobs', {
    method: 'POST',
    body: payload as unknown as Record<string, unknown>,
  });
  return res.job;
}

export async function applyToJob(
  jobId: string,
  payload: { name: string; email: string; disability: string; accommodation?: string }
) {
  const res = await apiFetch<{ application: any }>(`/jobs/${jobId}/apply`, {
    method: 'POST',
    body: payload,
  });
  return res.application;
}

export async function fetchMyApplications() {
  const res = await apiFetch<{ applications: any[] }>('/applications/mine');
  return res.applications;
}

export async function fetchCandidates(query: Record<string, string | number | undefined> = {}) {
  const res = await apiFetch<{ candidates: any[] }>('/applications', { query });
  return res.candidates;
}

export type CandidateSkill = { id: string; skill: string; score: number; verifiedAt: string | null };
export type CandidatePortfolio = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  url?: string;
  uploadedAt?: string;
};

/** Detail lamaran (HRD): skill passport + portofolio milik pelamar. */
export async function fetchApplicationDetail(id: string | number): Promise<{
  skills: CandidateSkill[];
  skillScores: CandidateSkill[];
  portfolios: CandidatePortfolio[];
}> {
  const res = await apiFetch<{
    skills?: CandidateSkill[];
    portfolios?: CandidatePortfolio[];
    application?: { skillScores?: CandidateSkill[] };
  }>(`/applications/${id}`);
  return {
    skills: Array.isArray(res.skills) ? res.skills : [],
    skillScores: Array.isArray(res.application?.skillScores) ? res.application!.skillScores! : [],
    portfolios: Array.isArray(res.portfolios) ? res.portfolios : [],
  };
}

/** Origin server (tanpa `/api`) untuk membuka file storage seperti /storage/portfolios/... */
export const FILES_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

/**
 * Ubah path file di backend (`/storage/...`) jadi URL absolut.
 * Tanpa ini, path relatif diminta ke Vite dev server (bukan Laravel) → gambar gagal dimuat.
 * `data:` / `blob:` / `http(s):` dibiarkan apa adanya.
 */
export function storageUrl(path?: string | null): string {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return path.startsWith('/') ? FILES_ORIGIN + path : path;
};

export async function updateApplicationStatus(id: string, status: string) {
  const res = await apiFetch<{ candidate: any }>(`/applications/${id}/status`, {
    method: 'PATCH',
    body: { status },
  });
  return res.candidate;
}

export async function revealCandidate(id: string) {
  const res = await apiFetch<{ candidate: any }>(`/applications/${id}/reveal`, { method: 'POST' });
  return res.candidate;
}

// ─── Messages (Feedback) ──────────────────────────────────────────────────────

export type MessageTarget = {
  applicationId?: string | number;
  jobId?: string | number;
  /** Perusahaan yang diajak ngobrol — thread HRD perusahaan untuk kandidat. */
  company?: string;
  general?: boolean;
};

function targetQuery(target: MessageTarget = {}): Record<string, string | number | boolean | undefined> {
  if (target.applicationId) return { applicationId: target.applicationId };
  if (target.jobId) return { jobId: target.jobId };
  if (target.company) return { company: target.company };
  return { general: true };
}

export async function fetchMessages(thread = 'feedback', target: MessageTarget = {}) {
  const res = await apiFetch<{ messages: any[] }>('/messages', {
    query: { ...targetQuery(target), thread },
  });
  return res.messages;
}

export async function sendMessage(
  text: string,
  thread = 'feedback',
  author?: 'kandidat' | 'hrd',
  target: MessageTarget = {}
) {
  const res = await apiFetch<{ message: any }>('/messages', {
    method: 'POST',
    body: { text, thread, author, applicationId: target.applicationId, jobId: target.jobId, company: target.company },
  });
  return res.message;
}

// ─── Needs (Kebutuhan Pribadi) ────────────────────────────────────────────────

export async function fetchNeeds() {
  const res = await apiFetch<{ needs: any[] }>('/needs');
  return res.needs;
}

export async function createNeed(payload: {
  title: string;
  desc?: string;
  category: string;
  priority: string;
  status?: string;
}) {
  const res = await apiFetch<{ need: any }>('/needs', { method: 'POST', body: payload });
  return res.need;
}

export async function updateNeed(id: number | string, payload: Record<string, unknown>) {
  const res = await apiFetch<{ need: any }>(`/needs/${id}`, { method: 'PATCH', body: payload });
  return res.need;
}

export async function deleteNeed(id: number | string) {
  await apiFetch(`/needs/${id}`, { method: 'DELETE' });
}

// ─── Profile & Portfolio ──────────────────────────────────────────────────────

export async function updateProfile(payload: Record<string, unknown>) {
  const res = await apiFetch<{ profile: SessionUser }>('/profile', {
    method: 'PUT',
    body: payload,
  });
  updateSessionUser(res.profile);
  return res.profile;
}

/** Unggah foto profil (file) ke backend → disimpan di storage/app/public/avatars. */
export async function uploadAvatar(file: File): Promise<SessionUser> {
  const form = new FormData();
  form.append('photo', file);
  const res = await apiFetch<{ profile: SessionUser }>('/profile/photo', { method: 'POST', body: form });
  updateSessionUser(res.profile);
  return res.profile;
}

export async function fetchPortfolios() {
  const res = await apiFetch<{ files: any[] }>('/portfolios');
  return res.files;
}

export async function uploadPortfolio(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await apiFetch<{ file: any }>('/portfolios', { method: 'POST', body: form });
  return res.file;
}

// ─── Skills (Skill Passport) ────────────────────────────────────────────────

export type PassportSkill = {
  id: string;
  skill: string;
  score: number;
  verifiedAt: string | null;
  createdAt?: string | null;
  source?: string;
};

export async function fetchSkills(): Promise<PassportSkill[]> {
  const res = await apiFetch<{ skills: PassportSkill[] }>('/skills');
  return res.skills;
}

export async function createSkill(name: string, score: number): Promise<PassportSkill> {
  const res = await apiFetch<{ skill: PassportSkill }>('/skills', {
    method: 'POST',
    body: { name, score },
  });
  return res.skill;
}

export async function updateSkill(id: string, payload: { name?: string; score?: number }): Promise<PassportSkill> {
  const res = await apiFetch<{ skill: PassportSkill }>(`/skills/${id}`, {
    method: 'PATCH',
    body: payload,
  });
  return res.skill;
}

export async function verifySkill(id: string): Promise<PassportSkill> {
  const res = await apiFetch<{ skill: PassportSkill }>(`/skills/${id}/verify`, { method: 'POST' });
  return res.skill;
}

export async function deleteSkill(id: string): Promise<void> {
  await apiFetch<{ message: string }>(`/skills/${id}`, { method: 'DELETE' });
}
