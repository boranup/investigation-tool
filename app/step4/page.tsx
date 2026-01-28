'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GitBranch, Plus, Trash2, CheckCircle, ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';
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

  const [newFactor, setNewFactor] = useState({
    title: '',
    description: '',
    factorType: 'contributing',
    factorCategory: 'equipment'
  });

  const factorTypes = [
    { value: 'immediate', label: 'Immediate Cause', description: 'Direct triggers', color: 'bg-red-100 text-red-700 border-red-200' },
    { value: 'contributing', label: 'Contributing Factor', description: 'Enabled the incident', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'root', label: 'Root Cause', description: 'Underlying systemic issues', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { value: 'latent', label: 'Latent Condition', description: 'Pre-existing weaknesses', color: 'bg-orange-100 text-orange-700 border-orange-200' }
  ];

  const factorCategories = [
    { value: 'equipment', label: 'Equipment/System', description: 'Hardware failures, design issues', needsHFAT: true, needsHOP: false },
    { value: 'human_performance', label: 'Human Performance', description: 'Actions, decisions, behaviors', needsHFAT: false, needsHOP: true },
    { value: 'procedure', label: 'Procedure', description: 'Work instructions, processes', needsHFAT: true, needsHOP: false },
    { value: 'organizational', label: 'Organizational', description: 'Management systems, culture', needsHFAT: false, needsHOP: true },
    { value: 'external', label: 'External Factor', description: 'Outside influences', needsHFAT: false, needsHOP: false }
  ];

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
      const category = factorCategories.find(c => c.value === newFactor.factorCategory);
      const needsAnalysis = category && (category.needsHFAT || category.needsHOP);
      
      const { data, error } = await supabase
        .from('causal_factors')
        .insert([{
          investigation_id: investigationId,
          causal_factor_title: newFactor.title,
          causal_factor_description: newFactor.description || null,
          factor_type: newFactor.factorType,
          factor_category: newFactor.factorCategory,
          analysis_status: needsAnalysis ? 'analysis_required' : 'identified'
        }])
        .select()
        .single();

      if (error) throw error;

      setFactors([...causalFactors, data]);
      setNewFactor({ title: '', description: '', factorType: 'contributing', factorCategory: 'equipment' });
      setShowAddFactor(false);
      alert('Causal factor added successfully!');
    } catch (error) {
      console.error('Error:', error);
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
              const needsHFAT = category?.needsHFAT;
              const needsHOP = category?.needsHOP;
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
                              {factor.analysis_status === 'analysis_complete' ? 'View HFAT' : 'Launch HFAT'}
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
        </div>
      </div>

      {/* Add Factor Modal */}
      {showAddFactor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6">Add Causal Factor</h2>

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
                      {cat.needsHFAT && ' (Requires HFAT)'}
                      {cat.needsHOP && ' (Requires HOP)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddFactor}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
    </>
  );
}
