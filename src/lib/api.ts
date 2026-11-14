// Client helpers for the API routes in src/app/api (spec 3.3).
import type { ID, Invitation, MemberSummary } from './types';

export interface UserSearchResult {
  user_id: string;
  display_name: string;
  image_url: string | null;
  email: string;
}

export interface MemberSummariesResponse {
  members: MemberSummary[];
  generated_at: string;
}

/** Non-2xx response. `message` is the route's `{ error }` text, safe to show inline. */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : `Request failed (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  return body as T;
}

/** Owner only. Sends an invitation the person must accept. 404 if no account has that email, 409 if already a member or invited. */
export function inviteByEmail(projectId: ID, email: string): Promise<Invitation> {
  return request<Invitation>(`/api/projects/${projectId}/invitations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
}

/** Up to 5 users by email prefix. The route requires q.length >= 3. */
export function searchUsers(q: string): Promise<UserSearchResult[]> {
  return request<UserSearchResult[]>(`/api/users/search?q=${encodeURIComponent(q)}`);
}

/** Phase 3. Cached server-side for 1 hour. */
export function getMemberSummaries(projectId: ID): Promise<MemberSummariesResponse> {
  return request<MemberSummariesResponse>(`/api/projects/${projectId}/summary`, { method: 'POST' });
}
