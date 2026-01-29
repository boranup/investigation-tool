'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GitBranch, Plus, Trash2, CheckCircle, ChevronDown, ChevronRight, ArrowRight, Edit2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import StepNavigation from '@/components/StepNavigation';

export default function CausalAnalysis() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const investigationId = searchParams.get('investigationId');

  const [investigation, setInvestigation] = useState<any>(null);
  const [causalFactors, setFactors] = useState<any[]>([]);
  const [showAddFactor, setShowAddFactor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedFactors, setExpandedFactors] = useState<Record<string, boolean>>({});
  const [editingFactorId, setEditingFactorId] = useState<string | null>(null);

  const [newFactor, setNewFactor] = useState({
    title: '',
    description: '',
    factorType: 'contributing',
    factorCategory: 'equipment',
    requiresHFAT: false,
    requiresHOP: false
  });

  const factorTypes = [
    { value: 'immediate', label: 'Immediate Cause', description: 'Direct triggers', color: 'bg-red-100 text-red-700 border-red-200' },
    { value: 'contributing', label: 'Contributing Factor', description: 'Enabled the incident', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'root', label: 'Root Cause', description: 'Underlying systemic issues', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { value: 'latent', label: 'Latent Condition', description: 'Pre-existing weaknesses', color: 'bg-orange-100 text-orange-700 border-orange-200' }
  ];

  const factorCategories = [
    { value: 'equipment', label: 'Equipment/System', description: 'Hardware failures, design issues' },
    { value: 'human_performance', label: 'Human Performance', description: 'Actions, decisions, behaviors' },
    { value: 'procedure', label: 'Procedure', description: 'Work instructions, processes' },
    { value: 'organizational', label: 'Organizational', description: 'Management systems, culture' },
    { value: 'external', label: 'External Factor', description: 'Outside influences' }
  ];

  // Auto-save handler for navigation - closes any open modals
  const handleBeforeNavigate = async (): Promise<boolean> => {
    setShowAddFactor(false);
    setEditingFactorId(null);
    return true; // Allow navigation
  };

  useEffect(() => {
    if (investigationId) {
      loadInvestigation();
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

  const loadCausalFactors = async () => {
    if (!investigationId) return;
    const { data } = await supabase
      .from('causal_factors')
      .select('*')
      .eq('investigation_id', investigationId)
      .order('created_at', { ascending: true });
    setFactors(data || []);
  };

  const handleAddFactor = async () => {
    if (!newFactor.title || !investigationId) {
      alert('Please enter a factor title');
      return;
    }

    setSaving(true);
    try {
      const needsAnalysis = newFactor.requiresHFAT || newFactor.requiresHOP;
      
      const factorData = {
        investigation_id: investigationId,
        causal_factor_title: newFactor.title,
        causal_factor_description: newFactor.description || null,
        factor_type: newFactor.factorType,
        factor_category: newFactor.factorCategory,
        requires_hfat: newFactor.requiresHFAT,
        requires_hop: newFactor.requiresHOP,
        analysis_status: needsAnalysis ? 'analysis_required' : 'identified'
      };

      if (editingFactorId) {
        // UPDATE existing factor
        const { error } = await supabase
          .from('causal_factors')
          .update(factorData)
          .eq('id', editingFactorId);

        if (error) throw error;
        alert('Causal factor updated successfully!');
      } else {
        // INSERT new factor
        const { data, error } = await supabase
          .from('causal_factors')
          .insert([factorData])
          .select()
          .single();

        if (error) throw error;
        setFactors([...causalFactors, data]);
        alert('Causal factor added successfully!');
      }

      setNewFactor({ title: '', description: '', factorType: 'contributing', factorCategory: 'equipment', requiresHFAT: false, requiresHOP: false });
      setEditingFactorId(null);
      setShowAddFactor(false);
      loadCausalFactors();
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving causal factor');
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

      if (error) throw error;
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
    return factorTypes.find(t => t.value === type)?.color || 'bg-gray-100 text-gray-700';
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, any> = {
      identified: { label: 'Identified', color: 'bg-slate-100 text-slate-700' },
      analysis_required: { label: 'Analysis Required', color: 'bg-amber-100 text-amber-700' },
      analysis_in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
      analysis_complete: { label: 'Complete', color: 'bg-green-100 text-green-700' }
    };
    const badge = badges[status] || badges.identified;
    return <span className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>{badge.label}</span>;
  };

  const allAnalysisComplete = causalFactors.length > 0 && 
    causalFactors.filter(f => f.analysis_status === 'analysis_required' || f.analysis_status === 'analysis_in_progress').length === 0;

  if (!investigationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No Investigation Selected</h2>
          <p className="text-slate-600">Please start from Step 1.</p>
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
          onBeforeNavigate={handleBeforeNavigate}
        />
      )}
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Step 4: Causal Analysis</h1>
            <p className="text-slate-600 mt-1">Identify and analyze causal factors</p>
            {investigation && (
              <div className="mt-2 text-sm text-slate-500">
                Investigation: <span className="font-medium text-slate-900">{investigation.investigation_number}</span>
              </div>
            )}
          </div>

          {/* Add Factor Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowAddFactor(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Causal Factor
            </button>
          </div>

          {/* Causal Factors List */}
          <div className="space-y-4">
            {causalFactors.map((factor) => {
              const category = factorCategories.find(c => c.value === factor.factor_category);
              const isExpanded = expandedFactors[factor.id];

              return (
                <div key={factor.id} className="bg-white rounded-lg shadow-sm border border-slate-200">
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Expand/Collapse Button */}
                      <button
                        onClick={() => toggleFactor(factor.id)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors mt-1"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-slate-600" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-600" />
                        )}
                      </button>

                      <div className="flex-1">
                        {/* Factor Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(factor.factor_type)}`}>
                              {factorTypes.find(t => t.value === factor.factor_type)?.label}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                              {factorCategories.find(c => c.value === factor.factor_category)?.label}
                            </span>
                            {getStatusBadge(factor.analysis_status)}
                          </div>
                          
                          {/* Quick Action Buttons - Always Visible */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingFactorId(factor.id);
                                setNewFactor({
                                  title: factor.causal_factor_title,
                                  description: factor.causal_factor_description || '',
                                  factorType: factor.factor_type,
                                  factorCategory: factor.factor_category,
                                  requiresHFAT: factor.requires_hfat || false,
                                  requiresHOP: factor.requires_hop || false
                                });
                                setShowAddFactor(true);
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Edit causal factor"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteFactor(factor.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete causal factor"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <h3 className="font-semibold text-lg text-slate-900 mb-2">{factor.causal_factor_title}</h3>
                        
                        {!isExpanded && factor.causal_factor_description && (
                          <p className="text-slate-600 text-sm line-clamp-2">{factor.causal_factor_description}</p>
                        )}

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="mt-3 space-y-3">
                            {factor.causal_factor_description && (
                              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                <p className="text-sm font-semibold text-slate-700 mb-2">Description</p>
                                <p className="text-slate-900 text-sm whitespace-pre-wrap">{factor.causal_factor_description}</p>
                              </div>
                            )}

                            <div className="flex gap-2 pt-3 border-t border-slate-200">
                              <button
                                onClick={() => {
                                  setEditingFactorId(factor.id);
                                  setNewFactor({
                                    title: factor.causal_factor_title,
                                    description: factor.causal_factor_description || '',
                                    factorType: factor.factor_type,
                                    factorCategory: factor.factor_category,
                                    requiresHFAT: factor.requires_hfat || false,
                                    requiresHOP: factor.requires_hop || false
                                  });
                                  setShowAddFactor(true);
                                }}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                              >
                                <Edit2 className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => deleteFactor(factor.id)}
                                className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 border border-red-300 rounded-lg hover:bg-red-200 transition-colors text-sm"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Assessment Buttons */}
                        <div className="flex gap-2 mt-3">
                          {factor.requires_hfat && (
                            <button
                              onClick={() => router.push(`/hfat-new?investigationId=${investigationId}&causalFactorId=${factor.id}`)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                                factor.analysis_status === 'analysis_complete'
                                  ? 'bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-200'
                                  : 'bg-purple-600 text-white hover:bg-purple-700'
                              }`}
                            >
                              <ArrowRight className="w-4 h-4" />
                              {factor.analysis_status === 'analysis_complete' ? 'View HFAT' : 'Launch HFAT'}
                            </button>
                          )}
                          {factor.requires_hop && (
                            <button
                              onClick={() => router.push(`/hop-new?investigationId=${investigationId}&causalFactorId=${factor.id}`)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                                factor.analysis_status === 'analysis_complete'
                                  ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              <ArrowRight className="w-4 h-4" />
                              {factor.analysis_status === 'analysis_complete' ? 'View HOP' : 'Launch HOP'}
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
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {causalFactors.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
              <GitBranch className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Causal Factors Yet</h3>
              <p className="text-slate-600 mb-4">Add your first causal factor to begin the analysis</p>
            </div>
          )}

          {/* Gate Warning */}
          {causalFactors.length > 0 && !allAnalysisComplete && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-amber-900">
                <strong>Note:</strong> Complete all required assessments before proceeding to recommendations.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
            <button
              onClick={() => router.push(`/step3?investigationId=${investigationId}`)}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Previous Step
            </button>
            <button
              onClick={() => router.push(`/step5?investigationId=${investigationId}`)}
              disabled={!allAnalysisComplete}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue to Recommendations
            </button>
          </div>
        </div>
      </div>

      {/* Add Factor Modal */}
      {showAddFactor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6">{editingFactorId ? 'Edit Causal Factor' : 'Add Causal Factor'}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Factor Title *</label>
                <input
                  type="text"
                  value={newFactor.title}
                  onChange={(e) => setNewFactor({ ...newFactor, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  placeholder="e.g., Relief valve failed to lift"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={newFactor.description}
                  onChange={(e) => setNewFactor({ ...newFactor, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  rows={3}
                  placeholder="Provide additional details..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Factor Type *</label>
                <select
                  value={newFactor.factorType}
                  onChange={(e) => setNewFactor({ ...newFactor, factorType: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                >
                  {factorTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Factor Category *</label>
                <select
                  value={newFactor.factorCategory}
                  onChange={(e) => setNewFactor({ ...newFactor, factorCategory: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                >
                  {factorCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* HFAT/HOP Analysis Checkboxes */}
              <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-sm font-medium text-slate-700 mb-3">Optional Detailed Analysis</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newFactor.requiresHFAT}
                      onChange={(e) => setNewFactor({ ...newFactor, requiresHFAT: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">
                      <strong>HFAT (Human Factors Analysis Tool)</strong> - Detailed analysis of individual, task, and organizational factors
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newFactor.requiresHOP}
                      onChange={(e) => setNewFactor({ ...newFactor, requiresHOP: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">
                      <strong>HOP (Human & Organizational Performance)</strong> - Context-based performance evaluation
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddFactor}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : editingFactorId ? 'Update Causal Factor' : 'Add Causal Factor'}
              </button>
              <button
                onClick={() => {
                  setShowAddFactor(false);
                  setEditingFactorId(null);
                  setNewFactor({ title: '', description: '', factorType: 'contributing', factorCategory: 'equipment', requiresHFAT: false, requiresHOP: false });
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
    </>
  );
}
