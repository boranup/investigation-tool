'use client'

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Network, Plus, Trash2, Edit2, ChevronDown, ChevronRight, AlertCircle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import StepNavigation from '@/components/StepNavigation';

export default function Visualisations() {
  const searchParams = useSearchParams();
  const investigationId = searchParams.get('investigationId');

  const [loading, setLoading] = useState(true);
  const [investigation, setInvestigation] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'5whys' | 'causalTree' | 'barriers'>('5whys');

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
    nodeType: 'immediate',
    factorCategory: 'equipment'
  });
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [editingTreeNodeId, setEditingTreeNodeId] = useState<string | null>(null);
  const [editNode, setEditNode] = useState({ title: '', description: '', nodeType: 'immediate', factorCategory: 'equipment' });

  // ── Barrier Analysis state ──────────────────────────────────
  const [barriers, setBarriers] = useState<any[]>([]);
  const [showAddBarrier, setShowAddBarrier] = useState(false);
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
      // Auto-expand all nodes that have children so tree is visible on load
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
    } catch (err) {
      console.error('Error loading visualisations:', err);
    } finally {
      setLoading(false);
    }
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
      // Update local state
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
          node_type: editNode.nodeType,
          factor_category: editNode.factorCategory
        })
        .eq('id', editingTreeNodeId);
      if (error) throw error;
      setCausalTree(prev => prev.map(n =>
        n.id === editingTreeNodeId
          ? { ...n, title: editNode.title.trim(), description: editNode.description.trim() || null, node_type: editNode.nodeType, factor_category: editNode.factorCategory }
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
        node_type: newNode.nodeType,
        factor_category: newNode.factorCategory
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
      setNewNode({ title: '', description: '', nodeType: 'immediate', factorCategory: 'equipment' });
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
      // Collect all descendant IDs recursively
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

  function getNodeTypeStyle(type: string) {
    return nodeTypes.find(t => t.value === type)?.color || 'bg-grey-100 text-grey-700 border-grey-300';
  }

  function getFactorTypeStyle(type: string) {
    return factorTypes.find(t => t.value === type)?.color || 'bg-grey-100 text-grey-700 border-grey-200';
  }

  // ── Tree renderer ────────────────────────────────────────────
  // Renders a single node card — edit form if active, otherwise view with action buttons
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
              {nodeTypes.map(nt => <option key={nt.value} value={nt.value}>{nt.label}</option>)}
            </select>
            <select
              value={editNode.factorCategory}
              onChange={(e) => setEditNode({ ...editNode, factorCategory: e.target.value })}
              className="border border-slate-300 rounded px-1 py-1 text-xs"
            >
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
              <span className={`px-1.5 py-0.5 rounded text-xs border ${getNodeTypeStyle(node.node_type)}`}>
                {nodeTypes.find(t => t.value === node.node_type)?.label}
              </span>
              <span className="px-1.5 py-0.5 rounded text-xs bg-white bg-opacity-70 border border-slate-300 text-slate-600">
                {factorCategories.find(c => c.value === node.factor_category)?.label}
              </span>
            </div>
          </div>
        </div>
        {/* Action row */}
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-current border-opacity-20">
          <button
            onClick={() => {
              setEditingTreeNodeId(node.id);
              setEditNode({ title: node.title, description: node.description || '', nodeType: node.node_type, factorCategory: node.factor_category });
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

  // Recursive vertical tree: node box on top, expand toggle, then children in a row connected by lines
  function renderTreeBranch(node: any): React.ReactNode {
    const children = causalTree.filter(n => n.parent_node_id === node.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const visibleChildren = hasChildren && isExpanded ? children : [];

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* The node box itself */}
        <div className="relative">
          {renderNodeBox(node)}
          {/* Expand/collapse toggle if has children */}
          {hasChildren && (
            <button
              onClick={() => toggleExpand(node.id)}
              className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-white border border-slate-300 rounded-full w-6 h-6 flex items-center justify-center shadow-sm hover:bg-slate-50 z-10"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3 text-slate-600" /> : <ChevronRight className="w-3 h-3 text-slate-600" />}
            </button>
          )}
        </div>

        {/* Connector and children row */}
        {visibleChildren.length > 0 && (
          <div className="flex flex-col items-center">
            {/* Vertical line from parent down to the horizontal bar */}
            <div className="w-0.5 h-6 bg-slate-400" />

            {/* Horizontal bar + vertical drops to each child */}
            <div className="relative flex items-start">
              {/* Horizontal connector bar */}
              {visibleChildren.length > 1 && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 bg-slate-400"
                  style={{ width: `calc(100% - 220px)` }}
                />
              )}

              {/* Each child with its own vertical drop */}
              <div className="flex gap-4 items-start">
                {visibleChildren.map((child) => (
                  <div key={child.id} className="flex flex-col items-center">
                    {/* Vertical drop from bar to child */}
                    <div className="w-0.5 h-4 bg-slate-400" />
                    {/* Recurse */}
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

  // ── Guards ───────────────────────────────────────────────────
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

  // ── Render ───────────────────────────────────────────────────
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
            </div>

            {/* ── 5 Whys Tab ─────────────────────────────────────── */}
            {activeTab === '5whys' && (
              <div className="p-6">
                {/* Incident seed */}
                <div className="bg-slate-100 border border-slate-300 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Starting Point — Incident</span>
                  </div>
                  <p className="text-slate-800 font-medium">
                    {investigation?.incident_description || 'No incident description recorded.'}
                  </p>
                </div>

                {/* Why chain */}
                <div className="space-y-2">
                  {whyChain.map((why, index) => (
                    <div key={why.id} className="flex gap-3">
                      {/* Connector line */}
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        {index < whyChain.length - 1 && <div className="w-0.5 flex-1 bg-blue-300 min-h-[16px]" />}
                      </div>

                      {/* Card — view or edit mode */}
                      <div className="flex-1 bg-white border border-slate-200 rounded-lg p-4 mb-2">
                        {editingWhyId === why.id ? (
                          /* ── Edit mode ── */
                          <div className="space-y-3">
                            <textarea
                              value={editWhy.answer}
                              onChange={(e) => setEditWhy({ ...editWhy, answer: e.target.value })}
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                              rows={2}
                              autoFocus
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Factor Type</label>
                                <select
                                  value={editWhy.factorType}
                                  onChange={(e) => setEditWhy({ ...editWhy, factorType: e.target.value })}
                                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                                >
                                  {factorTypes.map(ft => (
                                    <option key={ft.value} value={ft.value}>{ft.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex items-end">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editWhy.isRootCause}
                                    onChange={(e) => setEditWhy({ ...editWhy, isRootCause: e.target.checked })}
                                    className="w-4 h-4 text-blue-600"
                                  />
                                  <span className="text-sm text-slate-700">Root cause</span>
                                </label>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={updateWhyLevel}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingWhyId(null)}
                                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* ── View mode ── */
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-xs text-slate-500 italic mb-1">{why.question}</p>
                              <p className="text-slate-800 font-medium">{why.answer}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs border ${getFactorTypeStyle(why.factor_type)}`}>
                                  {factorTypes.find(t => t.value === why.factor_type)?.label}
                                </span>
                                {why.is_root_cause && (
                                  <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 border border-green-200 font-semibold">
                                    ✓ Root Cause
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingWhyId(why.id);
                                  setEditWhy({ answer: why.answer, isRootCause: why.is_root_cause, factorType: why.factor_type });
                                }}
                                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteWhyLevel(why.id, why.level)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                title="Delete this and subsequent levels"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Warning if shallow */}
                {whyChain.length > 0 && whyChain.length < 3 && !whyChain.some(w => w.is_root_cause) && (
                  <div className="flex items-start gap-2 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      Investigations typically require at least 3 levels of "Why" before reaching a root cause. Continue exploring.
                    </p>
                  </div>
                )}

                {/* Add Why form / button */}
                {!whyChain.some(w => w.is_root_cause) && (
                  showAddWhy ? (
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800 font-medium mb-3">
                        Why {whyChain.length + 1}: Why did "{whyChain.length > 0 ? whyChain[whyChain.length - 1].answer : (investigation?.incident_description || 'the incident')}" occur?
                      </p>
                      <textarea
                        value={newWhy.answer}
                        onChange={(e) => setNewWhy({ ...newWhy, answer: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-3"
                        rows={2}
                        placeholder="Provide the answer..."
                        autoFocus
                      />
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Factor Type</label>
                          <select
                            value={newWhy.factorType}
                            onChange={(e) => setNewWhy({ ...newWhy, factorType: e.target.value })}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                          >
                            {factorTypes.map(ft => (
                              <option key={ft.value} value={ft.value}>{ft.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-end">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newWhy.isRootCause}
                              onChange={(e) => setNewWhy({ ...newWhy, isRootCause: e.target.checked })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-slate-700">Mark as root cause</span>
                          </label>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={addWhyLevel}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                        >
                          Add Level {whyChain.length + 1}
                        </button>
                        <button
                          onClick={() => { setShowAddWhy(false); setNewWhy({ answer: '', isRootCause: false, factorType: 'individual' }); }}
                          className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddWhy(true)}
                      className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add Why Level {whyChain.length + 1}
                    </button>
                  )
                )}

                {/* Clear chain */}
                {whyChain.length > 0 && (
                  <button
                    onClick={clearWhyChain}
                    className="mt-4 text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    Clear entire chain and restart
                  </button>
                )}
              </div>
            )}

            {/* ── Causal Tree Tab ────────────────────────────────── */}
            {activeTab === 'causalTree' && (
              <div className="p-6">
                {/* Legend */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {nodeTypes.map(nt => (
                    <span key={nt.value} className={`px-3 py-1 rounded-full text-xs font-medium border ${nt.color}`}>
                      {nt.label}
                    </span>
                  ))}
                </div>

                {/* Root-level nodes — rendered as vertical tree */}
                <div className="flex flex-wrap justify-center gap-8 py-4">
                  {causalTree.filter(n => !n.parent_node_id).map(node => renderTreeBranch(node))}
                </div>

                {causalTree.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <Network className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">No causal tree nodes yet. Add the first cause below.</p>
                  </div>
                )}

                {/* Add node form / button */}
                {showAddNode ? (
                  <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
                    {selectedParentId && (
                      <p className="text-xs text-slate-500 mb-2">
                        Adding child cause under: <span className="font-semibold">{causalTree.find(n => n.id === selectedParentId)?.title}</span>
                      </p>
                    )}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
                      <input
                        type="text"
                        value={newNode.title}
                        onChange={(e) => setNewNode({ ...newNode, title: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                        placeholder="Describe the cause..."
                        autoFocus
                      />
                    </div>
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                      <textarea
                        value={newNode.description}
                        onChange={(e) => setNewNode({ ...newNode, description: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                        rows={2}
                        placeholder="Optional detail..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Cause Type</label>
                        <select
                          value={newNode.nodeType}
                          onChange={(e) => setNewNode({ ...newNode, nodeType: e.target.value })}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                        >
                          {nodeTypes.map(nt => (
                            <option key={nt.value} value={nt.value}>{nt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                        <select
                          value={newNode.factorCategory}
                          onChange={(e) => setNewNode({ ...newNode, factorCategory: e.target.value })}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                        >
                          {factorCategories.map(fc => (
                            <option key={fc.value} value={fc.value}>{fc.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={addTreeNode}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                      >
                        Add {selectedParentId ? 'Child' : 'Root'} Cause
                      </button>
                      <button
                        onClick={() => { setShowAddNode(false); setSelectedParentId(null); setNewNode({ title: '', description: '', nodeType: 'immediate', factorCategory: 'equipment' }); }}
                        className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setSelectedParentId(null); setShowAddNode(true); }}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Root Cause
                  </button>
                )}
              </div>
            )}

            {/* ── Barrier Analysis Tab ──────────────────────────── */}
            {activeTab === 'barriers' && (
              <div className="p-6">
                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-700">
                      {barriers.filter(b => b.status === 'present_performed').length}
                    </div>
                    <div className="text-xs text-green-600 mt-0.5">Performed</div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-amber-700">
                      {barriers.filter(b => b.status === 'present_partial').length}
                    </div>
                    <div className="text-xs text-amber-600 mt-0.5">Partial</div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-700">
                      {barriers.filter(b => b.status === 'present_failed').length}
                    </div>
                    <div className="text-xs text-red-600 mt-0.5">Failed</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-slate-600">
                      {barriers.filter(b => b.status === 'absent').length}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">Absent</div>
                  </div>
                </div>

                {/* Intro text */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-5">
                  <p className="text-sm text-slate-600">
                    Identify the barriers (safeguards) that were expected to prevent or mitigate this incident.
                    Record whether each barrier was present and whether it performed as intended.
                    Barriers are classified as <strong>Prevention</strong> (stopping the hazardous event) or <strong>Recovery</strong> (limiting consequences after the event).
                  </p>
                </div>

                {/* Add barrier button / form */}
                {!showAddBarrier && !editingBarrierId && (
                  <button
                    onClick={() => setShowAddBarrier(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors mb-5"
                  >
                    <Plus className="w-4 h-4" />
                    Add Barrier
                  </button>
                )}

                {/* Add Barrier Form */}
                {showAddBarrier && (
                  <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 mb-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-blue-800">New Barrier</h4>
                      <button onClick={() => setShowAddBarrier(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Barrier Name *</label>
                        <input
                          type="text"
                          value={newBarrier.name}
                          onChange={(e) => setNewBarrier({ ...newBarrier, name: e.target.value })}
                          placeholder="e.g. Pressure relief valve"
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Barrier Type *</label>
                        <select
                          value={newBarrier.barrierType}
                          onChange={(e) => setNewBarrier({ ...newBarrier, barrierType: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                        >
                          <option value="physical">Physical</option>
                          <option value="administrative">Administrative</option>
                          <option value="detection">Detection</option>
                          <option value="communication">Communication</option>
                          <option value="recovery">Recovery</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Classification *</label>
                        <select
                          value={newBarrier.side}
                          onChange={(e) => setNewBarrier({ ...newBarrier, side: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                        >
                          <option value="prevention">Prevention</option>
                          <option value="recovery">Recovery</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Status *</label>
                        <select
                          value={newBarrier.status}
                          onChange={(e) => setNewBarrier({ ...newBarrier, status: e.target.value, failureReason: '' })}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                        >
                          <option value="present_performed">Present & Performed</option>
                          <option value="present_partial">Present & Partially Performed</option>
                          <option value="present_failed">Present & Failed</option>
                          <option value="absent">Absent</option>
                        </select>
                      </div>
                      {['present_failed', 'present_partial', 'absent'].includes(newBarrier.status) && (
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            {newBarrier.status === 'absent' ? 'Reason for Absence *' : 'Failure Reason *'}
                          </label>
                          <input
                            type="text"
                            value={newBarrier.failureReason}
                            onChange={(e) => setNewBarrier({ ...newBarrier, failureReason: e.target.value })}
                            placeholder={newBarrier.status === 'absent' ? 'Why was this barrier not in place?' : 'Why did this barrier fail?'}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      )}
                      <div className={newBarrier.status === 'present_performed' ? 'md:col-span-2' : ''}>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                        <input
                          type="text"
                          value={newBarrier.notes}
                          onChange={(e) => setNewBarrier({ ...newBarrier, notes: e.target.value })}
                          placeholder="Additional context (optional)"
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={addBarrier}
                        disabled={!newBarrier.name.trim()}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add Barrier
                      </button>
                      <button
                        onClick={() => setShowAddBarrier(false)}
                        className="px-4 py-2 text-slate-600 border border-slate-300 text-sm rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Barrier list grouped by side */}
                {barriers.length === 0 && !showAddBarrier && (
                  <p className="text-sm text-slate-500 italic">No barriers recorded yet. Add barriers to analyse which safeguards were in place during this incident.</p>
                )}

                {['prevention', 'recovery'].map(side => {
                  const sideBarriers = barriers.filter(b => b.barrier_side === side);
                  if (sideBarriers.length === 0) return null;
                  return (
                    <div key={side} className="mb-5">
                      <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${side === 'prevention' ? 'border-blue-200' : 'border-emerald-200'}`}>
                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${side === 'prevention' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {side === 'prevention' ? 'Prevention Barriers' : 'Recovery Barriers'}
                        </span>
                        <span className="text-xs text-slate-500">({sideBarriers.length})</span>
                      </div>
                      <div className="space-y-2">
                        {sideBarriers.map((barrier: any) => (
                          <div key={barrier.id} className="border border-slate-200 rounded-lg overflow-hidden">
                            {editingBarrierId === barrier.id ? (
                              /* Edit inline form */
                              <div className="p-4 bg-blue-50 border-t border-blue-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Barrier Name *</label>
                                    <input
                                      type="text"
                                      value={editBarrier.name}
                                      onChange={(e) => setEditBarrier({ ...editBarrier, name: e.target.value })}
                                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Barrier Type *</label>
                                    <select
                                      value={editBarrier.barrierType}
                                      onChange={(e) => setEditBarrier({ ...editBarrier, barrierType: e.target.value })}
                                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                                    >
                                      <option value="physical">Physical</option>
                                      <option value="administrative">Administrative</option>
                                      <option value="detection">Detection</option>
                                      <option value="communication">Communication</option>
                                      <option value="recovery">Recovery</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Classification *</label>
                                    <select
                                      value={editBarrier.side}
                                      onChange={(e) => setEditBarrier({ ...editBarrier, side: e.target.value })}
                                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                                    >
                                      <option value="prevention">Prevention</option>
                                      <option value="recovery">Recovery</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Status *</label>
                                    <select
                                      value={editBarrier.status}
                                      onChange={(e) => setEditBarrier({ ...editBarrier, status: e.target.value, failureReason: '' })}
                                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                                    >
                                      <option value="present_performed">Present & Performed</option>
                                      <option value="present_partial">Present & Partially Performed</option>
                                      <option value="present_failed">Present & Failed</option>
                                      <option value="absent">Absent</option>
                                    </select>
                                  </div>
                                  {['present_failed', 'present_partial', 'absent'].includes(editBarrier.status) && (
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-medium text-slate-600 mb-1">
                                        {editBarrier.status === 'absent' ? 'Reason for Absence *' : 'Failure Reason *'}
                                      </label>
                                      <input
                                        type="text"
                                        value={editBarrier.failureReason}
                                        onChange={(e) => setEditBarrier({ ...editBarrier, failureReason: e.target.value })}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                                      />
                                    </div>
                                  )}
                                  <div className={editBarrier.status === 'present_performed' ? 'md:col-span-2' : ''}>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                                    <input
                                      type="text"
                                      value={editBarrier.notes}
                                      onChange={(e) => setEditBarrier({ ...editBarrier, notes: e.target.value })}
                                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2 mt-3">
                                  <button
                                    onClick={updateBarrier}
                                    disabled={!editBarrier.name.trim()}
                                    className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingBarrierId(null)}
                                    className="px-3 py-1.5 text-slate-600 border border-slate-300 text-xs rounded-lg hover:bg-slate-50 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Display row */
                              <div className="flex items-start justify-between p-3 hover:bg-slate-50 transition-colors">
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-slate-800">{barrier.barrier_name}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getBarrierStatusStyle(barrier.status)}`}>
                                      {getBarrierStatusLabel(barrier.status)}
                                    </span>
                                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                                      {getBarrierTypeLabel(barrier.barrier_type)}
                                    </span>
                                  </div>
                                  {barrier.failure_reason && (
                                    <p className="text-xs text-red-600 mt-1">
                                      <strong>{barrier.status === 'absent' ? 'Absence reason:' : 'Failure reason:'}</strong> {barrier.failure_reason}
                                    </p>
                                  )}
                                  {barrier.notes && (
                                    <p className="text-xs text-slate-500 mt-0.5">{barrier.notes}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                                  <button
                                    onClick={() => {
                                      setEditingBarrierId(barrier.id);
                                      setEditBarrier({
                                        name: barrier.barrier_name,
                                        barrierType: barrier.barrier_type,
                                        side: barrier.barrier_side,
                                        status: barrier.status,
                                        failureReason: barrier.failure_reason || '',
                                        notes: barrier.notes || ''
                                      });
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Edit"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => deleteBarrier(barrier.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
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

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Previous Step
            </button>
            <button
              onClick={() => {
                if (!investigationId) return;
                window.location.href = `/step5?investigationId=${investigationId}`;
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Next: Causal Analysis
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
