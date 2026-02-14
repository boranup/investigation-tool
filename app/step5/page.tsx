'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GitBranch, Plus, Edit2, Trash2, AlertCircle, Unlock, CheckCircle,
         Filter, Flag, ChevronDown, ChevronRight, Info, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import StepNavigation from '@/components/StepNavigation';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const factorTypes = [
  { value: 'immediate',     label: 'Immediate Cause',    colour: 'red'    },
  { value: 'contributing',  label: 'Contributing Factor', colour: 'orange' },
  { value: 'root',          label: 'Root Cause',          colour: 'purple' },
  { value: 'latent',        label: 'Latent Condition',    colour: 'blue'   },
];

const factorCategories = [
  { value: 'human_performance', label: 'Human Performance' },
  { value: 'equipment',         label: 'Equipment / Plant' },
  { value: 'procedure',         label: 'Procedure / Process' },
  { value: 'environment',       label: 'Work Environment' },
  { value: 'management',        label: 'Management / Organisational' },
  { value: 'external',          label: 'External Factor' },
];

const statusLabels: Record<string, { label: string; colour: string }> = {
  identified:           { label: 'Identified',       colour: 'slate'  },
  analysis_required:    { label: 'Analysis Required', colour: 'amber'  },
  analysis_in_progress: { label: 'In Progress',       colour: 'blue'   },
  analysis_complete:    { label: 'Complete',           colour: 'green'  },
};

const TYPE_COLOURS: Record<string, string> = {
  immediate:    'bg-red-100 text-red-700 border-red-300',
  contributing: 'bg-orange-100 text-orange-700 border-orange-300',
  root:         'bg-purple-100 text-purple-700 border-purple-300',
  latent:       'bg-blue-100 text-blue-700 border-blue-300',
};

const VISUALISATION_CAUSAL_TYPES = [
  { value: 'immediate',    label: 'Immediate Cause',     colour: 'red'    },
  { value: 'contributing', label: 'Contributing Factor',  colour: 'orange' },
  { value: 'root',         label: 'Root Cause',           colour: 'purple' },
  { value: 'latent',       label: 'Latent Condition',     colour: 'blue'   },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function CausalAnalysis() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const investigationId = searchParams.get('investigationId');

  const [loading, setLoading] = useState(true);
  const [investigation, setInvestigation] = useState<any>(null);
  const [causalFactors, setFactors] = useState<any[]>([]);
  const [hopAssessments, setHopAssessments] = useState<Record<string, any[]>>({});
  const [hfatAssessments, setHfatAssessments] = useState<Record<string, any[]>>({});

  const [showAddFactor, setShowAddFactor] = useState(false);
  const [editingFactor, setEditingFactor] = useState<any>(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Add mode: manual entry or expand from Step 4 visualisations
  const [addMode, setAddMode] = useState<'manual' | 'fromVisualisation'>('manual');
  const [flaggedItems, setFlaggedItems] = useState<any[]>([]);
  const [loadingFlagged, setLoadingFlagged] = useState(false);
  const [selectedFlaggedId, setSelectedFlaggedId] = useState<string | null>(null);

  const [newFactor, setNewFactor] = useState({
    title: '',
    description: '',
    factorType: 'contributing',
    factorCategory: 'equipment',
    parentFactorId: null as string | null,
    requiresHFAT: false,
    requiresHOP: false,
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // LOAD
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (investigationId) {
      loadAll();
    }
  }, [investigationId]);

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadInvestigation(), loadCausalFactors(), loadAssessments()]);
    setLoading(false);
  }

  async function loadInvestigation() {
    const { data } = await supabase
      .from('investigations')
      .select('*')
      .eq('id', investigationId)
      .single();
    if (data) setInvestigation(data);
  }

  async function loadCausalFactors() {
    const { data } = await supabase
      .from('causal_factors')
      .select('*')
      .eq('investigation_id', investigationId)
      .order('created_at', { ascending: true });
    if (data) setFactors(data);
  }

  async function loadAssessments() {
    const [hopRes, hfatRes] = await Promise.all([
      supabase.from('hop_assessments').select('*').eq('investigation_id', investigationId),
      supabase.from('hfat_assessments').select('*').eq('investigation_id', investigationId),
    ]);

    if (hopRes.data) {
      const grouped: Record<string, any[]> = {};
      hopRes.data.forEach(a => {
        if (!grouped[a.causal_factor_id]) grouped[a.causal_factor_id] = [];
        grouped[a.causal_factor_id].push(a);
      });
      setHopAssessments(grouped);
    }

    if (hfatRes.data) {
      const grouped: Record<string, any[]> = {};
      hfatRes.data.forEach(a => {
        if (!grouped[a.causal_factor_id]) grouped[a.causal_factor_id] = [];
        grouped[a.causal_factor_id].push(a);
      });
      setHfatAssessments(grouped);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LOAD FLAGGED ITEMS FROM STEP 4
  // ─────────────────────────────────────────────────────────────────────────────

  async function loadFlaggedVisualisationItems() {
    setLoadingFlagged(true);
    const [fishboneRes, whyRes, treeRes] = await Promise.all([
      supabase.from('fishbone_causes').select('*').eq('investigation_id', investigationId).eq('is_causal_factor', true),
      supabase.from('why_chain').select('*').eq('investigation_id', investigationId).eq('is_causal_factor', true),
      supabase.from('causal_tree_nodes').select('*').eq('investigation_id', investigationId).eq('is_causal_factor', true),
    ]);

    const items: any[] = [];

    (fishboneRes.data || []).forEach(item => items.push({
      id: `fishbone-${item.id}`,
      source: 'Fishbone',
      sourceIcon: '🐟',
      text: item.cause_text,
      causalFactorType: item.causal_factor_type || 'contributing',
    }));

    (whyRes.data || []).forEach(item => items.push({
      id: `why-${item.id}`,
      source: '5 Whys',
      sourceIcon: '❓',
      text: item.answer,
      causalFactorType: item.causal_factor_type || 'contributing',
    }));

    (treeRes.data || []).forEach(item => items.push({
      id: `tree-${item.id}`,
      source: 'Causal Tree',
      sourceIcon: '🌿',
      text: item.text,
      causalFactorType: item.causal_factor_type || 'contributing',
    }));

    setFlaggedItems(items);
    setLoadingFlagged(false);
  }

  function applyFlaggedItem(itemId: string) {
    const item = flaggedItems.find(i => i.id === itemId);
    if (!item) return;
    setNewFactor(prev => ({
      ...prev,
      title: item.text,
      description: `Identified via ${item.source} analysis in Step 4.`,
      factorType: item.causalFactorType || 'contributing',
    }));
    setSelectedFlaggedId(itemId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CRUD
  // ─────────────────────────────────────────────────────────────────────────────

  async function handleAddFactor() {
    if (!newFactor.title.trim()) return;
    try {
      const { error } = await supabase.from('causal_factors').insert([{
        investigation_id: investigationId,
        causal_factor_title: newFactor.title.trim(),
        causal_factor_description: newFactor.description.trim(),
        factor_type: newFactor.factorType,
        factor_category: newFactor.factorCategory,
        parent_factor_id: newFactor.parentFactorId,
        requires_hfat: newFactor.requiresHFAT,
        requires_hop: newFactor.requiresHOP,
        analysis_status: (newFactor.requiresHFAT || newFactor.requiresHOP) ? 'analysis_required' : 'identified',
      }]);
      if (error) throw error;
      resetAddForm();
      loadCausalFactors();
    } catch (error: any) {
      console.error('Error saving causal factor:', error);
      alert(`Error saving causal factor: ${error.message}`);
    }
  }

  function resetAddForm() {
    setNewFactor({ title: '', description: '', factorType: 'contributing', factorCategory: 'equipment', parentFactorId: null, requiresHFAT: false, requiresHOP: false });
    setShowAddFactor(false);
    setAddMode('manual');
    setSelectedFlaggedId(null);
    setFlaggedItems([]);
  }

  async function handleUpdateFactor() {
    if (!editingFactor) return;
    try {
      const { error } = await supabase.from('causal_factors').update({
        causal_factor_title: editingFactor.causal_factor_title,
        causal_factor_description: editingFactor.causal_factor_description,
        factor_type: editingFactor.factor_type,
        factor_category: editingFactor.factor_category,
        parent_factor_id: editingFactor.parent_factor_id || null,
        requires_hfat: editingFactor.requires_hfat,
        requires_hop: editingFactor.requires_hop,
        analysis_status: (editingFactor.requires_hfat || editingFactor.requires_hop) ? 'analysis_required' : 'identified',
      }).eq('id', editingFactor.id);
      if (error) throw error;
      setEditingFactor(null);
      loadCausalFactors();
      loadAssessments();
    } catch (error: any) {
      console.error('Error updating causal factor:', error);
      alert(`Error updating causal factor: ${error.message}`);
    }
  }

  async function handleDeleteFactor(id: string) {
    if (!confirm('Delete this causal factor? Any associated HFAT/HOP assessments will also be removed.')) return;
    try {
      await Promise.all([
        supabase.from('hfat_assessments').delete().eq('causal_factor_id', id),
        supabase.from('hop_assessments').delete().eq('causal_factor_id', id),
      ]);
      await supabase.from('causal_factors').delete().eq('id', id);
      loadCausalFactors();
      loadAssessments();
    } catch (error: any) {
      console.error('Error deleting causal factor:', error);
      alert(`Error: ${error.message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DERIVED STATE
  // ─────────────────────────────────────────────────────────────────────────────

  const filteredFactors = causalFactors.filter(f => {
    if (filterType !== 'all' && f.factor_type !== filterType) return false;
    if (filterStatus !== 'all' && f.analysis_status !== filterStatus) return false;
    return true;
  });

  const requiresAnalysisCount = causalFactors.filter(f =>
    f.analysis_status === 'analysis_required' || f.analysis_status === 'analysis_in_progress'
  ).length;

  const allAnalysisComplete = causalFactors.length > 0 && requiresAnalysisCount === 0;

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER GUARDS
  // ─────────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-600">Loading causal analysis…</p>
        </div>
      </div>
    );
  }

  if (!investigation) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-slate-700 font-medium">Investigation not found.</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      <StepNavigation
        investigationId={investigationId!}
        currentStep={5}
        investigationNumber={investigation.investigation_number}
      />

      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Step 5: Causal Factor Analysis</h1>
                <p className="text-slate-500 mt-1">
                  Document and analyse each causal factor. Run HFAT and/or HOP assessments where applicable.
                </p>
              </div>
              <button
                onClick={() => { setShowAddFactor(true); setAddMode('manual'); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />Add Causal Factor
              </button>
            </div>
          </div>

          {/* Status banners */}
          {requiresAnalysisCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  {requiresAnalysisCount} causal factor{requiresAnalysisCount !== 1 ? 's' : ''} require{requiresAnalysisCount === 1 ? 's' : ''} further analysis
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Complete HFAT and/or HOP assessments for each factor marked as requiring analysis before proceeding to Step 6.
                </p>
              </div>
            </div>
          )}

          {allAnalysisComplete && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <Unlock className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-900">Analysis complete</p>
                <p className="text-xs text-green-700 mt-0.5">All causal factors have been analysed. Proceed to Step 6: Recommendations.</p>
              </div>
            </div>
          )}

          {/* Add Causal Factor panel */}
          {showAddFactor && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Add Causal Factor</h2>
                <button onClick={resetAddForm} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mode toggle */}
              <div className="flex gap-1 mb-5 p-1 bg-slate-100 rounded-lg">
                <button
                  onClick={() => { setAddMode('manual'); setSelectedFlaggedId(null); }}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${addMode === 'manual' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  ✏️ Enter Manually
                </button>
                <button
                  onClick={() => { setAddMode('fromVisualisation'); loadFlaggedVisualisationItems(); }}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${addMode === 'fromVisualisation' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  🚩 Expand from Step 4 Visualisations
                </button>
              </div>

              {/* Visualisation picker */}
              {addMode === 'fromVisualisation' && (
                <div className="mb-5">
                  <p className="text-sm text-slate-600 mb-3">
                    Select a cause flagged in Step 4 to pre-populate the form below. You can then add detail, adjust the type, and configure HFAT/HOP.
                  </p>
                  {loadingFlagged ? (
                    <div className="flex items-center justify-center py-8 text-slate-400">
                      <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span className="text-sm">Loading flagged items…</span>
                    </div>
                  ) : flaggedItems.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl">
                      <Flag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No items have been flagged as causal factors in Step 4 yet.</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Go to Step 4 and use the flag toggle on any Fishbone cause, 5 Whys answer, or Causal Tree node.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {flaggedItems.map(item => (
                        <button
                          key={item.id}
                          onClick={() => applyFlaggedItem(item.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            selectedFlaggedId === item.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-lg flex-shrink-0">{item.sourceIcon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap gap-1.5 mb-1">
                                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{item.source}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${TYPE_COLOURS[item.causalFactorType] || 'bg-slate-100 text-slate-600 border-slate-300'}`}>
                                  {VISUALISATION_CAUSAL_TYPES.find(t => t.value === item.causalFactorType)?.label || item.causalFactorType}
                                </span>
                              </div>
                              <p className="text-sm text-slate-800 truncate">{item.text}</p>
                            </div>
                            {selectedFlaggedId === item.id && (
                              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedFlaggedId && (
                    <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Item selected — review and complete the form below, then save.
                    </p>
                  )}
                </div>
              )}

              {/* Form — always visible in manual mode; greyed out in visualisation mode until an item is selected */}
              <div className={addMode === 'fromVisualisation' && !selectedFlaggedId ? 'opacity-40 pointer-events-none' : ''}>
                {addMode === 'fromVisualisation' && selectedFlaggedId && (
                  <div className="mb-3 p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700">Pre-populated from Step 4. Expand the description and adjust settings before saving.</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newFactor.title}
                      onChange={e => setNewFactor({ ...newFactor, title: e.target.value })}
                      placeholder="Concise, factual title for this causal factor…"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea
                      value={newFactor.description}
                      onChange={e => setNewFactor({ ...newFactor, description: e.target.value })}
                      placeholder="Describe what happened, the context, and conditions at the time…"
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                      <select
                        value={newFactor.factorType}
                        onChange={e => setNewFactor({ ...newFactor, factorType: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        {factorTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                      <select
                        value={newFactor.factorCategory}
                        onChange={e => setNewFactor({ ...newFactor, factorCategory: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        {factorCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {causalFactors.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Parent Factor (optional)</label>
                      <select
                        value={newFactor.parentFactorId || ''}
                        onChange={e => setNewFactor({ ...newFactor, parentFactorId: e.target.value || null })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">None</option>
                        {causalFactors.map(f => <option key={f.id} value={f.id}>{f.causal_factor_title}</option>)}
                      </select>
                    </div>
                  )}

                  {/* HFAT / HOP checkboxes */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Assessment Tools</p>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newFactor.requiresHFAT}
                        onChange={e => setNewFactor({ ...newFactor, requiresHFAT: e.target.checked })}
                        className="w-4 h-4 mt-0.5 accent-purple-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-800">Run HFAT Assessment</p>
                        <p className="text-xs text-slate-500">Does this causal factor involve a human action, decision, or behaviour? If yes, consider HFAT to classify the human factors involved.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newFactor.requiresHOP}
                        onChange={e => setNewFactor({ ...newFactor, requiresHOP: e.target.checked })}
                        className="w-4 h-4 mt-0.5 accent-green-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-800">Run HOP Assessment</p>
                        <p className="text-xs text-slate-500">Do you want to understand why the action made sense in context — the conditions, pressures, and system factors that shaped it? If yes, consider HOP to explore local rationality and performance influencers.</p>
                      </div>
                    </label>

                    <p className="text-xs text-slate-400 italic">
                      Both can be applied to the same causal factor — HFAT gives you the structured classification, HOP gives you the contextual narrative. Together they may produce a more complete picture.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleAddFactor}
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Save Causal Factor
                    </button>
                    <button
                      onClick={resetAddForm}
                      className="px-5 py-2.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <label className="text-sm font-medium text-slate-700">Type:</label>
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  {factorTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-700">Status:</label>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="identified">Identified</option>
                  <option value="analysis_required">Analysis Required</option>
                  <option value="analysis_in_progress">In Progress</option>
                  <option value="analysis_complete">Complete</option>
                </select>
              </div>
              <div className="ml-auto text-sm text-slate-500">
                {filteredFactors.length} factor{filteredFactors.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          {/* Causal Factor Cards */}
          {filteredFactors.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <GitBranch className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No causal factors recorded yet</p>
              <p className="text-slate-400 text-sm mt-1">
                Add causal factors manually, or expand items flagged in Step 4 Visualisations.
              </p>
              <button
                onClick={() => { setShowAddFactor(true); setAddMode('manual'); }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Add First Causal Factor
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFactors.map(factor => {
                const typeInfo = factorTypes.find(t => t.value === factor.factor_type);
                const catInfo = factorCategories.find(c => c.value === factor.factor_category);
                const statusInfo = statusLabels[factor.analysis_status] || { label: factor.analysis_status, colour: 'slate' };
                const hasHfat = (hfatAssessments[factor.id] || []).length > 0;
                const hasHop = (hopAssessments[factor.id] || []).length > 0;

                return (
                  <div key={factor.id} className="bg-white rounded-xl shadow-sm border border-slate-200">
                    {editingFactor?.id === factor.id ? (
                      /* ── EDIT MODE ── */
                      <div className="p-6">
                        <h3 className="font-semibold text-slate-900 mb-4">Edit Causal Factor</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                            <input
                              type="text"
                              value={editingFactor.causal_factor_title}
                              onChange={e => setEditingFactor({ ...editingFactor, causal_factor_title: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea
                              value={editingFactor.causal_factor_description || ''}
                              onChange={e => setEditingFactor({ ...editingFactor, causal_factor_description: e.target.value })}
                              rows={3}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                              <select
                                value={editingFactor.factor_type}
                                onChange={e => setEditingFactor({ ...editingFactor, factor_type: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                              >
                                {factorTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                              <select
                                value={editingFactor.factor_category}
                                onChange={e => setEditingFactor({ ...editingFactor, factor_category: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                              >
                                {factorCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                              </select>
                            </div>
                          </div>
                          {causalFactors.filter(f => f.id !== factor.id).length > 0 && (
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Parent Factor</label>
                              <select
                                value={editingFactor.parent_factor_id || ''}
                                onChange={e => setEditingFactor({ ...editingFactor, parent_factor_id: e.target.value || null })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">None</option>
                                {causalFactors.filter(f => f.id !== factor.id).map(f => (
                                  <option key={f.id} value={f.id}>{f.causal_factor_title}</option>
                                ))}
                              </select>
                            </div>
                          )}
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Assessment Tools</p>
                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editingFactor.requires_hfat}
                                onChange={e => setEditingFactor({ ...editingFactor, requires_hfat: e.target.checked })}
                                className="w-4 h-4 mt-0.5 accent-purple-600"
                              />
                              <div>
                                <p className="text-sm font-medium text-slate-800">Run HFAT Assessment</p>
                                <p className="text-xs text-slate-500">Does this causal factor involve a human action, decision, or behaviour? If yes, consider HFAT to classify the human factors involved.</p>
                              </div>
                            </label>
                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editingFactor.requires_hop}
                                onChange={e => setEditingFactor({ ...editingFactor, requires_hop: e.target.checked })}
                                className="w-4 h-4 mt-0.5 accent-green-600"
                              />
                              <div>
                                <p className="text-sm font-medium text-slate-800">Run HOP Assessment</p>
                                <p className="text-xs text-slate-500">Do you want to understand why the action made sense in context — the conditions, pressures, and system factors that shaped it? If yes, consider HOP to explore local rationality and performance influencers.</p>
                              </div>
                            </label>
                            <p className="text-xs text-slate-400 italic">
                              Both can be applied to the same causal factor — HFAT gives you the structured classification, HOP gives you the contextual narrative.
                            </p>
                          </div>
                          <div className="flex gap-3">
                            <button onClick={handleUpdateFactor} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Save Changes</button>
                            <button onClick={() => setEditingFactor(null)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* ── VIEW MODE ── */
                      <div className="p-6">
                        {/* Factor header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <div className="flex flex-wrap gap-2 mb-2">
                              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${TYPE_COLOURS[factor.factor_type]}`}>
                                {typeInfo?.label || factor.factor_type}
                              </span>
                              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                {catInfo?.label || factor.factor_category}
                              </span>
                              <span className={`text-xs px-2.5 py-1 rounded-full ${
                                statusInfo.colour === 'amber'  ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                statusInfo.colour === 'green'  ? 'bg-green-100 text-green-700 border border-green-200' :
                                statusInfo.colour === 'blue'   ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                {statusInfo.label}
                              </span>
                            </div>
                            <h3 className="font-semibold text-slate-900">{factor.causal_factor_title}</h3>
                            {factor.causal_factor_description && (
                              <p className="text-sm text-slate-600 mt-1">{factor.causal_factor_description}</p>
                            )}
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => setEditingFactor({ ...factor })}
                              className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteFactor(factor.id)}
                              className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* HFAT Section */}
                        {factor.requires_hfat && (
                          <div className="mt-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">HFAT Assessment</span>
                                {hasHfat && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                              </div>
                            </div>

                            {(hfatAssessments[factor.id] || []).map((assessment: any) => (
                              <div key={assessment.id} className="mb-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                <div className="flex items-center justify-between">
                                  <div className="text-xs">
                                    <span className="font-medium text-purple-800">HFAT Analysis</span>
                                    <span className="text-purple-600 ml-2">
                                      {assessment.status === 'complete' ? '✓ Complete' : 'Draft'} — {new Date(assessment.updated_at).toLocaleDateString('en-AU')}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => router.push(`/hfat-new?investigationId=${investigationId}&causalFactorId=${factor.id}&assessmentId=${assessment.id}`)}
                                    className="text-xs px-2.5 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                                  >
                                    View/Edit
                                  </button>
                                </div>
                              </div>
                            ))}

                            <button
                              onClick={() => router.push(`/hfat-new?investigationId=${investigationId}&causalFactorId=${factor.id}`)}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              {hasHfat ? 'Add Another HFAT Assessment' : 'Launch HFAT Assessment'}
                            </button>
                          </div>
                        )}

                        {/* HOP Section */}
                        {factor.requires_hop && (
                          <div className="mt-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">HOP Assessment</span>
                                {hasHop && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                              </div>
                            </div>

                            {(hopAssessments[factor.id] || []).map((assessment: any) => (
                              <div key={assessment.id} className="mb-2 p-3 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center justify-between">
                                  <div className="text-xs">
                                    <span className="font-medium text-green-800">
                                      {assessment.action_type === 'error' ? 'Error Analysis' : 'Violation Analysis'}
                                    </span>
                                    <span className="text-green-600 ml-2">
                                      {assessment.status === 'complete' ? '✓ Complete' : 'Draft'} — {new Date(assessment.updated_at).toLocaleDateString('en-AU')}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => router.push(`/hop-new?investigationId=${investigationId}&causalFactorId=${factor.id}&assessmentId=${assessment.id}`)}
                                    className="text-xs px-2.5 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                  >
                                    View/Edit
                                  </button>
                                </div>
                              </div>
                            ))}

                            <button
                              onClick={() => router.push(`/hop-new?investigationId=${investigationId}&causalFactorId=${factor.id}`)}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              {hasHop ? 'Add Another HOP Assessment' : 'Launch HOP Assessment'}
                            </button>
                          </div>
                        )}

                        {/* Neither HFAT nor HOP required — show soft prompt */}
                        {!factor.requires_hfat && !factor.requires_hop && (
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <p className="text-xs text-slate-400 italic">
                              No assessment tools selected for this factor. Edit to enable HFAT and/or HOP if applicable.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom info panel */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">Causal Analysis Best Practice</p>
                <p className="text-sm text-blue-800">
                  Start with immediate causes (what directly triggered the incident), then trace back to contributing factors and root causes.
                  Use HFAT to classify human factors and HOP to understand why actions made sense to the people involved at the time.
                  Align your analysis with IOGP 621 categories to ensure regulatory consistency.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
