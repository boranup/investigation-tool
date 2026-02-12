'use client'

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Network, Plus, Trash2, Edit2, ChevronDown, ChevronRight, AlertCircle, X, HelpCircle, Download, Info, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import StepNavigation from '@/components/StepNavigation';

export default function Visualisations() {
  const searchParams = useSearchParams();
  const investigationId = searchParams.get('investigationId');

  const [loading, setLoading] = useState(true);
  const [investigation, setInvestigation] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'5whys' | 'causalTree' | 'barriers' | 'fishbone'>('5whys');

  const [whyChain, setWhyChain] = useState<any[]>([]);
  const [showAddWhy, setShowAddWhy] = useState(false);
  const [editingWhyId, setEditingWhyId] = useState<string | null>(null);
  const [editWhy, setEditWhy] = useState({ answer: '', isRootCause: false, factorType: 'individual' });
  const [newWhy, setNewWhy] = useState({ answer: '', isRootCause: false, factorType: 'individual' });

  const [causalTree, setCausalTree] = useState<any[]>([]);
  const [showAddNode, setShowAddNode] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [newNode, setNewNode] = useState({ title: '', description: '', nodeType: '', factorCategory: '' });
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [editingTreeNodeId, setEditingTreeNodeId] = useState<string | null>(null);
  const [editNode, setEditNode] = useState({ title: '', description: '', nodeType: '', factorCategory: '' });

  const [barriers, setBarriers] = useState<any[]>([]);
  const [causalFactors, setCausalFactors] = useState<any[]>([]);
  const [barrierView, setBarrierView] = useState<'list' | 'swisscheese'>('list');
  const [showAddBarrier, setShowAddBarrier] = useState(false);
  const [showCauseTypeModal, setShowCauseTypeModal] = useState(false);
  const [editingBarrierId, setEditingBarrierId] = useState<string | null>(null);
  const [newBarrier, setNewBarrier] = useState({
    name: '',
    barrierType: 'physical',
    side: 'prevention',
    status: 'present_performed',
    failureReason: '',
    notes: '',
    causalFactorId: ''
  });
  const [editBarrier, setEditBarrier] = useState({
    name: '',
    barrierType: 'physical',
    side: 'prevention',
    status: 'present_performed',
    failureReason: '',
    notes: '',
    causalFactorId: ''
  });

  const [fishboneCauses, setFishboneCauses] = useState<any[]>([]);
  const [fishboneProblemStatement, setFishboneProblemStatement] = useState('');
  const [editingCauseId, setEditingCauseId] = useState<string | null>(null);
  const [showGuidance, setShowGuidance] = useState(true);
  const [editCause, setEditCause] = useState({ text: '', subCauses: [] as string[] });
  const [fishboneView, setFishboneView] = useState<'list' | 'diagram'>('list');

  const factorTypes = [
    { value: 'individual', label: 'Individual / Team', color: 'bg-red-100 text-red-700 border-red-200' },
    { value: 'organisational', label: 'Organisational', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { value: 'equipment', label: 'Equipment / Systems', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'procedure', label: 'Procedure / Process', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { value: 'external', label: 'External', color: 'bg-green-100 text-green-700 border-green-200' }
  ];

  const nodeTypes = [
    { value: 'immediate', label: 'Immediate Cause', color: 'bg-red-100 text-red-700 border-red-300' },
    { value: 'contributing', label: 'Contributing Factor', color: 'bg-amber-100 text-amber-700 border-amber-300' },
    { value: 'root', label: 'Root Cause', color: 'bg-green-100 text-green-700 border-green-300' }
  ];

  const factorCategories = [
    { value: 'equipment', label: 'Equipment / Hardware' },
    { value: 'procedure', label: 'Procedure / Process' },
    { value: 'human_factors', label: 'Human Factors' },
    { value: 'organisational', label: 'Organisational' },
    { value: 'external', label: 'External' }
  ];

  const FISHBONE_CATEGORIES = [
    { id: 'people', label: 'People', description: 'Human factors, competence, awareness, fatigue, communication', position: 'top', examples: 'Inadequate training, fatigue, competency gaps, communication breakdown', color: 'border-blue-500' },
    { id: 'procedures', label: 'Procedures', description: 'Work instructions, permits, standards, compliance', position: 'top', examples: 'Procedure not followed, inadequate procedure, conflicting instructions', color: 'border-blue-500' },
    { id: 'plant', label: 'Plant/Equipment', description: 'Machinery, tools, systems, design, maintenance', position: 'top', examples: 'Equipment failure, design flaw, inadequate maintenance, tool deficiency', color: 'border-blue-500' },
    { id: 'environment', label: 'Environment', description: 'Weather, lighting, noise, workspace layout, housekeeping', position: 'bottom', examples: 'Poor visibility, extreme weather, confined space, cluttered workspace', color: 'border-purple-500' },
    { id: 'management', label: 'Management Systems', description: 'Planning, risk assessment, supervision, resource allocation', position: 'bottom', examples: 'Inadequate planning, insufficient resources, lack of supervision, poor risk assessment', color: 'border-purple-500' },
    { id: 'external', label: 'External Factors', description: 'Contractors, suppliers, regulatory changes, third parties', position: 'bottom', examples: 'Contractor performance, supplier quality, regulatory compliance, third-party actions', color: 'border-purple-500' }
  ];

  const causeTypeDefinitions = [
    { label: 'Immediate Cause', definition: 'What directly led to the incident at the point it occurred. The final unsafe act or condition that triggered the event.', guidance: 'Immediate causes explain what happened — but not why it was allowed to happen.' },
    { label: 'Contributing Factor', definition: 'Conditions or influences that increased the likelihood or severity of the incident but did not directly trigger it alone.', guidance: 'Contributing factors create the environment where the immediate cause could occur.' },
    { label: 'Root Cause', definition: 'The most fundamental underlying system or organisational failure that, if corrected, would prevent recurrence or significantly reduce likelihood.', guidance: 'Root causes explain why the causal and immediate causes existed in the first place.' }
  ];

  const rootCauseDefinition = {
    definition: 'The most fundamental underlying system or organisational failure that, if corrected, would prevent recurrence or significantly reduce likelihood.',
    guidance: 'Root causes explain why the causal and immediate causes existed in the first place.'
  };

  useEffect(() => {
    if (investigationId) {
      loadInvestigation();
      loadVisualisations();
      loadCausalFactors();
    }
  }, [investigationId]);

  async function loadInvestigation() {
    try {
      const { data } = await supabase.from('investigations').select('*').eq('id', investigationId).single();
      setInvestigation(data);
    } catch (err) { console.error('Error loading investigation:', err); }
  }

  async function loadCausalFactors() {
    try {
      const { data } = await supabase
        .from('causal_factors')
        .select('id, causal_factor_title, factor_type')
        .eq('investigation_id', investigationId)
        .order('created_at', { ascending: true });
      setCausalFactors(data || []);
    } catch (err) { console.error('Error loading causal factors:', err); }
  }

  async function loadVisualisations() {
    try {
      const { data: whyData } = await supabase.from('visualization_5whys').select('*').eq('investigation_id', investigationId).order('level', { ascending: true });
      setWhyChain(whyData || []);

      const { data: treeData } = await supabase.from('visualization_causal_tree').select('*').eq('investigation_id', investigationId).order('created_at', { ascending: true });
      setCausalTree(treeData || []);
      if (treeData && treeData.length > 0) {
        const parentIds = new Set<string>();
        treeData.forEach((node: any) => { if (node.parent_node_id) parentIds.add(node.parent_node_id); });
        setExpandedNodes(parentIds);
      }

      const { data: barrierData, error: barrierError } = await supabase.from('visualization_barriers').select('*').eq('investigation_id', investigationId).order('created_at', { ascending: true });
      if (barrierError) throw barrierError;
      setBarriers(barrierData || []);

      await loadFishboneData();
    } catch (err) { console.error('Error loading visualisations:', err); }
    finally { setLoading(false); }
  }

  async function loadFishboneData() {
    try {
      const { data: diagram } = await supabase.from('fishbone_diagrams').select(`*, fishbone_causes (*, fishbone_subcauses (*))`).eq('investigation_id', investigationId).single();
      if (diagram) {
        setFishboneProblemStatement(diagram.problem_statement || '');
        const causes = (diagram.fishbone_causes || []).map((cause: any) => ({
          id: cause.id, categoryId: cause.category_id, text: cause.cause_text,
          subCauses: (cause.fishbone_subcauses || []).sort((a: any, b: any) => a.display_order - b.display_order).map((sc: any) => sc.subcause_text)
        }));
        setFishboneCauses(causes);
      }
    } catch (err) { console.error('Error loading fishbone:', err); }
  }

  async function saveFishboneData() {
    try {
      const { data: diagram, error: diagramError } = await supabase.from('fishbone_diagrams').upsert({ investigation_id: investigationId, problem_statement: fishboneProblemStatement, updated_at: new Date().toISOString() }, { onConflict: 'investigation_id' }).select().single();
      if (diagramError) throw diagramError;
      await supabase.from('fishbone_causes').delete().eq('fishbone_id', diagram.id);
      for (let i = 0; i < fishboneCauses.length; i++) {
        const cause = fishboneCauses[i];
        const { data: insertedCause, error: causeError } = await supabase.from('fishbone_causes').insert({ fishbone_id: diagram.id, category_id: cause.categoryId, cause_text: cause.text, display_order: i }).select().single();
        if (causeError) throw causeError;
        if (cause.subCauses && cause.subCauses.length > 0) {
          const { error: subCauseError } = await supabase.from('fishbone_subcauses').insert(cause.subCauses.map((sc: string, idx: number) => ({ cause_id: insertedCause.id, subcause_text: sc, display_order: idx })));
          if (subCauseError) throw subCauseError;
        }
      }
    } catch (err: any) { console.error('Error saving fishbone:', err); alert(`Failed to save fishbone data: ${err.message}`); }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (investigationId && (fishboneProblemStatement || fishboneCauses.length > 0)) saveFishboneData();
    }, 2000);
    return () => clearTimeout(timer);
  }, [fishboneProblemStatement, fishboneCauses, investigationId]);

  function addFishboneCause(categoryId: string) {
    const newCauseObj = { id: `temp-${Date.now()}`, categoryId, text: '', subCauses: [] };
    setFishboneCauses([...fishboneCauses, newCauseObj]);
    setEditingCauseId(newCauseObj.id);
    setEditCause({ text: '', subCauses: [] });
  }

  function updateFishboneCause(causeId: string) {
    setFishboneCauses(prev => prev.map(c => c.id === causeId ? { ...c, text: editCause.text, subCauses: editCause.subCauses } : c));
    setEditingCauseId(null);
  }

  function deleteFishboneCause(causeId: string) { setFishboneCauses(prev => prev.filter(c => c.id !== causeId)); }
  function getCausesForCategory(categoryId: string) { return fishboneCauses.filter(c => c.categoryId === categoryId); }

  function exportFishbone() {
    const data = { problemStatement: fishboneProblemStatement, categories: FISHBONE_CATEGORIES.map(cat => ({ ...cat, causes: getCausesForCategory(cat.id).map(c => ({ mainCause: c.text, contributingFactors: c.subCauses })) })), exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `fishbone-diagram-${investigationId}-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  async function addWhyLevel() {
    if (!newWhy.answer.trim()) { alert('Please provide an answer before adding a level.'); return; }
    try {
      const previousAnswer = whyChain.length > 0 ? whyChain[whyChain.length - 1].answer : investigation?.incident_description || 'the incident';
      const { data, error } = await supabase.from('visualization_5whys').insert([{ investigation_id: investigationId, level: whyChain.length + 1, question: `Why ${whyChain.length + 1}: Why did "${previousAnswer}" occur?`, answer: newWhy.answer.trim(), is_root_cause: newWhy.isRootCause, factor_type: newWhy.factorType }]).select().single();
      if (error) throw error;
      setWhyChain([...whyChain, data]);
      setNewWhy({ answer: '', isRootCause: false, factorType: 'individual' });
      setShowAddWhy(false);
    } catch (err: any) { console.error('Error adding why level:', err); alert(`Error: ${err.message}`); }
  }

  async function deleteWhyLevel(id: string, level: number) {
    if (!confirm('Delete this level and all subsequent levels?')) return;
    try {
      const { error } = await supabase.from('visualization_5whys').delete().eq('investigation_id', investigationId).gte('level', level);
      if (error) throw error;
      loadVisualisations();
    } catch (err) { console.error('Error deleting why level:', err); }
  }

  async function clearWhyChain() {
    if (!confirm('Clear the entire 5 Whys chain? This cannot be undone.')) return;
    try {
      const { error } = await supabase.from('visualization_5whys').delete().eq('investigation_id', investigationId);
      if (error) throw error;
      setWhyChain([]);
    } catch (err) { console.error('Error clearing chain:', err); }
  }

  async function updateWhyLevel() {
    if (!editingWhyId) return;
    try {
      const { error } = await supabase.from('visualization_5whys').update({ answer: editWhy.answer.trim(), is_root_cause: editWhy.isRootCause, factor_type: editWhy.factorType }).eq('id', editingWhyId);
      if (error) throw error;
      setWhyChain(prev => prev.map(w => w.id === editingWhyId ? { ...w, answer: editWhy.answer.trim(), is_root_cause: editWhy.isRootCause, factor_type: editWhy.factorType } : w));
      setEditingWhyId(null);
    } catch (err: any) { console.error('Error updating why level:', err); alert(`Error: ${err.message}`); }
  }

  async function updateTreeNode() {
    if (!editingTreeNodeId) return;
    try {
      const { error } = await supabase.from('visualization_causal_tree').update({ title: editNode.title.trim(), description: editNode.description.trim() || null, node_type: editNode.nodeType || null, factor_category: editNode.factorCategory || null }).eq('id', editingTreeNodeId);
      if (error) throw error;
      setCausalTree(prev => prev.map(n => n.id === editingTreeNodeId ? { ...n, title: editNode.title.trim(), description: editNode.description.trim() || null, node_type: editNode.nodeType || null, factor_category: editNode.factorCategory || null } : n));
      setEditingTreeNodeId(null);
    } catch (err: any) { console.error('Error updating tree node:', err); alert(`Error: ${err.message}`); }
  }

  async function addTreeNode() {
    if (!newNode.title.trim()) { alert('Please provide a title.'); return; }
    try {
      const { data, error } = await supabase.from('visualization_causal_tree').insert([{ investigation_id: investigationId, parent_node_id: selectedParentId, title: newNode.title.trim(), description: newNode.description.trim() || null, node_type: newNode.nodeType || null, factor_category: newNode.factorCategory || null }]).select().single();
      if (error) throw error;
      setCausalTree([...causalTree, data]);
      if (selectedParentId) setExpandedNodes(prev => { const next = new Set(prev); next.add(selectedParentId); return next; });
      setNewNode({ title: '', description: '', nodeType: '', factorCategory: '' });
      setSelectedParentId(null);
      setShowAddNode(false);
    } catch (err: any) { console.error('Error adding tree node:', err); alert(`Error: ${err.message}`); }
  }

  async function deleteTreeNode(id: string) {
    if (!confirm('Delete this node and all its children?')) return;
    try {
      const idsToDelete = new Set<string>();
      const collectChildren = (parentId: string) => { idsToDelete.add(parentId); causalTree.filter(n => n.parent_node_id === parentId).forEach(child => collectChildren(child.id)); };
      collectChildren(id);
      const { error } = await supabase.from('visualization_causal_tree').delete().in('id', Array.from(idsToDelete));
      if (error) throw error;
      setCausalTree(causalTree.filter(n => !idsToDelete.has(n.id)));
    } catch (err) { console.error('Error deleting node:', err); }
  }

  async function addBarrier() {
    if (!investigationId || !newBarrier.name.trim()) return;
    const needsReason = ['present_failed', 'present_partial', 'absent'].includes(newBarrier.status);
    if (needsReason && !newBarrier.failureReason.trim()) { alert('Please provide a reason for the barrier failure or absence.'); return; }
    try {
      const { data, error } = await supabase.from('visualization_barriers').insert({
        investigation_id: investigationId,
        barrier_name: newBarrier.name.trim(),
        barrier_type: newBarrier.barrierType,
        barrier_side: newBarrier.side,
        status: newBarrier.status,
        failure_reason: needsReason ? newBarrier.failureReason.trim() : null,
        notes: newBarrier.notes.trim() || null,
        causal_factor_id: newBarrier.causalFactorId || null
      }).select().single();
      if (error) throw error;
      setBarriers([...barriers, data]);
      setNewBarrier({ name: '', barrierType: 'physical', side: 'prevention', status: 'present_performed', failureReason: '', notes: '', causalFactorId: '' });
      setShowAddBarrier(false);
    } catch (err: any) { console.error('Error adding barrier:', err); alert(`Error: ${err.message}`); }
  }

  async function updateBarrier() {
    if (!editingBarrierId || !editBarrier.name.trim()) return;
    const needsReason = ['present_failed', 'present_partial', 'absent'].includes(editBarrier.status);
    if (needsReason && !editBarrier.failureReason.trim()) { alert('Please provide a reason for the barrier failure or absence.'); return; }
    try {
      const { error } = await supabase.from('visualization_barriers').update({
        barrier_name: editBarrier.name.trim(),
        barrier_type: editBarrier.barrierType,
        barrier_side: editBarrier.side,
        status: editBarrier.status,
        failure_reason: needsReason ? editBarrier.failureReason.trim() : null,
        notes: editBarrier.notes.trim() || null,
        causal_factor_id: editBarrier.causalFactorId || null
      }).eq('id', editingBarrierId);
      if (error) throw error;
      setBarriers(prev => prev.map(b => b.id === editingBarrierId ? { ...b, barrier_name: editBarrier.name.trim(), barrier_type: editBarrier.barrierType, barrier_side: editBarrier.side, status: editBarrier.status, failure_reason: needsReason ? editBarrier.failureReason.trim() : null, notes: editBarrier.notes.trim() || null, causal_factor_id: editBarrier.causalFactorId || null } : b));
      setEditingBarrierId(null);
    } catch (err: any) { console.error('Error updating barrier:', err); alert(`Error: ${err.message}`); }
  }

  async function deleteBarrier(id: string) {
    try {
      const { error } = await supabase.from('visualization_barriers').delete().eq('id', id);
      if (error) throw error;
      setBarriers(prev => prev.filter(b => b.id !== id));
    } catch (err: any) { console.error('Error deleting barrier:', err); alert(`Error: ${err.message}`); }
  }

  function getBarrierStatusStyle(status: string) {
    switch (status) {
      case 'present_performed': return 'bg-green-100 text-green-700';
      case 'present_partial': return 'bg-amber-100 text-amber-700';
      case 'present_failed': return 'bg-red-100 text-red-700';
      case 'absent': return 'bg-slate-100 text-slate-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  }

  function getBarrierStatusLabel(status: string) {
    switch (status) {
      case 'present_performed': return 'Present & Performed';
      case 'present_partial': return 'Present & Partial';
      case 'present_failed': return 'Present & Failed';
      case 'absent': return 'Absent';
      default: return status;
    }
  }

  function getBarrierTypeLabel(type: string) {
    switch (type) {
      case 'physical': return 'Physical';
      case 'administrative': return 'Administrative';
      case 'detection': return 'Detection';
      case 'communication': return 'Communication';
      case 'recovery': return 'Recovery';
      default: return type;
    }
  }

  function toggleExpand(id: string) {
    setExpandedNodes(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  function getNodeTypeStyle(type: string | null) {
    if (!type) return 'bg-slate-100 text-slate-600 border-slate-300';
    return nodeTypes.find(t => t.value === type)?.color || 'bg-slate-100 text-slate-600 border-slate-300';
  }

  function getFactorTypeStyle(type: string) {
    return factorTypes.find(t => t.value === type)?.color || 'bg-grey-100 text-grey-700 border-grey-200';
  }

  // ============================================================================
  // SWISS CHEESE DIAGRAM COMPONENT
  // ============================================================================

  function SwissCheeseVisual() {
    const preventionBarriers = barriers.filter(b => b.barrier_side === 'prevention');
    const mitigationBarriers = barriers.filter(b => b.barrier_side === 'mitigation');

    if (preventionBarriers.length === 0 && mitigationBarriers.length === 0) {
      return (
        <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No barriers to display</p>
          <p className="text-slate-400 text-xs mt-1">Switch to List View to add barriers</p>
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

    // Zones: hazard anchor | prevention slices | top event node | mitigation slices | consequence anchor
    const hazardZone = 70;
    const topEventWidth = 100;
    const topEventGap = 28;
    const consequenceZone = 70;

    const preventionWidth = preventionBarriers.length * (sliceWidth + sliceGap);
    const mitigationWidth = mitigationBarriers.length * (sliceWidth + sliceGap);

    const svgWidth = hazardZone + preventionWidth + topEventGap + topEventWidth + topEventGap + mitigationWidth + consequenceZone + 20;

    // X positions
    const prevStartX = hazardZone;
    const topEventX = hazardZone + preventionWidth + topEventGap;
    const topEventCx = topEventX + topEventWidth / 2;
    const mitStartX = topEventX + topEventWidth + topEventGap;
    const consequenceCx = mitStartX + mitigationWidth + 30;

    function getSliceColour(status: string) {
      switch (status) {
        case 'present_performed': return { fill: '#dcfce7', stroke: '#16a34a', text: '#15803d' };
        case 'present_partial':   return { fill: '#fef3c7', stroke: '#d97706', text: '#b45309' };
        case 'present_failed':    return { fill: '#fee2e2', stroke: '#dc2626', text: '#b91c1c' };
        case 'absent':            return { fill: '#f1f5f9', stroke: '#94a3b8', text: '#64748b' };
        default:                  return { fill: '#f1f5f9', stroke: '#94a3b8', text: '#64748b' };
      }
    }

    function getHoles(status: string): { cx: number, cy: number, r: number }[] {
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
      const linkedFactor = causalFactors.find(f => f.id === barrier.causal_factor_id);
      return (
        <g key={barrier.id}>
          <defs>
            <clipPath id={`clip-${barrier.id}`}>
              <rect x={x} y={sliceTop} width={sliceWidth} height={sliceHeight} rx="6" />
            </clipPath>
          </defs>
          <rect x={x} y={sliceTop} width={sliceWidth} height={sliceHeight} rx="6" fill={colours.fill} stroke={colours.stroke} strokeWidth="2" />
          {holes.map((hole, hIdx) => (
            <circle key={hIdx} cx={x + hole.cx} cy={sliceTop + hole.cy} r={hole.r}
              fill="white" stroke={colours.stroke} strokeWidth="1" strokeDasharray="3,2"
              clipPath={`url(#clip-${barrier.id})`} />
          ))}
          <foreignObject x={x + 4} y={sliceTop + 6} width={sliceWidth - 8} height={60}>
            <div style={{ fontSize: '10px', fontWeight: '600', color: colours.text, textAlign: 'center', lineHeight: '1.3', wordBreak: 'break-word' }}>
              {barrier.barrier_name}
            </div>
          </foreignObject>
          <foreignObject x={x + 4} y={sliceBottom - 44} width={sliceWidth - 8} height={40}>
            <div style={{ fontSize: '9px', color: colours.text, textAlign: 'center' }}>
              <div style={{ background: 'white', borderRadius: '4px', padding: '2px 4px', marginBottom: '2px', opacity: 0.9 }}>
                {getBarrierTypeLabel(barrier.barrier_type)}
              </div>
              {linkedFactor && (
                <div style={{ background: 'white', borderRadius: '4px', padding: '2px 4px', opacity: 0.9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  🔗 {linkedFactor.causal_factor_title.substring(0, 14)}{linkedFactor.causal_factor_title.length > 14 ? '…' : ''}
                </div>
              )}
            </div>
          </foreignObject>
        </g>
      );
    }

    return (
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6 text-xs">
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-green-100 border border-green-500"></div><span className="text-slate-600">Present & Performed (no holes)</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-amber-100 border border-amber-500"></div><span className="text-slate-600">Present & Partial (small hole)</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-100 border border-red-500"></div><span className="text-slate-600">Present & Failed (large holes)</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-slate-100 border border-slate-400"></div><span className="text-slate-600">Absent (missing slice)</span></div>
        </div>

        <div className="overflow-x-auto">
          <svg width={svgWidth} height={svgHeight}>
            <defs>
              <marker id="arrow-red" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
              </marker>
              <marker id="arrow-orange" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#f97316" />
              </marker>
            </defs>

            {/* ── Horizontal spine ── */}
            {/* Hazard → first prevention slice */}
            <line x1="10" y1={midY} x2={prevStartX} y2={midY} stroke="#ef4444" strokeWidth="2.5" markerEnd="url(#arrow-red)" />
            {/* Last prevention slice → top event */}
            <line x1={prevStartX + preventionWidth} y1={midY} x2={topEventX} y2={midY} stroke="#ef4444" strokeWidth="2.5" markerEnd="url(#arrow-red)" />
            {/* Top event → first mitigation slice */}
            <line x1={topEventX + topEventWidth} y1={midY} x2={mitStartX} y2={midY} stroke="#f97316" strokeWidth="2.5" markerEnd="url(#arrow-orange)" />
            {/* Last mitigation slice → consequence */}
            {mitigationBarriers.length > 0 && (
              <line x1={mitStartX + mitigationWidth} y1={midY} x2={consequenceCx - 28} y2={midY} stroke="#f97316" strokeWidth="2.5" markerEnd="url(#arrow-orange)" />
            )}

            {/* ── HAZARD label ── */}
            <text x="8" y={midY - 12} fontSize="10" fill="#ef4444" fontWeight="700">HAZARD</text>

            {/* ── PREVENTION section label ── */}
            {preventionBarriers.length > 0 && (
              <text
                x={prevStartX + preventionWidth / 2 - (sliceGap / 2)}
                y={sliceTop - 12}
                fontSize="11" fill="#1d4ed8" fontWeight="700" textAnchor="middle"
              >── PREVENTION ──</text>
            )}

            {/* ── Prevention barrier slices ── */}
            {preventionBarriers.map((barrier, idx) => renderSlice(barrier, prevStartX + idx * (sliceWidth + sliceGap)))}

            {/* ── TOP EVENT node (centre) ── */}
            <rect x={topEventX} y={midY - 36} width={topEventWidth} height={72} rx="8"
              fill="#fef3c7" stroke="#f59e0b" strokeWidth="2.5" />
            <text x={topEventCx} y={midY - 10} fontSize="10" fill="#92400e" fontWeight="700" textAnchor="middle">💥 TOP</text>
            <text x={topEventCx} y={midY + 6}  fontSize="10" fill="#92400e" fontWeight="700" textAnchor="middle">EVENT</text>
            <foreignObject x={topEventX + 4} y={midY + 14} width={topEventWidth - 8} height={22}>
              <div style={{ fontSize: '8px', color: '#b45309', textAlign: 'center', lineHeight: '1.2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {investigation?.incident_description || ''}
              </div>
            </foreignObject>

            {/* ── MITIGATION section label ── */}
            {mitigationBarriers.length > 0 && (
              <text
                x={mitStartX + mitigationWidth / 2 - (sliceGap / 2)}
                y={sliceTop - 12}
                fontSize="11" fill="#7c3aed" fontWeight="700" textAnchor="middle"
              >── MITIGATION ──</text>
            )}

            {/* ── Mitigation barrier slices ── */}
            {mitigationBarriers.map((barrier, idx) => renderSlice(barrier, mitStartX + idx * (sliceWidth + sliceGap)))}

            {/* ── CONSEQUENCE target ── */}
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
          ].map(item => (
            <div key={item.status} className={`border rounded-lg p-3 text-center ${item.colour}`}>
              <div className="text-2xl font-bold">{barriers.filter(b => b.status === item.status).length}</div>
              <div className="text-xs font-medium mt-1">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Failed/absent barriers detail */}
        {barriers.some(b => ['present_failed', 'present_partial', 'absent'].includes(b.status)) && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-red-800 mb-3">Failed / Absent Barriers — Failure Reasons</h4>
            <div className="space-y-2">
              {barriers.filter(b => ['present_failed', 'present_partial', 'absent'].includes(b.status)).map(barrier => (
                <div key={barrier.id} className="text-sm">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mr-2 ${getBarrierStatusStyle(barrier.status)}`}>
                    {getBarrierStatusLabel(barrier.status)}
                  </span>
                  <span className="font-medium text-red-900">{barrier.barrier_name}:</span>
                  <span className="text-red-700 ml-1">{barrier.failure_reason || 'No reason provided'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 text-center text-xs text-slate-400">
          Diagram shows barriers left to right from hazard to incident. Holes represent failure points where the hazard can pass through.
        </div>
      </div>
    );
  }

  // ============================================================================
  // BARRIER CARD COMPONENT (shared between list and edit views)
  // ============================================================================

  function BarrierCard({ barrier }: { barrier: any }) {
    const linkedFactor = causalFactors.find(f => f.id === barrier.causal_factor_id);

    if (editingBarrierId === barrier.id) {
      return (
        <div className="bg-white border-2 border-blue-400 rounded-lg p-4 space-y-3">
          <input
            type="text"
            value={editBarrier.name}
            onChange={(e) => setEditBarrier({ ...editBarrier, name: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Barrier name..."
          />
          <div className="grid grid-cols-2 gap-3">
            <select value={editBarrier.barrierType} onChange={(e) => setEditBarrier({ ...editBarrier, barrierType: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
              <option value="physical">Physical</option>
              <option value="administrative">Administrative</option>
              <option value="detection">Detection</option>
              <option value="communication">Communication</option>
              <option value="recovery">Recovery</option>
            </select>
            <select value={editBarrier.status} onChange={(e) => setEditBarrier({ ...editBarrier, status: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
              <option value="present_performed">Present & Performed</option>
              <option value="present_partial">Present & Partial</option>
              <option value="present_failed">Present & Failed</option>
              <option value="absent">Absent</option>
            </select>
          </div>
          {editBarrier.barrierType && (
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
              {editBarrier.barrierType === 'physical' && '🔩 Physical barriers are tangible safeguards — guards, interlocks, pressure relief valves, hard hats, blast walls.'}
              {editBarrier.barrierType === 'administrative' && '📋 Administrative barriers are policy or procedure based — permits to work, checklists, procedures, sign-offs.'}
              {editBarrier.barrierType === 'detection' && '🔍 Detection barriers identify a hazardous condition before it escalates — alarms, gas detectors, inspections, monitoring systems.'}
              {editBarrier.barrierType === 'communication' && '📢 Communication barriers rely on information transfer to prevent harm — toolbox talks, handovers, warning signs, radio check-ins.'}
              {editBarrier.barrierType === 'recovery' && '🚑 Recovery barriers limit consequences after an event — emergency response plans, muster stations, first aid, spill containment.'}
            </div>
          )}
          {['present_failed', 'present_partial', 'absent'].includes(editBarrier.status) && (
            <textarea value={editBarrier.failureReason} onChange={(e) => setEditBarrier({ ...editBarrier, failureReason: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Why did this barrier fail or not exist?" />
          )}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Link to Causal Factor (optional)</label>
            <select value={editBarrier.causalFactorId} onChange={(e) => setEditBarrier({ ...editBarrier, causalFactorId: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
              <option value="">— Not linked —</option>
              {causalFactors.map(f => (
                <option key={f.id} value={f.id}>{f.causal_factor_title}</option>
              ))}
            </select>
            {causalFactors.length === 0 && <p className="text-xs text-slate-400 mt-1">No causal factors found. Add them in Step 5.</p>}
          </div>
          <textarea value={editBarrier.notes} onChange={(e) => setEditBarrier({ ...editBarrier, notes: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Additional notes..." />
          <div className="flex gap-2">
            <button onClick={updateBarrier} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Save</button>
            <button onClick={() => setEditingBarrierId(null)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-slate-900">{barrier.barrier_name}</h4>
          <div className="flex gap-1">
            <button onClick={() => { setEditingBarrierId(barrier.id); setEditBarrier({ name: barrier.barrier_name, barrierType: barrier.barrier_type, side: barrier.barrier_side, status: barrier.status, failureReason: barrier.failure_reason || '', notes: barrier.notes || '', causalFactorId: barrier.causal_factor_id || '' }); }} className="p-1 text-slate-400 hover:text-blue-600" title="Edit"><Edit2 className="w-4 h-4" /></button>
            <button onClick={() => deleteBarrier(barrier.id)} className="p-1 text-slate-400 hover:text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">{getBarrierTypeLabel(barrier.barrier_type)}</span>
          <span className={`px-2 py-1 rounded text-xs ${getBarrierStatusStyle(barrier.status)}`}>{getBarrierStatusLabel(barrier.status)}</span>
        </div>
        {barrier.failure_reason && <p className="text-sm text-slate-600 mb-2"><span className="font-medium">Failure Reason:</span> {barrier.failure_reason}</p>}
        {linkedFactor && (
          <div className="flex items-center gap-2 mt-2 px-2 py-1.5 bg-purple-50 border border-purple-200 rounded-lg">
            <span className="text-xs text-purple-700">🔗 Linked to causal factor:</span>
            <span className="text-xs font-medium text-purple-900">{linkedFactor.causal_factor_title}</span>
          </div>
        )}
        {barrier.notes && <p className="text-sm text-slate-600 mt-2"><span className="font-medium">Notes:</span> {barrier.notes}</p>}
      </div>
    );
  }

  // ============================================================================
  // HELPER COMPONENTS
  // ============================================================================

  function CauseTypeTooltip() {
    return (
      <button type="button" onClick={() => setShowCauseTypeModal(true)} className="ml-1.5 text-slate-400 hover:text-blue-600 transition-colors" aria-label="Cause type definitions">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-3a1 1 0 11-2 0 1 1 0 012 0zM9 5a1 1 0 100 2h2a1 1 0 100-2H9zm0 4a1 1 0 00-1 1v2a1 1 0 100 2h2a1 1 0 100-2v-2a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
      </button>
    );
  }

  function RootCauseTooltip() {
    const [open, setOpen] = useState(false);
    return (
      <div className="relative inline-block">
        <button type="button" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} className="ml-1 text-slate-400 hover:text-blue-600 transition-colors" aria-label="Root cause definition">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-3a1 1 0 11-2 0 1 1 0 012 0zM9 5a1 1 0 100 2h2a1 1 0 100-2H9zm0 4a1 1 0 00-1 1v2a1 1 0 100 2h2a1 1 0 100-2v-2a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
        </button>
        {open && (
          <div className="absolute z-50 left-1/2 -translate-x-1/2 mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-lg p-4">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-slate-200 rotate-45" />
            <p className="text-xs font-semibold text-slate-800">Root Cause</p>
            <p className="text-xs text-slate-600 mt-1">{rootCauseDefinition.definition}</p>
            <p className="text-xs text-blue-600 italic mt-1">👉 {rootCauseDefinition.guidance}</p>
          </div>
        )}
      </div>
    );
  }

  function CategoryTooltip({ category }: { category: any }) {
    const [open, setOpen] = useState(false);
    return (
      <div className="relative inline-block">
        <button type="button" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} className="ml-1.5 text-slate-400 hover:text-blue-600 transition-colors" aria-label={`${category.label} category information`}>
          <HelpCircle className="w-4 h-4" />
        </button>
        {open && (
          <div className="fixed z-50 w-80 bg-white border border-slate-200 rounded-lg shadow-lg p-4" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <p className="text-xs font-semibold text-slate-800">{category.label}</p>
            <p className="text-xs text-slate-600 mt-1">{category.description}</p>
            <p className="text-xs text-blue-600 mt-2"><span className="font-semibold">Examples:</span> {category.examples}</p>
          </div>
        )}
      </div>
    );
  }

  function FishboneDiagramVisual() {
    const svgWidth = 1200; const svgHeight = 600; const centerY = svgHeight / 2; const headX = svgWidth - 100; const tailX = 50;
    const topCategories = FISHBONE_CATEGORIES.filter(c => c.position === 'top');
    const bottomCategories = FISHBONE_CATEGORIES.filter(c => c.position === 'bottom');
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-6 overflow-x-auto">
        <svg width={svgWidth} height={svgHeight} className="mx-auto">
          <line x1={tailX} y1={centerY} x2={headX} y2={centerY} stroke="#334155" strokeWidth="3" />
          <polygon points={`${headX},${centerY} ${headX-15},${centerY-8} ${headX-15},${centerY+8}`} fill="#334155" />
          <foreignObject x={headX + 10} y={centerY - 40} width="150" height="80"><div className="text-xs font-semibold text-slate-900 text-center">{fishboneProblemStatement || 'Problem Statement'}</div></foreignObject>
          {topCategories.map((category, index) => {
            const x = tailX + 150 + (index * 300); const causes = getCausesForCategory(category.id);
            return (
              <g key={category.id}>
                <line x1={x} y1={centerY} x2={x + 80} y2={centerY - 120} stroke="#64748b" strokeWidth="2" />
                <foreignObject x={x + 40} y={centerY - 180} width="120" height="40"><div className="text-xs font-bold text-blue-700 text-center">{category.label}</div></foreignObject>
                {causes.slice(0, 3).map((cause, causeIdx) => {
                  const causeY = centerY - 100 + (causeIdx * -30);
                  return (<g key={cause.id}><line x1={x + 40} y1={centerY - 60} x2={x + 80} y2={causeY} stroke="#94a3b8" strokeWidth="1" /><foreignObject x={x + 85} y={causeY - 12} width="100" height="50"><div className="text-xs text-slate-700 bg-white px-1 py-0.5 border border-slate-200 rounded">{cause.text.substring(0, 30)}{cause.text.length > 30 ? '...' : ''}</div></foreignObject></g>);
                })}
                {causes.length > 3 && <foreignObject x={x + 85} y={centerY - 190} width="100" height="20"><div className="text-xs text-slate-500 italic">+{causes.length - 3} more</div></foreignObject>}
              </g>
            );
          })}
          {bottomCategories.map((category, index) => {
            const x = tailX + 150 + (index * 300); const causes = getCausesForCategory(category.id);
            return (
              <g key={category.id}>
                <line x1={x} y1={centerY} x2={x + 80} y2={centerY + 120} stroke="#64748b" strokeWidth="2" />
                <foreignObject x={x + 40} y={centerY + 140} width="120" height="40"><div className="text-xs font-bold text-purple-700 text-center">{category.label}</div></foreignObject>
                {causes.slice(0, 3).map((cause, causeIdx) => {
                  const causeY = centerY + 100 + (causeIdx * 30);
                  return (<g key={cause.id}><line x1={x + 40} y1={centerY + 60} x2={x + 80} y2={causeY} stroke="#94a3b8" strokeWidth="1" /><foreignObject x={x + 85} y={causeY - 12} width="100" height="50"><div className="text-xs text-slate-700 bg-white px-1 py-0.5 border border-slate-200 rounded">{cause.text.substring(0, 30)}{cause.text.length > 30 ? '...' : ''}</div></foreignObject></g>);
                })}
                {causes.length > 3 && <foreignObject x={x + 85} y={centerY + 190} width="100" height="20"><div className="text-xs text-slate-500 italic">+{causes.length - 3} more</div></foreignObject>}
              </g>
            );
          })}
        </svg>
        <div className="mt-4 text-center text-xs text-slate-500">Visual diagram shows up to 3 causes per category. Switch to List View to see all causes and edit.</div>
      </div>
    );
  }

  function renderNodeBox(node: any) {
    const isEditing = editingTreeNodeId === node.id;
    if (isEditing) {
      return (
        <div className="bg-white border-2 border-blue-400 rounded-lg p-3 shadow-sm" style={{ minWidth: 180, maxWidth: 220 }}>
          <input type="text" value={editNode.title} onChange={(e) => setEditNode({ ...editNode, title: e.target.value })} className="w-full border border-slate-300 rounded px-2 py-1 text-xs mb-2" autoFocus />
          <textarea value={editNode.description} onChange={(e) => setEditNode({ ...editNode, description: e.target.value })} className="w-full border border-slate-300 rounded px-2 py-1 text-xs mb-2" rows={2} placeholder="Description..." />
          <div className="grid grid-cols-2 gap-1 mb-2">
            <select value={editNode.nodeType} onChange={(e) => setEditNode({ ...editNode, nodeType: e.target.value })} className="border border-slate-300 rounded px-1 py-1 text-xs">
              <option value="">Not Specified</option>
              {nodeTypes.map(nt => <option key={nt.value} value={nt.value}>{nt.label}</option>)}
            </select>
            <select value={editNode.factorCategory} onChange={(e) => setEditNode({ ...editNode, factorCategory: e.target.value })} className="border border-slate-300 rounded px-1 py-1 text-xs">
              <option value="">Not Specified</option>
              {factorCategories.map(fc => <option key={fc.value} value={fc.value}>{fc.label}</option>)}
            </select>
          </div>
          <div className="flex gap-1">
            <button onClick={updateTreeNode} className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Save</button>
            <button onClick={() => setEditingTreeNodeId(null)} className="px-2 py-1 border border-slate-300 rounded text-xs hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      );
    }
    return (
      <div className={`border-2 rounded-lg p-3 shadow-sm ${getNodeTypeStyle(node.node_type)}`} style={{ minWidth: 180, maxWidth: 220 }}>
        <div className="flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{node.title}</p>
            {node.description && <p className="text-xs mt-0.5 opacity-75 line-clamp-2">{node.description}</p>}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {node.node_type && <span className={`px-1.5 py-0.5 rounded text-xs border ${getNodeTypeStyle(node.node_type)}`}>{nodeTypes.find(t => t.value === node.node_type)?.label}</span>}
              {node.factor_category && <span className="px-1.5 py-0.5 rounded text-xs bg-white bg-opacity-70 border border-slate-300 text-slate-600">{factorCategories.find(c => c.value === node.factor_category)?.label}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-current border-opacity-20">
          <button onClick={() => { setEditingTreeNodeId(node.id); setEditNode({ title: node.title, description: node.description || '', nodeType: node.node_type || '', factorCategory: node.factor_category || '' }); }} className="p-1 hover:bg-white hover:bg-opacity-50 rounded" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
          <button onClick={() => { setSelectedParentId(node.id); setShowAddNode(true); }} className="p-1 hover:bg-white hover:bg-opacity-50 rounded" title="Add child cause"><Plus className="w-3.5 h-3.5" /></button>
          <button onClick={() => deleteTreeNode(node.id)} className="p-1 hover:bg-white hover:bg-opacity-50 rounded text-red-600" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    );
  }

  function renderTreeBranch(node: any): React.ReactNode {
    const children = causalTree.filter(n => n.parent_node_id === node.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const visibleChildren = hasChildren && isExpanded ? children : [];
    return (
      <div key={node.id} className="flex flex-col items-center">
        <div className="relative">
          {renderNodeBox(node)}
          {hasChildren && (
            <button onClick={() => toggleExpand(node.id)} className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-white border border-slate-300 rounded-full w-6 h-6 flex items-center justify-center shadow-sm hover:bg-slate-50 z-10">
              {isExpanded ? <ChevronDown className="w-3 h-3 text-slate-600" /> : <ChevronRight className="w-3 h-3 text-slate-600" />}
            </button>
          )}
        </div>
        {visibleChildren.length > 0 && (
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-6 bg-slate-400" />
            <div className="relative flex items-start">
              {visibleChildren.length > 1 && <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 bg-slate-400" style={{ width: `calc(100% - 220px)` }} />}
              <div className="flex gap-4 items-start">
                {visibleChildren.map((child) => (
                  <div key={child.id} className="flex flex-col items-center">
                    <div className="w-0.5 h-4 bg-slate-400" />
                    {renderTreeBranch(child)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // EARLY RETURNS
  // ============================================================================

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading Visualisations...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <>
      {investigation && (
        <StepNavigation investigationId={investigationId} currentStep={4} investigationNumber={investigation.investigation_number} />
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-6xl mx-auto">

          {/* Page Header */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Step 4: Visualisations</h1>
                <p className="text-slate-600 mt-1">Identify causal factors using visual analysis tools</p>
                {investigation && (
                  <div className="mt-2 text-sm">
                    <span className="text-slate-500">Investigation:</span>{' '}
                    <span className="font-medium text-slate-700">{investigation.investigation_number}</span>
                    {' – '}
                    <span className="text-slate-600">{investigation.incident_description}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-6 overflow-hidden">
            <div className="flex border-b border-slate-200">
              {[
                { key: '5whys', icon: '🔍', label: '5 Whys Visual Builder', count: whyChain.length, unit: 'level' },
                { key: 'causalTree', icon: null, label: 'Causal Tree', count: causalTree.length, unit: 'node' },
                { key: 'barriers', icon: '🛡️', label: 'Barrier Analysis', count: barriers.length, unit: 'barrier' },
                { key: 'fishbone', icon: '🐟', label: 'Fishbone', count: fishboneCauses.length, unit: '' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {tab.icon ? <span className="text-lg">{tab.icon}</span> : <Network className="w-4 h-4" />}
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                        {tab.count}{tab.unit ? ` ${tab.unit}${tab.count !== 1 ? 's' : ''}` : ''}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* ================================================================
                5 WHYS TAB - unchanged
            ================================================================ */}
            {activeTab === '5whys' && (
              <div className="p-6">
                <div className="space-y-6">
                  {whyChain.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                      <p className="text-slate-600 mb-4">No 5 Whys chain started yet</p>
                      <button onClick={() => setShowAddWhy(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"><Plus className="w-4 h-4" />Start 5 Whys Analysis</button>
                    </div>
                  ) : (
                    <>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-blue-900">5 Whys Guidance</h3>
                            <p className="text-xs text-blue-800 mt-1">Keep asking "Why?" until you reach organisational or systemic root causes. Typically 3-7 levels deep. Mark root causes when identified.</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {whyChain.map((level, index) => (
                          <div key={level.id} className="relative">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">{level.level}</div>
                              <div className="flex-1">
                                {editingWhyId === level.id ? (
                                  <div className="bg-white border-2 border-blue-400 rounded-lg p-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">{level.question}</label>
                                    <textarea value={editWhy.answer} onChange={(e) => setEditWhy({ ...editWhy, answer: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-3" rows={2} placeholder="Answer..." autoFocus />
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                      <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Factor Type</label>
                                        <select value={editWhy.factorType} onChange={(e) => setEditWhy({ ...editWhy, factorType: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                                          {factorTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                                        </select>
                                      </div>
                                      <div className="flex items-center pt-6">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                          <input type="checkbox" checked={editWhy.isRootCause} onChange={(e) => setEditWhy({ ...editWhy, isRootCause: e.target.checked })} className="w-4 h-4 text-blue-600 rounded border-slate-300" />
                                          <span className="text-sm font-medium text-slate-700 flex items-center gap-1">Root Cause<RootCauseTooltip /></span>
                                        </label>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <button onClick={updateWhyLevel} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Save</button>
                                      <button onClick={() => setEditingWhyId(null)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                      <p className="text-sm font-medium text-slate-700">{level.question}</p>
                                      <div className="flex gap-1">
                                        <button onClick={() => { setEditingWhyId(level.id); setEditWhy({ answer: level.answer, isRootCause: level.is_root_cause, factorType: level.factor_type }); }} className="p-1 text-slate-400 hover:text-blue-600 rounded" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                        <button onClick={() => deleteWhyLevel(level.id, level.level)} className="p-1 text-slate-400 hover:text-red-600 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                      </div>
                                    </div>
                                    <p className="text-slate-900 mb-3">{level.answer}</p>
                                    <div className="flex flex-wrap gap-2">
                                      <span className={`px-2 py-1 rounded text-xs border ${getFactorTypeStyle(level.factor_type)}`}>{factorTypes.find(t => t.value === level.factor_type)?.label}</span>
                                      {level.is_root_cause && <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700 border border-green-200 font-semibold">✓ Root Cause</span>}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            {index < whyChain.length - 1 && <div className="ml-4 w-0.5 h-4 bg-blue-300"></div>}
                          </div>
                        ))}
                      </div>
                      {!showAddWhy && (
                        <div className="flex gap-3">
                          <button onClick={() => setShowAddWhy(true)} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center justify-center gap-2"><Plus className="w-4 h-4" />Add Next "Why?" Level</button>
                          <button onClick={clearWhyChain} className="px-4 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 inline-flex items-center gap-2"><Trash2 className="w-4 h-4" />Clear Chain</button>
                        </div>
                      )}
                    </>
                  )}
                  {showAddWhy && (
                    <div className="bg-white border-2 border-blue-400 rounded-lg p-6 mt-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">{whyChain.length === 0 ? 'Start 5 Whys Analysis' : `Add Why Level ${whyChain.length + 1}`}</h3>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Why did "{whyChain.length > 0 ? whyChain[whyChain.length - 1].answer : investigation?.incident_description || 'the incident'}" occur?</label>
                      <textarea value={newWhy.answer} onChange={(e) => setNewWhy({ ...newWhy, answer: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4" rows={3} placeholder="Provide your answer..." />
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Factor Type</label>
                          <select value={newWhy.factorType} onChange={(e) => setNewWhy({ ...newWhy, factorType: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                            {factorTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                          </select>
                        </div>
                        <div className="flex items-center pt-7">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={newWhy.isRootCause} onChange={(e) => setNewWhy({ ...newWhy, isRootCause: e.target.checked })} className="w-4 h-4 text-blue-600 rounded border-slate-300" />
                            <span className="text-sm font-medium text-slate-700 flex items-center gap-1">Root Cause<RootCauseTooltip /></span>
                          </label>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={addWhyLevel} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Level</button>
                        <button onClick={() => { setShowAddWhy(false); setNewWhy({ answer: '', isRootCause: false, factorType: 'individual' }); }} className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================================================================
                CAUSAL TREE TAB - unchanged
            ================================================================ */}
            {activeTab === 'causalTree' && (
              <div className="p-6">
                {causalTree.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                    <p className="text-slate-600 mb-4">No causal tree started yet</p>
                    <button onClick={() => { setSelectedParentId(null); setShowAddNode(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"><Plus className="w-4 h-4" />Add Root Cause</button>
                  </div>
                ) : (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-2">Causal Tree Guidance<CauseTypeTooltip /></h3>
                          <p className="text-xs text-blue-800 mt-1">Build a tree from the incident event. Add child causes to explore deeper levels. Click + on any node to add a child cause.</p>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-x-auto pb-8">
                      <div className="inline-flex flex-col items-center min-w-full">
                        {causalTree.filter(n => !n.parent_node_id).map(rootNode => renderTreeBranch(rootNode))}
                      </div>
                    </div>
                    {!showAddNode && (
                      <div className="flex justify-center mt-6">
                        <button onClick={() => { setSelectedParentId(null); setShowAddNode(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"><Plus className="w-4 h-4" />Add Another Node</button>
                      </div>
                    )}
                  </>
                )}
                {showAddNode && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">{selectedParentId ? 'Add Child Cause' : 'Add Root Cause'}</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Title *</label>
                          <input type="text" value={newNode.title} onChange={(e) => setNewNode({ ...newNode, title: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Brief cause title..." autoFocus />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                          <textarea value={newNode.description} onChange={(e) => setNewNode({ ...newNode, description: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Additional details..." />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">Cause Type<CauseTypeTooltip /></label>
                            <select value={newNode.nodeType} onChange={(e) => setNewNode({ ...newNode, nodeType: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                              <option value="">Not Specified</option>
                              {nodeTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Factor Category</label>
                            <select value={newNode.factorCategory} onChange={(e) => setNewNode({ ...newNode, factorCategory: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                              <option value="">Not Specified</option>
                              {factorCategories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                          <button onClick={addTreeNode} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Cause</button>
                          <button onClick={() => { setShowAddNode(false); setSelectedParentId(null); setNewNode({ title: '', description: '', nodeType: '', factorCategory: '' }); }} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================================================================
                BARRIERS TAB - ENHANCED with Swiss Cheese + Causal Factor linking
            ================================================================ */}
            {activeTab === 'barriers' && (
              <div className="p-6">
                {/* Guidance */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-blue-900">Barrier Analysis Guidance</h3>
                      <p className="text-xs text-blue-800 mt-1">
                        Identify barriers that existed or should have existed to prevent or mitigate the incident.
                        Analyse their performance, failure reasons, and link them to causal factors identified in Step 5.
                      </p>
                    </div>
                  </div>
                </div>

                {barriers.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                    <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 mb-4">No barriers identified yet</p>
                    <button onClick={() => setShowAddBarrier(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"><Plus className="w-4 h-4" />Add Barrier</button>
                  </div>
                ) : (
                  <>
                    {/* View toggle */}
                    <div className="flex items-center justify-center gap-3 p-4 bg-slate-50 rounded-lg mb-6">
                      <button onClick={() => setBarrierView('list')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${barrierView === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'}`}>
                        📋 List View
                      </button>
                      <button onClick={() => setBarrierView('swisscheese')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${barrierView === 'swisscheese' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'}`}>
                        🧀 Swiss Cheese Diagram
                      </button>
                    </div>

                    {/* Swiss Cheese View */}
                    {barrierView === 'swisscheese' && <SwissCheeseVisual />}

                    {/* List View */}
                    {barrierView === 'list' && (
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
                            Prevention Barriers
                          </h3>
                          <div className="space-y-3">
                            {barriers.filter(b => b.barrier_side === 'prevention').length === 0 ? (
                              <p className="text-sm text-slate-500 italic">No prevention barriers</p>
                            ) : (
                              barriers.filter(b => b.barrier_side === 'prevention').map(barrier => (
                                <BarrierCard key={barrier.id} barrier={barrier} />
                              ))
                            )}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-purple-600 inline-block"></span>
                            Mitigation Barriers
                          </h3>
                          <div className="space-y-3">
                            {barriers.filter(b => b.barrier_side === 'mitigation').length === 0 ? (
                              <p className="text-sm text-slate-500 italic">No mitigation barriers</p>
                            ) : (
                              barriers.filter(b => b.barrier_side === 'mitigation').map(barrier => (
                                <BarrierCard key={barrier.id} barrier={barrier} />
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Add barrier button */}
                    <div className="flex justify-center mt-6">
                      <button onClick={() => setShowAddBarrier(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"><Plus className="w-4 h-4" />Add Barrier</button>
                    </div>
                  </>
                )}

                {/* Add Barrier Modal */}
                {showAddBarrier && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Barrier</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Barrier Name *</label>
                          <input type="text" value={newBarrier.name} onChange={(e) => setNewBarrier({ ...newBarrier, name: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g., Emergency shutdown system, Safety procedure..." autoFocus />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                            <select value={newBarrier.barrierType} onChange={(e) => setNewBarrier({ ...newBarrier, barrierType: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                              <option value="physical">Physical</option>
                              <option value="administrative">Administrative</option>
                              <option value="detection">Detection</option>
                              <option value="communication">Communication</option>
                              <option value="recovery">Recovery</option>
                            </select>
                            {/* Barrier type tooltip */}
                            {newBarrier.barrierType && (
                              <div className="mt-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                                {newBarrier.barrierType === 'physical' && '🔩 Physical barriers are tangible safeguards — guards, interlocks, pressure relief valves, hard hats, blast walls.'}
                                {newBarrier.barrierType === 'administrative' && '📋 Administrative barriers are policy or procedure based — permits to work, checklists, procedures, sign-offs.'}
                                {newBarrier.barrierType === 'detection' && '🔍 Detection barriers identify a hazardous condition before it escalates — alarms, gas detectors, inspections, monitoring systems.'}
                                {newBarrier.barrierType === 'communication' && '📢 Communication barriers rely on information transfer to prevent harm — toolbox talks, handovers, warning signs, radio check-ins.'}
                                {newBarrier.barrierType === 'recovery' && '🚑 Recovery barriers limit consequences after an event — emergency response plans, muster stations, first aid, spill containment.'}
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Side</label>
                            <select value={newBarrier.side} onChange={(e) => setNewBarrier({ ...newBarrier, side: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                              <option value="prevention">Prevention</option>
                              <option value="mitigation">Mitigation</option>
                            </select>
                            {newBarrier.side && (
                              <div className="mt-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                                {newBarrier.side === 'prevention' && '🛡️ Prevention barriers stop the hazardous event from occurring in the first place.'}
                                {newBarrier.side === 'mitigation' && '⚡ Mitigation barriers reduce the severity of consequences after the event has occurred.'}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                          <select value={newBarrier.status} onChange={(e) => setNewBarrier({ ...newBarrier, status: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                            <option value="present_performed">Present & Performed</option>
                            <option value="present_partial">Present & Partial</option>
                            <option value="present_failed">Present & Failed</option>
                            <option value="absent">Absent</option>
                          </select>
                        </div>
                        {['present_failed', 'present_partial', 'absent'].includes(newBarrier.status) && (
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Failure Reason *</label>
                            <textarea value={newBarrier.failureReason} onChange={(e) => setNewBarrier({ ...newBarrier, failureReason: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Why did this barrier fail or not exist?" />
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Link to Causal Factor (optional)</label>
                          <select value={newBarrier.causalFactorId} onChange={(e) => setNewBarrier({ ...newBarrier, causalFactorId: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                            <option value="">— Not linked —</option>
                            {causalFactors.map(f => <option key={f.id} value={f.id}>{f.causal_factor_title}</option>)}
                          </select>
                          {causalFactors.length === 0 && <p className="text-xs text-slate-400 mt-1">No causal factors found. Add them in Step 5 first.</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                          <textarea value={newBarrier.notes} onChange={(e) => setNewBarrier({ ...newBarrier, notes: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Additional information..." />
                        </div>
                        <div className="flex gap-3 pt-4">
                          <button onClick={addBarrier} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Barrier</button>
                          <button onClick={() => { setShowAddBarrier(false); setNewBarrier({ name: '', barrierType: 'physical', side: 'prevention', status: 'present_performed', failureReason: '', notes: '', causalFactorId: '' }); }} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================================================================
                FISHBONE TAB - unchanged
            ================================================================ */}
            {activeTab === 'fishbone' && (
              <div className="p-6 space-y-6">
                {showGuidance && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2"><Info className="w-4 h-4 text-blue-600" /><h3 className="text-sm font-semibold text-blue-800">How to Use Fishbone Diagrams</h3></div>
                      <button onClick={() => setShowGuidance(false)} className="text-blue-600 hover:text-blue-800"><X className="w-4 h-4" /></button>
                    </div>
                    <ol className="text-xs text-blue-900 space-y-1 ml-4 list-decimal">
                      <li>Define the problem statement (the incident outcome)</li>
                      <li>For each category, identify main causes that contributed</li>
                      <li>Add sub-causes using "Why?" questions to drill down</li>
                      <li>Review all categories for comprehensive analysis</li>
                      <li>Validate causes against evidence from Steps 2 and 3</li>
                    </ol>
                  </div>
                )}
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-semibold text-slate-700">Problem Statement</label>
                    <CategoryTooltip category={{ label: 'Problem Statement', description: 'Clearly state what happened', examples: 'Specific incident description' }} />
                  </div>
                  <textarea value={fishboneProblemStatement} onChange={(e) => setFishboneProblemStatement(e.target.value)} placeholder="Example: Uncontrolled hydrocarbon release during valve maintenance..." className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" rows={3} />
                </div>
                <div className="flex items-center justify-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <button onClick={() => setFishboneView('list')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${fishboneView === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'}`}>📝 List View</button>
                  <button onClick={() => setFishboneView('diagram')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${fishboneView === 'diagram' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'}`}>📊 Diagram View</button>
                </div>
                {fishboneView === 'diagram' && (
                  fishboneCauses.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                      <p className="text-slate-600 mb-2">No causes added yet</p>
                      <p className="text-sm text-slate-500">Switch to List View to add causes</p>
                    </div>
                  ) : <FishboneDiagramVisual />
                )}
                {fishboneView === 'list' && (
                  <>
                    {FISHBONE_CATEGORIES.map((category) => {
                      const categoryCauses = getCausesForCategory(category.id);
                      return (
                        <div key={category.id} className={`bg-white border-l-4 ${category.color} border-t border-r border-b border-slate-200 rounded-lg`}>
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-base font-semibold text-slate-800">{category.label}</h3>
                                  <CategoryTooltip category={category} />
                                </div>
                                <p className="text-xs text-slate-600 mt-1">{category.description}</p>
                              </div>
                              <button onClick={() => addFishboneCause(category.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 flex items-center gap-1"><Plus className="w-3 h-3" />Add Cause</button>
                            </div>
                            {categoryCauses.length === 0 ? (
                              <div className="text-xs text-slate-500 italic py-3 text-center border-2 border-dashed border-slate-200 rounded-lg">No causes identified yet</div>
                            ) : (
                              <div className="space-y-3">
                                {categoryCauses.map((cause) => (
                                  <div key={cause.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                                    {editingCauseId === cause.id ? (
                                      <div className="space-y-2">
                                        <textarea value={editCause.text} onChange={(e) => setEditCause({ ...editCause, text: e.target.value })} placeholder="Main cause..." className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs" rows={2} autoFocus />
                                        <div>
                                          <div className="flex items-center justify-between mb-1">
                                            <label className="text-xs font-semibold">Contributing Factors</label>
                                            <button onClick={() => setEditCause({ ...editCause, subCauses: [...editCause.subCauses, ''] })} className="text-xs text-blue-600 flex items-center gap-1"><Plus className="w-3 h-3" />Add</button>
                                          </div>
                                          {editCause.subCauses.map((sc, idx) => (
                                            <div key={idx} className="flex items-center gap-2 mb-1">
                                              <span className="text-xs text-slate-400">└─</span>
                                              <input type="text" value={sc} onChange={(e) => { const newSub = [...editCause.subCauses]; newSub[idx] = e.target.value; setEditCause({ ...editCause, subCauses: newSub }); }} placeholder="Why?" className="flex-1 border border-slate-300 rounded px-2 py-1 text-xs" />
                                              <button onClick={() => setEditCause({ ...editCause, subCauses: editCause.subCauses.filter((_, i) => i !== idx) })} className="text-red-500"><X className="w-3 h-3" /></button>
                                            </div>
                                          ))}
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                          <button onClick={() => updateFishboneCause(cause.id)} className="px-3 py-1 bg-blue-600 text-white rounded text-xs">Save</button>
                                          <button onClick={() => setEditingCauseId(null)} className="px-3 py-1 border border-slate-300 rounded text-xs">Cancel</button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div>
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-800">{cause.text || <span className="italic text-slate-400">No description</span>}</p>
                                            {cause.subCauses.length > 0 && (
                                              <div className="mt-2 ml-4 space-y-1">
                                                {cause.subCauses.map((sc: string, idx: number) => <p key={idx} className="text-xs text-slate-600">└─ {sc}</p>)}
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex gap-1">
                                            <button onClick={() => { setEditingCauseId(cause.id); setEditCause({ text: cause.text, subCauses: cause.subCauses }); }} className="p-1 text-slate-400 hover:text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => deleteFishboneCause(cause.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600">{fishboneCauses.length} cause{fishboneCauses.length !== 1 ? 's' : ''} across {new Set(fishboneCauses.map(c => c.categoryId)).size} categor{new Set(fishboneCauses.map(c => c.categoryId)).size !== 1 ? 'ies' : 'y'}</div>
                    <button onClick={exportFishbone} disabled={!fishboneProblemStatement && fishboneCauses.length === 0} className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50"><Download className="w-4 h-4" />Export</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Cause Type Definitions Modal */}
      {showCauseTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Cause Type Definitions</h3>
              <button onClick={() => setShowCauseTypeModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              {causeTypeDefinitions.map((type, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-900 mb-2">{type.label}</h4>
                  <p className="text-sm text-slate-700 mb-2">{type.definition}</p>
                  <p className="text-sm text-blue-600 italic">💡 {type.guidance}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
