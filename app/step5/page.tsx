'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lightbulb, Plus, Edit2, Trash2, Filter, Target, Calendar, Users, Shield, CheckCircle, X, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import StepNavigation from '@/components/StepNavigation';

export default function RecommendationsDevelopment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const investigationId = searchParams.get('investigationId');

  const [showAddRecommendation, setShowAddRecommendation] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [saving, setSaving] = useState(false);
  const [editingRecommendationId, setEditingRecommendationId] = useState<string | null>(null);

  const [investigation, setInvestigation] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [causalFactors, setCausalFactors] = useState<any[]>([]);

  const [newRecommendation, setNewRecommendation] = useState({
    title: '',
    description: '',
    linkedFactors: [] as string[],
    controlType: 'engineering',
    priority: 'high',
    responsibility: '',
    targetDate: '',
    estimatedCost: 'Medium'
  });

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

  useEffect(() => {
    if (investigationId) {
      loadInvestigation();
      loadRecommendations();
      loadCausalFactors();
    }
  }, [investigationId]);

  const loadInvestigation = async () => {
    const { data } = await supabase
      .from('investigations')
      .select('*')
      .eq('id', investigationId)
      .single();
    
    setInvestigation(data);
  };

  const loadRecommendations = async () => {
    if (!investigationId) return;

    try {
      const { data, error } = await supabase
        .from('recommendations')
        .select('*')
        .eq('investigation_id', investigationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading recommendations:', error);
      } else {
        setRecommendations(data || []);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const loadCausalFactors = async () => {
    if (!investigationId) return;

    try {
      const { data, error } = await supabase
        .from('causal_factors')
        .select('*')
        .eq('investigation_id', investigationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading causal factors:', error);
      } else {
        setCausalFactors(data || []);
      }
    } catch (error) {
      console.error('Error loading causal factors:', error);
    }
  };

  // Auto-save handler for navigation - closes any open modals
  const handleBeforeNavigate = async (): Promise<boolean> => {
    setShowAddRecommendation(false);
    setEditingRecommendationId(null);
    return true; // Allow navigation
  };

  const handleAddRecommendation = async () => {
    if (!newRecommendation.title || !newRecommendation.description) {
      alert('Please fill in title and description');
      return;
    }

    if (!investigationId) {
      alert('No investigation selected');
      return;
    }

    setSaving(true);

    try {
      const recommendationData = {
        investigation_id: investigationId,
        title: newRecommendation.title,
        description: newRecommendation.description,
        linked_causal_factors: newRecommendation.linkedFactors,
        control_type: newRecommendation.controlType,
        priority: newRecommendation.priority,
        responsibility: newRecommendation.responsibility || null,
        target_date: newRecommendation.targetDate || null,
        estimated_cost: newRecommendation.estimatedCost,
        status: 'proposed'
      };

      if (editingRecommendationId) {
        // UPDATE existing recommendation
        const { error } = await supabase
          .from('recommendations')
          .update(recommendationData)
          .eq('id', editingRecommendationId);

        if (error) {
          console.error('Database error:', error);
          alert('Error updating recommendation');
          return;
        }

        alert('Recommendation updated successfully!');
      } else {
        // INSERT new recommendation
        const { data, error } = await supabase
          .from('recommendations')
          .insert([recommendationData])
          .select()
          .single();

        if (error) {
          console.error('Database error:', error);
          alert('Error saving recommendation');
          return;
        }

        // Add to local state
        setRecommendations([data, ...recommendations]);
        alert('Recommendation added successfully!');
      }

      // Reset form
      setNewRecommendation({
        title: '',
        description: '',
        linkedFactors: [],
        controlType: 'engineering',
        priority: 'high',
        responsibility: '',
        targetDate: '',
        estimatedCost: 'Medium'
      });
      setEditingRecommendationId(null);
      setShowAddRecommendation(false);
      loadRecommendations();
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving recommendation');
    } finally {
      setSaving(false);
    }
  };

  const deleteRecommendation = async (id: string) => {
    if (!confirm('Delete this recommendation?')) return;

    try {
      const { error } = await supabase
        .from('recommendations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting recommendation:', error);
        alert('Error deleting recommendation');
        return;
      }

      setRecommendations(recommendations.filter(r => r.id !== id));
      alert('Recommendation deleted');
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting recommendation');
    }
  };

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

  const filteredRecommendations = recommendations.filter(rec => {
    const matchesType = filterType === 'all' || rec.control_type === filterType;
    const matchesPriority = filterPriority === 'all' || rec.priority === filterPriority;
    return matchesType && matchesPriority;
  });

  const toggleFactorSelection = (factorId: string) => {
    setNewRecommendation(prev => ({
      ...prev,
      linkedFactors: prev.linkedFactors.includes(factorId)
        ? prev.linkedFactors.filter(id => id !== factorId)
        : [...prev.linkedFactors, factorId]
    }));
  };

  if (!investigationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No Investigation Selected</h2>
          <p className="text-slate-600">Please start from Step 1 to create an investigation.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {investigation && (
        <StepNavigation 
          investigationId={investigationId} 
          currentStep={5}
          investigationNumber={investigation.investigation_number}
          onBeforeNavigate={handleBeforeNavigate}
        />
      )}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Step 5: Recommendations</h1>
                <p className="text-slate-600 mt-1">Develop corrective and preventive actions</p>
                {investigation && (
                  <div className="mt-2 text-sm">
                    <span className="text-slate-500">Investigation:</span>{' '}
                    <span className="font-medium text-slate-700">{investigation.investigation_number}</span>
                    {' - '}
                    <span className="text-slate-600">{investigation.incident_description}</span>
                  </div>
                )}
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
            const controlInfo = getControlTypeInfo(rec.control_type);
            
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
                          {rec.responsibility && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <Users className="w-4 h-4" />
                              <div>
                                <div className="text-xs text-slate-500">Responsibility</div>
                                <div className="font-medium">{rec.responsibility}</div>
                              </div>
                            </div>
                          )}
                          {rec.target_date && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <Calendar className="w-4 h-4" />
                              <div>
                                <div className="text-xs text-slate-500">Target Date</div>
                                <div className="font-medium">{rec.target_date}</div>
                              </div>
                            </div>
                          )}
                          {rec.estimated_cost && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <Target className="w-4 h-4" />
                              <div>
                                <div className="text-xs text-slate-500">Cost Estimate</div>
                                <div className="font-medium">{rec.estimated_cost}</div>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-slate-600">
                            <Shield className="w-4 h-4" />
                            <div>
                              <div className="text-xs text-slate-500">Status</div>
                              <div className="font-medium capitalize">{rec.status}</div>
                            </div>
                          </div>
                        </div>

                        {rec.linked_causal_factors && rec.linked_causal_factors.length > 0 && (
                          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                            <span>Addresses:</span>
                            {rec.linked_causal_factors.map((cfId: string, idx: number) => {
                              const factor = causalFactors.find(cf => cf.id === cfId);
                              return (
                                <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200">
                                  {factor ? factor.causal_factor_title : cfId}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingRecommendationId(rec.id);
                        setNewRecommendation({
                          title: rec.title,
                          description: rec.description,
                          linkedFactors: rec.linked_causal_factors || [],
                          controlType: rec.control_type,
                          priority: rec.priority,
                          responsibility: rec.responsibility || '',
                          targetDate: rec.target_date || '',
                          estimatedCost: rec.estimated_cost
                        });
                        setShowAddRecommendation(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
            onClick={async () => {
              if (!investigationId) {
                alert('No investigation ID found');
                return;
              }
              
              if (confirm('Mark this investigation as complete? This will update the status and you can generate the final report.')) {
                try {
                  const { error } = await supabase
                    .from('investigations')
                    .update({ 
                      status: 'completed'
                    })
                    .eq('id', investigationId);

                  if (error) {
                    console.error('Error completing investigation:', error);
                    alert('Error updating investigation status: ' + error.message);
                  } else {
                    alert('Investigation marked as complete! Redirecting to report...');
                    router.push(`/report?investigationId=${investigationId}`);
                  }
                } catch (error: any) {
                  console.error('Error:', error);
                  alert('Error completing investigation: ' + error.message);
                }
              }
            }}
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{editingRecommendationId ? 'Edit Recommendation' : 'Add Recommendation'}</h2>
              <button
                onClick={() => {
                  setShowAddRecommendation(false);
                  setEditingRecommendationId(null);
                  setNewRecommendation({
                    title: '',
                    description: '',
                    linkedFactors: [],
                    controlType: 'engineering',
                    priority: 'high',
                    responsibility: '',
                    targetDate: '',
                    estimatedCost: 'Medium'
                  });
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Recommendation Title *
                </label>
                <input
                  type="text"
                  value={newRecommendation.title}
                  onChange={(e) => setNewRecommendation({ ...newRecommendation, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  placeholder="Brief description of the recommendation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Detailed Description *
                </label>
                <textarea
                  value={newRecommendation.description}
                  onChange={(e) => setNewRecommendation({ ...newRecommendation, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  rows={4}
                  placeholder="Provide detailed explanation of what should be done..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Control Type (Hierarchy of Controls) *
                </label>
                <select 
                  value={newRecommendation.controlType}
                  onChange={(e) => setNewRecommendation({ ...newRecommendation, controlType: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                >
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

              {causalFactors.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Link to Causal Factors
                  </label>
                  <div className="border border-slate-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {causalFactors.map(factor => (
                      <label key={factor.id} className="flex items-start gap-2 py-2 hover:bg-slate-50 px-2 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newRecommendation.linkedFactors.includes(factor.id)}
                          onChange={() => toggleFactorSelection(factor.id)}
                          className="mt-1"
                        />
                        <span className="text-sm text-slate-700">{factor.causal_factor_title}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Select which causal factors this recommendation addresses
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Priority *
                  </label>
                  <select 
                    value={newRecommendation.priority}
                    onChange={(e) => setNewRecommendation({ ...newRecommendation, priority: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Cost Estimate
                  </label>
                  <select 
                    value={newRecommendation.estimatedCost}
                    onChange={(e) => setNewRecommendation({ ...newRecommendation, estimatedCost: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  >
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
                    value={newRecommendation.responsibility}
                    onChange={(e) => setNewRecommendation({ ...newRecommendation, responsibility: e.target.value })}
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
                    value={newRecommendation.targetDate}
                    onChange={(e) => setNewRecommendation({ ...newRecommendation, targetDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddRecommendation}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : editingRecommendationId ? 'Update Recommendation' : 'Add Recommendation'}
              </button>
              <button
                onClick={() => {
                  setShowAddRecommendation(false);
                  setEditingRecommendationId(null);
                  setNewRecommendation({
                    title: '',
                    description: '',
                    linkedFactors: [],
                    controlType: 'engineering',
                    priority: 'high',
                    responsibility: '',
                    targetDate: '',
                    estimatedCost: 'Medium'
                  });
                }}
                disabled={saving}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
