'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, CheckCircle, ChevronDown, ChevronRight, Users, Brain, Building2, GraduationCap, MessageSquare, MapPin, AlertTriangle, Target, Settings } from 'lucide-react';

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

  const humanFactorsCategories = {
    individual: {
      icon: Users,
      color: 'blue',
      label: 'Individual Factors',
      items: [
        { id: 'attention', label: 'Attention/Distraction', tooltip: 'Was attention divided? Were there distractions?' },
        { id: 'fatigue', label: 'Fatigue/Alertness', tooltip: 'Was the person fatigued? Time of day effects?' },
        { id: 'stress', label: 'Stress/Pressure', tooltip: 'Was there time pressure or stress?' },
        { id: 'capability', label: 'Physical/Mental Capability', tooltip: 'Did the person have the capability to perform?' },
        { id: 'attitude', label: 'Attitude/Motivation', tooltip: 'What was their mindset and motivation?' },
        { id: 'perception', label: 'Perception/Situation Awareness', tooltip: 'Did they perceive the situation correctly?' }
      ]
    },
    team: {
      icon: MessageSquare,
      color: 'green',
      label: 'Team/Social Factors',
      items: [
        { id: 'communication', label: 'Communication', tooltip: 'Was communication clear and effective?' },
        { id: 'teamwork', label: 'Teamwork/Coordination', tooltip: 'Did the team work together effectively?' },
        { id: 'supervision', label: 'Supervision/Leadership', tooltip: 'Was supervision adequate?' },
        { id: 'norms', label: 'Group Norms/Culture', tooltip: 'What were the accepted practices?' }
      ]
    },
    task: {
      icon: Target,
      color: 'purple',
      label: 'Task/Procedure Factors',
      items: [
        { id: 'complexity', label: 'Task Complexity', tooltip: 'How complex was the task?' },
        { id: 'procedures', label: 'Procedures/Guidance', tooltip: 'Were procedures clear and available?' },
        { id: 'workload', label: 'Workload', tooltip: 'Was workload manageable?' },
        { id: 'time', label: 'Time Available', tooltip: 'Was there adequate time?' }
      ]
    },
    environment: {
      icon: MapPin,
      color: 'amber',
      label: 'Work Environment',
      items: [
        { id: 'workspace', label: 'Workspace Design', tooltip: 'Was the workspace well-designed?' },
        { id: 'lighting', label: 'Lighting/Visibility', tooltip: 'Could they see what they needed?' },
        { id: 'noise', label: 'Noise/Distractions', tooltip: 'Was noise a factor?' },
        { id: 'conditions', label: 'Environmental Conditions', tooltip: 'Temperature, weather, etc.' }
      ]
    },
    equipment: {
      icon: Settings,
      color: 'red',
      label: 'Equipment/Interface',
      items: [
        { id: 'design', label: 'Equipment Design', tooltip: 'Was equipment well-designed for the task?' },
        { id: 'displays', label: 'Displays/Indicators', tooltip: 'Were displays clear and effective?' },
        { id: 'controls', label: 'Controls/Inputs', tooltip: 'Were controls intuitive?' },
        { id: 'alarms', label: 'Alarms/Warnings', tooltip: 'Were alarms effective?' }
      ]
    },
    organization: {
      icon: Building2,
      color: 'slate',
      label: 'Organizational Factors',
      items: [
        { id: 'training', label: 'Training/Competence', tooltip: 'Was training adequate?' },
        { id: 'resources', label: 'Resources/Staffing', tooltip: 'Were resources sufficient?' },
        { id: 'culture', label: 'Safety Culture', tooltip: 'What was the safety culture?' },
        { id: 'planning', label: 'Planning/Preparation', tooltip: 'Was work well-planned?' },
        { id: 'management', label: 'Management Systems', tooltip: 'Were management systems effective?' }
      ]
    }
  };

  const [expandedCategories, setExpandedCategories] = useState({});
  const [ratings, setRatings] = useState({});
  const [notes, setNotes] = useState({});

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
    console.log('Saving HFAT Assessment:', { ratings, notes });
    alert('HFAT Assessment saved successfully!');
  };

  const handleComplete = () => {
    console.log('Completing HFAT Assessment:', { ratings, notes });
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
                Human Factors Analysis Tool
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
          {Object.entries(humanFactorsCategories).map(([categoryKey, category]) => {
            const Icon = category.icon;
            const isExpanded = expandedCategories[categoryKey];
            
            return (
              <div key={categoryKey} className="bg-white rounded-lg shadow-sm border border-slate-200">
                <button
                  onClick={() => toggleCategory(categoryKey)}
                  className={`w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors rounded-lg`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 text-${category.color}-600`} />
                    <h2 className="text-lg font-semibold text-slate-900">{category.label}</h2>
                  </div>
                  {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4">
                    {category.items.map(item => {
                      const ratingKey = `${categoryKey}_${item.id}`;
                      const currentRating = ratings[ratingKey] || 0;
                      
                      return (
                        <div key={item.id} className="border-t border-slate-200 pt-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-slate-900">{item.label}</h3>
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
                                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                                        currentRating === rating
                                          ? `${getRatingColor(rating)} border-slate-900`
                                          : 'bg-white border-slate-300 hover:border-slate-400'
                                      }`}
                                    >
                                      <span className={`text-sm font-medium ${currentRating === rating ? 'text-white' : 'text-slate-600'}`}>
                                        {rating}
                                      </span>
                                    </button>
                                  ))}
                                  <span className={`ml-3 text-sm font-medium px-3 py-1 rounded ${
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
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Notes / Evidence
                              </label>
                              <textarea
                                value={notes[ratingKey] || ''}
                                onChange={(e) => updateNotes(categoryKey, item.id, e.target.value)}
                                rows={2}
                                placeholder="Describe how this factor contributed to the incident..."
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
        </div>

        <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 mt-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Assessment Progress</h3>
          <div className="text-sm text-slate-700">
            <p>Rated Factors: {Object.values(ratings).filter(r => r > 0).length} / {
              Object.values(humanFactorsCategories).reduce((sum, cat) => sum + cat.items.length, 0)
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
