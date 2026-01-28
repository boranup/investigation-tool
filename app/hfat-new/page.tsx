'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function HFATAssessment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const investigationId = searchParams.get('investigationId');
  const causalFactorId = searchParams.get('causalFactorId');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [investigation, setInvestigation] = useState<any>(null);
  const [causalFactor, setCausalFactor] = useState<any>(null);

  // Contributing or Causal classification
  const [classification, setClassification] = useState<'contributing' | 'causal'>('contributing');

  // Form data for each HFAT category
  const [formData, setFormData] = useState({
    // Individual Factors (IOGP 4.2.1)
    fatigue: '',
    competency: '',
    awareness: '',
    stress: '',
    physical: '',
    
    // Task Factors (IOGP 4.2.2)
    taskDesign: '',
    procedures: '',
    equipment: '',
    environment: '',
    
    // Team Factors (IOGP 4.2.3)
    communication: '',
    teamwork: '',
    supervision: '',
    
    // Organizational Factors (IOGP 4.2.4)
    culture: '',
    resources: '',
    planning: '',
    policies: ''
  });

  useEffect(() => {
    loadData();
  }, [investigationId, causalFactorId]);

  const loadData = async () => {
    try {
      if (investigationId) {
        const { data: invData } = await supabase
          .from('investigations')
          .select('*')
          .eq('id', investigationId)
          .single();
        setInvestigation(invData);
      }

      if (causalFactorId) {
        const { data: cfData } = await supabase
          .from('causal_factors')
          .select('*')
          .eq('id', causalFactorId)
          .single();
        setCausalFactor(cfData);

        // Load existing HFAT assessment if exists
        const { data: hfatData } = await supabase
          .from('hfat_assessments')
          .select('*')
          .eq('causal_factor_id', causalFactorId)
          .single();

        if (hfatData && hfatData.notes) {
          const notes = hfatData.notes;
          if (notes.classification) setClassification(notes.classification);
          if (notes.factors) setFormData(notes.factors);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!investigationId || !causalFactorId) {
      alert('Missing investigation or causal factor ID');
      return;
    }

    setSaving(true);
    try {
      const assessmentData = {
        investigation_id: investigationId,
        causal_factor_id: causalFactorId,
        notes: {
          classification: classification,
          factors: formData
        },
        ratings: {}, // Empty for compatibility
        status: 'complete',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Check if assessment exists
      const { data: existing } = await supabase
        .from('hfat_assessments')
        .select('id')
        .eq('causal_factor_id', causalFactorId)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('hfat_assessments')
          .update(assessmentData)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('hfat_assessments')
          .insert([assessmentData]);

        if (error) throw error;
      }

      // Update causal factor status
      const { error: updateError } = await supabase
        .from('causal_factors')
        .update({ analysis_status: 'analysis_complete' })
        .eq('id', causalFactorId);

      if (updateError) throw updateError;

      alert('HFAT Assessment completed!');
      router.push(`/step4?investigationId=${investigationId}`);
    } catch (error: any) {
      console.error('Error completing:', error);
      alert(`Error completing assessment: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <button
            onClick={() => router.push(`/step4?investigationId=${investigationId}`)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Causal Analysis
          </button>
          
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">HFAT Assessment</h1>
            <p className="text-slate-600 mt-1">Human Factors Analysis Tool (IOGP 621)</p>
            {investigation && (
              <div className="mt-2 text-sm text-slate-500">
                Investigation: <span className="font-medium text-slate-900">{investigation.investigation_number}</span>
              </div>
            )}
            {causalFactor && (
              <div className="mt-1 text-sm text-slate-500">
                Causal Factor: <span className="font-medium text-slate-900">{causalFactor.causal_factor_title}</span>
              </div>
            )}
          </div>

          {/* Classification Selection */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <label className="block text-sm font-semibold text-blue-900 mb-3">Factor Classification</label>
            <div className="flex gap-3">
              <button
                onClick={() => setClassification('contributing')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                  classification === 'contributing'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                Contributing Factor
              </button>
              <button
                onClick={() => setClassification('causal')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                  classification === 'causal'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                Causal Factor
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-2">
              <strong>Contributing:</strong> Enabled the incident • <strong>Causal:</strong> Direct cause
            </p>
          </div>

          {/* HFAT Categories */}
          <div className="space-y-6">
            {/* Individual Factors */}
            <div>
              <h3 className="font-semibold text-lg text-slate-900 mb-3 pb-2 border-b border-slate-200">
                Individual Factors (IOGP 4.2.1)
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Fatigue / Alertness (IOGP 4.2.1.1)
                  </label>
                  <textarea
                    value={formData.fatigue}
                    onChange={(e) => setFormData({ ...formData, fatigue: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Was the person adequately rested? Consider shift patterns, work hours..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Competency / Training (IOGP 4.2.1.2)
                  </label>
                  <textarea
                    value={formData.competency}
                    onChange={(e) => setFormData({ ...formData, competency: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Did the person have adequate training and competency?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Situational Awareness (IOGP 4.2.1.3)
                  </label>
                  <textarea
                    value={formData.awareness}
                    onChange={(e) => setFormData({ ...formData, awareness: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Did the person have adequate awareness of the situation and hazards?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Stress / Workload (IOGP 4.2.1.4)
                  </label>
                  <textarea
                    value={formData.stress}
                    onChange={(e) => setFormData({ ...formData, stress: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Was there excessive workload or stress affecting performance?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Physical / Medical Factors (IOGP 4.2.1.5)
                  </label>
                  <textarea
                    value={formData.physical}
                    onChange={(e) => setFormData({ ...formData, physical: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Any physical or medical conditions affecting performance?"
                  />
                </div>
              </div>
            </div>

            {/* Task/Work Factors */}
            <div>
              <h3 className="font-semibold text-lg text-slate-900 mb-3 pb-2 border-b border-slate-200">
                Task/Work Factors (IOGP 4.2.2)
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Task Design / Complexity (IOGP 4.2.2.1)
                  </label>
                  <textarea
                    value={formData.taskDesign}
                    onChange={(e) => setFormData({ ...formData, taskDesign: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Was the task design appropriate? Was it too complex?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Procedures / Work Instructions (IOGP 4.2.2.2)
                  </label>
                  <textarea
                    value={formData.procedures}
                    onChange={(e) => setFormData({ ...formData, procedures: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Were procedures available, adequate, and followed?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Equipment / Tools (IOGP 4.2.2.3)
                  </label>
                  <textarea
                    value={formData.equipment}
                    onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Was equipment/tool design user-friendly and appropriate?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Environment / Conditions (IOGP 4.2.2.4)
                  </label>
                  <textarea
                    value={formData.environment}
                    onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Were environmental conditions suitable (lighting, noise, weather)?"
                  />
                </div>
              </div>
            </div>

            {/* Team/Communication Factors */}
            <div>
              <h3 className="font-semibold text-lg text-slate-900 mb-3 pb-2 border-b border-slate-200">
                Team/Communication Factors (IOGP 4.2.3)
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Communication (IOGP 4.2.3.1)
                  </label>
                  <textarea
                    value={formData.communication}
                    onChange={(e) => setFormData({ ...formData, communication: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Was communication clear and effective?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Teamwork / Coordination (IOGP 4.2.3.2)
                  </label>
                  <textarea
                    value={formData.teamwork}
                    onChange={(e) => setFormData({ ...formData, teamwork: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Did the team work together effectively?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Supervision / Leadership (IOGP 4.2.3.3)
                  </label>
                  <textarea
                    value={formData.supervision}
                    onChange={(e) => setFormData({ ...formData, supervision: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Was supervision adequate and supportive?"
                  />
                </div>
              </div>
            </div>

            {/* Organizational Factors */}
            <div>
              <h3 className="font-semibold text-lg text-slate-900 mb-3 pb-2 border-b border-slate-200">
                Organizational Factors (IOGP 4.2.4)
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Safety Culture (IOGP 4.2.4.1)
                  </label>
                  <textarea
                    value={formData.culture}
                    onChange={(e) => setFormData({ ...formData, culture: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Did organizational culture support safe operations?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Resources / Staffing (IOGP 4.2.4.2)
                  </label>
                  <textarea
                    value={formData.resources}
                    onChange={(e) => setFormData({ ...formData, resources: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Were adequate resources and staffing provided?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Work Planning / Scheduling (IOGP 4.2.4.3)
                  </label>
                  <textarea
                    value={formData.planning}
                    onChange={(e) => setFormData({ ...formData, planning: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Was work adequately planned and scheduled?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Policies / Standards (IOGP 4.2.4.4)
                  </label>
                  <textarea
                    value={formData.policies}
                    onChange={(e) => setFormData({ ...formData, policies: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Were policies and standards clear and appropriate?"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-slate-200">
            <button
              onClick={handleComplete}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              {saving ? 'Saving...' : 'Complete Assessment'}
            </button>
            <button
              onClick={() => router.push(`/step4?investigationId=${investigationId}`)}
              disabled={saving}
              className="px-6 py-3 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
