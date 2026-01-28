'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, CheckCircle, Target, HelpCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <div onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} className="cursor-help">
        {children}
      </div>
      {show && (
        <div className="absolute z-50 w-64 p-2 text-xs bg-gray-900 text-white rounded shadow-lg -top-2 left-6">
          {text}
          <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -left-1 top-3"></div>
        </div>
      )}
    </div>
  );
};

export default function HOPAssessment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const investigationId = searchParams.get('investigationId');
  const causalFactorId = searchParams.get('causalFactorId');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [investigation, setInvestigation] = useState<any>(null);
  const [causalFactor, setCausalFactor] = useState<any>(null);

  const [formData, setFormData] = useState({
    errorPrecursors: '',
    systemDefenses: '',
    vulnerabilities: '',
    systemImprovements: ''
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

        // Load existing HOP assessment
        const { data: hopData } = await supabase
          .from('hop_assessments')
          .select('*')
          .eq('causal_factor_id', causalFactorId)
          .single();

        if (hopData) {
          setFormData({
            errorPrecursors: hopData.workload_demands || '',
            systemDefenses: hopData.procedural_guidance || '',
            vulnerabilities: hopData.what_made_sense || '',
            systemImprovements: hopData.system_improvements || ''
          });
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
        workload_demands: formData.errorPrecursors,
        procedural_guidance: formData.systemDefenses,
        what_made_sense: formData.vulnerabilities,
        system_improvements: formData.systemImprovements,
        task_description: '',
        work_conditions: '',
        time_of_day: '',
        time_available: '',
        training_experience: '',
        equipment_design: '',
        communication_teamwork: '',
        supervisory_support: '',
        organizational_culture: '',
        local_rationality: '',
        tradeoffs_decisions: '',
        learning_points: '',
        status: 'complete',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Check if assessment exists
      const { data: existing } = await supabase
        .from('hop_assessments')
        .select('id')
        .eq('causal_factor_id', causalFactorId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('hop_assessments')
          .update(assessmentData)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hop_assessments')
          .insert([assessmentData]);
        if (error) throw error;
      }

      // Update causal factor status
      await supabase
        .from('causal_factors')
        .update({ analysis_status: 'analysis_complete' })
        .eq('id', causalFactorId);

      alert('HOP Assessment completed!');
      router.push(`/step4?investigationId=${investigationId}`);
    } catch (error: any) {
      console.error('Error:', error);
      alert(`Error: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push(`/step4?investigationId=${investigationId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Causal Analysis
          </button>
          
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">HOP Assessment</h1>
            </div>
            <p className="text-sm text-gray-600">Human & Organizational Performance</p>
            {investigation && (
              <div className="mt-3 text-sm text-gray-600">
                Investigation: <span className="font-medium text-gray-900">{investigation.investigation_number}</span>
              </div>
            )}
            {causalFactor && (
              <div className="text-sm text-gray-600">
                Causal Factor: <span className="font-medium text-gray-900">{causalFactor.causal_factor_title}</span>
              </div>
            )}
          </div>
        </div>

        {/* HOP Assessment Fields */}
        <div className="bg-white border rounded p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1">
              Error Precursors
              <Tooltip text="Were there changes, time pressure, distractions, or missing information that made error more likely?">
                <HelpCircle className="w-4 h-4 text-blue-500" />
              </Tooltip>
            </label>
            <textarea
              value={formData.errorPrecursors}
              onChange={(e) => setFormData({ ...formData, errorPrecursors: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
              rows={3}
              placeholder="Identify conditions that made errors likely (changes, time pressure, unclear information, etc.)..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1">
              System Defenses
              <Tooltip text="What barriers existed? Which failed or were bypassed? Could the error have been caught?">
                <HelpCircle className="w-4 h-4 text-blue-500" />
              </Tooltip>
            </label>
            <textarea
              value={formData.systemDefenses}
              onChange={(e) => setFormData({ ...formData, systemDefenses: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
              rows={3}
              placeholder="What defenses/barriers failed or were absent? Could error have been detected earlier?..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1">
              System Vulnerabilities
              <Tooltip text="What systemic weaknesses exist? What assumptions about human performance were flawed?">
                <HelpCircle className="w-4 h-4 text-blue-500" />
              </Tooltip>
            </label>
            <textarea
              value={formData.vulnerabilities}
              onChange={(e) => setFormData({ ...formData, vulnerabilities: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
              rows={3}
              placeholder="Identify systemic weaknesses and error-likely situations that could affect others..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1">
              System Improvements
              <Tooltip text="What system changes will reduce error-likely conditions and strengthen defenses?">
                <HelpCircle className="w-4 h-4 text-blue-500" />
              </Tooltip>
            </label>
            <textarea
              value={formData.systemImprovements}
              onChange={(e) => setFormData({ ...formData, systemImprovements: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
              rows={3}
              placeholder="Recommend system-level improvements to reduce error precursors and strengthen defenses..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleComplete}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircle className="w-5 h-5" />
            {saving ? 'Saving...' : 'Complete Assessment'}
          </button>
          <button
            onClick={() => router.push(`/step4?investigationId=${investigationId}`)}
            disabled={saving}
            className="px-6 py-3 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
