'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, CheckCircle, ChevronDown, ChevronRight, Users, Brain, Shield, HelpCircle } from 'lucide-react';
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

export default function HFATAssessment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const investigationId = searchParams.get('investigationId');
  const causalFactorId = searchParams.get('causalFactorId');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [investigation, setInvestigation] = useState<any>(null);
  const [causalFactor, setCausalFactor] = useState<any>(null);

  // Track which sections are expanded
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    individual: true,
    task: false,
    organizational: false
  });

  const [showJustCulture, setShowJustCulture] = useState(false);

  // Store ratings and notes for each factor
  const [humanFactors, setHumanFactors] = useState<Record<string, { rating: string; notes: string }>>({});

  // Just Culture assessment
  const [justCulture, setJustCulture] = useState({
    classification: '',
    justification: '',
    responseActions: ''
  });

  const factorCategories = {
    individual: {
      title: "Individual Factors (IOGP 621: 4.2.1)",
      icon: <Users className="w-5 h-5" />,
      items: [
        {
          id: 'fatigue',
          label: 'Fatigue / Alertness',
          iogp: '4.2.1.1',
          tooltip: 'Consider work schedules, shift patterns, rest periods, and whether the individual was adequately rested and alert for the task.'
        },
        {
          id: 'competency',
          label: 'Competency / Training',
          iogp: '4.2.1.2',
          tooltip: 'Assess if the person had appropriate qualifications, training, and experience for the task they were performing.'
        },
        {
          id: 'situational',
          label: 'Situational Awareness',
          iogp: '4.2.1.3',
          tooltip: 'Evaluate whether the individual understood the current situation, recognized hazards, and anticipated potential consequences.'
        },
        {
          id: 'stress',
          label: 'Stress / Workload',
          iogp: '4.2.1.4',
          tooltip: 'Consider time pressure, task complexity, mental/physical demands, and any personal or organizational stressors present.'
        },
        {
          id: 'health',
          label: 'Physical/Mental Health',
          iogp: '4.2.1.5',
          tooltip: 'Assess whether physical fitness, mental wellbeing, medication, or health conditions affected the individual\'s performance.'
        }
      ]
    },
    task: {
      title: "Task/Work Factors (IOGP 621: 4.2.2)",
      icon: <Brain className="w-5 h-5" />,
      items: [
        {
          id: 'procedure',
          label: 'Procedure Quality',
          iogp: '4.2.2.1',
          tooltip: 'Evaluate if procedures were available, accurate, easy to follow, and appropriate for the actual working conditions.'
        },
        {
          id: 'complexity',
          label: 'Task Complexity',
          iogp: '4.2.2.2',
          tooltip: 'Consider the number of steps, decision points, simultaneous activities, and cognitive demands required by the task.'
        },
        {
          id: 'time',
          label: 'Time Pressure',
          iogp: '4.2.2.3',
          tooltip: 'Assess whether deadlines, production targets, or scheduling created pressure that affected decision-making or performance.'
        },
        {
          id: 'tools',
          label: 'Tools/Equipment Design',
          iogp: '4.2.2.4',
          tooltip: 'Evaluate if tools and equipment were fit for purpose, properly maintained, ergonomically designed, and had adequate safety features.'
        },
        {
          id: 'communication',
          label: 'Communication',
          iogp: '4.2.2.5',
          tooltip: 'Consider clarity of instructions, handovers, team coordination, language barriers, and effectiveness of information exchange.'
        }
      ]
    },
    organizational: {
      title: "Organizational Factors (IOGP 621: 4.2.3)",
      icon: <Shield className="w-5 h-5" />,
      items: [
        {
          id: 'culture',
          label: 'Safety Culture',
          iogp: '4.2.3.1',
          tooltip: 'Assess organizational attitudes toward safety, reporting culture, management commitment, and whether safety is prioritized over production.'
        },
        {
          id: 'resources',
          label: 'Resource Allocation',
          iogp: '4.2.3.2',
          tooltip: 'Evaluate if adequate people, equipment, time, and budget were provided to complete the work safely and effectively.'
        },
        {
          id: 'supervision',
          label: 'Supervision/Leadership',
          iogp: '4.2.3.3',
          tooltip: 'Consider quality of oversight, leadership presence, supervisor competence, and whether appropriate guidance was available when needed.'
        },
        {
          id: 'planning',
          label: 'Work Planning',
          iogp: '4.2.3.4',
          tooltip: 'Assess whether the work was properly planned, hazards identified, controls implemented, and coordination with other activities considered.'
        },
        {
          id: 'change',
          label: 'Change Management',
          iogp: '4.2.3.5',
          tooltip: 'Evaluate if changes to equipment, procedures, personnel, or conditions were properly assessed, communicated, and controlled.'
        }
      ]
    }
  };

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

        // Load existing HFAT assessment
        const { data: hfatData } = await supabase
          .from('hfat_assessments')
          .select('*')
          .eq('causal_factor_id', causalFactorId)
          .single();

        if (hfatData && hfatData.notes) {
          setHumanFactors(hfatData.notes.humanFactors || {});
          setJustCulture(hfatData.notes.justCulture || {
            classification: '',
            justification: '',
            responseActions: ''
          });
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const updateHumanFactor = (category: string, itemId: string, rating: string) => {
    const key = `${category}_${itemId}`;
    setHumanFactors(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        rating: prev[key]?.rating === rating ? '' : rating, // Toggle off if clicking same button
        notes: prev[key]?.notes || ''
      }
    }));
  };

  const updateFactorNotes = (category: string, itemId: string, notes: string) => {
    const key = `${category}_${itemId}`;
    setHumanFactors(prev => ({
      ...prev,
      [key]: {
        rating: prev[key]?.rating || '',
        notes: notes
      }
    }));
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
          humanFactors: humanFactors,
          justCulture: justCulture
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
        const { error } = await supabase
          .from('hfat_assessments')
          .update(assessmentData)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hfat_assessments')
          .insert([assessmentData]);
        if (error) throw error;
      }

      // Update causal factor status
      await supabase
        .from('causal_factors')
        .update({ analysis_status: 'analysis_complete' })
        .eq('id', causalFactorId);

      alert('HFAT Assessment completed!');
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
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push(`/step4?investigationId=${investigationId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Causal Analysis
          </button>
          
          <div className="bg-white rounded-lg border p-4">
            <h1 className="text-2xl font-bold text-gray-900">HFAT Assessment</h1>
            <p className="text-sm text-gray-600 mt-1">Human Factors Analysis Tool | IOGP 621</p>
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

        {/* Factor Categories */}
        <div className="space-y-3">
          {Object.entries(factorCategories).map(([key, cat]) => (
            <div key={key} className="bg-white border rounded">
              <button
                onClick={() => toggleSection(key)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  {cat.icon}
                  <h4 className="font-semibold text-sm">{cat.title}</h4>
                </div>
                {expandedSections[key] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              
              {expandedSections[key] && (
                <div className="p-3 border-t space-y-3">
                  {cat.items.map(item => {
                    const factorKey = `${key}_${item.id}`;
                    const factor = humanFactors[factorKey];
                    
                    return (
                      <div key={item.id} className="border-l-4 border-blue-500 pl-3 py-2">
                        <div className="flex justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{item.label}</span>
                              <Tooltip text={item.tooltip}>
                                <HelpCircle className="w-4 h-4 text-blue-500" />
                              </Tooltip>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              IOGP: {item.iogp}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateHumanFactor(key, item.id, 'contributing')}
                              className={`px-3 py-1 text-xs rounded ${
                                factor?.rating === 'contributing'
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-orange-100 text-orange-700'
                              }`}
                            >
                              Contributing
                            </button>
                            <button
                              onClick={() => updateHumanFactor(key, item.id, 'causal')}
                              className={`px-3 py-1 text-xs rounded ${
                                factor?.rating === 'causal'
                                  ? 'bg-red-500 text-white'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              Causal
                            </button>
                          </div>
                        </div>
                        <textarea
                          value={factor?.notes || ''}
                          onChange={(e) => updateFactorNotes(key, item.id, e.target.value)}
                          className="w-full text-sm border rounded px-3 py-2"
                          rows={2}
                          placeholder="Describe how this factor contributed..."
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Just Culture Assessment */}
        <div className="bg-white border rounded">
          <button
            onClick={() => setShowJustCulture(!showJustCulture)}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <h4 className="font-semibold text-sm">Just Culture Assessment</h4>
            </div>
            {showJustCulture ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {showJustCulture && (
            <div className="p-3 border-t space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1 flex items-center gap-1">
                  Classification
                  <Tooltip text="Human Error: Unintended mistake anyone could make in same situation. At-Risk: Risky choice with unrecognized danger. Reckless: Deliberate disregard of known substantial risk.">
                    <HelpCircle className="w-3 h-3 text-blue-500" />
                  </Tooltip>
                </label>
                <select
                  value={justCulture.classification}
                  onChange={(e) => setJustCulture({ ...justCulture, classification: e.target.value })}
                  className="w-full border rounded px-2 py-1 text-sm"
                >
                  <option value="">Select...</option>
                  <option value="Human Error">Human Error - Unintended action, system focus</option>
                  <option value="At-Risk Behavior">At-Risk Behavior - Coaching & remove risk incentives</option>
                  <option value="Reckless Behavior">Reckless Behavior - Conscious disregard of risk</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Justification</label>
                <textarea
                  value={justCulture.justification}
                  onChange={(e) => setJustCulture({ ...justCulture, justification: e.target.value })}
                  className="w-full border rounded px-2 py-1 text-sm"
                  rows={2}
                  placeholder="Document reasoning and evidence for this classification..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Response Actions</label>
                <textarea
                  value={justCulture.responseActions}
                  onChange={(e) => setJustCulture({ ...justCulture, responseActions: e.target.value })}
                  className="w-full border rounded px-2 py-1 text-sm"
                  rows={2}
                  placeholder="Recommended actions based on classification (Console, coach, or punish)"
                />
              </div>
            </div>
          )}
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
