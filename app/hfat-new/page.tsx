'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, CheckCircle, ChevronDown, ChevronRight, Users, Target, Building2, Scale, AlertTriangle } from 'lucide-react';

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

  // IOGP 621 Categories
  const iogpCategories = {
    individual: {
      icon: Users,
      label: 'Individual Factors (IOGP 621: 4.2.1)',
      items: [
        { id: 'physical_health', label: 'Physical Health', tooltip: 'Physical condition affecting performance' },
        { id: 'mental_health', label: 'Mental Health/Psychological State', tooltip: 'Mental wellbeing and psychological factors' },
        { id: 'fatigue', label: 'Fatigue', tooltip: 'Tiredness, alertness levels' },
        { id: 'workload', label: 'Workload', tooltip: 'Demands on the individual' },
        { id: 'competence', label: 'Competence/Training', tooltip: 'Skills and training adequacy' },
        { id: 'motivation', label: 'Motivation', tooltip: 'Drive and engagement with task' }
      ]
    },
    task: {
      icon: Target,
      label: 'Task/Work Factors (IOGP 621: 4.2.2)',
      items: [
        { id: 'task_design', label: 'Task Design', tooltip: 'How the task was structured' },
        { id: 'procedures', label: 'Procedures/Instructions', tooltip: 'Quality and availability of procedures' },
        { id: 'tools_equipment', label: 'Tools & Equipment', tooltip: 'Adequacy of tools and equipment' },
        { id: 'workplace_design', label: 'Workplace Design', tooltip: 'Layout and design of workspace' },
        { id: 'environmental_conditions', label: 'Environmental Conditions', tooltip: 'Temperature, noise, lighting, etc.' },
        { id: 'communication', label: 'Communication', tooltip: 'Information exchange effectiveness' },
        { id: 'teamwork', label: 'Teamwork', tooltip: 'Team collaboration and coordination' }
      ]
    },
    organizational: {
      icon: Building2,
      label: 'Organizational Factors (IOGP 621: 4.2.3)',
      items: [
        { id: 'safety_culture', label: 'Safety Culture', tooltip: 'Organizational safety culture and values' },
        { id: 'work_pressure', label: 'Work Pressure', tooltip: 'Production vs safety pressures' },
        { id: 'supervision', label: 'Supervision', tooltip: 'Quality of supervision and oversight' },
        { id: 'management_systems', label: 'Management Systems', tooltip: 'SMS, permits, MOC, etc.' },
        { id: 'organizational_change', label: 'Organizational Change', tooltip: 'Recent changes affecting work' },
        { id: 'resources', label: 'Resources', tooltip: 'Adequacy of resources (people, time, equipment)' },
        { id: 'contractor_management', label: 'Contractor Management', tooltip: 'Management of contractors' }
      ]
    }
  };

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
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

  const updateRating = (category: string, itemId: string, rating: number) => {
    setRatings(prev => ({
      ...prev,
      [`${category}_${itemId}`]: rating
    }));
  };

  const updateNotes = (category: string, itemId: string, value: string) => {
    setNotes(prev => ({
      ...prev,
      [`${category}_${itemId}`]: value
    }));
  };

  const getRatingColor = (rating: number) => {
    if (rating === 0) return 'bg-gray-200';
    if (rating <= 2) return 'bg-green-500';
    if (rating <= 3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRatingLabel = (rating: number) => {
    if (rating === 0) return 'Not Rated';
    if (rating === 1) return 'Not a Factor';
    if (rating === 2) return 'Minor Factor';
    if (rating === 3) return 'Moderate Factor';
    if (rating === 4) return 'Significant Factor';
    if (rating === 5) return 'Major Factor';
    return '';
  };

  const handleSave = () => {
    console.log('Saving HFAT Assessment:', { ratings, notes, justCulture });
    alert('HFAT Assessment saved successfully!');
  };

  const handleComplete = () => {
    console.log('Completing HFAT Assessment:', { ratings, notes, justCulture });
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

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Rating Scale</h3>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <span className="text-slate-700">0 - Not Rated</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-slate-700">1-2 - Not/Minor Factor</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-slate-700">3 - Moderate Factor</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-slate-700">4-5 - Significant/Major Factor</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(iogpCategories).map(([categoryKey, category]) => {
            const Icon = category.icon;
            const isExpanded = expandedCategories[categoryKey];
            
            return (
              <div key={categoryKey} className="bg-white rounded-lg shadow-sm border-2 border-slate-200">
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
                  <div className="px-4 pb-4 space-y-4 border-t border-slate-200">
                    {category.items.map(item => {
                      const ratingKey = `${categoryKey}_${item.id}`;
                      const currentRating = ratings[ratingKey] || 0;
                      
                      return (
                        <div key={item.id} className="pt-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-slate-900 text-sm">{item.label}</h3>
                                {item.tooltip && (
                                  <div className="group relative">
                                    <AlertTriangle className="w-4 h-4 text-slate-400 cursor-help" />
                                    <div className="absolute hidden group-hover:block z-10 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg left-6 -top-2">
                                      {item.tooltip}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="mt-2">
                                <div className="flex items-center gap-2">
                                  {[0, 1, 2, 3, 4, 5].map(rating => (
                                    <button
                                      key={rating}
                                      onClick={() => updateRating(categoryKey, item.id, rating)}
                                      className={`w-9 h-9 rounded border-2 transition-all text-xs font-semibold ${
                                        currentRating === rating
                                          ? `${getRatingColor(rating)} border-slate-900 ${rating === 0 ? 'text-slate-600' : 'text-white'}`
                                          : 'bg-white border-slate-300 hover:border-slate-400 text-slate-600'
                                      }`}
                                    >
                                      {rating}
                                    </button>
                                  ))}
                                  <span className={`ml-2 text-xs font-medium px-2 py-1 rounded ${
                                    currentRating > 0 ? getRatingColor(currentRating) + ' text-white' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {getRatingLabel(currentRating)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {currentRating > 0 && (
                            <div className="mt-3">
                              <label className="block text-xs font-medium text-slate-700 mb-1">
                                Notes / Evidence
                              </label>
                              <textarea
                                value={notes[ratingKey] || ''}
                                onChange={(e) => updateNotes(categoryKey, item.id, e.target.value)}
                                rows={2}
                                placeholder="Describe how this factor contributed..."
                                className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Just Culture Assessment */}
          <div className="bg-white rounded-lg shadow-sm border-2 border-slate-200">
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

        <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 mt-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Assessment Progress</h3>
          <div className="text-sm text-slate-700">
            <p>Rated Factors: {Object.values(ratings).filter(r => r > 0).length} / {
              Object.values(iogpCategories).reduce((sum, cat) => sum + cat.items.length, 0)
            }</p>
            <p className="mt-1">
              Significant Factors (4-5): {Object.values(ratings).filter(r => r >= 4).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
