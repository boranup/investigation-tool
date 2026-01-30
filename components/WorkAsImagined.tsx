'use client'

import React, { useState, useEffect } from 'react';
import { BookOpen, Edit2, Save, X, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface WorkAsImaginedProps {
  timelineEventId: string;
  eventData: any;
  onUpdate: () => void;
}

export default function WorkAsImagined({ timelineEventId, eventData, onUpdate }: WorkAsImaginedProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    workAsImagined: '',
    workAsDone: '',
    deviationReason: '',
    isCustomPractice: false,
    customPracticePrevalence: ''
  });

  useEffect(() => {
    if (eventData) {
      setFormData({
        workAsImagined: eventData.work_as_imagined || '',
        workAsDone: eventData.work_as_done || '',
        deviationReason: eventData.practice_deviation_reason || '',
        isCustomPractice: eventData.is_custom_practice || false,
        customPracticePrevalence: eventData.custom_practice_prevalence || ''
      });
    }
  }, [eventData]);

  const hasData = eventData?.work_as_imagined || eventData?.work_as_done;
  const hasDeviation = formData.workAsImagined && formData.workAsDone && 
    formData.workAsImagined.trim() !== formData.workAsDone.trim();

  async function handleSave() {
    setSaving(true);
    try {
      const updateData = {
        work_as_imagined: formData.workAsImagined || null,
        work_as_done: formData.workAsDone || null,
        practice_deviation_reason: formData.deviationReason || null,
        is_custom_practice: formData.isCustomPractice,
        custom_practice_prevalence: formData.customPracticePrevalence || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('timeline_events')
        .update(updateData)
        .eq('id', timelineEventId);

      if (error) throw error;

      setIsEditing(false);
      onUpdate();
      alert('Work-As-Imagined analysis saved!');
    } catch (error: any) {
      console.error('Error saving:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    // Reset to original data
    setFormData({
      workAsImagined: eventData.work_as_imagined || '',
      workAsDone: eventData.work_as_done || '',
      deviationReason: eventData.practice_deviation_reason || '',
      isCustomPractice: eventData.is_custom_practice || false,
      customPracticePrevalence: eventData.custom_practice_prevalence || ''
    });
    setIsEditing(false);
  }

  return (
    <div className="mt-3 pt-3 border-t">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <h4 className="font-medium text-sm">Work-As-Imagined vs Work-As-Done</h4>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-1"
          >
            <Edit2 className="w-3 h-3" />
            {hasData ? 'Edit' : 'Add'}
          </button>
        ) : (
          <div className="flex gap-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1 disabled:opacity-50"
            >
              <Save className="w-3 h-3" />
              Save
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="text-xs px-2 py-1 border rounded hover:bg-gray-50 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Cancel
            </button>
          </div>
        )}
      </div>

      {!isEditing && !hasData && (
        <p className="text-xs text-gray-500 italic">No analysis yet - click Add to compare procedure vs practice</p>
      )}

      {!isEditing && hasData && (
        <div className="space-y-3">
          {formData.workAsImagined && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-xs font-semibold text-blue-900 mb-1">Work-As-Imagined (Procedure/Standard):</p>
              <p className="text-xs text-blue-800">{formData.workAsImagined}</p>
            </div>
          )}

          {formData.workAsDone && (
            <div className="bg-amber-50 border border-amber-200 rounded p-3">
              <p className="text-xs font-semibold text-amber-900 mb-1">Work-As-Done (Actual Practice):</p>
              <p className="text-xs text-amber-800">{formData.workAsDone}</p>
            </div>
          )}

          {hasDeviation && formData.deviationReason && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-red-900 mb-1">Why did this deviation occur?</p>
                  <p className="text-xs text-red-800">{formData.deviationReason}</p>
                </div>
              </div>
            </div>
          )}

          {formData.isCustomPractice && (
            <div className="bg-purple-50 border border-purple-200 rounded p-3">
              <p className="text-xs font-semibold text-purple-900 mb-1">
                ⚠️ Custom Practice / Local Workaround
              </p>
              {formData.customPracticePrevalence && (
                <p className="text-xs text-purple-800">
                  <strong>Prevalence:</strong> {formData.customPracticePrevalence}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {isEditing && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <label className="block text-xs font-semibold text-blue-900 mb-1">
              Work-As-Imagined (How should it be done?)
            </label>
            <p className="text-xs text-blue-700 mb-2 italic">
              According to procedures, standards, training, or management expectations
            </p>
            <textarea
              value={formData.workAsImagined}
              onChange={(e) => setFormData({...formData, workAsImagined: e.target.value})}
              className="w-full border rounded px-2 py-1 text-xs"
              rows={3}
              placeholder="e.g., Procedure states: Isolate equipment, verify zero energy, apply lockout, test before work..."
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded p-3">
            <label className="block text-xs font-semibold text-amber-900 mb-1">
              Work-As-Done (How was it actually done?)
            </label>
            <p className="text-xs text-amber-700 mb-2 italic">
              What actually happened in practice during this event
            </p>
            <textarea
              value={formData.workAsDone}
              onChange={(e) => setFormData({...formData, workAsDone: e.target.value})}
              className="w-full border rounded px-2 py-1 text-xs"
              rows={3}
              placeholder="e.g., Operator isolated equipment, but relied on previous shift's lockout rather than applying new lockout..."
            />
          </div>

          {hasDeviation && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <label className="block text-xs font-semibold text-red-900 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Why did this deviation occur?
              </label>
              <p className="text-xs text-red-700 mb-2 italic">
                What made the actual practice seem reasonable or necessary at the time?
              </p>
              <textarea
                value={formData.deviationReason}
                onChange={(e) => setFormData({...formData, deviationReason: e.target.value})}
                className="w-full border rounded px-2 py-1 text-xs"
                rows={2}
                placeholder="e.g., Time pressure, lack of lockout devices, common practice on this shift, procedure not updated for this equipment..."
              />
            </div>
          )}

          <div className="bg-purple-50 border border-purple-200 rounded p-3">
            <label className="flex items-center gap-2 mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isCustomPractice}
                onChange={(e) => setFormData({...formData, isCustomPractice: e.target.checked})}
                className="w-4 h-4"
              />
              <span className="text-xs font-semibold text-purple-900">
                This is a custom practice / local workaround (not an isolated deviation)
              </span>
            </label>

            {formData.isCustomPractice && (
              <div>
                <label className="block text-xs font-semibold text-purple-900 mb-1">
                  How widespread is this practice?
                </label>
                <select
                  value={formData.customPracticePrevalence}
                  onChange={(e) => setFormData({...formData, customPracticePrevalence: e.target.value})}
                  className="w-full border rounded px-2 py-1 text-xs"
                >
                  <option value="">Select prevalence...</option>
                  <option value="Individual">Individual - Only this person does it this way</option>
                  <option value="Team">Team - This crew/team commonly does it this way</option>
                  <option value="Shift">Shift - Common practice on this shift</option>
                  <option value="Department">Department - Standard practice in this department</option>
                  <option value="Site-wide">Site-wide - Common across the entire facility</option>
                </select>
              </div>
            )}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded p-2">
            <p className="text-xs text-gray-700">
              <strong>Purpose:</strong> Understanding the gap between procedures and practice helps identify where systems, training, or procedures need improvement.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
