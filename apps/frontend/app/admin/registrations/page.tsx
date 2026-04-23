'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminRegistrationsApi, villagesApi } from '@/lib/api';
import { AdminNav } from '@/components/admin/AdminNav';
import { AuthGuard } from '@/components/admin/AuthGuard';
import { getEventDays, formatDate, formatTime } from '@/lib/utils';
import type { Registration } from '@/lib/types';

export default function RegistrationsPage() {
  const qc = useQueryClient();
  const days = getEventDays();
  const [filterDate, setFilterDate] = useState('');
  const [filterVillage, setFilterVillage] = useState('');
  const [error, setError] = useState('');

  const { data: villages = [] } = useQuery({ queryKey: ['villages'], queryFn: villagesApi.getAll });

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ['registrations', filterDate, filterVillage],
    queryFn: () => adminRegistrationsApi.getAll({
      date: filterDate || undefined,
      villageId: filterVillage ? parseInt(filterVillage) : undefined,
    }),
    staleTime: 0,
  });

  const deleteMutation = useMutation({
    mutationFn: adminRegistrationsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['registrations'] }),
    onError: (e: any) => setError(e.response?.data?.message ?? 'Error'),
  });

  const totalParticipants = registrations.reduce((sum: number, r: Registration) => sum + r.participantCount, 0);

  const handleExportCsv = () => {
    adminRegistrationsApi.exportCsv({
      date: filterDate || undefined,
      villageId: filterVillage ? parseInt(filterVillage) : undefined,
    });
  };

  return (
    <AuthGuard>
      <AdminNav />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Registrations</h1>
            <p className="text-sm text-gray-500 mt-1">
              {registrations.length} registrations · {totalParticipants} participants
            </p>
          </div>
          <button onClick={handleExportCsv} className="btn-secondary text-sm">
            ↓ Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select
            className="input-field w-auto text-sm"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          >
            <option value="">All Days</option>
            {days.map((d) => (
              <option key={d.date} value={d.date}>Day {d.day} — {formatDate(d.date)}</option>
            ))}
          </select>
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
          {(filterDate || filterVillage) && (
            <button
              onClick={() => { setFilterDate(''); setFilterVillage(''); }}
              className="btn-secondary text-sm"
            >
              Clear filters
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="card animate-pulse h-48" />
        ) : registrations.length === 0 ? (
          <div className="card text-center text-gray-500 py-12">No registrations found.</div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Group</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Participants</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Event</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Village</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {registrations.map((reg: Registration) => (
                    <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{reg.groupName}</td>
                      <td className="px-4 py-3 text-gray-600">{reg.participantCount}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(reg.date.split('T')[0])}
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-mono">
                        {reg.timeSlot ? formatTime(reg.timeSlot.time) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {reg.timeSlot?.event?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {reg.timeSlot?.event?.village?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            if (confirm(`Delete registration for "${reg.groupName}"?`)) {
                              deleteMutation.mutate(reg.id);
                            }
                          }}
                          className="text-red-600 hover:underline text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
