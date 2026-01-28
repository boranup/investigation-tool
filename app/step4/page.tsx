'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GitBranch, Plus, Edit2, Trash2, AlertCircle, CheckCircle, Filter, Target, ArrowRight, Lock, Unlock, Eye, X, Save, ChevronDown, ChevronRight, Edit } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import StepNavigation from '@/components/StepNavigation';

export default function CausalAnalysis() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const investigationId = searchParams.get('investigationId');

  const [showAddFactor, setShowAddFactor] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [saving, setSaving] = useState(false);

  const [investigation, setInvestigation] = useState<any>(null);
  const [causalFactors, setFactors] = useState<any[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  
  // Track which factors are expanded
  const [expandedFactors, setExpandedFactors] = useState<Record<string, boolean>>({});

  const [newFactor, setNewFactor] = useState({
    title: '',
    description: '',
    factorType: 'contributing',
    factorCategory: 'equipment',
    linkedTimelineEvents: [] as string[]
  });

  const factorTypes = [
    { 
      value: 'immediate', 
      label: 'Immediate Cause', 
      description: 'Direct triggers - events that directly caused the incident',
      color: 'bg-red-100 text-red-700 border-red-200' 
    },
    { 
      value: 'contributing', 
      label: 'Contributing Factor', 
      description: 'Conditions that enabled or allowed the incident to occur',
      color: 'bg-blue-100 text-blue-700 border-blue-200' 
    },
    { 
      value: 'root', 
      label: 'Root Cause', 
      description: 'Underlying systemic issues - if fixed, prevents recurrence',
      color: 'bg-purple-100 text-purple-700 border-purple-200' 
    },
    { 
      value: 'latent', 
      label: 'Latent Condition', 
      description: 'Pre-existing weaknesses in the system waiting to contribute',
      color: 'bg-orange-100 text-orange-700 border-orange-200' 
    }
  ];

  const factorCategories = [
    { 
      value: 'equipment', 
      label: 'Equipment/System', 
      description: 'Hardware failures, design issues, or system malfunctions',
      needsHFAT: true, 
      needsHOP: false 
    },
    { 
      value: 'human_performance', 
      label: 'Human Performance', 
      description: 'Actions, decisions, or behaviors of personnel',
      needsHFAT: false, 
      needsHOP: true 
    },
    { 
      value: 'procedure', 
      label: 'Procedure', 
      description: 'Issues with written instructions, work methods, or processes',
      needsHFAT: true, 
      needsHOP: false 
    },
    { 
      value: 'organizational', 
      label: 'Organizational', 
      description: 'Management systems, culture, resources, or planning',
      needsHFAT: false, 
      needsHOP: true 
    },
    { 
      value: 'external', 
      label: 'External Factor', 
      description: 'Outside influences beyond organizational control',
      needsHFAT: false, 
      needsHOP: false 
    }
  ];

  useEffect(() => {
    if (investigationId) {
      loadInvestigation();
      loadCausalFactors();
      loadTimelineEvents();
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
        setFactors(data || []);
      }
    } catch (error) {
      console.error('Error loading causal factors:', error);
    }
  };

  const loadTimelineEvents = async () => {
    if (!investigationId) return;

    try {
      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('investigation_id', investigationId)
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true });

      if (error) {
        console.error('Error loading timeline events:', error);
      } else {
        setTimelineEvents(data || []);
      }
    } catch (error) {
      console.error('Error loading timeline:', error);
    }
  };

  const handleAddFactor = async () => {
    if (!newFactor.title) {
      alert('Please enter a factor title');
      return;
    }

    if (!investigationId) {
      alert('No investigation selected');
      return;
    }

    setSaving(true);

    try {
      // Determine if needs analysis based on category
      const category = factorCategories.find(c => c.value === newFactor.factorCategory);
      const needsAnalysis = category && (category.needsHFAT || category.needsHOP);
      const analysisStatus = needsAnalysis ? 'analysis_required' : 'identified';

      const { data, error } = await supabase
        .from('causal_factors')
        .insert([{
          investigation_id: investigationId,
          causal_factor_title: newFactor.title,
          causal_factor_description: newFactor.description || null,
          factor_type: newFactor.factorType,
          factor_category: newFactor.factorCategory,
          analysis_status: analysisStatus
        }])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        alert('Error saving causal factor');
        return;
      }

      // Add to local state
      setFactors([...causalFactors, data]);

      // Reset form
      setNewFactor({
        title: '',
        description: '',
        factorType: 'contributing',
        factorCategory: 'equipment',
        linkedTimelineEvents: []
      });

      setShowAddFactor(false);
      alert('Causal factor added successfully!');
    } catch (error) {
      console.error('Error adding factor:', error);
      alert('Error adding causal factor');
    } finally {
      setSaving(false);
    }
  };

  const deleteFactor = async (id: string) => {
    if (!confirm('Delete this causal factor?')) return;

    try {
      const { error } = await supabase
        .from('causal_factors')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting factor:', error);
        alert('Error deleting causal factor');
        return;
      }

      setFactors(causalFactors.filter(f => f.id !== id));
      alert('Causal factor deleted');
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting causal factor');
    }
  };

  const toggleFactor = (factorId: string) => {
    setExpandedFactors(prev => ({
      ...prev,
      [factorId]: !prev[factorId]
    }));
  };

  const getTypeColor = (type: string) => {
    const factorType = factorTypes.find(t => t.value === type);
    return factorType?.color || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusBadge = (status: string) => {
    const statuses: Record<string, any> = {
      identified: { label: 'Identified', color: 'bg-slate-100 text-slate-700' },
      analysis_required: { label: 'Analysis Required', color: 'bg-amber-100 text-amber-700' },
      analysis_in_progress: { label: 'Analysis In Progress', color: 'bg-blue-100 text-blue-700' },
      analysis_complete: { label: 'Analysis Complete', color: 'bg-green-100 text-green-700' }
    };
    const badge = statuses[status] || statuses.identified;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const filteredFactors = causalFactors.filter(factor => {
    const matchesType = filterType === 'all' || factor.factor_type === filterType;
    const matchesStatus = filterStatus === 'all' || factor.analysis_status === filterStatus;
    return matchesType && matchesStatus;
  });

  const requiresAnalysisCount = causalFactors.filter(
    f => f.analysis_status === 'analysis_required' || f.analysis_status === 'analysis_in_progress'
  ).length;

  const allAnalysisComplete = causalFactors.length > 0 && requiresAnalysisCount === 0;

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
          currentStep={4}
          investigationNumber={investigation.investigation_number}
        />
      )}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Step 4: Causal Analysis</h1>
                <p className="text-slate-600 mt-1">Identify and analyze causal factors</p>
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
              onClick={() => setShowAddFactor(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Causal Factor
            </button>
          </div>
        </div>

        {/* Analysis Gate Alert */}
        {requiresAnalysisCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-1">Further Analysis Required</h3>
              <p className="text-sm text-amber-800 mb-2">
                {requiresAnalysisCount} causal factor{requiresAnalysisCount !== 1 ? 's' : ''} require{requiresAnalysisCount === 1 ? 's' : ''} further analysis using HFAT or HOP assessment tools before proceeding to recommendations.
              </p>
              <p className="text-xs text-amber-700">
                Complete all required assessments to unlock Step 5: Recommendations
              </p>
            </div>
          </div>
        )}

        {allAnalysisComplete && causalFactors.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <Unlock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 mb-1">Analysis Complete</h3>
              <p className="text-sm text-green-800">
                All causal factors have been analyzed. You can now proceed to develop recommendations.
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-600" />
              <label className="text-sm font-medium text-slate-700">Factor Type:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-slate-300 rounded px-3 py-1 text-sm"
              >
                <option value="all">All Types</option>
                {factorTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-slate-300 rounded px-3 py-1 text-sm"
              >
                <option value="all">All Status</option>
                <option value="identified">Identified</option>
                <option value="analysis_required">Analysis Required</option>
                <option value="analysis_in_progress">In Progress</option>
                <option value="analysis_complete">Complete</option>
              </select>
            </div>
            <div className="ml-auto text-sm text-slate-600">
              {filteredFactors.length} factor{filteredFactors.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Causal Factors List */}
        <div className="space-y-4">
          {filteredFactors.map((factor) => {
            const category = factorCategories.find(c => c.value === factor.factor_category);
            const needsHFAT = category?.needsHFAT && 
              (factor.analysis_status === 'analysis_required' || factor.analysis_status === 'analysis_in_progress');
            const needsHOP = category?.needsHOP && 
              (factor.analysis_status === 'analysis_required' || factor.analysis_status === 'analysis_in_progress');

            return (
              <div key={factor.id} className="bg-white rounded-lg shadow-sm border border-slate-200">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleFactor(factor.id)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors mt-1"
                    >
                      {expandedFactors[factor.id] ? (
                        <ChevronDown className="w-5 h-5 text-slate-600" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-600" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(factor.factor_type)}`}>
                              {factorTypes.find(t => t.value === factor.factor_type)?.label}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                              {factorCategories.find(c => c.value === factor.factor_category)?.label}
                            </span>
                            {getStatusBadge(factor.analysis_status)}
                          </div>
                          <h3 className="font-semibold text-lg text-slate-900 mb-2">{factor.causal_factor_title}</h3>
                          {!expandedFactors[factor.id] && factor.causal_factor_description && (
                            <p className="text-slate-600 text-sm line-clamp-2">{factor.causal_factor_description}</p>
                          )}

                          {/* Expanded Content */}
                          {expandedFactors[factor.id] && (
                            <div className="mt-3 space-y-3">
                              {factor.causal_factor_description && (
                                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                  <label className="block text-xs font-semibold text-slate-700 mb-2">Description</label>
                                  <p className="text-slate-900 text-sm whitespace-pre-wrap">{factor.causal_factor_description}</p>
                                </div>
                              )}
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                  <label className="block text-xs font-semibold text-slate-700 mb-1">Factor Type</label>
                                  <p className="text-slate-900">{factorTypes.find(t => t.value === factor.factor_type)?.label}</p>
                                  <p className="text-xs text-slate-600 mt-1">{factorTypes.find(t => t.value === factor.factor_type)?.description}</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                                  <p className="text-slate-900">{factorCategories.find(c => c.value === factor.factor_category)?.label}</p>
                                  <p className="text-xs text-slate-600 mt-1">{factorCategories.find(c => c.value === factor.factor_category)?.description}</p>
                                </div>
                              </div>
                              
                              {/* Edit/Delete Actions */}
                              <div className="flex gap-2 pt-3 border-t border-slate-200">
                                <button
                                  onClick={() => {
                                    setNewFactor({
                                      title: factor.causal_factor_title,
                                      description: factor.causal_factor_description || '',
                                      factorType: factor.factor_type,
                                      factorCategory: factor.factor_category,
                                      linkedTimelineEvents: []
                                    });
                                    setShowAddFactor(true);
                                    // Scroll to form
                                    setTimeout(() => {
                                      document.getElementById('add-factor-form')?.scrollIntoView({ behavior: 'smooth' });
                                    }, 100);
                                  }}
                                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                >
                                  <Edit className="w-4 h-4" />
                                  Edit Factor
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm('Are you sure you want to delete this causal factor?')) {
                                      try {
                                        const { error } = await supabase
                                          .from('causal_factors')
                                          .delete()
                                          .eq('id', factor.id);
                                        
                                        if (error) throw error;
                                        
                                        // Reload factors
                                        loadFactors();
                                      } catch (error: any) {
                                        alert(`Error deleting factor: ${error.message}`);
                                      }
                                    }
                                  }}
                                  className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 border border-red-300 rounded-lg hover:bg-red-200 transition-colors text-sm"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Assessment Actions */}
                          <div className="flex gap-2 mt-3">
                          {needsHFAT && (
                            <button 
                              onClick={() => router.push(`/hfat-new?investigationId=${investigationId}&causalFactorId=${factor.id}`)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                                factor.analysis_status === 'analysis_complete'
                                  ? 'bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-200'
                                  : 'bg-purple-600 text-white hover:bg-purple-700'
                              }`}
                            >
                              <ArrowRight className="w-4 h-4" />
                              {factor.analysis_status === 'analysis_complete' ? 'View HFAT Assessment' : 'Launch HFAT Assessment'}
                            </button>
                          )}
                          {needsHOP && (
                            <button 
                              onClick={() => router.push(`/hop-new?investigationId=${investigationId}&causalFactorId=${factor.id}`)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                                factor.analysis_status === 'analysis_complete'
                                  ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              <ArrowRight className="w-4 h-4" />
                              {factor.analysis_status === 'analysis_complete' ? 'View HOP Assessment' : 'Launch HOP Assessment'}
                            </button>
                          )}
                          {factor.analysis_status === 'analysis_complete' && (
                            <div className="flex items-center gap-2 text-sm text-green-700">
                              <CheckCircle className="w-4 h-4" />
                              <span>Complete</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => deleteFactor(factor.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete factor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredFactors.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <GitBranch className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Causal Factors Yet</h3>
            <p className="text-slate-600 mb-4">Start analyzing the incident by identifying causal factors</p>
            <button
              onClick={() => setShowAddFactor(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add First Causal Factor
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
            onClick={() => {
              if (!allAnalysisComplete) {
                alert('Please complete all required assessments before proceeding to recommendations.');
                return;
              }
              if (!investigationId) {
                alert('No investigation ID found');
                return;
              }
              window.location.href = `/step5?investigationId=${investigationId}`;
            }}
            disabled={!allAnalysisComplete}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {allAnalysisComplete ? 'Next: Recommendations' : 'Complete Analysis First'}
          </button>
        </div>
      </div>

      {/* CONTINUED IN PART 2 */}
      {/* Add Causal Factor Modal */}
      {showAddFactor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" id="add-factor-form">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Add Causal Factor</h2>
              <button
                onClick={() => setShowAddFactor(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Factor Title *
                </label>
                <input
                  type="text"
                  value={newFactor.title}
                  onChange={(e) => setNewFactor({ ...newFactor, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  placeholder="e.g., Relief valve failed to lift at set pressure"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newFactor.description}
                  onChange={(e) => setNewFactor({ ...newFactor, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  rows={3}
                  placeholder="Provide additional details about this causal factor..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Factor Type *
                </label>
                <select
                  value={newFactor.factorType}
                  onChange={(e) => setNewFactor({ ...newFactor, factorType: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                >
                  {factorTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Immediate causes are direct triggers; contributing factors enable the incident; root causes are underlying systemic issues
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Factor Category *
                </label>
                <select
                  value={newFactor.factorCategory}
                  onChange={(e) => setNewFactor({ ...newFactor, factorCategory: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                >
                  {factorCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                      {cat.needsHFAT && ' (Requires HFAT)'}
                      {cat.needsHOP && ' (Requires HOP)'}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Equipment/Procedure factors require HFAT assessment; Human Performance/Organizational factors require HOP assessment
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> After adding this causal factor, you'll need to complete the appropriate assessment (HFAT or HOP) before proceeding to recommendations.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddFactor}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Adding...' : 'Add Causal Factor'}
              </button>
              <button
                onClick={() => setShowAddFactor(false)}
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
