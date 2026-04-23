'use client';

import { useQuery } from '@tanstack/react-query';
import { villagesApi, eventsApi, adminRegistrationsApi } from '@/lib/api';
import { AdminNav } from '@/components/admin/AdminNav';
import { AuthGuard } from '@/components/admin/AuthGuard';
import { getEventDays, formatDate } from '@/lib/utils';
import { useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const days = getEventDays();
  const [selectedDate, setSelectedDate] = useState(days[0]?.date ?? '');

  const { data: villages = [] } = useQuery({
    queryKey: ['villages'],
    queryFn: villagesApi.getAll,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsApi.getAll(),
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ['registrations'],
    queryFn: () => adminRegistrationsApi.getAll(),
  });

  const { data: calendar = [], isLoading: loadingCalendar } = useQuery({
    queryKey: ['calendar', selectedDate],
    queryFn: () => adminRegistrationsApi.getCalendar(selectedDate),
    enabled: !!selectedDate,
    staleTime: 0,
  });

  const todayReg = registrations.filter(
    (r) => r.date.split('T')[0] === selectedDate,
  );
  const totalParticipants = registrations.reduce((sum, r) => sum + r.participantCount, 0);
  const bookedSlots = calendar.filter((c) => !c.available).length;
  const availableSlots = calendar.filter((c) => c.available).length;

  return (
    <AuthGuard>
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Event registration overview</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Villages', value: villages.length, color: 'blue' },
            { label: 'Events', value: events.length, color: 'indigo' },
            { label: 'Registrations', value: registrations.length, color: 'green' },
            { label: 'Total Participants', value: totalParticipants, color: 'purple' },
          ].map((stat) => (
            <div key={stat.label} className="card text-center">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Calendar occupancy */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-semibold text-gray-900">Slot Occupancy</h2>
            <select
              className="input-field w-auto text-sm"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            >
              {days.map((d) => (
                <option key={d.date} value={d.date}>
                  Day {d.day} — {formatDate(d.date)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-green-500 rounded-full" />
              {availableSlots} available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-red-500 rounded-full" />
              {bookedSlots} booked
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-gray-300 rounded-full" />
              {todayReg.length} registrations today
            </span>
          </div>

          {loadingCalendar ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : (
            <div className="grid gap-2">
              {/* Group by village */}
              {Array.from(new Set(calendar.map((c) => c.village))).map((villageName) => {
                const villageSlots = calendar.filter((c) => c.village === villageName);
                return (
                  <div key={villageName} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
                      {villageName}
                    </div>
                    <div className="divide-y divide-gray-100">
                      {villageSlots.map((slot) => (
                        <div key={slot.slotId} className="px-3 py-2 flex items-center justify-between text-sm">
                          <div>
                            <span className="font-medium">{slot.event}</span>
                            <span className="text-gray-400 ml-2">{slot.time}</span>
                          </div>
                          {slot.available ? (
                            <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-0.5 rounded-full">
                              Free
                            </span>
                          ) : (
                            <span className="text-red-600 text-xs bg-red-50 px-2 py-0.5 rounded-full truncate max-w-[140px]">
                              {slot.registration?.groupName}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {calendar.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No slots found</p>
              )}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/admin/registrations', label: 'View All Registrations', icon: '📋' },
            { href: '/admin/villages', label: 'Manage Villages', icon: '🏘' },
            { href: '/admin/events', label: 'Manage Events', icon: '🎪' },
            { href: '/admin/time-slots', label: 'Manage Time Slots', icon: '⏰' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="card hover:border-blue-300 hover:shadow-md transition-all text-center"
            >
              <p className="text-2xl mb-1">{link.icon}</p>
              <p className="text-sm font-medium text-gray-700">{link.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </AuthGuard>
  );
}
