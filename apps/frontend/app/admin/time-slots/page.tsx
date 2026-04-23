'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi, villagesApi, timeSlotsApi, adminTimeSlotsApi } from '@/lib/api';
import { AdminNav } from '@/components/admin/AdminNav';
import { AuthGuard } from '@/components/admin/AuthGuard';
import type { TimeSlot } from '@/lib/types';

export default function TimeSlotsPage() {
  const qc = useQueryClient();
  const [editSlot, setEditSlot] = useState<TimeSlot | null>(null);
  const [editTime, setEditTime] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newEventId, setNewEventId] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [filterEvent, setFilterEvent] = useState('');
  const [error, setError] = useState('');

  const { data: villages = [] } = useQuery({ queryKey: ['villages'], queryFn: villagesApi.getAll });
  const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: () => eventsApi.getAll() });

  const { data: timeSlots = [], isLoading } = useQuery({
    queryKey: ['time-slots', filterEvent],
    queryFn: () => timeSlotsApi.getAll(filterEvent ? parseInt(filterEvent) : undefined),
    staleTime: 0,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['time-slots'] });

  const createMutation = useMutation({
    mutationFn: adminTimeSlotsApi.create,
    onSuccess: () => { invalidate(); setNewTime(''); setNewEventId(''); setShowAdd(false); setError(''); },
    onError: (e: any) => setError(e.response?.data?.message ?? 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, time }: { id: number; time: string }) => adminTimeSlotsApi.update(id, { time }),
    onSuccess: () => { invalidate(); setEditSlot(null); setError(''); },
    onError: (e: any) => setError(e.response?.data?.message ?? 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminTimeSlotsApi.delete,
    onSuccess: invalidate,
    onError: (e: any) => setError(e.response?.data?.message ?? 'Error'),
  });

  // Group by event
  const grouped = events.map((event) => ({
    event,
    slots: timeSlots.filter((s: TimeSlot) => s.eventId === event.id),
  })).filter((g) => !filterEvent || g.event.id === parseInt(filterEvent));

  return (
    <AuthGuard>
      <AdminNav />
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Time Slots</h1>
            <p className="text-sm text-gray-500 mt-1">{timeSlots.length} slots configured</p>
          </div>
          <div className="flex gap-2">
            <select
              className="input-field w-auto text-sm"
              value={filterEvent}
              onChange={(e) => setFilterEvent(e.target.value)}
            >
              <option value="">All Events</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>{e.village?.name} / {e.name}</option>
              ))}
            </select>
            <button onClick={() => { setShowAdd(true); setError(''); }} className="btn-primary">
              + Add Slot
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {showAdd && (
          <div className="card space-y-3">
            <h3 className="font-semibold">New Time Slot</h3>
            <select
              className="input-field"
              value={newEventId}
              onChange={(e) => setNewEventId(e.target.value)}
            >
              <option value="">Select event *</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>{e.village?.name} / {e.name}</option>
              ))}
            </select>
            <input
              type="time"
              className="input-field"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => createMutation.mutate({ time: newTime, eventId: parseInt(newEventId) })}
                disabled={!newTime || !newEventId || createMutation.isPending}
                className="btn-primary"
              >
                {createMutation.isPending ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="card animate-pulse h-20" />)}</div>
        ) : (
          <div className="space-y-4">
            {grouped.map(({ event, slots }) => (
              <div key={event.id} className="card p-0 overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                  <p className="font-medium text-gray-900">{event.name}</p>
                  <p className="text-xs text-gray-500">{event.village?.name}</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {slots.map((slot: TimeSlot) => (
                    <div key={slot.id} className="px-4 py-2.5 flex items-center justify-between">
                      {editSlot?.id === slot.id ? (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="time"
                            className="input-field w-32"
                            value={editTime}
                            onChange={(e) => setEditTime(e.target.value)}
                          />
                          <button
                            onClick={() => updateMutation.mutate({ id: slot.id, time: editTime })}
                            disabled={!editTime || updateMutation.isPending}
                            className="btn-primary text-sm py-1.5"
                          >
                            Save
                          </button>
                          <button onClick={() => setEditSlot(null)} className="btn-secondary text-sm py-1.5">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="font-mono text-gray-900">{slot.time}</span>
                          <div className="flex gap-3">
                            <button
                              onClick={() => { setEditSlot(slot); setEditTime(slot.time); }}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete slot ${slot.time} for ${event.name}?`)) {
                                  deleteMutation.mutate(slot.id);
                                }
                              }}
                              className="text-sm text-red-600 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {slots.length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-400">No slots configured</div>
                  )}
                </div>
              </div>
            ))}
            {grouped.length === 0 && (
              <div className="card text-center text-gray-500 py-8">No time slots found.</div>
            )}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
