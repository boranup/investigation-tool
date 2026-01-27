'use client'

import React, { useState } from 'react';
import { Lightbulb, Plus, Edit2, Trash2, Filter, Target, Calendar, Users, Shield } from 'lucide-react';

export default function RecommendationsDevelopment() {
  const [showAddRecommendation, setShowAddRecommendation] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const investigation = {
    number: 'INV-2026-001',
    description: 'Pressure relief valve failure during startup'
  };

  const controlTypes = [
    { 
      value: 'elimination', 
      label: 'Elimination', 
      description: 'Physically remove the hazard',
      rank: 1,
      color: 'bg-green-600'
    },
    { 
      value: 'substitution', 
      label: 'Substitution', 
      description: 'Replace with less hazardous alternative',
      rank: 2,
      color: 'bg-green-500'
    },
    { 
      value: 'engineering', 
      label: 'Engineering Controls', 
      description: 'Isolate people from hazard',
      rank: 3,
      color: 'bg-blue-500'
    },
    { 
      value: 'administrative', 
      label: 'Administrative Controls', 
      description: 'Change work practices/procedures',
      rank: 4,
      color: 'bg-orange-500'
    },
    { 
      value: 'ppe', 
      label: 'PPE', 
      description: 'Protect the worker',
      rank: 5,
      color: 'bg-red-500'
    }
  ];

  const [recommendations, setRecommendations] = useState([
    {
      id: '1',
      title: 'Implement automated valve testing program',
      description: 'Install automated testing system to verify PSV lift pressure every 6 months without manual intervention',
      linkedCausalFactors: ['cf-004'],
      controlType: 'engineering',
      priority: 'high',
      responsibility: 'Maintenance Manager',
      targetDate: '2026-04-01',
      estimatedCost: 'Medium',
      status: 'proposed'
    },
    {
      id: '2',
      title: 'Enhance DCS alarm configuration',
      description: 'Add predictive pressure trend alarm at 10% below relief set point with escalating notifications',
      linkedCausalFactors: ['cf-003'],
      controlType: 'engineering',
      priority: 'high',
      responsibility: 'Instrumentation Lead',
      targetDate: '2026-03-15',
      estimatedCost: 'Low',
      status: 'proposed'
    },
    {
      id: '3',
      title: 'Update operator training on trend monitoring',
      description: 'Develop and deliver training module on recognizing early deviation trends and intervention protocols',
      linkedCausalFactors: ['cf-003'],
      controlType: 'administrative',
      priority: 'medium',
      responsibility: 'Training Coordinator',
      targetDate: '2026-05-01',
      estimatedCost: 'Low',
      status: 'proposed'
    }
  ]);

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-100 text-red-700 border-red-200',
      medium: 'bg-amber-100 text-amber-700 border-amber-200',
      low: 'bg-green-100 text-green-700 border-green-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getControlTypeInfo = (type: string) => {
    return controlTypes.find(ct => ct.value === type);
  };

  const deleteRecommendation = (id: string) => {
    if (confirm('Delete this recommendation?')) {
      setRecommendations(recommendations.filter(r => r.id !== id));
    }
  };

  const filteredRecommendations = recommendations.filter(rec => {
    const matchesType = filterType === 'all' || rec.controlType === filterType;
    const matchesPriority = filterPriority === 'all' || rec.priority === filterPriority;
    return matchesType && matchesPriority;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Step 5: Recommendations</h1>
              <p className="text-slate-600 mt-1">Develop corrective and preventive actions</p>
              <div className="mt-2 text-sm">
                <span className="text-slate-500">Investigation:</span>{' '}
                <span className="font-medium text-slate-700">{investigation.number}</span>
                {' - '}
                <span className="text-slate-600">{investigation.description}</span>
              </div>
            </div>
            <button
              onClick={() => setShowAddRecommendation(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Recommendation
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-600" />
              <label className="text-sm font-medium text-slate-700">Control Type:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-slate-300 rounded px-3 py-1 text-sm"
              >
                <option value="all">All Types</option>
                {controlTypes.map(ct => (
                  <option key={ct.value} value={ct.value}>{ct.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Priority:</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="border border-slate-300 rounded px-3 py-1 text-sm"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="ml-auto text-sm text-slate-600">
              {filteredRecommendations.length} recommendation(s)
            </div>
          </div>
        </div>

        {/* Recommendations List */}
        <div className="space-y-4">
          {filteredRecommendations.map((rec) => {
            const controlInfo = getControlTypeInfo(rec.controlType);
            
            return (
              <div key={rec.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <Lightbulb className="w-5 h-5 text-amber-500 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-slate-900 mb-2">{rec.title}</h3>
                        <p className="text-slate-600 text-sm mb-3">{rec.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(rec.priority)}`}>
                            {rec.priority.toUpperCase()} Priority
                          </span>
                          {controlInfo && (
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full ${controlInfo.color}`} />
                              <span className="text-xs font-medium text-slate-700">
                                {controlInfo.label} (Rank {controlInfo.rank})
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Users className="w-4 h-4" />
                            <div>
                              <div className="text-xs text-slate-500">Responsibility</div>
                              <div className="font-medium">{rec.responsibility}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Calendar className="w-4 h-4" />
                            <div>
                              <div className="text-xs text-slate-500">Target Date</div>
                              <div className="font-medium">{rec.targetDate}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Target className="w-4 h-4" />
                            <div>
                              <div className="text-xs text-slate-500">Cost Estimate</div>
                              <div className="font-medium">{rec.estimatedCost}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Shield className="w-4 h-4" />
                            <div>
                              <div className="text-xs text-slate-500">Status</div>
                              <div className="font-medium capitalize">{rec.status}</div>
                            </div>
                          </div>
                        </div>

                        {rec.linkedCausalFactors.length > 0 && (
                          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                            <span>Addresses:</span>
                            {rec.linkedCausalFactors.map((cf, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200">
                                {cf}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit recommendation"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteRecommendation(rec.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete recommendation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredRecommendations.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <Lightbulb className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Recommendations Yet</h3>
            <p className="text-slate-600 mb-4">Start developing corrective and preventive actions</p>
            <button
              onClick={() => setShowAddRecommendation(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add First Recommendation
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Previous Step
          </button>
          <button
            onClick={() => alert('Investigation complete! Generate final report.')}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Complete Investigation
          </button>
        </div>
      </div>

      {/* Add Recommendation Modal */}
      {showAddRecommendation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add Recommendation</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Recommendation Title *
                </label>
                <input
                  type="text"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  placeholder="Brief description of the recommendation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Detailed Description *
                </label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  rows={4}
                  placeholder="Provide detailed explanation of what should be done..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Control Type (Hierarchy of Controls) *
                </label>
                <select className="w-full border border-slate-300 rounded-lg px-4 py-2">
                  <option value="">Select control type...</option>
                  {controlTypes.map((ct, idx) => (
                    <option key={ct.value} value={ct.value}>
                      {idx + 1}. {ct.label} - {ct.description}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Select from most effective (1. Elimination) to least effective (5. PPE)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Priority *
                  </label>
                  <select className="w-full border border-slate-300 rounded-lg px-4 py-2">
                    <option value="">Select priority...</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Cost Estimate
                  </label>
                  <select className="w-full border border-slate-300 rounded-lg px-4 py-2">
                    <option value="">Select cost range...</option>
                    <option value="Low">Low (&lt;$10k)</option>
                    <option value="Medium">Medium ($10k-$100k)</option>
                    <option value="High">High (&gt;$100k)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Responsible Party
                  </label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2"
                    placeholder="Department or role"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Target Completion Date
                  </label>
                  <input
                    type="date"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddRecommendation(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Recommendation
              </button>
              <button
                onClick={() => setShowAddRecommendation(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
