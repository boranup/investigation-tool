'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function HOPAssessment() {
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

  // Form data for HOP assessment
  const [formData, setFormData] = useState({
    taskDescription: '',
    workConditions: '',
    timeOfDay: '',
    workloadDemands: '',
    timeAvailable: '',
    proceduralGuidance: '',
    trainingExperience: '',
    equipmentDesign: '',
    communicationTeamwork: '',
    supervisorySupport: '',
    organizationalCulture: '',
    whatMadeSense: '',
    localRationality: '',
    tradeoffsDecisions: '',
    systemImprovements: '',
    learningPoints: ''
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

        // Load existing HOP assessment if exists
        const { data: hopData } = await supabase
          .from('hop_assessments')
          .select('*')
          .eq('causal_factor_id', causalFactorId)
          .single();

        if (hopData) {
          setClassification(hopData.classification || 'contributing');
          setFormData({
            taskDescription: hopData.task_description || '',
            workConditions: hopData.work_conditions || '',
            timeOfDay: hopData.time_of_day || '',
            workloadDemands: hopData.workload_demands || '',
            timeAvailable: hopData.time_available || '',
            proceduralGuidance: hopData.procedural_guidance || '',
            trainingExperience: hopData.training_experience || '',
            equipmentDesign: hopData.equipment_design || '',
            communicationTeamwork: hopData.communication_teamwork || '',
            supervisorySupport: hopData.supervisory_support || '',
            organizationalCulture: hopData.organizational_culture || '',
            whatMadeSense: hopData.what_made_sense || '',
            localRationality: hopData.local_rationality || '',
            tradeoffsDecisions: hopData.tradeoffs_decisions || '',
            systemImprovements: hopData.system_improvements || '',
            learningPoints: hopData.learning_points || ''
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
        classification: classification,
        task_description: formData.taskDescription,
        work_conditions: formData.workConditions,
        time_of_day: formData.timeOfDay,
        workload_demands: formData.workloadDemands,
        time_available: formData.timeAvailable,
        procedural_guidance: formData.proceduralGuidance,
        training_experience: formData.trainingExperience,
        equipment_design: formData.equipmentDesign,
        communication_teamwork: formData.communicationTeamwork,
        supervisory_support: formData.supervisorySupport,
        organizational_culture: formData.organizationalCulture,
        what_made_sense: formData.whatMadeSense,
        local_rationality: formData.localRationality,
        tradeoffs_decisions: formData.tradeoffsDecisions,
        system_improvements: formData.systemImprovements,
        learning_points: formData.learningPoints,
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
        // Update existing
        const { error } = await supabase
          .from('hop_assessments')
          .update(assessmentData)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('hop_assessments')
          .insert([assessmentData]);

        if (error) throw error;
      }

      // Update causal factor status
      const { error: updateError } = await supabase
        .from('causal_factors')
        .update({ analysis_status: 'analysis_complete' })
        .eq('id', causalFactorId);

      if (updateError) throw updateError;

      alert('HOP Assessment completed!');
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
            <h1 className="text-2xl font-bold text-slate-900">HOP Assessment</h1>
            <p className="text-slate-600 mt-1">Human & Organizational Performance</p>
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

          {/* HOP Assessment Fields */}
          <div className="space-y-6">
            {/* Context */}
            <div>
              <h3 className="font-semibold text-lg text-slate-900 mb-3 pb-2 border-b border-slate-200">
                Context
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Task/Activity Description
                  </label>
                  <textarea
                    value={formData.taskDescription}
                    onChange={(e) => setFormData({ ...formData, taskDescription: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    placeholder="What was the person doing at the time of the incident?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Work Conditions
                  </label>
                  <textarea
                    value={formData.workConditions}
                    onChange={(e) => setFormData({ ...formData, workConditions: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Describe the working environment and conditions"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Time of Day
                  </label>
                  <input
                    type="text"
                    value={formData.timeOfDay}
                    onChange={(e) => setFormData({ ...formData, timeOfDay: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="e.g., Night shift, early morning"
                  />
                </div>
              </div>
            </div>

            {/* Performance Influencing Factors */}
            <div>
              <h3 className="font-semibold text-lg text-slate-900 mb-3 pb-2 border-b border-slate-200">
                Performance Influencing Factors
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Workload & Demands
                  </label>
                  <textarea
                    value={formData.workloadDemands}
                    onChange={(e) => setFormData({ ...formData, workloadDemands: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    placeholder="What were the workload demands and pressures?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Time Available
                  </label>
                  <textarea
                    value={formData.timeAvailable}
                    onChange={(e) => setFormData({ ...formData, timeAvailable: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Was there adequate time to complete the task safely?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Procedural Guidance
                  </label>
                  <textarea
                    value={formData.proceduralGuidance}
                    onChange={(e) => setFormData({ ...formData, proceduralGuidance: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    placeholder="What procedures or guidance were available?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Training & Experience
                  </label>
                  <textarea
                    value={formData.trainingExperience}
                    onChange={(e) => setFormData({ ...formData, trainingExperience: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    placeholder="What training and experience did the person have?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Equipment Design
                  </label>
                  <textarea
                    value={formData.equipmentDesign}
                    onChange={(e) => setFormData({ ...formData, equipmentDesign: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    placeholder="How did equipment design influence the situation?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Communication & Teamwork
                  </label>
                  <textarea
                    value={formData.communicationTeamwork}
                    onChange={(e) => setFormData({ ...formData, communicationTeamwork: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    placeholder="How did communication and teamwork factors play a role?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Supervisory Support
                  </label>
                  <textarea
                    value={formData.supervisorySupport}
                    onChange={(e) => setFormData({ ...formData, supervisorySupport: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    placeholder="What supervisory support was available?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Organizational Culture
                  </label>
                  <textarea
                    value={formData.organizationalCulture}
                    onChange={(e) => setFormData({ ...formData, organizationalCulture: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    placeholder="How did organizational culture and norms influence behavior?"
                  />
                </div>
              </div>
            </div>

            {/* Learning from Incident */}
            <div>
              <h3 className="font-semibold text-lg text-slate-900 mb-3 pb-2 border-b border-slate-200">
                Learning from the Incident
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    What Made Sense to the Worker?
                  </label>
                  <textarea
                    value={formData.whatMadeSense}
                    onChange={(e) => setFormData({ ...formData, whatMadeSense: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={3}
                    placeholder="From the worker's perspective, why did their actions make sense at the time?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Local Rationality
                  </label>
                  <textarea
                    value={formData.localRationality}
                    onChange={(e) => setFormData({ ...formData, localRationality: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={3}
                    placeholder="What information and context shaped their decisions?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tradeoffs & Decisions
                  </label>
                  <textarea
                    value={formData.tradeoffsDecisions}
                    onChange={(e) => setFormData({ ...formData, tradeoffsDecisions: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={3}
                    placeholder="What tradeoffs or competing goals were they managing?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    System Improvements
                  </label>
                  <textarea
                    value={formData.systemImprovements}
                    onChange={(e) => setFormData({ ...formData, systemImprovements: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={3}
                    placeholder="What system changes could prevent similar incidents?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Key Learning Points
                  </label>
                  <textarea
                    value={formData.learningPoints}
                    onChange={(e) => setFormData({ ...formData, learningPoints: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={3}
                    placeholder="What are the key takeaways from this assessment?"
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
