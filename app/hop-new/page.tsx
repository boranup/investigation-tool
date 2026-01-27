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
  const assessmentId = searchParams.get('assessmentId');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [investigation, setInvestigation] = useState<any>(null);
  const [causalFactor, setCausalFactor] = useState<any>(null);

  const [formData, setFormData] = useState({
    // Context
    taskDescription: '',
    workConditions: '',
    timeOfDay: '',
    
    // Performance Influencing Factors
    workloadDemands: '',
    timeAvailable: '',
    proceduralGuidance: '',
    trainingExperience: '',
    equipmentDesign: '',
    communicationTeamwork: '',
    supervisorySupport: '',
    organizationalCulture: '',
    
    // Human Performance Analysis
    whatMadeSense: '',
    localRationality: '',
    tradeoffsDecisions: '',
    
    // Learning Opportunities
    systemImprovements: '',
    learningPoints: ''
  });

  const [currentSection, setCurrentSection] = useState(1);

  useEffect(() => {
    loadData();
  }, [investigationId, causalFactorId, assessmentId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load investigation
      if (investigationId) {
        const { data: invData } = await supabase
          .from('investigations')
          .select('*')
          .eq('id', investigationId)
          .single();
        setInvestigation(invData);
      }

      // Load causal factor
      if (causalFactorId) {
        const { data: cfData } = await supabase
          .from('causal_factors')
          .select('*')
          .eq('id', causalFactorId)
          .single();
        setCausalFactor(cfData);
      }

      // Load existing assessment if editing
      if (assessmentId) {
        const { data: assessmentData } = await supabase
          .from('hop_assessments')
          .select('*')
          .eq('id', assessmentId)
          .single();
        
        if (assessmentData) {
          setFormData({
            taskDescription: assessmentData.task_description || '',
            workConditions: assessmentData.work_conditions || '',
            timeOfDay: assessmentData.time_of_day || '',
            workloadDemands: assessmentData.workload_demands || '',
            timeAvailable: assessmentData.time_available || '',
            proceduralGuidance: assessmentData.procedural_guidance || '',
            trainingExperience: assessmentData.training_experience || '',
            equipmentDesign: assessmentData.equipment_design || '',
            communicationTeamwork: assessmentData.communication_teamwork || '',
            supervisorySupport: assessmentData.supervisory_support || '',
            organizationalCulture: assessmentData.organizational_culture || '',
            whatMadeSense: assessmentData.what_made_sense || '',
            localRationality: assessmentData.local_rationality || '',
            tradeoffsDecisions: assessmentData.tradeoffs_decisions || '',
            systemImprovements: assessmentData.system_improvements || '',
            learningPoints: assessmentData.learning_points || ''
          });
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!investigationId || !causalFactorId) {
      alert('Missing investigation or causal factor ID');
      return;
    }

    setSaving(true);
    try {
      const assessmentData = {
        investigation_id: investigationId,
        causal_factor_id: causalFactorId,
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
        status: 'draft',
        updated_at: new Date().toISOString()
      };

      if (assessmentId) {
        const { error } = await supabase
          .from('hop_assessments')
          .update(assessmentData)
          .eq('id', assessmentId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hop_assessments')
          .insert([assessmentData]);
        
        if (error) throw error;
      }

      alert('HOP Assessment saved successfully!');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error saving assessment');
    } finally {
      setSaving(false);
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

      if (assessmentId) {
        const { error } = await supabase
          .from('hop_assessments')
          .update(assessmentData)
          .eq('id', assessmentId);
        
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

      alert('HOP Assessment completed! Returning to causal analysis...');
      router.push('/step4');
    } catch (error) {
      console.error('Error completing:', error);
      alert('Error completing assessment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-slate-600">Loading assessment...</div>
      </div>
    );
  }

  const sections = [
    { id: 1, name: 'Context', icon: '📋' },
    { id: 2, name: 'PIFs - Task & Environment', icon: '⚙️' },
    { id: 3, name: 'PIFs - Individual & Team', icon: '👥' },
    { id: 4, name: 'PIFs - Organizational', icon: '🏢' },
    { id: 5, name: 'Local Rationality', icon: '🧠' },
    { id: 6, name: 'Learning & Improvements', icon: '💡' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <button
            onClick={() => router.push('/step4')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Causal Analysis
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">HOP Assessment</h1>
              <p className="text-slate-600 mt-1">Human and Organizational Performance Analysis</p>
              <div className="mt-2 text-sm">
                <span className="text-slate-500">Investigation:</span>{' '}
                <span className="font-medium text-slate-700">{investigation?.investigation_number || 'Loading...'}</span>
              </div>
              <div className="text-sm">
                <span className="text-slate-500">Causal Factor:</span>{' '}
                <span className="font-medium text-slate-700">{causalFactor?.causal_factor_title || 'Loading...'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={handleComplete}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                {saving ? 'Completing...' : 'Complete Assessment'}
              </button>
            </div>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setCurrentSection(section.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  currentSection === section.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{section.icon}</span>
                <span className="text-sm font-medium">{section.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Section Content */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          {currentSection === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">📋 Work Context</h2>
                <p className="text-sm text-slate-600 mb-6">
                  Describe the context in which the work was being performed
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Task Description
                </label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="What task was being performed when the incident occurred?"
                  value={formData.taskDescription}
                  onChange={(e) => setFormData({ ...formData, taskDescription: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Work Conditions
                </label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Describe the physical work environment (weather, lighting, noise, space constraints, etc.)"
                  value={formData.workConditions}
                  onChange={(e) => setFormData({ ...formData, workConditions: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Time of Day / Shift Information
                </label>
                <input
                  type="text"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Night shift, hour 10 of 12-hour shift"
                  value={formData.timeOfDay}
                  onChange={(e) => setFormData({ ...formData, timeOfDay: e.target.value })}
                />
              </div>
            </div>
          )}

          {currentSection === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">⚙️ Performance Influencing Factors - Task & Environment</h2>
                <p className="text-sm text-slate-600 mb-6">
                  Identify factors related to the task itself and the work environment
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Workload & Demands
                </label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Was the workload normal, high, or low? Were there competing demands?"
                  value={formData.workloadDemands}
                  onChange={(e) => setFormData({ ...formData, workloadDemands: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Time Available
                </label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Was there adequate time? Time pressure? Rushed conditions?"
                  value={formData.timeAvailable}
                  onChange={(e) => setFormData({ ...formData, timeAvailable: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Procedural Guidance
                </label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Were procedures available, accurate, and usable? Were they followed?"
                  value={formData.proceduralGuidance}
                  onChange={(e) => setFormData({ ...formData, proceduralGuidance: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Equipment Design & Usability
                </label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Was equipment well-designed and intuitive? Any human factors issues?"
                  value={formData.equipmentDesign}
                  onChange={(e) => setFormData({ ...formData, equipmentDesign: e.target.value })}
                />
              </div>
            </div>
          )}

          {currentSection === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">👥 Performance Influencing Factors - Individual & Team</h2>
                <p className="text-sm text-slate-600 mb-6">
                  Identify factors related to individual capabilities and team dynamics
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Training & Experience
                </label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Did the person have adequate training? Experience with this task? Recent practice?"
                  value={formData.trainingExperience}
                  onChange={(e) => setFormData({ ...formData, trainingExperience: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Communication & Teamwork
                </label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Was communication clear? Were handoffs effective? Team coordination?"
                  value={formData.communicationTeamwork}
                  onChange={(e) => setFormData({ ...formData, communicationTeamwork: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Supervisory Support
                </label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Was supervision adequate? Were resources available? Support when needed?"
                  value={formData.supervisorySupport}
                  onChange={(e) => setFormData({ ...formData, supervisorySupport: e.target.value })}
                />
              </div>
            </div>
          )}

          {currentSection === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">🏢 Performance Influencing Factors - Organizational</h2>
                <p className="text-sm text-slate-600 mb-6">
                  Identify organizational and cultural factors
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Organizational Culture & Norms
                </label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="What organizational factors influenced behavior? Production pressure? Safety culture? Work-arounds? Unwritten rules?"
                  value={formData.organizationalCulture}
                  onChange={(e) => setFormData({ ...formData, organizationalCulture: e.target.value })}
                />
              </div>
            </div>
          )}

          {currentSection === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">🧠 Understanding Local Rationality</h2>
                <p className="text-sm text-slate-600 mb-6">
                  Understand why the person's actions made sense to them at the time
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  What Made Sense to the Person?
                </label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="From the person's perspective at the time, why did their actions make sense? What were they trying to accomplish?"
                  value={formData.whatMadeSense}
                  onChange={(e) => setFormData({ ...formData, whatMadeSense: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Local Rationality - Context at the Time
                </label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="What information did they have? What did they not know? What were the pressures and constraints?"
                  value={formData.localRationality}
                  onChange={(e) => setFormData({ ...formData, localRationality: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Trade-offs and Decisions
                </label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="What trade-offs were being made? Efficiency vs. thoroughness? Speed vs. accuracy?"
                  value={formData.tradeoffsDecisions}
                  onChange={(e) => setFormData({ ...formData, tradeoffsDecisions: e.target.value })}
                />
              </div>
            </div>
          )}

          {currentSection === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">💡 Learning & System Improvements</h2>
                <p className="text-sm text-slate-600 mb-6">
                  Identify opportunities for learning and system-level improvements
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  System Improvements
                </label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="What system changes could reduce the likelihood of similar events? Focus on making the right thing easier to do."
                  value={formData.systemImprovements}
                  onChange={(e) => setFormData({ ...formData, systemImprovements: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Key Learning Points
                </label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="What are the key insights from this analysis? What should be shared with the organization?"
                  value={formData.learningPoints}
                  onChange={(e) => setFormData({ ...formData, learningPoints: e.target.value })}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
                <h3 className="font-semibold text-blue-900 mb-3">HOP Principles Applied</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>✓ People are not the problem - the system is</li>
                  <li>✓ Blame fixes nothing - understanding fixes everything</li>
                  <li>✓ Context drives behavior - behavior makes sense given context</li>
                  <li>✓ Learning is vital - failure is an opportunity to learn</li>
                  <li>✓ Response matters - how we respond affects future behavior</li>
                </ul>
              </div>

              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-green-900 mb-2">Assessment Summary</h4>
                <div className="text-sm text-green-800 space-y-1">
                  <p><strong>Causal Factor:</strong> {causalFactor?.causal_factor_title || 'Loading...'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
            <button
              onClick={() => setCurrentSection(Math.max(1, currentSection - 1))}
              disabled={currentSection === 1}
              className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentSection(Math.min(6, currentSection + 1))}
              disabled={currentSection === 6}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
