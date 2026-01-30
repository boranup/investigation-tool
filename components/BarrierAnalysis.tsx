'use client'

import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Barrier {
  id: string;
  barrier_type: string;
  barrier_category: string;
  barrier_description: string;
  barrier_status: string;
  failure_reason?: string;
}

interface BarrierAnalysisProps {
  timelineEventId: string;
}

export default function BarrierAnalysis({ timelineEventId }: BarrierAnalysisProps) {
  const [barriers, setBarriers] = useState<Barrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddBarrier, setShowAddBarrier] = useState(false);
  const [editingBarrier, setEditingBarrier] = useState<Barrier | null>(null);

  const [newBarrier, setNewBarrier] = useState({
    barrierType: 'prevention',
    barrierCategory: 'hardware',
    description: '',
    status: 'failed',
    failureReason: ''
  });

  const barrierTypes = [
    { value: 'prevention', label: 'Prevention', description: 'Prevent the event from occurring' },
    { value: 'detection', label: 'Detection', description: 'Detect the problem early' },
    { value: 'mitigation', label: 'Mitigation', description: 'Reduce consequences' },
    { value: 'recovery', label: 'Recovery', description: 'Recover from the event' }
  ];

  const barrierCategories = [
    { value: 'hardware', label: 'Hardware', description: 'Physical equipment, devices' },
    { value: 'software', label: 'Software', description: 'Control systems, automation' },
    { value: 'procedural', label: 'Procedural', description: 'Procedures, work instructions' },
    { value: 'supervisory', label: 'Supervisory', description: 'Oversight, checks, approvals' },
    { value: 'human', label: 'Human', description: 'Training, competence, awareness' }
  ];

  const barrierStatuses = [
    { value: 'worked', label: 'Worked', color: 'green', description: 'Barrier functioned as intended' },
    { value: 'failed', label: 'Failed', color: 'red', description: 'Barrier did not function' },
    { value: 'degraded', label: 'Degraded', color: 'amber', description: 'Barrier partially effective' },
    { value: 'missing', label: 'Missing', color: 'gray', description: 'Barrier should have existed but didn\'t' }
  ];

  useEffect(() => {
    loadBarriers();
  }, [timelineEventId]);

  async function loadBarriers() {
    try {
      const { data, error } = await supabase
        .from('timeline_barriers')
        .select('*')
        .eq('timeline_event_id', timelineEventId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setBarriers(data || []);
    } catch (error) {
      console.error('Error loading barriers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveBarrier() {
    try {
      const barrierData = {
        timeline_event_id: timelineEventId,
        barrier_type: newBarrier.barrierType,
        barrier_category: newBarrier.barrierCategory,
        barrier_description: newBarrier.description,
        barrier_status: newBarrier.status,
        failure_reason: newBarrier.failureReason || null
      };

      if (editingBarrier) {
        const { error } = await supabase
          .from('timeline_barriers')
          .update(barrierData)
          .eq('id', editingBarrier.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('timeline_barriers')
          .insert([barrierData]);
        if (error) throw error;
      }

      setNewBarrier({
        barrierType: 'prevention',
        barrierCategory: 'hardware',
        description: '',
        status: 'failed',
        failureReason: ''
      });
      setShowAddBarrier(false);
      setEditingBarrier(null);
      loadBarriers();
    } catch (error: any) {
      console.error('Error saving barrier:', error);
      alert(`Error: ${error.message}`);
    }
  }

  async function deleteBarrier(id: string) {
    if (!confirm('Delete this barrier?')) return;

    try {
      const { error } = await supabase
        .from('timeline_barriers')
        .delete()
        .eq('id', id);
      if (error) throw error;
      loadBarriers();
    } catch (error) {
      console.error('Error deleting barrier:', error);
      alert('Error deleting barrier');
    }
  }

  function startEdit(barrier: Barrier) {
    setEditingBarrier(barrier);
    setNewBarrier({
      barrierType: barrier.barrier_type,
      barrierCategory: barrier.barrier_category,
      description: barrier.barrier_description,
      status: barrier.barrier_status,
      failureReason: barrier.failure_reason || ''
    });
    setShowAddBarrier(true);
  }

  if (loading) {
    return (
      <div className="text-sm text-gray-500">Loading barriers...</div>
    );
  }

  const statusColor = (status: string) => {
    const statusInfo = barrierStatuses.find(s => s.value === status);
    return statusInfo?.color || 'gray';
  };

  return (
    <div className="mt-3 pt-3 border-t">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-600" />
          <h4 className="font-medium text-sm">Barrier Analysis</h4>
        </div>
        <button
          onClick={() => {
            setEditingBarrier(null);
            setNewBarrier({
              barrierType: 'prevention',
              barrierCategory: 'hardware',
              description: '',
              status: 'failed',
              failureReason: ''
            });
            setShowAddBarrier(true);
          }}
          className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          <Plus className="w-3 h-3 inline mr-1" />
          Add Barrier
        </button>
      </div>

      {/* Barrier List */}
      <div className="space-y-2">
        {barriers.map(barrier => {
          const typeInfo = barrierTypes.find(t => t.value === barrier.barrier_type);
          const categoryInfo = barrierCategories.find(c => c.value === barrier.barrier_category);
          const color = statusColor(barrier.barrier_status);

          return (
            <div
              key={barrier.id}
              className={`p-2 rounded border-l-4 border-${color}-500 bg-${color}-50`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-900">
                      {typeInfo?.label} - {categoryInfo?.label}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded bg-${color}-100 text-${color}-700 font-medium`}>
                      {barrier.barrier_status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700">{barrier.barrier_description}</p>
                  {barrier.failure_reason && (
                    <p className="text-xs text-red-700 mt-1 italic">
                      <strong>Why failed:</strong> {barrier.failure_reason}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => startEdit(barrier)}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteBarrier(barrier.id)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {barriers.length === 0 && (
          <p className="text-xs text-gray-500 italic">No barriers identified yet</p>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddBarrier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">
                {editingBarrier ? 'Edit Barrier' : 'Add Barrier'}
              </h3>
              <button
                onClick={() => {
                  setShowAddBarrier(false);
                  setEditingBarrier(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Barrier Type *</label>
                  <select
                    value={newBarrier.barrierType}
                    onChange={(e) => setNewBarrier({...newBarrier, barrierType: e.target.value})}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    {barrierTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Barrier Category *</label>
                  <select
                    value={newBarrier.barrierCategory}
                    onChange={(e) => setNewBarrier({...newBarrier, barrierCategory: e.target.value})}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    {barrierCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label} - {cat.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea
                  value={newBarrier.description}
                  onChange={(e) => setNewBarrier({...newBarrier, description: e.target.value})}
                  className="w-full border rounded px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Describe the barrier and its intended function..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status *</label>
                <select
                  value={newBarrier.status}
                  onChange={(e) => setNewBarrier({...newBarrier, status: e.target.value})}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  {barrierStatuses.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label} - {status.description}
                    </option>
                  ))}
                </select>
              </div>

              {(newBarrier.status === 'failed' || newBarrier.status === 'degraded') && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Why did this barrier {newBarrier.status === 'failed' ? 'fail' : 'perform poorly'}?
                  </label>
                  <textarea
                    value={newBarrier.failureReason}
                    onChange={(e) => setNewBarrier({...newBarrier, failureReason: e.target.value})}
                    className="w-full border rounded px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Explain what caused the barrier to fail or perform below expectations..."
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddBarrier(false);
                  setEditingBarrier(null);
                }}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveBarrier}
                disabled={!newBarrier.description}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-300"
              >
                {editingBarrier ? 'Update' : 'Add'} Barrier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
