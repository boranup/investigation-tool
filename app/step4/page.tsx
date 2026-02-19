'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, Network, GitBranch,
         Shield, HelpCircle, Fish, Flag, X, CheckCircle, Info, BookOpen, List, Network as BowTie } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import StepNavigation from '@/components/StepNavigation';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS — original values preserved exactly
// ─────────────────────────────────────────────────────────────────────────────

const factorTypes = [
  { value: 'individual',     label: 'Individual / Team',      colour: 'bg-red-100 text-red-700 border-red-200'    },
  { value: 'organisational', label: 'Organisational',          colour: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'equipment',      label: 'Equipment / Systems',     colour: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'procedure',      label: 'Procedure / Process',     colour: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'external',       label: 'External',                colour: 'bg-green-100 text-green-700 border-green-200' },
];

const nodeTypes = [
  { value: 'immediate',    label: 'Immediate Cause',    colour: 'bg-red-100 text-red-700 border-red-300'    },
  { value: 'contributing', label: 'Contributing Factor', colour: 'bg-amber-100 text-amber-700 border-amber-300' },
  { value: 'root',         label: 'Root Cause',          colour: 'bg-green-100 text-green-700 border-green-300' },
];

const factorCategories = [
  { value: 'equipment',      label: 'Equipment / Hardware' },
  { value: 'procedure',      label: 'Procedure / Process'  },
  { value: 'human_factors',  label: 'Human Factors'        },
  { value: 'organisational', label: 'Organisational'       },
  { value: 'external',       label: 'External'             },
];

const CAUSAL_FACTOR_TYPES = [
  { value: 'immediate',    label: 'Immediate Cause',    colour: 'bg-red-100 text-red-700 border-red-200'    },
  { value: 'contributing', label: 'Contributing Factor', colour: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'root',         label: 'Root Cause',          colour: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'latent',       label: 'Latent Condition',    colour: 'bg-blue-100 text-blue-700 border-blue-200' },
];

const FISHBONE_CATEGORIES = [
  { id: 'people',       label: 'People',            colour: '#3b82f6', description: 'Human factors, competence, awareness, fatigue, communication' },
  { id: 'procedures',   label: 'Procedures',        colour: '#8b5cf6', description: 'Work instructions, permits, standards, compliance' },
  { id: 'plant',        label: 'Plant / Equipment', colour: '#f59e0b', description: 'Machinery, tools, systems, design, maintenance' },
  { id: 'environment',  label: 'Environment',       colour: '#10b981', description: 'Weather, lighting, noise, workspace layout, housekeeping' },
  { id: 'management',   label: 'Management Systems',colour: '#ef4444', description: 'Planning, risk assessment, supervision, resource allocation' },
  { id: 'external',     label: 'External Factors',  colour: '#6b7280', description: 'Contractors, suppliers, regulatory changes, third parties' },
];

const BARRIER_TYPES = [
  { value: 'physical',        label: 'Physical Barrier',        example: 'Guards, containment, blast walls' },
  { value: 'administrative',  label: 'Administrative Barrier',  example: 'Procedures, permits, training' },
  { value: 'detection',       label: 'Detection Barrier',       example: 'Sensors, alarms, inspections' },
  { value: 'communication',   label: 'Communication Barrier',   example: 'Handover notes, signage, radio comms' },
  { value: 'recovery',        label: 'Recovery Barrier',        example: 'Emergency shutdown, spill containment, evacuation' },
];

const BARRIER_STATUSES = [
  { value: 'present_performed', label: 'Present & Performed',           colour: 'bg-green-100 text-green-700 border-green-300'  },
  { value: 'present_partial',   label: 'Present & Partially Performed', colour: 'bg-amber-100 text-amber-700 border-amber-300'  },
  { value: 'present_failed',    label: 'Present & Failed',              colour: 'bg-red-100 text-red-700 border-red-300'        },
  { value: 'absent',            label: 'Absent / Not in Place',         colour: 'bg-slate-200 text-slate-700 border-slate-400'  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────────────────────────────────────

function getCausalFactorBadge(isCF: boolean, cfType: string) {
  if (!isCF) return null;
  return CAUSAL_FACTOR_TYPES.find(t => t.value === cfType) || CAUSAL_FACTOR_TYPES[1];
}

// ─────────────────────────────────────────────────────────────────────────────
// CAUSAL FACTOR FLAG FORM — reusable across all three tools
// ─────────────────────────────────────────────────────────────────────────────

function CausalFactorFlagForm({ isCausalFactor, causalFactorType, onToggle, onTypeChange }: {
  isCausalFactor: boolean;
  causalFactorType: string;
  onToggle: () => void;
  onTypeChange: (val: string) => void;
}) {
  return (
    <div className={`rounded-lg border p-3 ${isCausalFactor ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={isCausalFactor} onChange={onToggle} className="w-4 h-4 mt-0.5 accent-amber-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-800">Flag as Causal Factor</p>
          <p className="text-xs text-slate-500 mt-0.5">Mark this item for promotion to Step 5 Causal Factor Analysis.</p>
        </div>
      </label>
      {isCausalFactor && (
        <div className="mt-3">
          <label className="block text-xs font-medium text-slate-700 mb-1">Causal Factor Type</label>
          <select
            value={causalFactorType}
            onChange={e => onTypeChange(e.target.value)}
            className="w-full px-3 py-1.5 border border-amber-300 rounded text-sm bg-white focus:ring-2 focus:ring-amber-400"
          >
            {CAUSAL_FACTOR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function Visualisations() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const investigationId = searchParams.get('investigationId');

  const [loading, setLoading] = useState(true);
  const [investigation, setInvestigation] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'5whys' | 'causalTree' | 'fishbone' | 'barriers'>('5whys');

  // ── 5 Whys state ────────────────────────────────────────────
  const [whyChain, setWhyChain] = useState<any[]>([]);
  const [showAddWhy, setShowAddWhy] = useState(false);
  const [editingWhyId, setEditingWhyId] = useState<string | null>(null);
  const [newWhy, setNewWhy] = useState({ answer: '', isRootCause: false, factorType: 'individual' });
  const [editWhy, setEditWhy] = useState({ answer: '', isRootCause: false, factorType: 'individual' });

  // ── Causal Tree state ────────────────────────────────────────
  const [causalTree, setCausalTree] = useState<any[]>([]);
  const [showAddNode, setShowAddNode] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [newNode, setNewNode] = useState({ text: '', nodeType: 'immediate', isCausalFactor: false, causalFactorType: 'contributing' });
  const [editNode, setEditNode] = useState({ text: '', nodeType: '', isCausalFactor: false, causalFactorType: 'contributing' });
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // ── Fishbone state ────────────────────────────────────────────
  const [fishboneProblemStatement, setFishboneProblemStatement] = useState('');
  const [fishboneCauses, setFishboneCauses] = useState<any[]>([]);
  const [fishboneDiagramId, setFishboneDiagramId] = useState<string | null>(null);
  const [editingCauseId, setEditingCauseId] = useState<string | null>(null);
  const [editCause, setEditCause] = useState({ text: '', isCausalFactor: false, causalFactorType: 'contributing' });
  const [fishboneView, setFishboneView] = useState<'list' | 'diagram'>('list');
  const [showFishboneGuidance, setShowFishboneGuidance] = useState(false);

  // ── Barrier state ─────────────────────────────────────────────
  const [barriers, setBarriers] = useState<any[]>([]);
  const [showAddBarrier, setShowAddBarrier] = useState(false);
  const [editingBarrierId, setEditingBarrierId] = useState<string | null>(null);
  const [newBarrier, setNewBarrier] = useState({ name: '', barrierType: 'physical', side: 'prevention', status: 'present_performed', failureReason: '', notes: '' });
  const [editBarrier, setEditBarrier] = useState({ name: '', barrierType: 'physical', side: 'prevention', status: 'present_performed', failureReason: '', notes: '' });
  const [barrierView, setBarrierView] = useState<'list' | 'bowtie'>('list');

  // ─────────────────────────────────────────────────────────────────────────────
  // LOAD
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (investigationId) loadAll();
  }, [investigationId]);

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadInvestigation(), loadWhyChain(), loadCausalTree(), loadFishbone(), loadBarriers()]);
    setLoading(false);
  }

  async function loadInvestigation() {
    const { data } = await supabase.from('investigations').select('*').eq('id', investigationId).single();
    if (data) setInvestigation(data);
  }

  async function loadWhyChain() {
    const { data } = await supabase
      .from('visualization_5whys')
      .select('*')
      .eq('investigation_id', investigationId)
      .order('level', { ascending: true });
    if (data) setWhyChain(data);
  }

  async function loadCausalTree() {
    const { data } = await supabase
      .from('visualization_causal_tree')
      .select('*')
      .eq('investigation_id', investigationId)
      .order('created_at', { ascending: true });
    if (data) setCausalTree(data);
  }

  async function loadFishbone() {
    const { data: diagram } = await supabase
      .from('fishbone_diagrams')
      .select('*')
      .eq('investigation_id', investigationId)
      .single();
    if (!diagram) return;
    setFishboneDiagramId(diagram.id);
    setFishboneProblemStatement(diagram.problem_statement || '');
    const { data: causes } = await supabase
      .from('fishbone_causes')
      .select('*, fishbone_subcauses(*)')
      .eq('fishbone_id', diagram.id)
      .order('display_order', { ascending: true });
    if (causes) {
      setFishboneCauses(causes.map((c: any) => ({
        id: c.id,
        categoryId: c.category_id,
        text: c.cause_text,
        isCausalFactor: c.is_causal_factor || false,
        causalFactorType: c.causal_factor_type || 'contributing',
        subCauses: (c.fishbone_subcauses || []).map((s: any) => s.subcause_text),
      })));
    }
  }

  async function loadBarriers() {
    const { data } = await supabase
      .from('visualization_barriers')
      .select('*')
      .eq('investigation_id', investigationId)
      .order('created_at', { ascending: true});
    if (data) setBarriers(data);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5 WHYS CRUD
  // ─────────────────────────────────────────────────────────────────────────────

  async function handleAddWhy() {
    if (!newWhy.answer.trim()) return;
    if (!newWhy.factorType) { alert('Please select a Factor Classification before saving.'); return; }
    const previousAnswer = whyChain.length > 0
      ? whyChain[whyChain.length - 1].answer
      : investigation?.incident_description || 'the incident';
    const whyData = {
      investigation_id: investigationId,
      level: whyChain.length + 1,
      question: `Why ${whyChain.length + 1}: Why did "${previousAnswer}" occur?`,
      answer: newWhy.answer.trim(),
      is_root_cause: newWhy.isRootCause,
      factor_type: newWhy.factorType,
    };
    const { data, error } = await supabase.from('visualization_5whys').insert([whyData]).select().single();
    if (error) { alert(`Error saving: ${error.message}`); return; }
    setWhyChain([...whyChain, data]);
    setNewWhy({ answer: '', isRootCause: false, factorType: 'individual' });
    setShowAddWhy(false);
  }

  async function handleUpdateWhy() {
    if (!editingWhyId || !editWhy.answer.trim()) return;
    if (!editWhy.factorType) { alert('Please select a Factor Classification before saving.'); return; }
    const { error } = await supabase
      .from('visualization_5whys')
      .update({ answer: editWhy.answer.trim(), is_root_cause: editWhy.isRootCause, factor_type: editWhy.factorType })
      .eq('id', editingWhyId);
    if (error) { alert(`Error updating: ${error.message}`); return; }
    setWhyChain(whyChain.map(w => w.id === editingWhyId
      ? { ...w, answer: editWhy.answer.trim(), is_root_cause: editWhy.isRootCause, factor_type: editWhy.factorType }
      : w
    ));
    setEditingWhyId(null);
  }

  async function handleDeleteWhy(id: string, level: number) {
    if (!confirm(`Delete Why ${level}?`)) return;
    const { error } = await supabase.from('visualization_5whys').delete().eq('id', id);
    if (error) { alert(`Error deleting: ${error.message}`); return; }
    setWhyChain(whyChain.filter(w => w.level < level));
  }

  async function handleClearWhys() {
    if (!confirm('Clear entire 5 Whys chain?')) return;
    const { error } = await supabase.from('visualization_5whys').delete().eq('investigation_id', investigationId);
    if (error) { alert(`Error clearing: ${error.message}`); return; }
    setWhyChain([]);
  }

  async function handleToggleWhyCF(id: string, current: boolean, cfType: string) {
    const { error } = await supabase
      .from('visualization_5whys')
      .update({ is_causal_factor: !current, causal_factor_type: !current ? cfType : null })
      .eq('id', id);
    if (error) { alert(`Error toggling: ${error.message}`); return; }
    setWhyChain(whyChain.map(w => w.id === id ? { ...w, is_causal_factor: !current, causal_factor_type: !current ? cfType : null } : w));
  }

  async function handleUpdateWhyCFType(id: string, cfType: string) {
    const { error } = await supabase.from('visualization_5whys').update({ causal_factor_type: cfType }).eq('id', id);
    if (error) { alert(`Error updating type: ${error.message}`); return; }
    setWhyChain(whyChain.map(w => w.id === id ? { ...w, causal_factor_type: cfType } : w));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CAUSAL TREE CRUD
  // ─────────────────────────────────────────────────────────────────────────────

  async function handleAddNode() {
    if (!newNode.text.trim()) return;
    const nodeData = {
      investigation_id: investigationId,
      parent_node_id: selectedParentId,
      title: newNode.text.trim(),
      node_type: newNode.nodeType || null,
      is_causal_factor: newNode.isCausalFactor,
      causal_factor_type: newNode.isCausalFactor ? newNode.causalFactorType : null,
    };
    const { data, error } = await supabase.from('visualization_causal_tree').insert([nodeData]).select().single();
    if (error) { alert(`Error adding node: ${error.message}`); return; }
    setCausalTree([...causalTree, data]);
    setNewNode({ text: '', nodeType: 'immediate', isCausalFactor: false, causalFactorType: 'contributing' });
    setShowAddNode(false);
    setSelectedParentId(null);
  }

  async function handleUpdateNode(id: string) {
    if (!editNode.text.trim()) return;
    const { error } = await supabase
      .from('visualization_causal_tree')
      .update({
        title: editNode.text.trim(),
        node_type: editNode.nodeType || null,
        is_causal_factor: editNode.isCausalFactor,
        causal_factor_type: editNode.isCausalFactor ? editNode.causalFactorType : null,
      })
      .eq('id', id);
    if (error) { alert(`Error updating: ${error.message}`); return; }
    setCausalTree(causalTree.map(n => n.id === id
      ? { ...n, title: editNode.text.trim(), node_type: editNode.nodeType || null, is_causal_factor: editNode.isCausalFactor, causal_factor_type: editNode.isCausalFactor ? editNode.causalFactorType : null }
      : n
    ));
    setEditingNodeId(null);
  }

  async function handleDeleteNode(id: string) {
    if (!confirm('Delete this node and all children?')) return;
    const nodesToDelete = [id];
    function collectChildren(nodeId: string) {
      const children = causalTree.filter(n => n.parent_node_id === nodeId);
      children.forEach(c => {
        nodesToDelete.push(c.id);
        collectChildren(c.id);
      });
    }
    collectChildren(id);
    const { error } = await supabase.from('visualization_causal_tree').delete().in('id', nodesToDelete);
    if (error) { alert(`Error deleting: ${error.message}`); return; }
    setCausalTree(causalTree.filter(n => !nodesToDelete.includes(n.id)));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FISHBONE CRUD
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!fishboneDiagramId) return;
    const timer = setTimeout(() => saveFishboneData(), 2000);
    return () => clearTimeout(timer);
  }, [fishboneProblemStatement, fishboneCauses]);

  async function saveFishboneData() {
    if (!fishboneDiagramId) return;
    const { error: diagErr } = await supabase
      .from('fishbone_diagrams')
      .update({ problem_statement: fishboneProblemStatement })
      .eq('id', fishboneDiagramId);
    if (diagErr) console.error('Error saving diagram:', diagErr);
    const { error: delErr } = await supabase.from('fishbone_causes').delete().eq('fishbone_id', fishboneDiagramId);
    if (delErr) console.error('Error deleting old causes:', delErr);
    for (let idx = 0; idx < fishboneCauses.length; idx++) {
      const cause = fishboneCauses[idx];
      if (cause.id.toString().startsWith('temp-')) continue;
      const causeData = {
        fishbone_id: fishboneDiagramId,
        category_id: cause.categoryId,
        cause_text: cause.text,
        display_order: idx,
        is_causal_factor: cause.isCausalFactor || false,
        causal_factor_type: cause.isCausalFactor ? cause.causalFactorType : null,
      };
      const { data: insertedCause, error: causeErr } = await supabase
        .from('fishbone_causes')
        .insert([causeData])
        .select()
        .single();
      if (causeErr) { console.error('Error inserting cause:', causeErr); continue; }
      if (cause.subCauses && cause.subCauses.length > 0) {
        for (let subIdx = 0; subIdx < cause.subCauses.length; subIdx++) {
          const subText = cause.subCauses[subIdx];
          const subData = { cause_id: insertedCause.id, subcause_text: subText, display_order: subIdx };
          const { error: subErr } = await supabase.from('fishbone_subcauses').insert([subData]);
          if (subErr) console.error('Error inserting subcause:', subErr);
        }
      }
    }
  }

  async function initializeFishbone() {
    const { data, error } = await supabase
      .from('fishbone_diagrams')
      .insert([{ investigation_id: investigationId, problem_statement: investigation?.incident_description || '' }])
      .select()
      .single();
    if (error) { alert(`Error creating diagram: ${error.message}`); return; }
    setFishboneDiagramId(data.id);
    setFishboneProblemStatement(data.problem_statement || '');
  }

  function addFishboneCause(categoryId: string) {
    const tempId = `temp-${Date.now()}`;
    setFishboneCauses([...fishboneCauses, { id: tempId, categoryId, text: '', isCausalFactor: false, causalFactorType: 'contributing', subCauses: [] }]);
    setEditingCauseId(tempId);
    setEditCause({ text: '', isCausalFactor: false, causalFactorType: 'contributing' });
  }

  function saveFishboneCause(causeId: string) {
    if (!editCause.text.trim()) return;
    setFishboneCauses(fishboneCauses.map(c => c.id === causeId ? { ...c, text: editCause.text.trim(), isCausalFactor: editCause.isCausalFactor, causalFactorType: editCause.causalFactorType } : c));
    setEditingCauseId(null);
  }

  function deleteFishboneCause(causeId: string) {
    setFishboneCauses(fishboneCauses.filter(c => c.id !== causeId));
  }

  function addSubCause(causeId: string) {
    setFishboneCauses(fishboneCauses.map(c => c.id === causeId ? { ...c, subCauses: [...(c.subCauses || []), ''] } : c));
  }

  function updateSubCause(causeId: string, subIdx: number, text: string) {
    setFishboneCauses(fishboneCauses.map(c => {
      if (c.id !== causeId) return c;
      const newSubs = [...(c.subCauses || [])];
      newSubs[subIdx] = text;
      return { ...c, subCauses: newSubs };
    }));
  }

  function deleteSubCause(causeId: string, subIdx: number) {
    setFishboneCauses(fishboneCauses.map(c => {
      if (c.id !== causeId) return c;
      return { ...c, subCauses: c.subCauses.filter((_: any, i: number) => i !== subIdx) };
    }));
  }

  function toggleFishboneCF(causeId: string, current: boolean) {
    setFishboneCauses(fishboneCauses.map(c => c.id === causeId ? { ...c, isCausalFactor: !current } : c));
  }

  function updateFishboneCFType(causeId: string, cfType: string) {
    setFishboneCauses(fishboneCauses.map(c => c.id === causeId ? { ...c, causalFactorType: cfType } : c));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // BARRIER CRUD
  // ─────────────────────────────────────────────────────────────────────────────

  async function handleAddBarrier() {
    if (!newBarrier.name.trim()) return;
    const barrierData = {
      investigation_id: investigationId,
      barrier_name: newBarrier.name.trim(),
      barrier_type: newBarrier.barrierType,
      barrier_side: newBarrier.side,
      status: newBarrier.status,
      failure_reason: newBarrier.failureReason.trim() || null,
      notes: newBarrier.notes.trim() || null,
    };
    const { data, error } = await supabase.from('visualization_barriers').insert([barrierData]).select().single();
    if (error) { alert(`Error adding barrier: ${error.message}`); return; }
    setBarriers([...barriers, data]);
    setNewBarrier({ name: '', barrierType: 'physical', side: 'prevention', status: 'present_performed', failureReason: '', notes: '' });
    setShowAddBarrier(false);
  }

  async function handleUpdateBarrier(id: string) {
    if (!editBarrier.name.trim()) return;
    const { error } = await supabase
      .from('visualization_barriers')
      .update({
        barrier_name: editBarrier.name.trim(),
        barrier_type: editBarrier.barrierType,
        barrier_side: editBarrier.side,
        status: editBarrier.status,
        failure_reason: editBarrier.failureReason.trim() || null,
        notes: editBarrier.notes.trim() || null,
      })
      .eq('id', id);
    if (error) { alert(`Error updating barrier: ${error.message}`); return; }
    setBarriers(barriers.map(b => b.id === id
      ? { ...b, barrier_name: editBarrier.name.trim(), barrier_type: editBarrier.barrierType, barrier_side: editBarrier.side, status: editBarrier.status, failure_reason: editBarrier.failureReason.trim() || null, notes: editBarrier.notes.trim() || null }
      : b
    ));
    setEditingBarrierId(null);
  }

  async function handleDeleteBarrier(id: string) {
    if (!confirm('Delete this barrier?')) return;
    const { error } = await supabase.from('visualization_barriers').delete().eq('id', id);
    if (error) { alert(`Error deleting: ${error.message}`); return; }
    setBarriers(barriers.filter(b => b.id !== id));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CAUSAL TREE RENDERER
  // ─────────────────────────────────────────────────────────────────────────────

  function renderTreeNode(node: any, depth = 0): React.ReactNode {
    const children = causalTree.filter(c => c.parent_node_id === node.id);
    const isExpanded = expandedNodes.has(node.id);
    const cfBadge = getCausalFactorBadge(node.is_causal_factor, node.causal_factor_type);
    const ntInfo = nodeTypes.find(t => t.value === node.node_type);
    return (
      <div key={node.id} style={{ marginLeft: depth * 24 }}>
        <div className={`border rounded-lg p-3 mb-1 ${node.is_causal_factor ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'}`}>
          {editingNodeId === node.id ? (
            <div className="space-y-2">
              <textarea value={editNode.text} onChange={e => setEditNode({ ...editNode, text: e.target.value })}
                rows={2} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500" />
              <select value={editNode.nodeType} onChange={e => setEditNode({ ...editNode, nodeType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded text-sm">
                <option value="">Type (optional)</option>
                {nodeTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <CausalFactorFlagForm
                isCausalFactor={editNode.isCausalFactor}
                causalFactorType={editNode.causalFactorType}
                onToggle={() => setEditNode({ ...editNode, isCausalFactor: !editNode.isCausalFactor })}
                onTypeChange={val => setEditNode({ ...editNode, causalFactorType: val })}
              />
              <div className="flex gap-2">
                <button onClick={() => handleUpdateNode(node.id)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Save</button>
                <button onClick={() => setEditingNodeId(null)} className="px-3 py-1 border border-slate-300 rounded text-sm hover:bg-slate-50">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {ntInfo && <span className={`text-xs px-2 py-0.5 rounded-full border ${ntInfo.colour}`}>{ntInfo.label}</span>}
                  {cfBadge && <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${cfBadge.colour}`}><Flag className="w-2.5 h-2.5" />{cfBadge.label}</span>}
                </div>
                <p className="text-sm text-slate-800">{node.title}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {children.length > 0 && (
                  <button onClick={() => setExpandedNodes(prev => { const next = new Set(prev); isExpanded ? next.delete(node.id) : next.add(node.id); return next; })}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded" title={isExpanded ? 'Collapse' : 'Expand'}>
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                )}
                <button onClick={() => { setShowAddNode(true); setSelectedParentId(node.id); }} className="p-1.5 text-slate-400 hover:text-green-600 rounded hover:bg-green-50" title="Add child node">
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { setEditingNodeId(node.id); setEditNode({ text: node.title, nodeType: node.node_type || '', isCausalFactor: node.is_causal_factor || false, causalFactorType: node.causal_factor_type || 'contributing' }); }}
                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDeleteNode(node.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
        {isExpanded && children.map(child => renderTreeNode(child, depth + 1))}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER GUARDS
  // ─────────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-600">Loading visualisations…</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  const flaggedCount = [
    ...whyChain.filter(w => w.is_causal_factor),
    ...causalTree.filter(n => n.is_causal_factor),
    ...fishboneCauses.filter(c => c.isCausalFactor),
  ].length;

  return (
    <>
      <StepNavigation investigationId={investigationId!} currentStep={4} investigationNumber={investigation?.investigation_number} />
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Step 4: Visualisations</h1>
            <p className="text-slate-500 mt-1">
              Use these tools to explore causal relationships. Flag items as Causal Factors to carry them forward into Step 5 Analysis.
            </p>
            {flaggedCount > 0 && (
              <div className="mt-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <Flag className="w-4 h-4 flex-shrink-0" />
                <span>{flaggedCount} item{flaggedCount !== 1 ? 's' : ''} flagged as Causal Factor{flaggedCount !== 1 ? 's' : ''} — use "Expand from Step 4 Visualisations" in Step 5 to promote them.</span>
              </div>
            )}
          </div>

          {/* Tab bar */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
            <div className="flex border-b border-slate-200">
              {([
                { key: '5whys',      icon: <HelpCircle className="w-4 h-4" />, label: '5 Whys',        count: whyChain.length },
                { key: 'causalTree', icon: <GitBranch  className="w-4 h-4" />, label: 'Causal Tree',   count: causalTree.length },
                { key: 'fishbone',   icon: <Fish        className="w-4 h-4" />, label: 'Fishbone',      count: fishboneCauses.length },
                { key: 'barriers',   icon: <Shield      className="w-4 h-4" />, label: 'Barrier Analysis', count: barriers.length },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.count > 0 && <span className="ml-1 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">{tab.count}</span>}
                </button>
              ))}
            </div>
             {/* ── 5 WHYS TAB ────────────────────────────────────────── */}
            {activeTab === '5whys' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">5 Whys Analysis</h2>
                    <p className="text-sm text-slate-500">Start from the incident and ask "Why?" repeatedly to trace causes back to root systemic factors.</p>
                  </div>
                  {whyChain.length > 0 && (
                    <button onClick={handleClearWhys} className="text-xs px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">Clear All</button>
                  )}
                </div>

                {/* Incident starting point */}
                <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Incident / Starting Point</p>
                  <p className="text-sm text-slate-800">{investigation?.incident_description || 'No incident description recorded.'}</p>
                </div>

                {/* Why chain */}
                {whyChain.map((why, idx) => {
                  const ftInfo = factorTypes.find(t => t.value === why.factor_type);
                  const cfBadge = getCausalFactorBadge(why.is_causal_factor, why.causal_factor_type);
                  return (
                    <div key={why.id} className={`mb-3 border rounded-xl p-4 ${why.is_causal_factor ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'}`}>
                      {editingWhyId === why.id ? (
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">WHY {idx + 1}</p>
                          <textarea value={editWhy.answer} onChange={e => setEditWhy({ ...editWhy, answer: e.target.value })}
                            rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Factor Classification <span className="text-red-500">*</span></label>
                            <select value={editWhy.factorType} onChange={e => setEditWhy({ ...editWhy, factorType: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                              <option value="">Select classification…</option>
                              {factorTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={editWhy.isRootCause} onChange={e => setEditWhy({ ...editWhy, isRootCause: e.target.checked })} className="w-4 h-4 accent-green-600" />
                            <span className="text-sm text-slate-700">Mark as Root Cause</span>
                          </label>
                          <div className="flex gap-2">
                            <button onClick={handleUpdateWhy} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Save</button>
                            <button onClick={() => setEditingWhyId(null)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex flex-wrap gap-1.5 mb-1.5">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">WHY {idx + 1}</span>
                              {ftInfo && <span className={`text-xs px-2 py-0.5 rounded-full border ${ftInfo.colour}`}>{ftInfo.label}</span>}
                              {why.is_root_cause && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-300 font-semibold">Root Cause</span>}
                              {cfBadge && <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${cfBadge.colour}`}><Flag className="w-2.5 h-2.5" />{cfBadge.label}</span>}
                            </div>
                            <p className="text-xs text-slate-400 italic mb-1">{why.question}</p>
                            <p className="text-sm text-slate-800">{why.answer}</p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => { setEditingWhyId(why.id); setEditWhy({ answer: why.answer, isRootCause: why.is_root_cause, factorType: why.factor_type }); }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50"><Edit2 className="w-4 h-4" /></button>
                            {idx === whyChain.length - 1 && (
                              <button onClick={() => handleDeleteWhy(why.id, why.level)} className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                            )}
                          </div>
                        </div>
                      )}
                      {/* CF flag toggle (view mode) */}
                      {editingWhyId !== why.id && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <CausalFactorFlagForm
                            isCausalFactor={why.is_causal_factor || false}
                            causalFactorType={why.causal_factor_type || 'contributing'}
                            onToggle={() => handleToggleWhyCF(why.id, why.is_causal_factor || false, why.causal_factor_type || 'contributing')}
                            onTypeChange={val => handleUpdateWhyCFType(why.id, val)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add Why form */}
                {showAddWhy ? (
                  <div className="border border-blue-200 bg-blue-50 rounded-xl p-4 mb-4 space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">WHY {whyChain.length + 1}</p>
                    {whyChain.length > 0 && (
                      <p className="text-xs text-slate-500 italic">Why did "{whyChain[whyChain.length - 1].answer}" occur?</p>
                    )}
                    <textarea value={newWhy.answer} onChange={e => setNewWhy({ ...newWhy, answer: e.target.value })}
                      placeholder="Enter the cause…" rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Factor Classification <span className="text-red-500">*</span></label>
                      <select value={newWhy.factorType} onChange={e => setNewWhy({ ...newWhy, factorType: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                        <option value="">Select classification…</option>
                        {factorTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={newWhy.isRootCause} onChange={e => setNewWhy({ ...newWhy, isRootCause: e.target.checked })} className="w-4 h-4 accent-green-600" />
                      <span className="text-sm text-slate-700">Mark as Root Cause</span>
                    </label>
                    <div className="flex gap-2">
                      <button onClick={handleAddWhy} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Add Why</button>
                      <button onClick={() => { setShowAddWhy(false); setNewWhy({ answer: '', isRootCause: false, factorType: 'individual' }); }}
                        className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowAddWhy(true)}
                    className="w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors text-sm font-medium">
                    + Add Why {whyChain.length + 1}
                  </button>
                )}
              </div>
            )}

            {/* ── CAUSAL TREE TAB ──────────────────────────────────────── */}
            {activeTab === 'causalTree' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Causal Tree</h2>
                    <p className="text-sm text-slate-500">Build a hierarchical tree showing how immediate causes lead to contributing factors and root causes.</p>
                  </div>
                </div>

                {causalTree.filter(n => !n.parent_node_id).length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                    <GitBranch className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium">No causal tree started</p>
                    <p className="text-slate-500 text-sm mt-1">Add a root node to begin mapping causal relationships.</p>
                    <button onClick={() => { setShowAddNode(true); setSelectedParentId(null); }}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                      <Plus className="w-4 h-4 inline mr-1" />Add Root Node
                    </button>
                  </div>
                ) : (
                  <>
                    {causalTree.filter(n => !n.parent_node_id).map(node => renderTreeNode(node))}
                    <button onClick={() => { setShowAddNode(true); setSelectedParentId(null); }}
                      className="w-full mt-3 px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors text-sm font-medium">
                      + Add Another Root Node
                    </button>
                  </>
                )}

                {/* Add Node Modal */}
                {showAddNode && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">Add Node</h3>
                        <button onClick={() => { setShowAddNode(false); setSelectedParentId(null); setNewNode({ text: '', nodeType: 'immediate', isCausalFactor: false, causalFactorType: 'contributing' }); }}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded"><X className="w-5 h-5" /></button>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Node Text <span className="text-red-500">*</span></label>
                        <textarea value={newNode.text} onChange={e => setNewNode({ ...newNode, text: e.target.value })}
                          placeholder="Describe this causal factor…" rows={3}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Node Type</label>
                        <select value={newNode.nodeType} onChange={e => setNewNode({ ...newNode, nodeType: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                          {nodeTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      {selectedParentId && (
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                          Will be added as child of selected node
                        </div>
                      )}
                      <CausalFactorFlagForm
                        isCausalFactor={newNode.isCausalFactor}
                        causalFactorType={newNode.causalFactorType}
                        onToggle={() => setNewNode({ ...newNode, isCausalFactor: !newNode.isCausalFactor })}
                        onTypeChange={val => setNewNode({ ...newNode, causalFactorType: val })}
                      />
                      <div className="flex gap-2">
                        <button onClick={handleAddNode} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Add Node</button>
                        <button onClick={() => { setShowAddNode(false); setSelectedParentId(null); setNewNode({ text: '', nodeType: 'immediate', isCausalFactor: false, causalFactorType: 'contributing' }); }}
                          className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── FISHBONE TAB ──────────────────────────────────────────── */}
            {activeTab === 'fishbone' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Fishbone Diagram (Ishikawa)</h2>
                    <p className="text-sm text-slate-500">Categorise contributing factors across six analysis categories.</p>
                  </div>
                  <div className="flex gap-2">
                    {fishboneDiagramId && (
                      <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                        <button onClick={() => setFishboneView('list')}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${fishboneView === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                          <List className="w-3.5 h-3.5 inline mr-1" />List View
                        </button>
                        <button onClick={() => setFishboneView('diagram')}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${fishboneView === 'diagram' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                          <Fish className="w-3.5 h-3.5 inline mr-1" />Diagram
                        </button>
                      </div>
                    )}
                    <button onClick={() => setShowFishboneGuidance(!showFishboneGuidance)}
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50">
                      <BookOpen className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {showFishboneGuidance && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-900 space-y-2">
                    <p className="font-semibold">Fishbone Category Guidance</p>
                    <ul className="space-y-1 text-xs">
                      {FISHBONE_CATEGORIES.map(cat => (
                        <li key={cat.id}><span className="font-medium" style={{ color: cat.colour }}>{cat.label}:</span> {cat.description}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {!fishboneDiagramId ? (
                  <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                    <Fish className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium">No fishbone diagram started</p>
                    <p className="text-slate-500 text-sm mt-1">Create a diagram to begin categorising causes.</p>
                    <button onClick={initializeFishbone}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                      <Plus className="w-4 h-4 inline mr-1" />Create Fishbone
                    </button>
                  </div>
                ) : fishboneView === 'list' ? (
                  <>
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-slate-700 mb-1">Problem Statement</label>
                      <textarea value={fishboneProblemStatement} onChange={e => setFishboneProblemStatement(e.target.value)}
                        placeholder="What is the problem being analysed?" rows={2}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                    </div>

                    {FISHBONE_CATEGORIES.map(category => {
                      const categoryCauses = fishboneCauses.filter(c => c.categoryId === category.id);
                      return (
                        <div key={category.id} className="mb-5">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded" style={{ backgroundColor: category.colour }}></div>
                              <h3 className="text-sm font-semibold text-slate-800">{category.label}</h3>
                              <span className="text-xs text-slate-400">{categoryCauses.length}</span>
                            </div>
                            <button onClick={() => addFishboneCause(category.id)}
                              className="text-xs px-2 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded">
                              <Plus className="w-3 h-3 inline mr-1" />Add Cause
                            </button>
                          </div>

                          <div className="space-y-2 pl-5">
                            {categoryCauses.map(cause => (
                              <div key={cause.id} className={`border rounded-lg p-3 ${cause.isCausalFactor ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'}`}>
                                {editingCauseId === cause.id ? (
                                  <div className="space-y-2">
                                    <textarea value={editCause.text} onChange={e => setEditCause({ ...editCause, text: e.target.value })}
                                      rows={2} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500" />
                                    <CausalFactorFlagForm
                                      isCausalFactor={editCause.isCausalFactor}
                                      causalFactorType={editCause.causalFactorType}
                                      onToggle={() => setEditCause({ ...editCause, isCausalFactor: !editCause.isCausalFactor })}
                                      onTypeChange={val => setEditCause({ ...editCause, causalFactorType: val })}
                                    />
                                    <div className="flex gap-2">
                                      <button onClick={() => saveFishboneCause(cause.id)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Save</button>
                                      <button onClick={() => setEditingCauseId(null)} className="px-3 py-1 border border-slate-300 rounded text-sm hover:bg-slate-50">Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1">
                                        {cause.isCausalFactor && (
                                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mb-1 ${getCausalFactorBadge(true, cause.causalFactorType)?.colour || 'bg-amber-100 text-amber-700'}`}>
                                            <Flag className="w-2.5 h-2.5" />{getCausalFactorBadge(true, cause.causalFactorType)?.label || 'Flagged'}
                                          </span>
                                        )}
                                        <p className="text-sm text-slate-800">{cause.text}</p>
                                        {cause.subCauses && cause.subCauses.length > 0 && (
                                          <p className="text-xs text-slate-500 mt-1">+ {cause.subCauses.length} contributing factor(s)</p>
                                        )}
                                      </div>
                                      <div className="flex gap-1 flex-shrink-0">
                                        <button onClick={() => { setEditingCauseId(cause.id); setEditCause({ text: cause.text, isCausalFactor: cause.isCausalFactor, causalFactorType: cause.causalFactorType }); }}
                                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50"><Edit2 className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => deleteFishboneCause(cause.id)}
                                          className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                                      </div>
                                    </div>

                                    {/* Subcauses */}
                                    {editingCauseId !== cause.id && cause.subCauses && cause.subCauses.length > 0 && (
                                      <div className="mt-2 space-y-1 pl-3 border-l-2 border-slate-200">
                                        {cause.subCauses.map((sub: string, subIdx: number) => (
                                          <div key={subIdx} className="flex items-center gap-2 group">
                                            <input type="text" value={sub} onChange={e => updateSubCause(cause.id, subIdx, e.target.value)}
                                              className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-400" />
                                            <button onClick={() => deleteSubCause(cause.id, subIdx)}
                                              className="p-1 text-slate-300 group-hover:text-red-500 rounded"><X className="w-3 h-3" /></button>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {editingCauseId !== cause.id && (
                                      <div className="mt-2 pt-2 border-t border-slate-100">
                                        <button onClick={() => addSubCause(cause.id)}
                                          className="text-xs text-slate-500 hover:text-blue-600">+ Add contributing factor</button>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Problem Statement</p>
                      <p className="text-sm text-slate-800">{fishboneProblemStatement || 'No problem statement defined'}</p>
                    </div>
                    {fishboneCauses.length === 0 ? (
                      <div className="text-center py-12 text-slate-500">
                        <p className="text-sm">No causes added yet. Switch to List View to add causes.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <svg width="900" height="500" className="mx-auto">
                          {/* Head (problem) */}
                          <polygon points="850,250 780,230 780,270" fill="#fbbf24" stroke="#92400e" strokeWidth="2" />
                          <text x="815" y="255" fontSize="10" fill="#92400e" fontWeight="700" textAnchor="middle">PROBLEM</text>

                          {/* Spine */}
                          <line x1="100" y1="250" x2="780" y2="250" stroke="#64748b" strokeWidth="3" />

                          {/* Top bones */}
                          {['people', 'procedures', 'plant'].map((catId, idx) => {
                            const cat = FISHBONE_CATEGORIES.find(c => c.id === catId)!;
                            const causes = fishboneCauses.filter(c => c.categoryId === catId);
                            const x = 200 + idx * 220;
                            return (
                              <g key={catId}>
                                <line x1={x} y1="250" x2={x - 60} y2="150" stroke={cat.colour} strokeWidth="2.5" />
                                <text x={x - 70} y="140" fontSize="11" fill={cat.colour} fontWeight="700" textAnchor="end">{cat.label}</text>
                                {causes.slice(0, 2).map((cause, cIdx) => {
                                  const ty = 170 + cIdx * 35;
                                  const truncated = cause.text.length > 22 ? cause.text.slice(0, 22) + '…' : cause.text;
                                  return (
                                    <g key={cause.id}>
                                      {cause.isCausalFactor && <circle cx={x - 65} cy={ty} r="4" fill="#f59e0b" />}
                                      <text x={x - 72} y={ty + 3} fontSize="8" fill="#475569" textAnchor="end">{truncated}</text>
                                    </g>
                                  );
                                })}
                              </g>
                            );
                          })}

                          {/* Bottom bones */}
                          {['environment', 'management', 'external'].map((catId, idx) => {
                            const cat = FISHBONE_CATEGORIES.find(c => c.id === catId)!;
                            const causes = fishboneCauses.filter(c => c.categoryId === catId);
                            const x = 200 + idx * 220;
                            return (
                              <g key={catId}>
                                <line x1={x} y1="250" x2={x - 60} y2="350" stroke={cat.colour} strokeWidth="2.5" />
                                <text x={x - 70} y="365" fontSize="11" fill={cat.colour} fontWeight="700" textAnchor="end">{cat.label}</text>
                                {causes.slice(0, 2).map((cause, cIdx) => {
                                  const ty = 280 + cIdx * 35;
                                  const truncated = cause.text.length > 22 ? cause.text.slice(0, 22) + '…' : cause.text;
                                  return (
                                    <g key={cause.id}>
                                      {cause.isCausalFactor && <circle cx={x - 65} cy={ty} r="4" fill="#f59e0b" />}
                                      <text x={x - 72} y={ty + 3} fontSize="8" fill="#475569" textAnchor="end">{truncated}</text>
                                    </g>
                                  );
                                })}
                              </g>
                            );
                          })}

                          {/* Legend */}
                          <g>
                            <circle cx="50" cy="30" r="4" fill="#f59e0b" />
                            <text x="60" y="33" fontSize="9" fill="#64748b">Causal Factor</text>
                          </g>
                        </svg>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── BARRIER ANALYSIS TAB ─────────────────────────────────── */}
            {activeTab === 'barriers' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Barrier Analysis</h2>
                    <p className="text-sm text-slate-500">Identify prevention and recovery barriers — which were present, which failed, and which were absent.</p>
                  </div>
                  <div className="flex gap-2">
                    {barriers.length > 0 && (
                      <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                        <button onClick={() => setBarrierView('list')}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${barrierView === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                          <List className="w-3.5 h-3.5 inline mr-1" />List View
                        </button>
                        <button onClick={() => setBarrierView('bowtie')}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${barrierView === 'bowtie' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                          <BowTie className="w-3.5 h-3.5 inline mr-1" />Bow-Tie
                        </button>
                      </div>
                    )}
                    <button onClick={() => setShowAddBarrier(true)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                      <Plus className="w-4 h-4" />Add Barrier
                    </button>
                  </div>
                </div>

                {barrierView === 'bowtie' && barriers.length > 0 ? (
                  /* BOW-TIE DIAGRAM VIEW */
                  <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <BowTieDiagram barriers={barriers} investigation={investigation} />
                  </div>
                ) : (
                  /* LIST VIEW */
                  <>
                    {/* Status summary */}
                    {barriers.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                        {BARRIER_STATUSES.map(bs => {
                          const count = barriers.filter(b => b.status === bs.value).length;
                          return (
                            <div key={bs.value} className={`rounded-xl border p-3 text-center ${bs.colour}`}>
                              <p className="text-2xl font-bold">{count}</p>
                              <p className="text-xs mt-0.5">{bs.label}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add Barrier form */}
                    {showAddBarrier && (
                      <div className="mb-5 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <h3 className="text-sm font-semibold text-slate-800">Add Barrier</h3>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Barrier Name <span className="text-red-500">*</span></label>
                          <input type="text" value={newBarrier.name} onChange={e => setNewBarrier({ ...newBarrier, name: e.target.value })}
                            placeholder="e.g. Pressure Relief Valve, Permit to Work system…"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Barrier Type</label>
                            <select value={newBarrier.barrierType} onChange={e => setNewBarrier({ ...newBarrier, barrierType: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                              {BARRIER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Barrier Side</label>
                            <select value={newBarrier.side} onChange={e => setNewBarrier({ ...newBarrier, side: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                              <option value="prevention">Prevention (stops incident occurring)</option>
                              <option value="recovery">Recovery (limits consequences)</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                          <select value={newBarrier.status} onChange={e => setNewBarrier({ ...newBarrier, status: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                            {BARRIER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </div>
                        {(newBarrier.status === 'present_failed' || newBarrier.status === 'present_partial' || newBarrier.status === 'absent') && (
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Failure / Absence Reason</label>
                            <textarea value={newBarrier.failureReason} onChange={e => setNewBarrier({ ...newBarrier, failureReason: e.target.value })}
                              placeholder="Describe why this barrier failed or was not in place…" rows={2}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                          </div>
                        )}
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Notes (optional)</label>
                          <textarea value={newBarrier.notes} onChange={e => setNewBarrier({ ...newBarrier, notes: e.target.value })}
                            placeholder="Additional observations…" rows={2}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleAddBarrier} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Save Barrier</button>
                          <button onClick={() => { setShowAddBarrier(false); setNewBarrier({ name: '', barrierType: 'physical', side: 'prevention', status: 'present_performed', failureReason: '', notes: '' }); }}
                            className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
                        </div>
                      </div>
                    )}

                    {/* Barrier list grouped by side */}
                    {barriers.length === 0 ? (
                      <div className="text-center py-12 text-slate-500">
                        <Shield className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                        <p className="font-medium">No barriers recorded yet</p>
                        <p className="text-sm mt-1">Add prevention barriers (stops incident) and recovery barriers (limits consequences).</p>
                      </div>
                    ) : (
                      ['prevention', 'recovery'].map(side => {
                        const sideBars = barriers.filter(b => b.barrier_side === side);
                        if (sideBars.length === 0) return null;
                        return (
                          <div key={side} className="mb-5">
                            <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                              <Shield className="w-4 h-4 text-slate-400" />
                              {side === 'prevention' ? 'Prevention Barriers' : 'Recovery Barriers'}
                              <span className="ml-1 px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full text-xs">{sideBars.length}</span>
                            </h3>
                            <div className="space-y-2">
                              {sideBars.map(barrier => {
                                const statusInfo = BARRIER_STATUSES.find(s => s.value === barrier.status);
                                const typeInfo = BARRIER_TYPES.find(t => t.value === barrier.barrier_type);
                                return (
                                  <div key={barrier.id} className="border border-slate-200 bg-white rounded-xl p-4">
                                    {editingBarrierId === barrier.id ? (
                                      <div className="space-y-3">
                                        <input type="text" value={editBarrier.name} onChange={e => setEditBarrier({ ...editBarrier, name: e.target.value })}
                                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                                        <div className="grid grid-cols-2 gap-3">
                                          <select value={editBarrier.barrierType} onChange={e => setEditBarrier({ ...editBarrier, barrierType: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                                            {BARRIER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                          </select>
                                          <select value={editBarrier.side} onChange={e => setEditBarrier({ ...editBarrier, side: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                                            <option value="prevention">Prevention</option>
                                            <option value="recovery">Recovery</option>
                                          </select>
                                        </div>
                                        <select value={editBarrier.status} onChange={e => setEditBarrier({ ...editBarrier, status: e.target.value })}
                                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                                          {BARRIER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                        </select>
                                        {(editBarrier.status === 'present_failed' || editBarrier.status === 'present_partial' || editBarrier.status === 'absent') && (
                                          <textarea value={editBarrier.failureReason} onChange={e => setEditBarrier({ ...editBarrier, failureReason: e.target.value })}
                                            placeholder="Failure / absence reason…" rows={2}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                        )}
                                        <textarea value={editBarrier.notes} onChange={e => setEditBarrier({ ...editBarrier, notes: e.target.value })}
                                          placeholder="Notes (optional)…" rows={2}
                                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                        <div className="flex gap-2">
                                          <button onClick={() => handleUpdateBarrier(barrier.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Save</button>
                                          <button onClick={() => setEditingBarrierId(null)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                          <div className="flex flex-wrap gap-1.5 mb-1">
                                            {statusInfo && <span className={`text-xs px-2 py-0.5 rounded-full border ${statusInfo.colour}`}>{statusInfo.label}</span>}
                                            {typeInfo && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">{typeInfo.label}</span>}
                                          </div>
                                          <p className="text-sm font-medium text-slate-900">{barrier.barrier_name}</p>
                                          {barrier.failure_reason && <p className="text-xs text-red-700 mt-1"><span className="font-medium">Failure reason:</span> {barrier.failure_reason}</p>}
                                          {barrier.notes && <p className="text-xs text-slate-500 mt-0.5">{barrier.notes}</p>}
                                        </div>
                                        <div className="flex gap-1 flex-shrink-0">
                                          <button onClick={() => { setEditingBarrierId(barrier.id); setEditBarrier({ name: barrier.barrier_name, barrierType: barrier.barrier_type, side: barrier.barrier_side, status: barrier.status, failureReason: barrier.failure_reason || '', notes: barrier.notes || '' }); }}
                                            className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"><Edit2 className="w-4 h-4" /></button>
                                          <button onClick={() => handleDeleteBarrier(barrier.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* Guidance */}
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-blue-900 mb-1">Barrier Analysis Best Practice</p>
                          <p className="text-sm text-blue-800">
                            Prevention barriers should have stopped the incident from occurring. Recovery barriers limit the consequences once an incident is underway.
                            For each failed or absent barrier, the reason for failure often reveals a causal factor — flag it in Step 5 Analysis.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOW-TIE DIAGRAM COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function BowTieDiagram({ barriers, investigation }: { barriers: any[]; investigation: any }) {
  const preventionBarriers = barriers.filter(b => b.barrier_side === 'prevention');
  const recoveryBarriers = barriers.filter(b => b.barrier_side === 'recovery');

  if (preventionBarriers.length === 0 && recoveryBarriers.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Shield className="w-10 h-10 mx-auto mb-3 text-slate-300" />
        <p className="text-sm">No barriers to display. Switch to List View to add barriers.</p>
      </div>
    );
  }

  // Layout constants
  const sliceWidth = 110;
  const sliceGap = 20;
  const svgHeight = 340;
  const sliceTop = 70;
  const sliceBottom = 270;
  const sliceHeight = sliceBottom - sliceTop;
  const midY = svgHeight / 2;

  // Zones
  const hazardZone = 70;
  const topEventWidth = 100;
  const topEventGap = 28;
  const consequenceZone = 70;

  const preventionWidth = preventionBarriers.length * (sliceWidth + sliceGap);
  const recoveryWidth = recoveryBarriers.length * (sliceWidth + sliceGap);

  const svgWidth = hazardZone + preventionWidth + topEventGap + topEventWidth + topEventGap + recoveryWidth + consequenceZone + 20;

  // X positions
  const prevStartX = hazardZone;
  const topEventX = hazardZone + preventionWidth + topEventGap;
  const topEventCx = topEventX + topEventWidth / 2;
  const recovStartX = topEventX + topEventWidth + topEventGap;
  const consequenceCx = recovStartX + recoveryWidth + 30;

  function getSliceColour(status: string) {
    switch (status) {
      case 'present_performed': return { fill: '#dcfce7', stroke: '#16a34a', text: '#15803d' };
      case 'present_partial':   return { fill: '#fef3c7', stroke: '#d97706', text: '#b45309' };
      case 'present_failed':    return { fill: '#fee2e2', stroke: '#dc2626', text: '#b91c1c' };
      case 'absent':            return { fill: '#f1f5f9', stroke: '#94a3b8', text: '#64748b' };
      default:                  return { fill: '#f1f5f9', stroke: '#94a3b8', text: '#64748b' };
    }
  }

  function getHoles(status: string): { cx: number; cy: number; r: number }[] {
    switch (status) {
      case 'present_performed': return [];
      case 'present_partial':   return [{ cx: sliceWidth / 2, cy: sliceHeight * 0.38, r: 16 }];
      case 'present_failed':    return [
        { cx: sliceWidth / 2 - 14, cy: sliceHeight * 0.28, r: 14 },
        { cx: sliceWidth / 2 + 12, cy: sliceHeight * 0.52, r: 18 },
        { cx: sliceWidth / 2 - 6,  cy: sliceHeight * 0.70, r: 11 }
      ];
      case 'absent':            return [{ cx: sliceWidth / 2, cy: sliceHeight * 0.5, r: 38 }];
      default: return [];
    }
  }

  function renderSlice(barrier: any, x: number) {
    const colours = getSliceColour(barrier.status);
    const holes = getHoles(barrier.status);
    return (
      <g key={barrier.id}>
        <rect x={x} y={sliceTop} width={sliceWidth} height={sliceHeight} rx="6"
          fill={colours.fill} stroke={colours.stroke} strokeWidth="2.5" />
        {holes.map((hole, idx) => (
          <circle key={idx} cx={x + hole.cx} cy={sliceTop + hole.cy} r={hole.r}
            fill="white" stroke={colours.stroke} strokeWidth="1.5" />
        ))}
        <foreignObject x={x + 4} y={sliceTop + 6} width={sliceWidth - 8} height={sliceHeight - 12}>
          <div style={{ fontSize: '8px', color: colours.text, fontWeight: 600, lineHeight: '1.2', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
            {barrier.barrier_name.length > 50 ? barrier.barrier_name.slice(0, 50) + '…' : barrier.barrier_name}
          </div>
        </foreignObject>
      </g>
    );
  }

  return (
    <>
      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border border-green-500"></div>
          <span className="text-slate-600">Performed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-100 border border-amber-500"></div>
          <span className="text-slate-600">Partial</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 border border-red-500"></div>
          <span className="text-slate-600">Failed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-100 border border-slate-400"></div>
          <span className="text-slate-600">Absent</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg width={svgWidth} height={svgHeight} className="mx-auto">
          {/* Defs */}
          <defs>
            <marker id="arrow-red" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
            </marker>
            <marker id="arrow-orange" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#f97316" />
            </marker>
          </defs>

          {/* Hazard → first prevention slice */}
          <line x1="10" y1={midY} x2={prevStartX} y2={midY} stroke="#ef4444" strokeWidth="2.5" markerEnd="url(#arrow-red)" />
          {/* Last prevention slice → top event */}
          {preventionBarriers.length > 0 && (
            <line x1={prevStartX + preventionWidth} y1={midY} x2={topEventX} y2={midY} stroke="#ef4444" strokeWidth="2.5" markerEnd="url(#arrow-red)" />
          )}
          {/* Top event → first recovery slice */}
          <line x1={topEventX + topEventWidth} y1={midY} x2={recovStartX} y2={midY} stroke="#f97316" strokeWidth="2.5" markerEnd="url(#arrow-orange)" />
          {/* Last recovery slice → consequence */}
          {recoveryBarriers.length > 0 && (
            <line x1={recovStartX + recoveryWidth} y1={midY} x2={consequenceCx - 28} y2={midY} stroke="#f97316" strokeWidth="2.5" markerEnd="url(#arrow-orange)" />
          )}

          {/* HAZARD label */}
          <text x="8" y={midY - 12} fontSize="10" fill="#ef4444" fontWeight="700">HAZARD</text>

          {/* PREVENTION section label */}
          {preventionBarriers.length > 0 && (
            <text
              x={prevStartX + preventionWidth / 2 - (sliceGap / 2)}
              y={sliceTop - 12}
              fontSize="11" fill="#1d4ed8" fontWeight="700" textAnchor="middle"
            >── PREVENTION ──</text>
          )}

          {/* Prevention barrier slices */}
          {preventionBarriers.map((barrier, idx) => renderSlice(barrier, prevStartX + idx * (sliceWidth + sliceGap)))}

          {/* TOP EVENT node (centre) */}
          <rect x={topEventX} y={midY - 36} width={topEventWidth} height={72} rx="8"
            fill="#fef3c7" stroke="#f59e0b" strokeWidth="2.5" />
          <text x={topEventCx} y={midY - 10} fontSize="10" fill="#92400e" fontWeight="700" textAnchor="middle">💥 TOP</text>
          <text x={topEventCx} y={midY + 6}  fontSize="10" fill="#92400e" fontWeight="700" textAnchor="middle">EVENT</text>
          <foreignObject x={topEventX + 4} y={midY + 14} width={topEventWidth - 8} height={22}>
            <div style={{ fontSize: '8px', color: '#b45309', textAlign: 'center', lineHeight: '1.2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {investigation?.incident_description || ''}
            </div>
          </foreignObject>

          {/* RECOVERY section label */}
          {recoveryBarriers.length > 0 && (
            <text
              x={recovStartX + recoveryWidth / 2 - (sliceGap / 2)}
              y={sliceTop - 12}
              fontSize="11" fill="#7c3aed" fontWeight="700" textAnchor="middle"
            >── RECOVERY ──</text>
          )}

          {/* Recovery barrier slices */}
          {recoveryBarriers.map((barrier, idx) => renderSlice(barrier, recovStartX + idx * (sliceWidth + sliceGap)))}

          {/* CONSEQUENCE target */}
          <circle cx={consequenceCx} cy={midY} r="26" fill="#fff7ed" stroke="#f97316" strokeWidth="2.5" />
          <circle cx={consequenceCx} cy={midY} r="15" fill="#fed7aa" stroke="#f97316" strokeWidth="1.5" />
          <circle cx={consequenceCx} cy={midY} r="5"  fill="#f97316" />
          <text x={consequenceCx} y={midY + 40} fontSize="9" fill="#c2410c" fontWeight="700" textAnchor="middle">CONSEQUENCE</text>
        </svg>
      </div>

      {/* Summary stats */}
      <div className="mt-6 grid grid-cols-4 gap-3">
        {[
          { label: 'Performed', status: 'present_performed', colour: 'bg-green-50 border-green-200 text-green-700' },
          { label: 'Partial',   status: 'present_partial',   colour: 'bg-amber-50 border-amber-200 text-amber-700' },
          { label: 'Failed',    status: 'present_failed',    colour: 'bg-red-50 border-red-200 text-red-700' },
          { label: 'Absent',    status: 'absent',            colour: 'bg-slate-50 border-slate-200 text-slate-600' }
        ].map(item => {
          const count = barriers.filter(b => b.status === item.status).length;
          return (
            <div key={item.status} className={`rounded-xl border p-3 text-center ${item.colour}`}>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs mt-0.5">{item.label}</p>
            </div>
          );
        })}
      </div>
    </>
  );
}      
