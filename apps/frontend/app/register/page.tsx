'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { villagesApi, eventsApi, timeSlotsApi, registrationsApi } from '@/lib/api';
import { getEventDays, formatTime, formatDate } from '@/lib/utils';
import type { Village, Event, TimeSlot } from '@/lib/types';
import Link from 'next/link';

type Step = 'day' | 'village' | 'event' | 'slot' | 'form' | 'success';

interface FormData {
  groupName: string;
  participantCount: string;
}

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('day');
  const [selectedDay, setSelectedDay] = useState<{ day: number; date: string; label: string } | null>(null);
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [form, setForm] = useState<FormData>({ groupName: '', participantCount: '' });
  const [errorMsg, setErrorMsg] = useState('');

  const days = getEventDays();

  const { data: villages = [], isLoading: loadingVillages } = useQuery({
    queryKey: ['villages'],
    queryFn: villagesApi.getAll,
    enabled: step === 'village',
  });

  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['events', selectedVillage?.id],
    queryFn: () => eventsApi.getAll(selectedVillage!.id),
    enabled: step === 'event' && !!selectedVillage,
  });

  const { data: timeSlots = [], isLoading: loadingSlots } = useQuery({
    queryKey: ['slots', selectedEvent?.id, selectedDay?.date],
    queryFn: () => timeSlotsApi.getWithAvailability(selectedEvent!.id, selectedDay!.date),
    enabled: step === 'slot' && !!selectedEvent && !!selectedDay,
    staleTime: 0,
  });

  const mutation = useMutation({
    mutationFn: registrationsApi.create,
    onSuccess: () => {
      setStep('success');
      setErrorMsg('');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message ?? 'Registration failed. Please try again.';
      setErrorMsg(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const handleSubmit = () => {
    if (!selectedSlot || !selectedDay || !form.groupName || !form.participantCount) return;
    setErrorMsg('');
    mutation.mutate({
      groupName: form.groupName.trim(),
      participantCount: parseInt(form.participantCount),
      date: selectedDay.date,
      timeSlotId: selectedSlot.id,
    });
  };

  const goBack = () => {
    setErrorMsg('');
    if (step === 'village') { setStep('day'); setSelectedDay(null); }
    else if (step === 'event') { setStep('village'); setSelectedVillage(null); }
    else if (step === 'slot') { setStep('event'); setSelectedEvent(null); }
    else if (step === 'form') { setStep('slot'); setSelectedSlot(null); }
  };

  const reset = () => {
    setStep('day');
    setSelectedDay(null);
    setSelectedVillage(null);
    setSelectedEvent(null);
    setSelectedSlot(null);
    setForm({ groupName: '', participantCount: '' });
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          {step !== 'day' && step !== 'success' && (
            <button onClick={goBack} className="p-1 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="flex-1">
            <h1 className="font-semibold text-gray-900">Event Registration</h1>
            {selectedDay && (
              <p className="text-xs text-gray-500">{selectedDay.label}</p>
            )}
          </div>
          <Link href="/" className="text-sm text-blue-600 hover:underline">Home</Link>
        </div>

        {/* Progress bar */}
        {step !== 'success' && (
          <div className="max-w-lg mx-auto px-4 pb-2">
            <div className="flex gap-1">
              {(['day', 'village', 'event', 'slot', 'form'] as Step[]).map((s, i) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    ['day', 'village', 'event', 'slot', 'form'].indexOf(step) >= i
                      ? 'bg-blue-600'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">

        {/* Step 1: Select Day */}
        {step === 'day' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Select a Day</h2>
              <p className="text-sm text-gray-500 mt-1">Choose which day you'd like to attend</p>
            </div>
            <div className="space-y-2">
              {days.map((d) => (
                <button
                  key={d.day}
                  onClick={() => { setSelectedDay(d); setStep('village'); }}
                  className="w-full text-left card hover:border-blue-300 hover:shadow-md transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">Day {d.day}</p>
                      <p className="text-sm text-gray-500">{formatDate(d.date)}</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Village */}
        {step === 'village' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Select a Village</h2>
              <p className="text-sm text-gray-500 mt-1">Choose which village you'd like to visit</p>
            </div>
            {loadingVillages ? (
              <LoadingCards />
            ) : (
              <div className="space-y-2">
                {villages.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => { setSelectedVillage(v); setStep('event'); }}
                    className="w-full text-left card hover:border-blue-300 hover:shadow-md transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{v.name}</p>
                        {v._count && (
                          <p className="text-sm text-gray-500">{v._count.events} events available</p>
                        )}
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Select Event */}
        {step === 'event' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Select an Event</h2>
              <p className="text-sm text-gray-500 mt-1">{selectedVillage?.name}</p>
            </div>
            {loadingEvents ? (
              <LoadingCards />
            ) : events.length === 0 ? (
              <div className="card text-center text-gray-500">No events available</div>
            ) : (
              <div className="space-y-2">
                {events.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => { setSelectedEvent(e); setStep('slot'); }}
                    className="w-full text-left card hover:border-blue-300 hover:shadow-md transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{e.name}</p>
                        {e.description && (
                          <p className="text-sm text-gray-500 mt-0.5">{e.description}</p>
                        )}
                        {e.timeSlots && (
                          <p className="text-xs text-blue-600 mt-1">
                            {e.timeSlots.length} time slot{e.timeSlots.length !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      <svg className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Select Time Slot */}
        {step === 'slot' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Select a Time</h2>
              <p className="text-sm text-gray-500 mt-1">{selectedEvent?.name}</p>
            </div>
            {loadingSlots ? (
              <LoadingCards count={2} />
            ) : timeSlots.length === 0 ? (
              <div className="card text-center text-gray-500">No time slots configured</div>
            ) : (
              <div className="space-y-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => {
                      if (!slot.available) return;
                      setSelectedSlot(slot);
                      setStep('form');
                    }}
                    disabled={!slot.available}
                    className={`w-full text-left card transition-all ${
                      slot.available
                        ? 'hover:border-blue-300 hover:shadow-md active:scale-[0.99] cursor-pointer'
                        : 'opacity-60 cursor-not-allowed bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          slot.available ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <svg className={`w-5 h-5 ${slot.available ? 'text-green-600' : 'text-red-500'}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {slot.available
                              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            }
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{formatTime(slot.time)}</p>
                          <p className={`text-sm ${slot.available ? 'text-green-600' : 'text-red-500'}`}>
                            {slot.available ? 'Available' : `Taken by ${slot.registration?.groupName ?? 'another group'}`}
                          </p>
                        </div>
                      </div>
                      {slot.available && (
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 5: Registration Form */}
        {step === 'form' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Group Details</h2>
              <p className="text-sm text-gray-500 mt-1">Almost done! Tell us about your group.</p>
            </div>

            {/* Summary card */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-1.5">
              <p className="text-sm font-semibold text-blue-900">Your selection</p>
              <div className="text-sm text-blue-700 space-y-0.5">
                <p>📅 {selectedDay?.label}</p>
                <p>🏘 {selectedVillage?.name}</p>
                <p>🎪 {selectedEvent?.name}</p>
                <p>⏰ {selectedSlot && formatTime(selectedSlot.time)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Team Alpha, Family Smith..."
                  value={form.groupName}
                  onChange={(e) => setForm({ ...form, groupName: e.target.value })}
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Participants <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="e.g. 10"
                  min={1}
                  max={500}
                  value={form.participantCount}
                  onChange={(e) => setForm({ ...form, participantCount: e.target.value })}
                />
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">{errorMsg}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!form.groupName.trim() || !form.participantCount || mutation.isPending}
              className="btn-primary w-full text-base py-3"
            >
              {mutation.isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Registering...
                </span>
              ) : (
                'Confirm Registration'
              )}
            </button>
          </div>
        )}

        {/* Step 6: Success */}
        {step === 'success' && (
          <div className="text-center space-y-6 pt-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Registered!</h2>
              <p className="text-gray-500 mt-2">Your group has been successfully registered.</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left space-y-1.5">
              <p className="text-sm font-semibold text-green-900">Booking summary</p>
              <div className="text-sm text-green-700 space-y-0.5">
                <p>👥 {form.groupName}</p>
                <p>👤 {form.participantCount} participants</p>
                <p>📅 {selectedDay?.label}</p>
                <p>🏘 {selectedVillage?.name}</p>
                <p>🎪 {selectedEvent?.name}</p>
                <p>⏰ {selectedSlot && formatTime(selectedSlot.time)}</p>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <button onClick={reset} className="btn-primary w-full">
                Register Another
              </button>
              <Link href="/" className="btn-secondary w-full">
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function LoadingCards({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-1/3" />
        </div>
      ))}
    </div>
  );
}
