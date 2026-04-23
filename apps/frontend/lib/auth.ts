'use client';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminToken');
}

export function setToken(token: string): void {
  localStorage.setItem('adminToken', token);
}

export function removeToken(): void {
  localStorage.removeItem('adminToken');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
