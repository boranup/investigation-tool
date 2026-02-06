'use client'

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Network, Plus, Trash2, Edit2, ChevronDown, ChevronRight, AlertCircle, X, HelpCircle, Download, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import StepNavigation from '@/components/StepNavigation';

export default function Visualisations() {
  const searchParams = useSearchParams();
  const investigationId = searchParams.get('investigationId');

  const [loading, setLoading] = useState(true);
  const [investigation, setInvestigation] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'5whys' | 'causalTree' | 'barriers' | 'fishbone'>('5whys');

  // ── 5 Whys state ─────────────────────────────────────────────
  const [whyChain, setWhyChain] = useState<any[]>([]);
  const [showAddWhy, setShowAddWhy] = useState(false);
  const [editingWhyId, setEditingWhyId] = useState<string | null>(null);
  const [editWhy, setEditWhy] = useState({ answer: '', isRootCause: false, factorType: 'individual' });
  const [newWhy, setNewWhy] = useState({
    answer: '',
    isRootCause: false,
    factorType: 'individual'
  });

  // ── Causal Tree state ────────────────────────────────────────
  const [causalTree, setCausalTree] = useState<any[]>([]);
  const [showAddNode, setShowAddNode] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [newNode, setNewNode] = useState({
    title: '',
    description: '',
    nodeType: '',
    factorCategory: ''
  });
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [editingTreeNodeId, setEditingTreeNodeId] = useState<string | null>(null);
  const [editNode, setEditNode] = useState({ title: '', description: '', nodeType: '', factorCategory: '' });

  // ── Barrier Analysis state ──────────────────────────────────
  const [barriers, setBarriers] = useState<any[]>([]);
  const [showAddBarrier, setShowAddBarrier] = useState(false);
  const [showCauseTypeModal, setShowCauseTypeModal] = useState(false);
  const [editingBarrierId, setEditingBarrierId] = useState<string | null>(null);
  const [newBarrier, setNewBarrier] = useState({
    name: '',
    barrierType: 'physical',
    side: 'prevention',
    status: 'present_performed',
    failureReason: '',
    notes: ''
  });
  const [editBarrier, setEditBarrier] = useState({
    name: '',
    barrierType: 'physical',
    side: 'prevention',
    status: 'present_performed',
    failureReason: '',
    notes: ''
  });

  // ── Fishbone state ──────────────────────────────────────────
  const [fishboneCauses, setFishboneCauses] = useState<any[]>([]);
  const [fishboneProblemStatement, setFishboneProblemStatement] = useState('');
  const [editingCauseId, setEditingCauseId] = useState<string | null>(null);
  const [showGuidance, setShowGuidance] = useState(true);
  const [editCause, setEditCause] = useState({ text: '', subCauses: [] as string[] });

  // ── Constants ────────────────────────────────────────────────
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
    {
      label: 'Immediate Cause',
      definition: 'What directly led to the incident at the point it occurred. The final unsafe act or condition that triggered the event.',
      guidance: 'Immediate causes explain what happened — but not why it was allowed to happen.'
    },
    {
      label: 'Contributing Factor',
      definition: 'Conditions or influences that increased the likelihood or severity of the incident but did not directly trigger it alone.',
      guidance: 'Contributing factors create the environment where the immediate cause could occur.'
    },
    {
      label: 'Root Cause',
      definition: 'The most fundamental underlying system or organisational failure that, if corrected, would prevent recurrence or significantly reduce likelihood.',
      guidance: 'Root causes explain why the causal and immediate causes existed in the first place.'
    }
  ];

  const rootCauseDefinition = {
    definition: 'The most fundamental underlying system or organisational failure that, if corrected, would prevent recurrence or significantly reduce likelihood.',
    guidance: 'Root causes explain why the causal and immediate causes existed in the first place.'
  };

  // ── Load data ────────────────────────────────────────────────
  useEffect(() => {
    if (investigationId) {
      loadInvestigation();
      loadVisualisations();
    }
  }, [investigationId]);

  async function loadInvestigation() {
    try {
      const { data } = await supabase
        .from('investigations')
        .select('*')
        .eq('id', investigationId)
        .single();
      setInvestigation(data);
    } catch (err) {
      console.error('Error loading investigation:', err);
    }
  }

  async function loadVisualisations() {
    try {
      // 5 Whys
      const { data: whyData } = await supabase
        .from('visualization_5whys')
        .select('*')
        .eq('investigation_id', investigationId)
        .order('level', { ascending: true });
      setWhyChain(whyData || []);

      // Causal Tree
      const { data: treeData } = await supabase
        .from('visualization_causal_tree')
        .select('*')
        .eq('investigation_id', investigationId)
        .order('created_at', { ascending: true });
      setCausalTree(treeData || []);
      if (treeData && treeData.length > 0) {
        const parentIds = new Set<string>();
        treeData.forEach((node: any) => {
          if (node.parent_node_id) {
            parentIds.add(node.parent_node_id);
          }
        });
        setExpandedNodes(parentIds);
      }

      // Barriers
      const { data: barrierData, error: barrierError } = await supabase
        .from('visualization_barriers')
        .select('*')
        .eq('investigation_id', investigationId)
        .order('created_at', { ascending: true });

      if (barrierError) throw barrierError;
      setBarriers(barrierData || []);

      // Fishbone
      await loadFishboneData();
    } catch (err) {
      console.error('Error loading visualisations:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadFishboneData() {
    try {
      const { data: diagram } = await supabase
        .from('fishbone_diagrams')
        .select(`*, fishbone_causes (*, fishbone_subcauses (*))`)
        .eq('investigation_id', investigationId)
        .single();

      if (diagram) {
        setFishboneProblemStatement(diagram.problem_statement || '');
        const causes = (diagram.fishbone_causes || []).map((cause: any) => ({
          id: cause.id,
          categoryId: cause.category_id,
          text: cause.cause_text,
          subCauses: (cause.fishbone_subcauses || [])
            .sort((a: any, b: any) => a.display_order - b.display_order)
            .map((sc: any) => sc.subcause_text)
        }));
        setFishboneCauses(causes);
      }
    } catch (err) {
      console.error('Error loading fishbone:', err);
    }
  }

  async function saveFishboneData() {
    try {
      const { data: diagram, error: diagramError } = await supabase
        .from('fishbone_diagrams')
        .upsert({
          investigation_id: investigationId,
          problem_statement: fishboneProblemStatement,
          updated_at: new Date().toISOString()
        }, { onConflict: 'investigation_id' })
        .select()
        .single();

      if (diagramError) throw diagramError;

      await supabase.from('fishbone_causes').delete().eq('fishbone_id', diagram.id);

      for (let i = 0; i < fishboneCauses.length; i++) {
        const cause = fishboneCauses[i];
        const { data: insertedCause, error: causeError } = await supabase
          .from('fishbone_causes')
          .insert({
            fishbone_id: diagram.id,
            category_id: cause.categoryId,
            cause_text: cause.text,
            display_order: i
          })
          .select()
          .single();

        if (causeError) throw causeError;

        if (cause.subCauses && cause.subCauses.length > 0) {
          const subCausesToInsert = cause.subCauses.map((sc: string, idx: number) => ({
            cause_id: insertedCause.id,
            subcause_text: sc,
            display_order: idx
          }));
          const { error: subCauseError } = await supabase.from('fishbone_subcauses').insert(subCausesToInsert);
          if (subCauseError) throw subCauseError;
        }
      }
    } catch (err: any) {
      console.error('Error saving fishbone:', err);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (investigationId && (fishboneProblemStatement || fishboneCauses.length > 0)) {
        saveFishboneData();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [fishboneProblemStatement, fishboneCauses]);

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

  function deleteFishboneCause(causeId: string) {
    setFishboneCauses(prev => prev.filter(c => c.id !== causeId));
  }

  function getCausesForCategory(categoryId: string) {
    return fishboneCauses.filter(c => c.categoryId === categoryId);
  }

  function exportFishbone() {
    const data = {
      problemStatement: fishboneProblemStatement,
      categories: FISHBONE_CATEGORIES.map(cat => ({
        ...cat,
        causes: getCausesForCategory(cat.id).map(c => ({ mainCause: c.text, contributingFactors: c.subCauses }))
      })),
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fishbone-diagram-${investigationId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── 5 Whys functions ─────────────────────────────────────────
  async function addWhyLevel() {
    if (!newWhy.answer.trim()) {
      alert('Please provide an answer before adding a level.');
      return;
    }

    try {
      const previousAnswer = whyChain.length > 0
        ? whyChain[whyChain.length - 1].answer
        : investigation?.incident_description || 'the incident';

      const whyData = {
        investigation_id: investigationId,
        level: whyChain.length + 1,
        question: `Why ${whyChain.length + 1}: Why did "${previousAnswer}" occur?`,
        answer: newWhy.answer.trim(),
        is_root_cause: newWhy.isRootCause,
        factor_type: newWhy.factorType
      };

      const { data, error } = await supabase
        .from('visualization_5whys')
        .insert([whyData])
        .select()
        .single();

      if (error) throw error;

      setWhyChain([...whyChain, data]);
      setNewWhy({ answer: '', isRootCause: false, factorType: 'individual' });
      setShowAddWhy(false);
    } catch (err: any) {
      console.error('Error adding why level:', err);
      alert(`Error: ${err.message}`);
    }
  }

  async function deleteWhyLevel(id: string, level: number) {
    if (!confirm('Delete this level and all subsequent levels?')) return;
    try {
      const { error } = await supabase
        .from('visualization_5whys')
        .delete()
        .eq('investigation_id', investigationId)
        .gte('level', level);
      if (error) throw error;
      loadVisualisations();
    } catch (err) {
      console.error('Error deleting why level:', err);
    }
  }

  async function clearWhyChain() {
    if (!confirm('Clear the entire 5 Whys chain? This cannot be undone.')) return;
    try {
      const { error } = await supabase
        .from('visualization_5whys')
        .delete()
        .eq('investigation_id', investigationId);
      if (error) throw error;
      setWhyChain([]);
    } catch (err) {
      console.error('Error clearing chain:', err);
    }
  }

  async function updateWhyLevel() {
    if (!editingWhyId) return;
    try {
      const { error } = await supabase
        .from('visualization_5whys')
        .update({
          answer: editWhy.answer.trim(),
          is_root_cause: editWhy.isRootCause,
          factor_type: editWhy.factorType
        })
        .eq('id', editingWhyId);
      if (error) throw error;
      setWhyChain(prev => prev.map(w =>
        w.id === editingWhyId
          ? { ...w, answer: editWhy.answer.trim(), is_root_cause: editWhy.isRootCause, factor_type: editWhy.factorType }
          : w
      ));
      setEditingWhyId(null);
    } catch (err: any) {
      console.error('Error updating why level:', err);
      alert(`Error: ${err.message}`);
    }
  }

  async function updateTreeNode() {
    if (!editingTreeNodeId) return;
    try {
      const { error } = await supabase
        .from('visualization_causal_tree')
        .update({
          title: editNode.title.trim(),
          description: editNode.description.trim() || null,
          node_type: editNode.nodeType || null,
          factor_category: editNode.factorCategory || null
        })
        .eq('id', editingTreeNodeId);
      if (error) throw error;
      setCausalTree(prev => prev.map(n =>
        n.id === editingTreeNodeId
          ? { ...n, title: editNode.title.trim(), description: editNode.description.trim() || null, node_type: editNode.nodeType || null, factor_category: editNode.factorCategory || null }
          : n
      ));
      setEditingTreeNodeId(null);
    } catch (err: any) {
      console.error('Error updating tree node:', err);
      alert(`Error: ${err.message}`);
    }
  }

  // ── Causal Tree functions ────────────────────────────────────
  async function addTreeNode() {
    if (!newNode.title.trim()) {
      alert('Please provide a title.');
      return;
    }
    try {
      const nodeData = {
        investigation_id: investigationId,
        parent_node_id: selectedParentId,
        title: newNode.title.trim(),
        description: newNode.description.trim() || null,
        node_type: newNode.nodeType || null,
        factor_category: newNode.factorCategory || null
      };

      const { data, error } = await supabase
        .from('visualization_causal_tree')
        .insert([nodeData])
        .select()
        .single();

      if (error) throw error;

      setCausalTree([...causalTree, data]);
      if (selectedParentId) {
        setExpandedNodes(prev => { const next = new Set(prev); next.add(selectedParentId); return next; });
      }
      setNewNode({ title: '', description: '', nodeType: '', factorCategory: '' });
      setSelectedParentId(null);
      setShowAddNode(false);
    } catch (err: any) {
      console.error('Error adding tree node:', err);
      alert(`Error: ${err.message}`);
    }
  }

  async function deleteTreeNode(id: string) {
    if (!confirm('Delete this node and all its children?')) return;
    try {
      const idsToDelete = new Set<string>();
      const collectChildren = (parentId: string) => {
        idsToDelete.add(parentId);
        causalTree.filter(n => n.parent_node_id === parentId).forEach(child => collectChildren(child.id));
      };
      collectChildren(id);

      const { error } = await supabase
        .from('visualization_causal_tree')
        .delete()
        .in('id', Array.from(idsToDelete));

      if (error) throw error;
      setCausalTree(causalTree.filter(n => !idsToDelete.has(n.id)));
    } catch (err) {
      console.error('Error deleting node:', err);
    }
  }

  async function addBarrier() {
    if (!investigationId || !newBarrier.name.trim()) return;
    const needsReason = ['present_failed', 'present_partial', 'absent'].includes(newBarrier.status);
    if (needsReason && !newBarrier.failureReason.trim()) {
      alert('Please provide a reason for the barrier failure or absence.');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('visualization_barriers')
        .insert({
          investigation_id: investigationId,
          barrier_name: newBarrier.name.trim(),
          barrier_type: newBarrier.barrierType,
          barrier_side: newBarrier.side,
          status: newBarrier.status,
          failure_reason: needsReason ? newBarrier.failureReason.trim() : null,
          notes: newBarrier.notes.trim() || null
        })
        .select()
        .single();

      if (error) throw error;
      setBarriers([...barriers, data]);
      setNewBarrier({ name: '', barrierType: 'physical', side: 'prevention', status: 'present_performed', failureReason: '', notes: '' });
      setShowAddBarrier(false);
    } catch (err: any) {
      console.error('Error adding barrier:', err);
      alert(`Error: ${err.message}`);
    }
  }

  async function updateBarrier() {
    if (!editingBarrierId || !editBarrier.name.trim()) return;
    const needsReason = ['present_failed', 'present_partial', 'absent'].includes(editBarrier.status);
    if (needsReason && !editBarrier.failureReason.trim()) {
      alert('Please provide a reason for the barrier failure or absence.');
      return;
    }
    try {
      const { error } = await supabase
        .from('visualization_barriers')
        .update({
          barrier_name: editBarrier.name.trim(),
          barrier_type: editBarrier.barrierType,
          barrier_side: editBarrier.side,
          status: editBarrier.status,
          failure_reason: needsReason ? editBarrier.failureReason.trim() : null,
          notes: editBarrier.notes.trim() || null
        })
        .eq('id', editingBarrierId);
      if (error) throw error;
      setBarriers(prev => prev.map(b =>
        b.id === editingBarrierId
          ? { ...b, barrier_name: editBarrier.name.trim(), barrier_type: editBarrier.barrierType, barrier_side: editBarrier.side, status: editBarrier.status, failure_reason: needsReason ? editBarrier.failureReason.trim() : null, notes: editBarrier.notes.trim() || null }
          : b
      ));
      setEditingBarrierId(null);
    } catch (err: any) {
      console.error('Error updating barrier:', err);
      alert(`Error: ${err.message}`);
    }
  }

  async function deleteBarrier(id: string) {
    try {
      const { error } = await supabase
        .from('visualization_barriers')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setBarriers(prev => prev.filter(b => b.id !== id));
    } catch (err: any) {
      console.error('Error deleting barrier:', err);
      alert(`Error: ${err.message}`);
    }
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
    setExpandedNodes(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function getNodeTypeStyle(type: string | null) {
    if (!type) return 'bg-slate-100 text-slate-600 border-slate-300';
    return nodeTypes.find(t => t.value === type)?.color || 'bg-slate-100 text-slate-600 border-slate-300';
  }

  function getFactorTypeStyle(type: string) {
    return factorTypes.find(t => t.value === type)?.color || 'bg-grey-100 text-grey-700 border-grey-200';
  }
  function renderNodeBox(node: any) {
    const isEditing = editingTreeNodeId === node.id;

    if (isEditing) {
      return (
        <div className="bg-white border-2 border-blue-400 rounded-lg p-3 shadow-sm" style={{ minWidth: 180, maxWidth: 220 }}>
          <input
            type="text"
            value={editNode.title}
            onChange={(e) => setEditNode({ ...editNode, title: e.target.value })}
            className="w-full border border-slate-300 rounded px-2 py-1 text-xs mb-2"
            autoFocus
          />
          <textarea
            value={editNode.description}
            onChange={(e) => setEditNode({ ...editNode, description: e.target.value })}
            className="w-full border border-slate-300 rounded px-2 py-1 text-xs mb-2"
            rows={2}
            placeholder="Description..."
          />
          <div className="grid grid-cols-2 gap-1 mb-2">
            <select
              value={editNode.nodeType}
              onChange={(e) => setEditNode({ ...editNode, nodeType: e.target.value })}
              className="border border-slate-300 rounded px-1 py-1 text-xs"
            >
              <option value="">Not Specified</option>
              {nodeTypes.map(nt => <option key={nt.value} value={nt.value}>{nt.label}</option>)}
            </select>
            <select
              value={editNode.factorCategory}
              onChange={(e) => setEditNode({ ...editNode, factorCategory: e.target.value })}
              className="border border-slate-300 rounded px-1 py-1 text-xs"
            >
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
              {node.node_type && (
                <span className={`px-1.5 py-0.5 rounded text-xs border ${getNodeTypeStyle(node.node_type)}`}>
                  {nodeTypes.find(t => t.value === node.node_type)?.label}
                </span>
              )}
              {node.factor_category && (
                <span className="px-1.5 py-0.5 rounded text-xs bg-white bg-opacity-70 border border-slate-300 text-slate-600">
                  {factorCategories.find(c => c.value === node.factor_category)?.label}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-current border-opacity-20">
          <button
            onClick={() => {
              setEditingTreeNodeId(node.id);
              setEditNode({ title: node.title, description: node.description || '', nodeType: node.node_type || '', factorCategory: node.factor_category || '' });
            }}
            className="p-1 hover:bg-white hover:bg-opacity-50 rounded"
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setSelectedParentId(node.id);
              setShowAddNode(true);
            }}
            className="p-1 hover:bg-white hover:bg-opacity-50 rounded"
            title="Add child cause"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => deleteTreeNode(node.id)}
            className="p-1 hover:bg-white hover:bg-opacity-50 rounded text-red-600"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
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
            <button
              onClick={() => toggleExpand(node.id)}
              className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-white border border-slate-300 rounded-full w-6 h-6 flex items-center justify-center shadow-sm hover:bg-slate-50 z-10"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3 text-slate-600" /> : <ChevronRight className="w-3 h-3 text-slate-600" />}
            </button>
          )}
        </div>

        {visibleChildren.length > 0 && (
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-6 bg-slate-400" />
            <div className="relative flex items-start">
              {visibleChildren.length > 1 && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 bg-slate-400"
                  style={{ width: `calc(100% - 220px)` }}
                />
              )}
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

  function CauseTypeTooltip() {
    return (
      <button
        type="button"
        onClick={() => setShowCauseTypeModal(true)}
        className="ml-1.5 text-slate-400 hover:text-blue-600 transition-colors"
        aria-label="Cause type definitions"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-3a1 1 0 11-2 0 1 1 0 012 0zM9 5a1 1 0 100 2h2a1 1 0 100-2H9zm0 4a1 1 0 00-1 1v2a1 1 0 100 2h2a1 1 0 100-2v-2a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </button>
    );
  }

  function RootCauseTooltip() {
    const [open, setOpen] = useState(false);
    return (
      <div className="relative inline-block">
        <button
          type="button"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          className="ml-1 text-slate-400 hover:text-blue-600 transition-colors"
          aria-label="Root cause definition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-3a1 1 0 11-2 0 1 1 0 012 0zM9 5a1 1 0 100 2h2a1 1 0 100-2H9zm0 4a1 1 0 00-1 1v2a1 1 0 100 2h2a1 1 0 100-2v-2a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
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
        <button
          type="button"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          className="ml-1.5 text-slate-400 hover:text-blue-600 transition-colors"
          aria-label={`${category.label} category information`}
        >
          <HelpCircle className="w-4 h-4" />
        </button>
        {open && (
          <div className="absolute z-50 left-1/2 -translate-x-1/2 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg p-4">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-slate-200 rotate-45" />
            <p className="text-xs font-semibold text-slate-800">{category.label}</p>
            <p className="text-xs text-slate-600 mt-1">{category.description}</p>
            <p className="text-xs text-blue-600 mt-2">
              <span className="font-semibold">Examples:</span> {category.examples}
            </p>
          </div>
        )}
      </div>
    );
  }

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
        <div className="max-w-6xl mx-auto">

          {/* Header */}
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

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-6 overflow-hidden">
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab('5whys')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === '5whys'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">🔍</span>
                  <span>5 Whys Visual Builder</span>
                  {whyChain.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                      {whyChain.length} level{whyChain.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('causalTree')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'causalTree'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Network className="w-4 h-4" />
                  <span>Causal Tree</span>
                  {causalTree.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                      {causalTree.length} node{causalTree.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('barriers')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'barriers'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">🛡️</span>
                  <span>Barrier Analysis</span>
                  {barriers.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                      {barriers.length} barrier{barriers.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('fishbone')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'fishbone'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">🐟</span>
                  <span>Fishbone</span>
                  {fishboneCauses.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                      {fishboneCauses.length}
                    </span>
                  )}
                </div>
              </button>
            </div>
