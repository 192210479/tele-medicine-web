export const AUTH_KEY = "tele_auth";

export interface AuthUser {
  user_id: number;
  role: "patient" | "doctor" | "admin";
}

export function saveAuth(user: AuthUser): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function getAuth(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthUser; } catch { return null; }
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function isLoggedIn(): boolean {
  return getAuth() !== null;
}
