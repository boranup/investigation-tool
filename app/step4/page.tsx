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
  const [activeTab, setActiveTab] = useState<'5whys' | 'causalTree'>('5whys');

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
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [editingTreeNodeId, setEditingTreeNodeId] = useState<string | null>(null);
  const [editNode, setEditNode] = useState({ title: '', description: '', nodeType: 'immediate', factorCategory: 'equipment' });

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
        const parentIds: Record<string, boolean> = {};
        treeData.forEach((node: any) => {
          if (node.parent_node_id) {
            parentIds[node.parent_node_id] = true;
          }
        });
        setExpandedNodes(parentIds);
      }
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
        setExpandedNodes({ ...expandedNodes, [selectedParentId]: true });
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
      const idsToDelete: string[] = [];
      const collectChildren = (parentId: string) => {
        idsToDelete.push(parentId);
        causalTree.filter(n => n.parent_node_id === parentId).forEach(child => collectChildren(child.id));
      };
      collectChildren(id);

      const { error } = await supabase
        .from('visualization_causal_tree')
        .delete()
        .in('id', idsToDelete);

      if (error) throw error;
      setCausalTree(causalTree.filter(n => !idsToDelete.includes(n.id)));
    } catch (err) {
      console.error('Error deleting node:', err);
    }
  }

  function toggleExpand(id: string) {
    setExpandedNodes(prev => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = true;
      }
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
  // Single node card — view mode or inline edit
  function renderNodeBox(node: any) {
    const isEditing = editingTreeNodeId === node.id;

    if (isEditing) {
      return (
        <div className="bg-white border-2 border-blue-400 rounded-lg p-3 shadow-md w-48">
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
          <div className="flex gap-1 mb-2">
            <select
              value={editNode.nodeType}
              onChange={(e) => setEditNode({ ...editNode, nodeType: e.target.value })}
              className="flex-1 border border-slate-300 rounded px-1 py-1 text-xs"
            >
              {nodeTypes.map(nt => <option key={nt.value} value={nt.value}>{nt.label}</option>)}
            </select>
            <select
              value={editNode.factorCategory}
              onChange={(e) => setEditNode({ ...editNode, factorCategory: e.target.value })}
              className="flex-1 border border-slate-300 rounded px-1 py-1 text-xs"
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
      <div className={`border-2 rounded-lg p-3 shadow-sm w-48 ${getNodeTypeStyle(node.node_type)}`}>
        <p className="font-semibold text-sm leading-snug">{node.title}</p>
        {node.description && <p className="text-xs mt-1 opacity-75 leading-snug">{node.description}</p>}
        <div className="flex flex-wrap gap-1 mt-2">
          <span className={`px-1.5 py-0.5 rounded text-xs border ${getNodeTypeStyle(node.node_type)}`}>
            {nodeTypes.find(t => t.value === node.node_type)?.label}
          </span>
          <span className="px-1.5 py-0.5 rounded text-xs bg-white bg-opacity-70 border border-slate-300 text-slate-600">
            {factorCategories.find(c => c.value === node.factor_category)?.label}
          </span>
        </div>
        {/* Action buttons */}
        <div className="flex items-center gap-0.5 mt-2 pt-2 border-t border-current border-opacity-20">
          <button
            onClick={() => {
              setEditingTreeNodeId(node.id);
              setEditNode({ title: node.title, description: node.description || '', nodeType: node.node_type, factorCategory: node.factor_category });
            }}
            className="p-1 hover:bg-white hover:bg-opacity-50 rounded"
            title="Edit"
          ><Edit2 className="w-3.5 h-3.5" /></button>
          <button
            onClick={() => { setSelectedParentId(node.id); setShowAddNode(true); }}
            className="p-1 hover:bg-white hover:bg-opacity-50 rounded"
            title="Add child cause"
          ><Plus className="w-3.5 h-3.5" /></button>
          <button
            onClick={() => deleteTreeNode(node.id)}
            className="p-1 hover:bg-white hover:bg-opacity-50 rounded text-red-600"
            title="Delete node and children"
          ><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    );
  }

  // Recursive branch: renders one node, then its children beneath connected by lines
  function renderTreeBranch(node: any): React.ReactNode {
    const children = causalTree.filter(n => n.parent_node_id === node.id);
    const hasChildren = children.length > 0;
    const isExpanded = !!expandedNodes[node.id];

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* The node box */}
        <div className="relative">
          {renderNodeBox(node)}
          {/* Expand/collapse toggle on bottom edge */}
          {hasChildren && (
            <button
              onClick={() => toggleExpand(node.id)}
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10
                         w-6 h-6 rounded-full bg-white border border-slate-300 shadow-sm
                         flex items-center justify-center hover:bg-slate-50"
            >
              {isExpanded
                ? <ChevronDown className="w-3 h-3 text-slate-600" />
                : <ChevronRight className="w-3 h-3 text-slate-600" />}
            </button>
          )}
        </div>

        {/* Connector lines + children */}
        {hasChildren && isExpanded && (
          <div className="flex flex-col items-center">
            {/* Vertical stem down from this node */}
            <div className="w-px h-6 bg-slate-400" />

            {/* Horizontal bar spans across all children; each child has its own vertical drop */}
            <div className="relative flex items-start">
              {/* Horizontal bar — only visible when there are 2+ children */}
              {children.length > 1 && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-slate-400"
                     style={{ width: 'calc(100% - 192px)' }} />
              )}

              {/* Row of children */}
              <div className="flex gap-6 items-start">
                {children.map(child => (
                  <div key={child.id} className="flex flex-col items-center">
                    {/* Vertical drop from bar to child */}
                    <div className="w-px h-4 bg-slate-400" />
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
