'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';
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
    // NEW: Error vs Violation Classification
    actionType: '', // 'error' or 'violation'
    violationType: '', // 'routine', 'situational', 'exceptional'
    violationContext: '',
    violationPrevalence: '',
    
    // Context
    context: '',
    
    // Performance Influencing Factors
    errorPrecursors: '',
    systemDefenses: '',
    learningOpportunities: '',
    
    // NEW: Organizational Factors
    orgManagementDecisions: '',
    orgPriorities: '',
    orgSystemicIssues: '',
    
    // NEW: Latent Conditions
    latentConditionDuration: '',
    latentPreviousOpportunities: '',
    latentOtherIncidents: '',
    
    // NEW: Leadership Messaging
    leadershipPriorityMessages: '',
    leadershipProductionSafety: '',
    leadershipPreviousResponse: '',
    
    // REMOVED: System Improvements (now goes to recommendations)
  });

  useEffect(() => {
    loadData();
  }, [investigationId, causalFactorId, assessmentId]);

  async function loadData() {
    try {
      setLoading(true);

      // Load investigation
      const { data: invData, error: invError } = await supabase
        .from('investigations')
        .select('*')
        .eq('id', investigationId)
        .single();

      if (invError) throw invError;
      setInvestigation(invData);

      // Load causal factor
      const { data: cfData, error: cfError } = await supabase
        .from('causal_factors')
        .select('*')
        .eq('id', causalFactorId)
        .single();

      if (cfError) throw cfError;
      setCausalFactor(cfData);

      // If editing existing assessment, load it
      if (assessmentId) {
        const { data: assessmentData, error: assessmentError } = await supabase
          .from('hop_assessments')
          .select('*')
          .eq('id', assessmentId)
          .single();

        if (assessmentError) throw assessmentError;
        
        setFormData({
          actionType: assessmentData.action_type || '',
          violationType: assessmentData.violation_type || '',
          violationContext: assessmentData.violation_context || '',
          violationPrevalence: assessmentData.violation_prevalence || '',
          context: assessmentData.context || '',
          errorPrecursors: assessmentData.error_precursors || '',
          systemDefenses: assessmentData.system_defenses || '',
          learningOpportunities: assessmentData.learning_opportunities || '',
          orgManagementDecisions: assessmentData.org_management_decisions || '',
          orgPriorities: assessmentData.org_priorities || '',
          orgSystemicIssues: assessmentData.org_systemic_issues || '',
          latentConditionDuration: assessmentData.latent_condition_duration || '',
          latentPreviousOpportunities: assessmentData.latent_previous_opportunities || '',
          latentOtherIncidents: assessmentData.latent_other_incidents || '',
          leadershipPriorityMessages: assessmentData.leadership_priority_messages || '',
          leadershipProductionSafety: assessmentData.leadership_production_safety || '',
          leadershipPreviousResponse: assessmentData.leadership_previous_response || '',
        });
      }

    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error loading data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);

      const hopData = {
        investigation_id: investigationId,
        causal_factor_id: causalFactorId,
        action_type: formData.actionType,
        violation_type: formData.violationType,
        violation_context: formData.violationContext,
        violation_prevalence: formData.violationPrevalence,
        context: formData.context,
        error_precursors: formData.errorPrecursors,
        system_defenses: formData.systemDefenses,
        learning_opportunities: formData.learningOpportunities,
        org_management_decisions: formData.orgManagementDecisions,
        org_priorities: formData.orgPriorities,
        org_systemic_issues: formData.orgSystemicIssues,
        latent_condition_duration: formData.latentConditionDuration,
        latent_previous_opportunities: formData.latentPreviousOpportunities,
        latent_other_incidents: formData.latentOtherIncidents,
        leadership_priority_messages: formData.leadershipPriorityMessages,
        leadership_production_safety: formData.leadershipProductionSafety,
        leadership_previous_response: formData.leadershipPreviousResponse,
        completed: true,
        completed_at: new Date().toISOString()
      };

      if (assessmentId) {
        // Update existing
        const { error } = await supabase
          .from('hop_assessments')
          .update(hopData)
          .eq('id', assessmentId);

        if (error) {
          console.error('Supabase error details:', error);
          throw error;
        }
      } else {
        // Create new
        const { error } = await supabase
          .from('hop_assessments')
          .insert([hopData]);

        if (error) {
          console.error('Supabase error details:', error);
          throw error;
        }
      }

      // Update causal factor status
      await supabase
        .from('causal_factors')
        .update({ 
          assessment_status: 'validated',
          updated_at: new Date().toISOString()
        })
        .eq('id', causalFactorId);

      alert('HOP Assessment saved successfully!');
      router.back();

    } catch (error: any) {
      console.error('Error saving:', error);
      alert(`Error saving assessment: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading HOP Assessment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Investigation
          </button>

          <h1 className="text-2xl font-bold text-gray-900">
            HOP Assessment
          </h1>
          <p className="text-gray-600 mt-2">
            Investigation: {investigation?.investigation_number} - {investigation?.incident_description}
          </p>
          <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="font-medium text-blue-900">Causal Factor:</p>
            <p className="text-blue-700 text-sm mt-1">{causalFactor?.title}</p>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          
          {/* ============================================================ */}
          {/* NEW SECTION: Error vs Violation Classification */}
          {/* ============================================================ */}
          <div className="border-b pb-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="text-amber-600" size={20} />
              <h2 className="text-lg font-semibold">1. Action Classification</h2>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-900 font-medium mb-2">
                First, determine: Was this action deliberate or unintentional?
              </p>
              <p className="text-xs text-amber-700">
                This determines the analysis pathway: Errors require PSF analysis; Violations require understanding why the violation made sense.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Was this action deliberate or unintentional? *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 p-3 border rounded cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="actionType"
                      value="error"
                      checked={formData.actionType === 'error'}
                      onChange={(e) => setFormData({...formData, actionType: e.target.value})}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-medium">Unintentional (Error)</div>
                      <div className="text-xs text-gray-600">
                        Person did not intend this outcome; made a mistake, forgot, misperceived
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 border rounded cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="actionType"
                      value="violation"
                      checked={formData.actionType === 'violation'}
                      onChange={(e) => setFormData({...formData, actionType: e.target.value})}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-medium">Deliberate (Violation)</div>
                      <div className="text-xs text-gray-600">
                        Person knowingly deviated from procedure/rule (but did not intend harm)
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Violation Type (only if violation selected) */}
              {formData.actionType === 'violation' && (
                <div className="pl-6 border-l-4 border-amber-300 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Type of Violation *
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-start gap-2 p-3 border rounded cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="violationType"
                          value="routine"
                          checked={formData.violationType === 'routine'}
                          onChange={(e) => setFormData({...formData, violationType: e.target.value})}
                          className="w-4 h-4 mt-1"
                        />
                        <div>
                          <div className="font-medium">Routine Violation</div>
                          <div className="text-xs text-gray-600">
                            Common practice; "everyone does it this way"; normalized deviation
                          </div>
                        </div>
                      </label>

                      <label className="flex items-start gap-2 p-3 border rounded cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="violationType"
                          value="situational"
                          checked={formData.violationType === 'situational'}
                          onChange={(e) => setFormData({...formData, violationType: e.target.value})}
                          className="w-4 h-4 mt-1"
                        />
                        <div>
                          <div className="font-medium">Situational Violation</div>
                          <div className="text-xs text-gray-600">
                            Specific circumstances forced deviation (time pressure, equipment unavailable, etc.)
                          </div>
                        </div>
                      </label>

                      <label className="flex items-start gap-2 p-3 border rounded cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="violationType"
                          value="exceptional"
                          checked={formData.violationType === 'exceptional'}
                          onChange={(e) => setFormData({...formData, violationType: e.target.value})}
                          className="w-4 h-4 mt-1"
                        />
                        <div>
                          <div className="font-medium">Exceptional Violation</div>
                          <div className="text-xs text-gray-600">
                            Rare, one-off situation requiring unusual response
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Why did this violation make sense to the person at the time? *
                    </label>
                    <textarea
                      value={formData.violationContext}
                      onChange={(e) => setFormData({...formData, violationContext: e.target.value})}
                      className="w-full border rounded p-3"
                      rows={4}
                      placeholder="Explain the context, pressures, and reasons why the person chose to violate the procedure..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      How widespread is this violation?
                    </label>
                    <select
                      value={formData.violationPrevalence}
                      onChange={(e) => setFormData({...formData, violationPrevalence: e.target.value})}
                      className="w-full border rounded p-2"
                    >
                      <option value="">Select...</option>
                      <option value="isolated">Isolated - This person only</option>
                      <option value="team">Team - This team/crew does this</option>
                      <option value="shift">Shift - Everyone on this shift</option>
                      <option value="site-wide">Site-wide - Common across site</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Context */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold mb-4">2. Context</h2>
            <div>
              <label className="block text-sm font-medium mb-2">
                What was happening? What were the circumstances?
              </label>
              <textarea
                value={formData.context}
                onChange={(e) => setFormData({...formData, context: e.target.value})}
                className="w-full border rounded p-3"
                rows={4}
                placeholder="Describe the situation, conditions, and context when this action occurred..."
              />
            </div>
          </div>

          {/* Performance Influencing Factors */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold mb-4">3. Performance Influencing Factors</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  Error Precursors
                  <div className="group relative">
                    <HelpCircle size={16} className="text-gray-400" />
                    <div className="hidden group-hover:block absolute left-6 top-0 w-64 bg-gray-900 text-white text-xs p-2 rounded shadow-lg z-10">
                      Changes, time pressure, distractions, missing information that made error more likely
                    </div>
                  </div>
                </label>
                <textarea
                  value={formData.errorPrecursors}
                  onChange={(e) => setFormData({...formData, errorPrecursors: e.target.value})}
                  className="w-full border rounded p-3"
                  rows={3}
                  placeholder="What conditions made this error/violation likely? (workload, fatigue, unclear procedures, equipment design, etc.)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  System Defenses
                  <div className="group relative">
                    <HelpCircle size={16} className="text-gray-400" />
                    <div className="hidden group-hover:block absolute left-6 top-0 w-64 bg-gray-900 text-white text-xs p-2 rounded shadow-lg z-10">
                      What barriers existed? Which failed or were bypassed?
                    </div>
                  </div>
                </label>
                <textarea
                  value={formData.systemDefenses}
                  onChange={(e) => setFormData({...formData, systemDefenses: e.target.value})}
                  className="w-full border rounded p-3"
                  rows={3}
                  placeholder="What defenses/barriers were in place? Which failed? Could the error have been caught?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Learning Opportunities
                </label>
                <textarea
                  value={formData.learningOpportunities}
                  onChange={(e) => setFormData({...formData, learningOpportunities: e.target.value})}
                  className="w-full border rounded p-3"
                  rows={3}
                  placeholder="What can we learn? How can we make the system more resilient?"
                />
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* NEW SECTION: Organizational Factors */}
          {/* ============================================================ */}
          <div className="border-b pb-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="text-orange-600" size={20} />
              <h2 className="text-lg font-semibold">4. Organizational Factors</h2>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-orange-900 font-medium">
                Don't stop at individual actions - understand the organizational context
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  What management decisions contributed to this situation?
                </label>
                <textarea
                  value={formData.orgManagementDecisions}
                  onChange={(e) => setFormData({...formData, orgManagementDecisions: e.target.value})}
                  className="w-full border rounded p-3"
                  rows={3}
                  placeholder="Resource allocation, staffing levels, equipment procurement, modification decisions, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  What organizational priorities influenced behaviour?
                </label>
                <textarea
                  value={formData.orgPriorities}
                  onChange={(e) => setFormData({...formData, orgPriorities: e.target.value})}
                  className="w-full border rounded p-3"
                  rows={3}
                  placeholder="Production vs. safety pressures, cost constraints, schedule demands, competing priorities..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  What systemic issues allowed this to persist?
                </label>
                <textarea
                  value={formData.orgSystemicIssues}
                  onChange={(e) => setFormData({...formData, orgSystemicIssues: e.target.value})}
                  className="w-full border rounded p-3"
                  rows={3}
                  placeholder="Safety culture issues, inadequate oversight, normalized deviations, weak learning systems..."
                />
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* NEW SECTION: Latent Conditions */}
          {/* ============================================================ */}
          <div className="border-b pb-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="text-red-600" size={20} />
              <h2 className="text-lg font-semibold">5. Latent Conditions</h2>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-900 font-medium">
                Trace conditions back to their origin - how long has this issue existed?
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  How long has this condition existed?
                </label>
                <textarea
                  value={formData.latentConditionDuration}
                  onChange={(e) => setFormData({...formData, latentConditionDuration: e.target.value})}
                  className="w-full border rounded p-3"
                  rows={2}
                  placeholder="When was this condition first created? Has it been dormant for years?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  What previous opportunities were there to identify or correct this?
                </label>
                <textarea
                  value={formData.latentPreviousOpportunities}
                  onChange={(e) => setFormData({...formData, latentPreviousOpportunities: e.target.value})}
                  className="w-full border rounded p-3"
                  rows={2}
                  placeholder="Previous incidents, audits, inspections, risk assessments that could have caught this..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  What other incidents might this condition contribute to?
                </label>
                <textarea
                  value={formData.latentOtherIncidents}
                  onChange={(e) => setFormData({...formData, latentOtherIncidents: e.target.value})}
                  className="w-full border rounded p-3"
                  rows={2}
                  placeholder="What similar incidents could occur from this same systemic issue?"
                />
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* NEW SECTION: Leadership Messaging */}
          {/* ============================================================ */}
          <div className="pb-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="text-purple-600" size={20} />
              <h2 className="text-lg font-semibold">6. Leadership Messaging</h2>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-purple-900 font-medium">
                What messages did leadership communicate about priorities and safety?
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  What messages did workers receive about priorities?
                </label>
                <textarea
                  value={formData.leadershipPriorityMessages}
                  onChange={(e) => setFormData({...formData, leadershipPriorityMessages: e.target.value})}
                  className="w-full border rounded p-3"
                  rows={2}
                  placeholder="Explicit and implicit messages about what matters (production targets, safety first, cost control, etc.)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  How were production vs. safety decisions communicated?
                </label>
                <textarea
                  value={formData.leadershipProductionSafety}
                  onChange={(e) => setFormData({...formData, leadershipProductionSafety: e.target.value})}
                  className="w-full border rounded p-3"
                  rows={2}
                  placeholder="When conflicts arose between production and safety, what guidance was given?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  What was the response to previous similar issues?
                </label>
                <textarea
                  value={formData.leadershipPreviousResponse}
                  onChange={(e) => setFormData({...formData, leadershipPreviousResponse: e.target.value})}
                  className="w-full border rounded p-3"
                  rows={2}
                  placeholder="How did leadership respond to previous incidents, concerns raised, or near-misses?"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !formData.actionType}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Complete HOP Assessment
              </>
            )}
          </button>
        </div>

        {/* Note about removed sections */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> System improvements and recommendations should be documented in the 
            <strong> Recommendations</strong> step (Step 5) after all causal factors are fully understood.
            Disciplinary decisions are outside the scope of investigation and should be handled separately by HR.
          </p>
        </div>
      </div>
    </div>
  );
}
