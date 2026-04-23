import axios from 'axios';
import type {
  Village,
  Event,
  TimeSlot,
  Registration,
  AuthResponse,
  CalendarEntry,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token on admin requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('adminToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/admin') && path !== '/admin') {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin';
      }
    }
    return Promise.reject(error);
  },
);

// ─── Public API ───────────────────────────────────────────────────────────────

export const villagesApi = {
  getAll: () => api.get<Village[]>('/villages').then((r) => r.data),
  getOne: (id: number) => api.get<Village>(`/villages/${id}`).then((r) => r.data),
};

export const eventsApi = {
  getAll: (villageId?: number) =>
    api
      .get<Event[]>('/events', { params: villageId ? { villageId } : {} })
      .then((r) => r.data),
  getOne: (id: number) => api.get<Event>(`/events/${id}`).then((r) => r.data),
};

export const timeSlotsApi = {
  getAll: (eventId?: number) =>
    api
      .get<TimeSlot[]>('/time-slots', { params: eventId ? { eventId } : {} })
      .then((r) => r.data),
  getWithAvailability: (eventId: number, date: string) =>
    api
      .get<TimeSlot[]>('/time-slots', { params: { eventId, date } })
      .then((r) => r.data),
};

export const registrationsApi = {
  create: (data: {
    groupName: string;
    participantCount: number;
    date: string;
    timeSlotId: number;
  }) => api.post<Registration>('/registrations', data).then((r) => r.data),
};

// ─── Admin API ────────────────────────────────────────────────────────────────

export const authApi = {
  login: (username: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { username, password }).then((r) => r.data),
};

export const adminVillagesApi = {
  create: (name: string) => api.post<Village>('/villages', { name }).then((r) => r.data),
  update: (id: number, name: string) =>
    api.put<Village>(`/villages/${id}`, { name }).then((r) => r.data),
  delete: (id: number) => api.delete(`/villages/${id}`).then((r) => r.data),
};

export const adminEventsApi = {
  create: (data: { name: string; description?: string; villageId: number }) =>
    api.post<Event>('/events', data).then((r) => r.data),
  update: (id: number, data: { name?: string; description?: string; villageId?: number }) =>
    api.put<Event>(`/events/${id}`, data).then((r) => r.data),
  delete: (id: number) => api.delete(`/events/${id}`).then((r) => r.data),
};

export const adminTimeSlotsApi = {
  create: (data: { time: string; eventId: number }) =>
    api.post<TimeSlot>('/time-slots', data).then((r) => r.data),
  update: (id: number, data: { time?: string; eventId?: number }) =>
    api.put<TimeSlot>(`/time-slots/${id}`, data).then((r) => r.data),
  delete: (id: number) => api.delete(`/time-slots/${id}`).then((r) => r.data),
};

export const adminRegistrationsApi = {
  getAll: (params?: { date?: string; villageId?: number }) =>
    api.get<Registration[]>('/registrations', { params }).then((r) => r.data),
  getCalendar: (date: string) =>
    api.get<CalendarEntry[]>('/registrations/calendar', { params: { date } }).then((r) => r.data),
  delete: (id: number) => api.delete(`/registrations/${id}`).then((r) => r.data),
  exportCsv: async (params?: { date?: string; villageId?: number }) => {
    const res = await api.get('/registrations/export/csv', {
      params,
      responseType: 'blob',
    });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrations-${params?.date ?? 'all'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
