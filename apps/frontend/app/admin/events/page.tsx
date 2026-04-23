'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { villagesApi, eventsApi, adminEventsApi } from '@/lib/api';
import { AdminNav } from '@/components/admin/AdminNav';
import { AuthGuard } from '@/components/admin/AuthGuard';
import type { Event } from '@/lib/types';

interface EventForm {
  name: string;
  description: string;
  villageId: string;
}

const emptyForm: EventForm = { name: '', description: '', villageId: '' };

export default function EventsPage() {
  const qc = useQueryClient();
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [editForm, setEditForm] = useState<EventForm>(emptyForm);
  const [newForm, setNewForm] = useState<EventForm>(emptyForm);
  const [showAdd, setShowAdd] = useState(false);
  const [filterVillage, setFilterVillage] = useState('');
  const [error, setError] = useState('');

  const { data: villages = [] } = useQuery({ queryKey: ['villages'], queryFn: villagesApi.getAll });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', filterVillage],
    queryFn: () => eventsApi.getAll(filterVillage ? parseInt(filterVillage) : undefined),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['events'] });

  const createMutation = useMutation({
    mutationFn: adminEventsApi.create,
    onSuccess: () => { invalidate(); setNewForm(emptyForm); setShowAdd(false); setError(''); },
    onError: (e: any) => setError(e.response?.data?.message ?? 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EventForm> }) =>
      adminEventsApi.update(id, { ...data, villageId: data.villageId ? parseInt(data.villageId) : undefined }),
    onSuccess: () => { invalidate(); setEditEvent(null); setError(''); },
    onError: (e: any) => setError(e.response?.data?.message ?? 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminEventsApi.delete,
    onSuccess: invalidate,
    onError: (e: any) => setError(e.response?.data?.message ?? 'Error'),
  });

  const startEdit = (event: Event) => {
    setEditEvent(event);
    setEditForm({
      name: event.name,
      description: event.description ?? '',
      villageId: String(event.villageId),
    });
    setError('');
  };

  return (
    <AuthGuard>
      <AdminNav />
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Events</h1>
            <p className="text-sm text-gray-500 mt-1">{events.length} events</p>
          </div>
          <div className="flex gap-2">
            <select
              className="input-field w-auto text-sm"
              value={filterVillage}
              onChange={(e) => setFilterVillage(e.target.value)}
            >
              <option value="">All Villages</option>
              {villages.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            <button onClick={() => { setShowAdd(true); setError(''); }} className="btn-primary">
              + Add Event
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Add form */}
        {showAdd && (
          <div className="card space-y-3">
            <h3 className="font-semibold">New Event</h3>
            <input
              className="input-field"
              placeholder="Event name *"
              value={newForm.name}
              onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
              autoFocus
            />
            <input
              className="input-field"
              placeholder="Description (optional)"
              value={newForm.description}
              onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
            />
            <select
              className="input-field"
              value={newForm.villageId}
              onChange={(e) => setNewForm({ ...newForm, villageId: e.target.value })}
            >
              <option value="">Select village *</option>
              {villages.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => createMutation.mutate({
                  name: newForm.name,
                  description: newForm.description || undefined,
                  villageId: parseInt(newForm.villageId),
                })}
                disabled={!newForm.name.trim() || !newForm.villageId || createMutation.isPending}
                className="btn-primary"
              >
                {createMutation.isPending ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}

        {/* Events list */}
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="card animate-pulse h-16" />)}</div>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div key={event.id} className="card">
                {editEvent?.id === event.id ? (
                  <div className="space-y-2">
                    <input
                      className="input-field"
                      placeholder="Event name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                    <input
                      className="input-field"
                      placeholder="Description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    />
                    <select
                      className="input-field"
                      value={editForm.villageId}
                      onChange={(e) => setEditForm({ ...editForm, villageId: e.target.value })}
                    >
                      {villages.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateMutation.mutate({ id: event.id, data: editForm })}
                        disabled={!editForm.name.trim() || updateMutation.isPending}
                        className="btn-primary text-sm"
                      >
                        {updateMutation.isPending ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={() => setEditEvent(null)} className="btn-secondary text-sm">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{event.name}</p>
                      {event.description && (
                        <p className="text-sm text-gray-500 mt-0.5">{event.description}</p>
                      )}
                      <p className="text-xs text-blue-600 mt-1">
                        {event.village?.name} · {event.timeSlots?.length ?? 0} slots
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => startEdit(event)} className="text-sm text-blue-600 hover:underline">
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${event.name}"?`)) deleteMutation.mutate(event.id);
                        }}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {events.length === 0 && (
              <div className="card text-center text-gray-500 py-8">No events found.</div>
            )}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
