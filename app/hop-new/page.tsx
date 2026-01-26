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
  }, []);

  const loadData = async () => {
    try {
      // Load investigation
      if (investigationId) {
        const { data: invData } = await supabase
          .from('investigations')
          .select('*')
          .eq('id', investigationId)
          .single();
        if (invData) setInvestigation(invData);
      }

      // Load causal factor
      if (causalFactorId) {
        const { data: cfData } = await supabase
          .from('causal_factors')
          .select('*')
          .eq('id', causalFactorId)
          .single();
        if (cfData) setCausalFactor(cfData);
      }

      // Load existing assessment if assessmentId provided
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
        // Update existing
        const { error } = await supabase
          .from('hop_assessments')
          .update(assessmentData)
          .eq('id', assessmentId);
        
        if (error) throw error;
      } else {
        // Create new
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
              <h1 className="text-2xl font-bold text-slate-900 mb-1">
                HOP Assessment
              </h1>
              <p className="text-sm text-slate-600">
                Human and Organizational Performance Analysis
              </p>
              <div className="mt-2 text-sm">
                <span className="text-slate-500">Investigation:</span>{' '}
                <span className="font-medium text-slate-700">{investigation?.investigation_number || 'Loading...'}</span>
              </div>
              <div className="text-sm">
                <span className="text-slate-500">Causal Factor:</span>{' '}
                <span className="font-medium text-slate-700">{causalFactor?.causal_factor_title || 'Loading...'}</span>
              </div>
            </div>
            <div className="flex gap-2">
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
                {saving ? 'Saving...' : 'Complete Assessment'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sticky top-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Sections</h3>
              <div className="space-y-2">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setCurrentSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      currentSection === section.id
                        ? 'bg-green-100 text-green-900 font-medium'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="mr-2">{section.icon}</span>
                    {section.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              
              {currentSection === 1 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Context Setting</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Task Description *
                      </label>
                      <textarea
                        value={formData.taskDescription}
                        onChange={(e) => setFormData({...formData, taskDescription: e.target.value})}
                        rows={3}
                        placeholder="What was the person doing? What was their role and responsibility at the time?"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Work Conditions
                      </label>
                      <textarea
                        value={formData.workConditions}
                        onChange={(e) => setFormData({...formData, workConditions: e.target.value})}
                        rows={3}
                        placeholder="Describe the work environment, conditions, and context (e.g., startup operation, maintenance activity, emergency response)"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Time of Day / Shift
                      </label>
                      <input
                        type="text"
                        value={formData.timeOfDay}
                        onChange={(e) => setFormData({...formData, timeOfDay: e.target.value})}
                        placeholder="e.g., Night shift, end of 12-hour shift"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-amber-900 mb-2">Just Culture Reminder</h4>
                      <p className="text-sm text-amber-800">
                        Focus on understanding what made sense to the person at the time. 
                        Avoid hindsight bias and blame. We're trying to learn, not punish.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {currentSection === 2 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">
                    Performance Influencing Factors: Task & Environment
                  </h2>
                  <p className="text-sm text-slate-600 mb-4">
                    What factors in the task and environment influenced performance?
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Workload & Task Demands
                      </label>
                      <textarea
                        value={formData.workloadDemands}
                        onChange={(e) => setFormData({...formData, workloadDemands: e.target.value})}
                        rows={3}
                        placeholder="How demanding was the task? Were there competing priorities? Multiple simultaneous demands?"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Time Available
                      </label>
                      <textarea
                        value={formData.timeAvailable}
                        onChange={(e) => setFormData({...formData, timeAvailable: e.target.value})}
                        rows={3}
                        placeholder="Was there time pressure? Adequate time to assess and respond? Rushed conditions?"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Procedural Guidance
                      </label>
                      <textarea
                        value={formData.proceduralGuidance}
                        onChange={(e) => setFormData({...formData, proceduralGuidance: e.target.value})}
                        rows={3}
                        placeholder="Were procedures available, clear, and usable? Did they match the actual task? Were they followed as written?"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Equipment & HMI Design
                      </label>
                      <textarea
                        value={formData.equipmentDesign}
                        onChange={(e) => setFormData({...formData, equipmentDesign: e.target.value})}
                        rows={3}
                        placeholder="How did equipment design affect performance? Were displays clear? Controls intuitive? Alarms effective?"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentSection === 3 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">
                    Performance Influencing Factors: Individual & Team
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Training & Experience
                      </label>
                      <textarea
                        value={formData.trainingExperience}
                        onChange={(e) => setFormData({...formData, trainingExperience: e.target.value})}
                        rows={3}
                        placeholder="What was the person's training and experience level? Had they encountered this situation before? Recent training?"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Communication & Teamwork
                      </label>
                      <textarea
                        value={formData.communicationTeamwork}
                        onChange={(e) => setFormData({...formData, communicationTeamwork: e.target.value})}
                        rows={3}
                        placeholder="How was communication? Were team members available? Was information shared effectively? Any handover issues?"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Supervisory Support
                      </label>
                      <textarea
                        value={formData.supervisorySupport}
                        onChange={(e) => setFormData({...formData, supervisorySupport: e.target.value})}
                        rows={3}
                        placeholder="Was supervision available and engaged? Clear expectations? Support when needed?"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentSection === 4 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">
                    Performance Influencing Factors: Organizational
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Organizational Culture & Norms
                      </label>
                      <textarea
                        value={formData.organizationalCulture}
                        onChange={(e) => setFormData({...formData, organizationalCulture: e.target.value})}
                        rows={4}
                        placeholder="What organizational factors influenced this? Production pressure? Safety culture? Accepted workarounds? Resource constraints?"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-blue-900 mb-2">Consider:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Are there conflicting goals? (productivity vs safety)</li>
                        <li>• Are resources adequate? (staffing, equipment, time)</li>
                        <li>• Is there management support for safety?</li>
                        <li>• Are there systemic issues or normalized deviations?</li>
                        <li>• How does the organization respond to concerns?</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {currentSection === 5 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">
                    Local Rationality & Sense-Making
                  </h2>
                  <p className="text-sm text-slate-600 mb-4">
                    Understanding what made sense to the person at the time
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        What Made Sense at the Time? *
                      </label>
                      <textarea
                        value={formData.whatMadeSense}
                        onChange={(e) => setFormData({...formData, whatMadeSense: e.target.value})}
                        rows={4}
                        placeholder="From the person's perspective, what made sense? What were they trying to achieve? What information did they have?"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Local Rationality Analysis
                      </label>
                      <textarea
                        value={formData.localRationality}
                        onChange={(e) => setFormData({...formData, localRationality: e.target.value})}
                        rows={4}
                        placeholder="Given what they knew, what they were experiencing, and the goals they were pursuing, why did their actions make sense?"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Trade-offs & Decisions
                      </label>
                      <textarea
                        value={formData.tradeoffsDecisions}
                        onChange={(e) => setFormData({...formData, tradeoffsDecisions: e.target.value})}
                        rows={3}
                        placeholder="What trade-offs were they managing? Efficiency vs thoroughness? Speed vs accuracy? Multiple competing goals?"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentSection === 6 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">
                    Learning & System Improvements
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        System Improvements *
                      </label>
                      <textarea
                        value={formData.systemImprovements}
                        onChange={(e) => setFormData({...formData, systemImprovements: e.target.value})}
                        rows={4}
                        placeholder="Based on this analysis, what system changes would help? Consider: training, procedures, equipment design, organizational factors..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Key Learning Points
                      </label>
                      <textarea
                        value={formData.learningPoints}
                        onChange={(e) => setFormData({...formData, learningPoints: e.target.value})}
                        rows={4}
                        placeholder="What are the key insights from this HOP analysis? What should the organization learn?"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-green-900 mb-2">Assessment Summary</h4>
                      <div className="text-sm text-green-800 space-y-1">
                        <p><strong>Causal Factor:</strong> {causalFactor.title}</p>
                        <p><strong>Status:</strong> {formData.assessmentStatus === 'complete' ? 'Complete' : 'In Progress'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
                <button
                  onClick={() => setCurrentSection(Math.max(1, currentSection - 1))}
                  disabled={currentSection === 1}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous Section
                </button>
                <button
                  onClick={() => setCurrentSection(Math.min(6, currentSection + 1))}
                  disabled={currentSection === 6}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next Section
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
