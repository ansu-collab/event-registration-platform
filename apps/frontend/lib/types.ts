export interface Village {
  id: number;
  name: string;
  _count?: { events: number };
  events?: Event[];
  createdAt?: string;
}

export interface Event {
  id: number;
  name: string;
  description?: string;
  villageId: number;
  village?: { id: number; name: string };
  timeSlots?: TimeSlot[];
  createdAt?: string;
}

export interface TimeSlot {
  id: number;
  time: string;
  eventId: number;
  event?: Event;
  available?: boolean;
  registration?: Registration | null;
  createdAt?: string;
}

export interface Registration {
  id: number;
  groupName: string;
  participantCount: number;
  date: string;
  timeSlotId: number;
  timeSlot?: TimeSlot;
  createdAt?: string;
}

export interface AdminUser {
  id: number;
  username: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AdminUser;
}

export interface CalendarEntry {
  slotId: number;
  time: string;
  event: string;
  village: string;
  villageId: number;
  eventId: number;
  available: boolean;
  registration: Registration | null;
}

export interface ApiError {
  message: string;
  statusCode: number;
}
