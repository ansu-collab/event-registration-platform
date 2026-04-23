'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { villagesApi, adminVillagesApi } from '@/lib/api';
import { AdminNav } from '@/components/admin/AdminNav';
import { AuthGuard } from '@/components/admin/AuthGuard';
import type { Village } from '@/lib/types';

export default function VillagesPage() {
  const qc = useQueryClient();
  const [editVillage, setEditVillage] = useState<Village | null>(null);
  const [newName, setNewName] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('');

  const { data: villages = [], isLoading } = useQuery({
    queryKey: ['villages'],
    queryFn: villagesApi.getAll,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['villages'] });

  const createMutation = useMutation({
    mutationFn: adminVillagesApi.create,
    onSuccess: () => { invalidate(); setNewName(''); setShowAdd(false); setError(''); },
    onError: (e: any) => setError(e.response?.data?.message ?? 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => adminVillagesApi.update(id, name),
    onSuccess: () => { invalidate(); setEditVillage(null); setError(''); },
    onError: (e: any) => setError(e.response?.data?.message ?? 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminVillagesApi.delete,
    onSuccess: invalidate,
    onError: (e: any) => setError(e.response?.data?.message ?? 'Error'),
  });

  return (
    <AuthGuard>
      <AdminNav />
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Villages</h1>
            <p className="text-sm text-gray-500 mt-1">{villages.length} villages configured</p>
          </div>
          <button onClick={() => { setShowAdd(true); setError(''); }} className="btn-primary">
            + Add Village
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Add form */}
        {showAdd && (
          <div className="card space-y-3">
            <h3 className="font-semibold">New Village</h3>
            <input
              className="input-field"
              placeholder="Village name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => createMutation.mutate(newName)}
                disabled={!newName.trim() || createMutation.isPending}
                className="btn-primary"
              >
                {createMutation.isPending ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}

        {/* Villages list */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse h-16" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {villages.map((v) => (
              <div key={v.id} className="card">
                {editVillage?.id === v.id ? (
                  <div className="space-y-2">
                    <input
                      className="input-field"
                      value={editVillage.name}
                      onChange={(e) => setEditVillage({ ...editVillage, name: e.target.value })}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateMutation.mutate({ id: v.id, name: editVillage.name })}
                        disabled={!editVillage.name.trim() || updateMutation.isPending}
                        className="btn-primary text-sm"
                      >
                        {updateMutation.isPending ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={() => setEditVillage(null)} className="btn-secondary text-sm">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{v.name}</p>
                      {v._count && (
                        <p className="text-sm text-gray-500">{v._count.events} events</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditVillage(v); setError(''); }}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${v.name}"? All events will also be deleted.`)) {
                            deleteMutation.mutate(v.id);
                          }
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
            {villages.length === 0 && (
              <div className="card text-center text-gray-500 py-8">
                No villages yet. Click "Add Village" to get started.
              </div>
            )}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
