'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, CheckCircle, ChevronDown, ChevronRight, Users, Target, Building2, Scale, HelpCircle } from 'lucide-react';

export default function HFATAssessment() {
  const router = useRouter();
  
  const investigation = {
    id: 'inv-001',
    number: 'INV-2026-001',
    description: 'Pressure relief valve failure during startup'
  };

  const causalFactor = {
    id: 'cf-003',
    title: 'Operator did not recognize early pressure trend deviation',
    description: 'Pressure began trending above normal 45 minutes before alarm'
  };

  const iogpCategories = {
    individual: {
      icon: Users,
      label: 'Individual Factors (IOGP 621: 4.2.1)',
      items: [
        { 
          id: 'fatigue', 
          label: 'Fatigue / Alertness', 
          reference: 'IOGP 4.2.1.1 | TapRooT®: Human Performance',
          tooltip: 'Consider work schedules, shift patterns, rest periods, and whether the individual was adequately rested and alert for the task.'
        },
        { 
          id: 'competency', 
          label: 'Competency / Training', 
          reference: 'IOGP 4.2.1.2 | TapRooT®: Training Deficiency',
          tooltip: 'Consider whether training and competency assessment was adequate for the task requirements.'
        },
        { 
          id: 'awareness', 
          label: 'Situational Awareness', 
          reference: 'IOGP 4.2.1.3 | TapRooT®: Management System',
          tooltip: 'Consider whether the individual had adequate awareness of the situation and potential hazards.'
        },
        { 
          id: 'stress', 
          label: 'Stress / Workload', 
          reference: '',
          tooltip: 'Consider mental and physical workload, time pressure, and stress factors.'
        }
      ]
    },
    task: {
      icon: Target,
      label: 'Task/Work Factors (IOGP 621: 4.2.2)',
      items: [
        { 
          id: 'task_design', 
          label: 'Task Design / Complexity', 
          reference: 'IOGP 4.2.2.1',
          tooltip: 'Consider whether the task was appropriately designed and complexity was manageable.'
        },
        { 
          id: 'procedures', 
          label: 'Procedures / Work Instructions', 
          reference: 'IOGP 4.2.2.2',
          tooltip: 'Consider availability, quality, and usability of procedures and instructions.'
        },
        { 
          id: 'communication', 
          label: 'Communication', 
          reference: 'IOGP 4.2.2.3',
          tooltip: 'Consider effectiveness of communication between team members and with management.'
        },
        { 
          id: 'tools', 
          label: 'Tools & Equipment', 
          reference: 'IOGP 4.2.2.4',
          tooltip: 'Consider adequacy and availability of tools and equipment for the task.'
        },
        { 
          id: 'environment', 
          label: 'Work Environment', 
          reference: 'IOGP 4.2.2.5',
          tooltip: 'Consider physical environment: lighting, noise, temperature, space, etc.'
        }
      ]
    },
    organizational: {
      icon: Building2,
      label: 'Organizational Factors (IOGP 621: 4.2.3)',
      items: [
        { 
          id: 'resources', 
          label: 'Resources / Staffing', 
          reference: 'IOGP 4.2.3.1',
          tooltip: 'Consider adequacy of resources including staffing levels, time, and budget.'
        },
        { 
          id: 'culture', 
          label: 'Safety Culture / Leadership', 
          reference: 'IOGP 4.2.3.2',
          tooltip: 'Consider organizational safety culture and leadership commitment to safety.'
        },
        { 
          id: 'planning', 
          label: 'Planning / Risk Assessment', 
          reference: 'IOGP 4.2.3.3',
          tooltip: 'Consider quality of planning and risk assessment processes.'
        },
        { 
          id: 'management', 
          label: 'Management Systems', 
          reference: 'IOGP 4.2.3.4',
          tooltip: 'Consider effectiveness of management systems (permits, MOC, etc.).'
        },
        { 
          id: 'supervision', 
          label: 'Supervision / Oversight', 
          reference: 'IOGP 4.2.3.5',
          tooltip: 'Consider adequacy of supervision and oversight during work.'
        }
      ]
    }
  };

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [factorData, setFactorData] = useState<Record<string, { classification: string; description: string }>>({});
  const [showJustCulture, setShowJustCulture] = useState(false);
  const [justCulture, setJustCulture] = useState({
    classification: '',
    justification: '',
    responseActions: ''
  });

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const updateClassification = (category: string, itemId: string, classification: string) => {
    const key = `${category}_${itemId}`;
    setFactorData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        classification,
        description: prev[key]?.description || ''
      }
    }));
  };

  const updateDescription = (category: string, itemId: string, description: string) => {
    const key = `${category}_${itemId}`;
    setFactorData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        classification: prev[key]?.classification || '',
        description
      }
    }));
  };

  const handleSave = () => {
    console.log('Saving HFAT Assessment:', { factorData, justCulture });
    alert('HFAT Assessment saved successfully!');
  };

  const handleComplete = () => {
    console.log('Completing HFAT Assessment:', { factorData, justCulture });
    alert('HFAT Assessment completed! Returning to causal analysis...');
    router.push('/step4');
  };

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
                HFAT Assessment
              </h1>
              <p className="text-sm text-slate-600">
                Human Factors Analysis Tool (IOGP 621)
              </p>
              <div className="mt-2 text-sm">
                <span className="text-slate-500">Investigation:</span>{' '}
                <span className="font-medium text-slate-700">{investigation.number}</span>
              </div>
              <div className="text-sm">
                <span className="text-slate-500">Causal Factor:</span>{' '}
                <span className="font-medium text-slate-700">{causalFactor.title}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Draft
              </button>
              <button
                onClick={handleComplete}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Complete Assessment
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(iogpCategories).map(([categoryKey, category]) => {
            const Icon = category.icon;
            const isExpanded = expandedCategories[categoryKey];
            
            return (
              <div key={categoryKey} className="bg-white rounded-lg shadow-sm border border-slate-200">
                <button
                  onClick={() => toggleCategory(categoryKey)}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-slate-700" />
                    <h2 className="text-base font-semibold text-slate-900">{category.label}</h2>
                  </div>
                  {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-6 border-t border-slate-200">
                    {category.items.map(item => {
                      const key = `${categoryKey}_${item.id}`;
                      const data = factorData[key] || { classification: '', description: '' };
                      
                      return (
                        <div key={item.id} className="pt-6 border-l-4 border-blue-500 pl-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-slate-900">{item.label}</h3>
                                {item.tooltip && (
                                  <div className="group relative">
                                    <HelpCircle className="w-4 h-4 text-blue-500 cursor-help" />
                                    <div className="absolute hidden group-hover:block z-10 w-80 p-3 bg-gray-900 text-white text-xs rounded shadow-lg left-6 -top-2">
                                      {item.tooltip}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {item.reference && (
                                <p className="text-xs text-slate-500 mb-3">{item.reference}</p>
                              )}
                              
                              <div className="flex gap-2 mb-3">
                                <button
                                  onClick={() => updateClassification(categoryKey, item.id, 'contributing')}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    data.classification === 'contributing'
                                      ? 'bg-orange-100 text-orange-800 border-2 border-orange-400'
                                      : 'bg-slate-100 text-slate-700 border-2 border-slate-300 hover:bg-slate-200'
                                  }`}
                                >
                                  Contributing
                                </button>
                                <button
                                  onClick={() => updateClassification(categoryKey, item.id, 'causal')}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    data.classification === 'causal'
                                      ? 'bg-red-100 text-red-800 border-2 border-red-400'
                                      : 'bg-slate-100 text-slate-700 border-2 border-slate-300 hover:bg-slate-200'
                                  }`}
                                >
                                  Causal
                                </button>
                              </div>

                              <textarea
                                value={data.description}
                                onChange={(e) => updateDescription(categoryKey, item.id, e.target.value)}
                                rows={3}
                                placeholder="Describe how this factor contributed..."
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Just Culture Assessment */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <button
              onClick={() => setShowJustCulture(!showJustCulture)}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Scale className="w-5 h-5 text-slate-700" />
                <h2 className="text-base font-semibold text-slate-900">Just Culture Assessment</h2>
              </div>
              {showJustCulture ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
            </button>

            {showJustCulture && (
              <div className="px-4 pb-4 space-y-4 border-t border-slate-200 pt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Classification
                  </label>
                  <select
                    value={justCulture.classification}
                    onChange={(e) => setJustCulture({...justCulture, classification: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Select classification...</option>
                    <option value="human_error">Human Error (unintentional)</option>
                    <option value="at_risk">At-Risk Behavior (risk not recognized or believed justified)</option>
                    <option value="reckless">Reckless Behavior (conscious disregard of risk)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Justification
                  </label>
                  <textarea
                    value={justCulture.justification}
                    onChange={(e) => setJustCulture({...justCulture, justification: e.target.value})}
                    rows={3}
                    placeholder="Explain the reasoning for this classification..."
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Response Actions
                  </label>
                  <textarea
                    value={justCulture.responseActions}
                    onChange={(e) => setJustCulture({...justCulture, responseActions: e.target.value})}
                    rows={3}
                    placeholder="What response is appropriate? (Console, coach, or punish)"
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-amber-900 mb-1">Just Culture Guide</h4>
                  <ul className="text-xs text-amber-800 space-y-1">
                    <li><strong>Human Error:</strong> Console - unintentional mistake, focus on system improvements</li>
                    <li><strong>At-Risk:</strong> Coach - risk not recognized or believed necessary, focus on awareness</li>
                    <li><strong>Reckless:</strong> Punish - conscious disregard of substantial risk</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
