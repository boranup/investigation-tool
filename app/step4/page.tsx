'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GitBranch, Plus, Edit2, Trash2, AlertTriangle, Lock, Unlock, ArrowRight, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import StepNavigation from '@/components/StepNavigation';

export default function CausalAnalysis() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const investigationId = searchParams.get('investigationId');

  const [loading, setLoading] = useState(true);
  const [investigation, setInvestigation] = useState<any>(null);
  const [causalFactors, setFactors] = useState<any[]>([]);
  const [hopAssessments, setHopAssessments] = useState<any>({});
  const [hfatAssessments, setHfatAssessments] = useState<any>({});
  
  const [showAddFactor, setShowAddFactor] = useState(false);
  const [editingFactor, setEditingFactor] = useState<any>(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [newFactor, setNewFactor] = useState({
    title: '',
    description: '',
    factorType: 'immediate',
    factorCategory: 'equipment',
    parentFactorId: null
  });

  useEffect(() => {
    if (investigationId) {
      loadInvestigation();
      loadCausalFactors();
      loadAssessments();
    }
  }, [investigationId]);

  async function loadInvestigation() {
    try {
      const { data, error } = await supabase
        .from('investigations')
        .select('*')
        .eq('id', investigationId)
        .single();

      if (error) throw error;
      setInvestigation(data);
    } catch (error) {
      console.error('Error loading investigation:', error);
    }
  }

  async function loadCausalFactors() {
    try {
      const { data, error } = await supabase
        .from('causal_factors')
        .select('*')
        .eq('investigation_id', investigationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setFactors(data || []);
    } catch (error) {
      console.error('Error loading causal factors:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadAssessments() {
    try {
      // Get all causal factors for this investigation
      const { data: factors } = await supabase
        .from('causal_factors')
        .select('id')
        .eq('investigation_id', investigationId);

      if (!factors) return;

      const factorIds = factors.map(f => f.id);

      // Load all HOP assessments
      const { data: hopData } = await supabase
        .from('hop_assessments')
        .select('*')
        .in('causal_factor_id', factorIds);

      // Load all HFAT assessments  
      const { data: hfatData } = await supabase
        .from('hfat_assessments')
        .select('*')
        .in('causal_factor_id', factorIds);

      // Group by causal_factor_id
      const hopMap: any = {};
      hopData?.forEach((assessment: any) => {
        if (!hopMap[assessment.causal_factor_id]) {
          hopMap[assessment.causal_factor_id] = [];
        }
        hopMap[assessment.causal_factor_id].push(assessment);
      });

      const hfatMap: any = {};
      hfatData?.forEach((assessment: any) => {
        if (!hfatMap[assessment.causal_factor_id]) {
          hfatMap[assessment.causal_factor_id] = [];
        }
        hfatMap[assessment.causal_factor_id].push(assessment);
      });

      setHopAssessments(hopMap);
      setHfatAssessments(hfatMap);
    } catch (error) {
      console.error('Error loading assessments:', error);
    }
  }

  async function addCausalFactor() {
    try {
      const factorData = {
        investigation_id: investigationId,
        causal_factor_title: newFactor.title,  // Database uses causal_factor_title
        causal_factor_description: newFactor.description,  // Database uses causal_factor_description
        factor_type: newFactor.factorType,
        factor_category: newFactor.factorCategory,
        parent_causal_factor_id: newFactor.parentFactorId,
        analysis_status: 'identified'
      };

      console.log('Attempting to insert causal factor:', factorData);

      const { data, error } = await supabase
        .from('causal_factors')
        .insert([factorData])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Successfully added causal factor:', data);

      setNewFactor({
        title: '',
        description: '',
        factorType: 'immediate',
        factorCategory: 'equipment',
        parentFactorId: null
      });
      setShowAddFactor(false);
      loadCausalFactors();
      loadAssessments();
    } catch (error: any) {
      console.error('Error adding causal factor:', error);
      alert(`Error adding causal factor: ${error.message}\n\nCheck browser console for details.`);
    }
  }

  async function updateCausalFactor() {
    if (!editingFactor) return;

    try {
      const { error } = await supabase
        .from('causal_factors')
        .update({
          causal_factor_title: editingFactor.causal_factor_title,
          causal_factor_description: editingFactor.causal_factor_description,
          factor_type: editingFactor.factor_type,
          factor_category: editingFactor.factor_category,
          parent_causal_factor_id: editingFactor.parent_causal_factor_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingFactor.id);

      if (error) throw error;

      setEditingFactor(null);
      loadCausalFactors();
    } catch (error) {
      console.error('Error updating causal factor:', error);
      alert('Error updating causal factor');
    }
  }

  async function deleteCausalFactor(id: string) {
    if (!confirm('Are you sure you want to delete this causal factor?')) return;

    try {
      const { error } = await supabase
        .from('causal_factors')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadCausalFactors();
      loadAssessments();
    } catch (error) {
      console.error('Error deleting causal factor:', error);
      alert('Error deleting causal factor');
    }
  }

  const factorTypes = [
    { value: 'immediate', label: 'Immediate Cause', color: 'red' },
    { value: 'contributing', label: 'Contributing Factor', color: 'amber' },
    { value: 'root', label: 'Root Cause', color: 'purple' }
  ];

  const factorCategories = [
    { value: 'equipment', label: 'Equipment/Hardware' },
    { value: 'human_performance', label: 'Human Performance' },
    { value: 'procedure', label: 'Procedure/Process' },
    { value: 'organizational', label: 'Organizational' },
    { value: 'external', label: 'External Factor' }
  ];

  const filteredFactors = causalFactors.filter(f => {
    if (filterType !== 'all' && f.factor_type !== filterType) return false;
    if (filterStatus !== 'all' && f.analysis_status !== filterStatus) return false;
    return true;
  });

  // Check if all causal factors are validated (for Step 5 gate)
  const allFactorsValidated = causalFactors.length > 0 && 
    causalFactors.every(f => f.analysis_status === 'validated');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Causal Analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Step Navigation */}
      <StepNavigation 
        investigationId={investigationId || ''} 
        currentStep={4}
        investigationNumber={investigation?.investigation_number}
      />
      
      <div className="py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Step 4: Causal Factor Analysis
              </h1>
              <p className="text-gray-600 mt-1">
                Investigation: {investigation?.investigation_number} - {investigation?.incident_description}
              </p>
            </div>
            <button
              onClick={() => setShowAddFactor(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              Add Causal Factor
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
            <GitBranch className="text-blue-600" size={24} />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">
                  Analysis Progress
                </span>
                <span className="text-sm text-blue-700">
                  {causalFactors.filter(f => f.analysis_status === 'validated').length} / {causalFactors.length} Validated
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${causalFactors.length > 0 
                      ? (causalFactors.filter(f => f.analysis_status === 'validated').length / causalFactors.length) * 100 
                      : 0}%`
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Removed Step 5 lock - not all factors require validation */}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Filter by Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="all">All Types</option>
                {factorTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Filter by Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="all">All Statuses</option>
                <option value="identified">Identified</option>
                <option value="analysis_required">Analysis Required</option>
                <option value="under_analysis">Under Analysis</option>
                <option value="validated">Validated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Causal Factors List */}
        <div className="space-y-4">
          {filteredFactors.map(factor => {
            const typeInfo = factorTypes.find(t => t.value === factor.factor_type);
            const categoryInfo = factorCategories.find(c => c.value === factor.factor_category);

            return (
              <div key={factor.id} className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6">
                {editingFactor?.id === factor.id ? (
                  /* Edit Mode */
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editingFactor.causal_factor_title}
                      onChange={(e) => setEditingFactor({...editingFactor, causal_factor_title: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 font-medium"
                      placeholder="Causal factor title..."
                    />
                    <textarea
                      value={editingFactor.causal_factor_description}
                      onChange={(e) => setEditingFactor({...editingFactor, causal_factor_description: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                      rows={3}
                      placeholder="Description..."
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Type</label>
                        <select
                          value={editingFactor.factor_type}
                          onChange={(e) => setEditingFactor({...editingFactor, factor_type: e.target.value})}
                          className="w-full border rounded-lg px-3 py-2"
                        >
                          {factorTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Category</label>
                        <select
                          value={editingFactor.factor_category}
                          onChange={(e) => setEditingFactor({...editingFactor, factor_category: e.target.value})}
                          className="w-full border rounded-lg px-3 py-2"
                        >
                          {factorCategories.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingFactor(null)}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={updateCausalFactor}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {factor.causal_factor_title}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${typeInfo?.color}-100 text-${typeInfo?.color}-700`}>
                            {typeInfo?.label}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {categoryInfo?.label}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">
                          {factor.causal_factor_description}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingFactor(factor)}
                          className="p-2 hover:bg-gray-100 rounded"
                        >
                          <Edit2 size={16} className="text-gray-600" />
                        </button>
                        <button
                          onClick={() => deleteCausalFactor(factor.id)}
                          className="p-2 hover:bg-gray-100 rounded"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mb-4">
                      {factor.analysis_status === 'validated' && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          <CheckCircle size={16} />
                          Validated
                        </div>
                      )}
                      {factor.analysis_status === 'analysis_required' && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                          <AlertTriangle size={16} />
                          Analysis Required
                        </div>
                      )}
                      {factor.analysis_status === 'identified' && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          Identified
                        </div>
                      )}
                    </div>

                    {/* HOP Assessment Section - Available for all factor types */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">HOP Assessment</h4>
                        {hopAssessments[factor.id]?.length > 0 && (
                          <span className="text-xs text-green-600">
                            {hopAssessments[factor.id].length} assessment(s)
                          </span>
                        )}
                      </div>

                      {hopAssessments[factor.id]?.map((assessment: any) => (
                        <div key={assessment.id} className="mb-2 p-3 bg-green-50 rounded border border-green-200">
                          <div className="flex items-center justify-between">
                            <div className="text-xs">
                              <div className="font-medium">
                                {assessment.action_type === 'error' ? '🔴 Error Analysis' : '⚠️ Violation Analysis'}
                                {assessment.violation_type && ` - ${assessment.violation_type.charAt(0).toUpperCase() + assessment.violation_type.slice(1)}`}
                              </div>
                              <div className="text-gray-600 mt-1">
                                {assessment.status === 'complete' ? '✅ Complete' : '📝 Draft'} - 
                                {' '}{new Date(assessment.updated_at).toLocaleDateString()}
                              </div>
                            </div>
                            <button
                              onClick={() => router.push(`/hop-new?investigationId=${investigationId}&causalFactorId=${factor.id}&assessmentId=${assessment.id}`)}
                              className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              View/Edit
                            </button>
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={() => router.push(`/hop-new?investigationId=${investigationId}&causalFactorId=${factor.id}`)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm mt-2"
                      >
                        <Plus className="w-4 h-4" />
                        {hopAssessments[factor.id]?.length > 0 ? 'Add Another HOP Assessment' : 'Launch HOP Assessment'}
                      </button>
                    </div>

                    {/* HFAT Assessment Section - Available for all factor types */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">HFAT Assessment</h4>
                        {hfatAssessments[factor.id]?.length > 0 && (
                          <span className="text-xs text-purple-600">
                            {hfatAssessments[factor.id].length} assessment(s)
                          </span>
                        )}
                      </div>

                      {hfatAssessments[factor.id]?.map((assessment: any) => (
                        <div key={assessment.id} className="mb-2 p-3 bg-purple-50 rounded border border-purple-200">
                          <div className="flex items-center justify-between">
                            <div className="text-xs">
                              <div className="font-medium">HFAT Analysis</div>
                              <div className="text-gray-600 mt-1">
                                {assessment.status === 'complete' ? '✅ Complete' : '📝 Draft'} - 
                                {' '}{new Date(assessment.updated_at).toLocaleDateString()}
                              </div>
                            </div>
                            <button
                              onClick={() => router.push(`/hfat-new?investigationId=${investigationId}&causalFactorId=${factor.id}&assessmentId=${assessment.id}`)}
                              className="text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                            >
                              View/Edit
                            </button>
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={() => router.push(`/hfat-new?investigationId=${investigationId}&causalFactorId=${factor.id}`)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm mt-2"
                      >
                        <Plus className="w-4 h-4" />
                        {hfatAssessments[factor.id]?.length > 0 ? 'Add Another HFAT Assessment' : 'Launch HFAT Assessment'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredFactors.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <GitBranch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No causal factors match your filters</p>
          </div>
        )}

        {/* Add Causal Factor Modal */}
        {showAddFactor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <h2 className="text-xl font-bold mb-4">Add Causal Factor</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    value={newFactor.title}
                    onChange={(e) => setNewFactor({...newFactor, title: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Brief description of the causal factor..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description *</label>
                  <textarea
                    value={newFactor.description}
                    onChange={(e) => setNewFactor({...newFactor, description: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    rows={4}
                    placeholder="Detailed explanation of this causal factor..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Type *</label>
                    <select
                      value={newFactor.factorType}
                      onChange={(e) => setNewFactor({...newFactor, factorType: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      {factorTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Category *</label>
                    <select
                      value={newFactor.factorCategory}
                      onChange={(e) => setNewFactor({...newFactor, factorCategory: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      {factorCategories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowAddFactor(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addCausalFactor}
                  disabled={!newFactor.title || !newFactor.description}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                >
                  Add Causal Factor
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
