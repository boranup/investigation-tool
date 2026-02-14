'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, Network, GitBranch,
         Shield, HelpCircle, Fish, Flag, X, CheckCircle, Info, BookOpen } from 'lucide-react';
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
      .order('created_at', { ascending: true });
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
    const { error } = await supabase.from('visualization_5whys').update({
      answer: editWhy.answer.trim(),
      is_root_cause: editWhy.isRootCause,
      factor_type: editWhy.factorType,
    }).eq('id', editingWhyId);
    if (error) { alert(`Error updating: ${error.message}`); return; }
    setWhyChain(prev => prev.map(w => w.id === editingWhyId ? { ...w, answer: editWhy.answer, is_root_cause: editWhy.isRootCause, factor_type: editWhy.factorType } : w));
    setEditingWhyId(null);
  }

  async function handleDeleteWhy(id: string, level: number) {
    if (!confirm('Delete this level and all subsequent levels?')) return;
    await supabase.from('visualization_5whys').delete().eq('investigation_id', investigationId).gte('level', level);
    setWhyChain(prev => prev.filter(w => w.level < level));
  }

  async function handleClearWhys() {
    if (!confirm('Clear the entire 5 Whys chain? This cannot be undone.')) return;
    await supabase.from('visualization_5whys').delete().eq('investigation_id', investigationId);
    setWhyChain([]);
  }

  async function handleToggleWhyCF(id: string, currentCF: boolean, currentType: string) {
    const newCF = !currentCF;
    await supabase.from('visualization_5whys').update({ is_causal_factor: newCF, causal_factor_type: newCF ? (currentType || 'contributing') : null }).eq('id', id);
    setWhyChain(prev => prev.map(w => w.id === id ? { ...w, is_causal_factor: newCF, causal_factor_type: newCF ? (currentType || 'contributing') : null } : w));
  }

  async function handleUpdateWhyCFType(id: string, cfType: string) {
    await supabase.from('visualization_5whys').update({ causal_factor_type: cfType }).eq('id', id);
    setWhyChain(prev => prev.map(w => w.id === id ? { ...w, causal_factor_type: cfType } : w));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CAUSAL TREE CRUD
  // ─────────────────────────────────────────────────────────────────────────────

  async function handleAddNode() {
    if (!newNode.text.trim()) return;
    const { data, error } = await supabase.from('visualization_causal_tree').insert([{
      investigation_id: investigationId,
      title: newNode.text.trim(),
      node_type: newNode.nodeType || null,
      factor_category: null,
      parent_node_id: selectedParentId,
      is_causal_factor: newNode.isCausalFactor,
      causal_factor_type: newNode.isCausalFactor ? newNode.causalFactorType : null,
    }]).select().single();
    if (error) { alert(`Error saving node: ${error.message}`); return; }
    setCausalTree(prev => [...prev, data]);
    if (selectedParentId) {
      setExpandedNodes(prev => { const next = new Set(prev); next.add(selectedParentId); return next; });
    }
    setNewNode({ text: '', nodeType: 'immediate', isCausalFactor: false, causalFactorType: 'contributing' });
    setShowAddNode(false);
    setSelectedParentId(null);
  }

  async function handleUpdateNode(id: string) {
    const { error } = await supabase.from('visualization_causal_tree').update({
      title: editNode.text,
      node_type: editNode.nodeType || null,
      is_causal_factor: editNode.isCausalFactor,
      causal_factor_type: editNode.isCausalFactor ? editNode.causalFactorType : null,
    }).eq('id', id);
    if (error) { alert(`Error updating: ${error.message}`); return; }
    setCausalTree(prev => prev.map(n => n.id === id ? { ...n, title: editNode.text, node_type: editNode.nodeType, is_causal_factor: editNode.isCausalFactor, causal_factor_type: editNode.causalFactorType } : n));
    setEditingNodeId(null);
  }

  async function handleDeleteNode(id: string) {
    if (!confirm('Delete this node and all its children?')) return;
    const children = causalTree.filter(n => n.parent_node_id === id);
    for (const child of children) await handleDeleteNode(child.id);
    await supabase.from('visualization_causal_tree').delete().eq('id', id);
    setCausalTree(prev => prev.filter(n => n.id !== id));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FISHBONE CRUD
  // ─────────────────────────────────────────────────────────────────────────────

  // Auto-save fishbone
  useEffect(() => {
    const timer = setTimeout(() => {
      if (investigationId && (fishboneProblemStatement || fishboneCauses.length > 0)) {
        saveFishboneData();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [fishboneProblemStatement, fishboneCauses]);

  async function saveFishboneData() {
    try {
      const { data: diagram } = await supabase
        .from('fishbone_diagrams')
        .upsert({ investigation_id: investigationId, problem_statement: fishboneProblemStatement, updated_at: new Date().toISOString() }, { onConflict: 'investigation_id' })
        .select().single();
      if (!diagram) return;
      setFishboneDiagramId(diagram.id);
      await supabase.from('fishbone_causes').delete().eq('fishbone_id', diagram.id);
      for (let i = 0; i < fishboneCauses.length; i++) {
        const cause = fishboneCauses[i];
        const { data: insertedCause } = await supabase
          .from('fishbone_causes')
          .insert({ fishbone_id: diagram.id, category_id: cause.categoryId, cause_text: cause.text, display_order: i, is_causal_factor: cause.isCausalFactor || false, causal_factor_type: cause.isCausalFactor ? cause.causalFactorType : null })
          .select().single();
        if (insertedCause && cause.subCauses?.length > 0) {
          await supabase.from('fishbone_subcauses').insert(
            cause.subCauses.map((sc: string, idx: number) => ({ cause_id: insertedCause.id, subcause_text: sc, display_order: idx }))
          );
        }
      }
    } catch (err) { console.error('Error saving fishbone:', err); }
  }

  function addFishboneCause(categoryId: string) {
    const newCauseObj = { id: `temp-${Date.now()}`, categoryId, text: '', isCausalFactor: false, causalFactorType: 'contributing', subCauses: [] };
    setFishboneCauses(prev => [...prev, newCauseObj]);
    setEditingCauseId(newCauseObj.id);
    setEditCause({ text: '', isCausalFactor: false, causalFactorType: 'contributing' });
  }

  function saveFishboneCause(causeId: string) {
    if (!editCause.text.trim()) {
      setFishboneCauses(prev => prev.filter(c => c.id !== causeId));
      setEditingCauseId(null);
      return;
    }
    setFishboneCauses(prev => prev.map(c =>
      c.id === causeId ? { ...c, text: editCause.text.trim(), isCausalFactor: editCause.isCausalFactor, causalFactorType: editCause.causalFactorType } : c
    ));
    setEditingCauseId(null);
  }

  function deleteFishboneCause(causeId: string) {
    setFishboneCauses(prev => prev.filter(c => c.id !== causeId));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // BARRIER CRUD
  // ─────────────────────────────────────────────────────────────────────────────

  async function handleAddBarrier() {
    if (!newBarrier.name.trim()) return;
    const { data, error } = await supabase.from('visualization_barriers').insert([{
      investigation_id: investigationId,
      barrier_name: newBarrier.name.trim(),
      barrier_type: newBarrier.barrierType,
      barrier_side: newBarrier.side,
      status: newBarrier.status,
      failure_reason: newBarrier.failureReason.trim() || null,
      notes: newBarrier.notes.trim() || null,
    }]).select().single();
    if (error) { alert(`Error saving barrier: ${error.message}`); return; }
    setBarriers(prev => [...prev, data]);
    setNewBarrier({ name: '', barrierType: 'physical', side: 'prevention', status: 'present_performed', failureReason: '', notes: '' });
    setShowAddBarrier(false);
  }

  async function handleUpdateBarrier(id: string) {
    const { error } = await supabase.from('visualization_barriers').update({
      barrier_name: editBarrier.name.trim(),
      barrier_type: editBarrier.barrierType,
      barrier_side: editBarrier.side,
      status: editBarrier.status,
      failure_reason: editBarrier.failureReason.trim() || null,
      notes: editBarrier.notes.trim() || null,
    }).eq('id', id);
    if (error) { alert(`Error updating barrier: ${error.message}`); return; }
    setBarriers(prev => prev.map(b => b.id === id ? { ...b, barrier_name: editBarrier.name, barrier_type: editBarrier.barrierType, barrier_side: editBarrier.side, status: editBarrier.status, failure_reason: editBarrier.failureReason || null, notes: editBarrier.notes || null } : b));
    setEditingBarrierId(null);
  }

  async function handleDeleteBarrier(id: string) {
    if (!confirm('Delete this barrier?')) return;
    await supabase.from('visualization_barriers').delete().eq('id', id);
    setBarriers(prev => prev.filter(b => b.id !== id));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FISHBONE SVG DIAGRAM — pure SVG, no foreignObject
  // ─────────────────────────────────────────────────────────────────────────────

  function FishboneDiagramVisual() {
    const svgWidth = 1100;
    const svgHeight = 580;
    const spineY = svgHeight / 2;
    const headX = svgWidth - 90;
    const tailX = 60;
    const spineLen = headX - tailX;
    const boneLen = 140;
    const boneSpacingX = spineLen / 4;

    const topCats = FISHBONE_CATEGORIES.slice(0, 3);
    const botCats = FISHBONE_CATEGORIES.slice(3, 6);

    type BonePos = { x: number; side: 'top' | 'bottom'; cat: typeof FISHBONE_CATEGORIES[0] };
    const bonePositions: BonePos[] = [
      { x: tailX + boneSpacingX * 1, side: 'top',    cat: topCats[0] },
      { x: tailX + boneSpacingX * 2, side: 'top',    cat: topCats[1] },
      { x: tailX + boneSpacingX * 3, side: 'top',    cat: topCats[2] },
      { x: tailX + boneSpacingX * 1, side: 'bottom', cat: botCats[0] },
      { x: tailX + boneSpacingX * 2, side: 'bottom', cat: botCats[1] },
      { x: tailX + boneSpacingX * 3, side: 'bottom', cat: botCats[2] },
    ];

    function trunc(text: string, max: number) {
      return text.length > max ? text.slice(0, max - 1) + '…' : text;
    }

    return (
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full min-w-[700px]" style={{ fontFamily: 'Arial, sans-serif' }}>
          <line x1={tailX} y1={spineY} x2={headX - 10} y2={spineY} stroke="#1e293b" strokeWidth="3" />
          <polygon points={`${headX - 10},${spineY - 9} ${headX + 10},${spineY} ${headX - 10},${spineY + 9}`} fill="#1e293b" />
          <rect x={headX + 12} y={spineY - 30} width={64} height={60} rx={5} fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
          <text x={headX + 44} y={spineY - 10} textAnchor="middle" fontSize="8" fontWeight="700" fill="white">{trunc((fishboneProblemStatement || 'Problem').split(' ').slice(0,3).join(' '),14)}</text>
          <text x={headX + 44} y={spineY + 4}  textAnchor="middle" fontSize="8" fontWeight="700" fill="white">{trunc((fishboneProblemStatement || 'Statement').split(' ').slice(3,6).join(' '),14)}</text>
          <text x={headX + 44} y={spineY + 18} textAnchor="middle" fontSize="8" fontWeight="700" fill="white">{trunc((fishboneProblemStatement || '').split(' ').slice(6).join(' '),14)}</text>
          {bonePositions.map(({ x, side, cat }) => {
            const dir = side === 'top' ? -1 : 1;
            const tipY = spineY + dir * boneLen;
            const causes = fishboneCauses.filter(c => c.categoryId === cat.id);
            return (
              <g key={cat.id}>
                <line x1={x} y1={spineY} x2={x} y2={tipY} stroke={cat.colour} strokeWidth="2.5" />
                <text x={x} y={tipY + dir * 16} textAnchor="middle" fontSize="11" fontWeight="700" fill={cat.colour}>{cat.label}</text>
                {causes.slice(0, 4).map((cause, i) => {
                  const causeY = spineY + dir * (30 + i * 26);
                  const branchDir = i % 2 === 0 ? -1 : 1;
                  const tipCX = x + branchDir * 68;
                  const isCF = cause.isCausalFactor;
                  const subs = cause.subCauses || [];
                  return (
                    <g key={cause.id}>
                      <title>{cause.text}{isCF ? ` ▶ ${CAUSAL_FACTOR_TYPES.find(t => t.value === cause.causalFactorType)?.label || 'Causal Factor'}` : ''}{subs.length > 0 ? `\n+${subs.length} contributing factor(s)` : ''}</title>
                      <line x1={x} y1={causeY} x2={tipCX} y2={causeY} stroke={cat.colour} strokeWidth="1.5" strokeDasharray={isCF ? '0' : '4,3'} />
                      {isCF && <circle cx={branchDir > 0 ? tipCX - 5 : tipCX + 5} cy={causeY} r="4" fill="#d97706" />}
                      <text x={branchDir > 0 ? tipCX + 5 : tipCX - 5} y={causeY - 3} textAnchor={branchDir > 0 ? 'start' : 'end'} fontSize="9" fill={isCF ? '#92400e' : '#1e293b'} fontWeight={isCF ? '700' : '400'}>{trunc(cause.text, 22)}</text>
                      {subs.length > 0 && <text x={branchDir > 0 ? tipCX + 5 : tipCX - 5} y={causeY + 9} textAnchor={branchDir > 0 ? 'start' : 'end'} fontSize="7" fill="#64748b">+{subs.length} contributing factor{subs.length !== 1 ? 's' : ''}</text>}
                    </g>
                  );
                })}
                {causes.length > 4 && <text x={x} y={spineY + dir * (30 + 4 * 26 + 10)} textAnchor="middle" fontSize="8" fill="#94a3b8" fontStyle="italic">+{causes.length - 4} more (List View)</text>}
              </g>
            );
          })}
        </svg>
        <div className="mt-3 flex flex-wrap gap-6 justify-center text-xs text-slate-500">
          <div className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-amber-500"></span><span>Flagged as Causal Factor</span></div>
          <div className="flex items-center gap-1.5"><svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4,3" /></svg><span>Dashed = not yet flagged</span></div>
        </div>
        <p className="text-center text-xs text-slate-400 mt-1 italic">Hover over any label to see full text. Switch to List View to add, edit, or flag items.</p>
      </div>
    );
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
                      <button onClick={handleAddWhy} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Save</button>
                      <button onClick={() => { setShowAddWhy(false); setNewWhy({ answer: '', isRootCause: false, factorType: 'individual' }); }} className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowAddWhy(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors text-sm">
                    <Plus className="w-4 h-4" />
                    {whyChain.length === 0 ? 'Add First Why' : `Add Why ${whyChain.length + 1}`}
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
                    <p className="text-sm text-slate-500">Build a hierarchical tree of causes branching from the incident. Flag nodes as Causal Factors for Step 5 analysis.</p>
                  </div>
                  <button onClick={() => { setShowAddNode(true); setSelectedParentId(null); }}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                    <Plus className="w-4 h-4" />Add Node
                  </button>
                </div>

                {/* Add Node form */}
                {showAddNode && (
                  <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <p className="text-sm font-medium text-slate-700">
                      {selectedParentId ? `Add child of: "${causalTree.find(n => n.id === selectedParentId)?.title || '...'}"` : 'Add top-level node'}
                    </p>
                    <textarea value={newNode.text} onChange={e => setNewNode({ ...newNode, text: e.target.value })}
                      placeholder="Describe this cause or condition…" rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                    <select value={newNode.nodeType} onChange={e => setNewNode({ ...newNode, nodeType: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                      <option value="">Type (optional)</option>
                      {nodeTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    {causalTree.length > 0 && (
                      <select value={selectedParentId || ''} onChange={e => setSelectedParentId(e.target.value || null)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                        <option value="">No parent (top-level)</option>
                        {causalTree.map(n => <option key={n.id} value={n.id}>{(n.title || '').slice(0, 60)}</option>)}
                      </select>
                    )}
                    <CausalFactorFlagForm
                      isCausalFactor={newNode.isCausalFactor}
                      causalFactorType={newNode.causalFactorType}
                      onToggle={() => setNewNode({ ...newNode, isCausalFactor: !newNode.isCausalFactor })}
                      onTypeChange={val => setNewNode({ ...newNode, causalFactorType: val })}
                    />
                    <div className="flex gap-2">
                      <button onClick={handleAddNode} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Save Node</button>
                      <button onClick={() => { setShowAddNode(false); setSelectedParentId(null); setNewNode({ text: '', nodeType: 'immediate', isCausalFactor: false, causalFactorType: 'contributing' }); }}
                        className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
                    </div>
                  </div>
                )}

                {causalTree.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Network className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium">No causal tree nodes yet</p>
                    <p className="text-sm mt-1">Start with the incident or top event, then branch outward.</p>
                  </div>
                ) : (
                  <div>{causalTree.filter(n => !n.parent_node_id).map(node => renderTreeNode(node))}</div>
                )}
              </div>
            )}

            {/* ── FISHBONE TAB ─────────────────────────────────────────── */}
            {activeTab === 'fishbone' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Fishbone (Ishikawa) Diagram</h2>
                    <p className="text-sm text-slate-500">Brainstorm potential causes across six standard categories. Auto-saves as you work.</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowFishboneGuidance(v => !v)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-600 hover:bg-slate-50">
                      <BookOpen className="w-3.5 h-3.5" />Guidance
                    </button>
                    <button onClick={() => setFishboneView(v => v === 'list' ? 'diagram' : 'list')}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-600 hover:bg-slate-50">
                      <Fish className="w-3.5 h-3.5" />{fishboneView === 'list' ? 'Diagram View' : 'List View'}
                    </button>
                  </div>
                </div>

                {showFishboneGuidance && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-start justify-between">
                      <h3 className="text-sm font-semibold text-blue-900 mb-2">How to use the Fishbone Diagram</h3>
                      <button onClick={() => setShowFishboneGuidance(false)} className="text-blue-400 hover:text-blue-600"><X className="w-4 h-4" /></button>
                    </div>
                    <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Enter the problem or incident outcome in the Problem Statement field below.</li>
                      <li>For each category, click "Add Cause" to record a possible contributing cause.</li>
                      <li>Use contributing factors (sub-causes) to capture conditions that led to each cause.</li>
                      <li>Flag any cause as a Causal Factor once you have enough evidence to support it.</li>
                      <li>Switch to Diagram View for a visual overview of all causes across categories.</li>
                    </ol>
                  </div>
                )}

                {/* Problem statement */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Problem Statement</label>
                  <input type="text" value={fishboneProblemStatement}
                    onChange={e => setFishboneProblemStatement(e.target.value)}
                    placeholder="What is the specific problem or incident outcome being analysed?"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                </div>

                {fishboneView === 'diagram' ? (
                  <FishboneDiagramVisual />
                ) : (
                  <div className="space-y-4">
                    {FISHBONE_CATEGORIES.map(cat => {
                      const catCauses = fishboneCauses.filter(c => c.categoryId === cat.id);
                      return (
                        <div key={cat.id} className="border border-slate-200 rounded-xl overflow-hidden">
                          <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: cat.colour + '18', borderBottom: `2px solid ${cat.colour}` }}>
                            <div>
                              <h3 className="text-sm font-semibold" style={{ color: cat.colour }}>{cat.label}</h3>
                              <p className="text-xs text-slate-500">{cat.description}</p>
                            </div>
                            <button onClick={() => addFishboneCause(cat.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
                              style={{ backgroundColor: cat.colour }}>
                              <Plus className="w-3.5 h-3.5" />Add Cause
                            </button>
                          </div>
                          <div className="p-3 space-y-2">
                            {catCauses.length === 0 && (
                              <p className="text-xs text-slate-400 italic text-center py-2">No causes recorded for this category yet.</p>
                            )}
                            {catCauses.map(cause => (
                              <div key={cause.id} className={`rounded-lg border p-3 ${cause.isCausalFactor ? 'border-amber-300 bg-amber-50' : 'bg-white border-slate-200'}`}>
                                {editingCauseId === cause.id ? (
                                  <div className="space-y-2">
                                    <textarea value={editCause.text}
                                      onChange={e => setEditCause({ ...editCause, text: e.target.value })}
                                      placeholder="Describe this cause…" rows={2}
                                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                      autoFocus />
                                    <CausalFactorFlagForm
                                      isCausalFactor={editCause.isCausalFactor}
                                      causalFactorType={editCause.causalFactorType}
                                      onToggle={() => setEditCause({ ...editCause, isCausalFactor: !editCause.isCausalFactor })}
                                      onTypeChange={val => setEditCause({ ...editCause, causalFactorType: val })}
                                    />
                                    <div className="flex gap-2">
                                      <button onClick={() => saveFishboneCause(cause.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Save</button>
                                      <button onClick={() => { setEditingCauseId(null); if (cause.text === '') deleteFishboneCause(cause.id); }}
                                        className="px-3 py-1.5 border border-slate-300 rounded text-sm hover:bg-slate-50">Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                      {cause.isCausalFactor && (
                                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border mb-1 ${CAUSAL_FACTOR_TYPES.find(t => t.value === cause.causalFactorType)?.colour || 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                          <Flag className="w-2.5 h-2.5" />
                                          {CAUSAL_FACTOR_TYPES.find(t => t.value === cause.causalFactorType)?.label || 'Causal Factor'}
                                        </span>
                                      )}
                                      <p className="text-sm text-slate-800">{cause.text}</p>
                                      {cause.subCauses?.length > 0 && (
                                        <ul className="mt-1 space-y-0.5">
                                          {cause.subCauses.map((sc: string, i: number) => (
                                            <li key={i} className="text-xs text-slate-500 flex items-start gap-1"><span className="text-slate-300 mt-0.5">└</span>{sc}</li>
                                          ))}
                                        </ul>
                                      )}
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0">
                                      <button onClick={() => { setEditingCauseId(cause.id); setEditCause({ text: cause.text, isCausalFactor: cause.isCausalFactor, causalFactorType: cause.causalFactorType }); }}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50"><Edit2 className="w-4 h-4" /></button>
                                      <button onClick={() => deleteFishboneCause(cause.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
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
                  <button onClick={() => setShowAddBarrier(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                    <Plus className="w-4 h-4" />Add Barrier
                  </button>
                </div>

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
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}      
