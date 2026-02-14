'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Network, Plus, Trash2, Edit2, ChevronDown, ChevronRight, AlertCircle, X,
         HelpCircle, Download, Info, Flag, CheckCircle, Tag, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import StepNavigation from '@/components/StepNavigation';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const CAUSAL_FACTOR_TYPES = [
  { value: 'immediate',     label: 'Immediate Cause',     colour: 'red',    description: 'The direct cause — the final action or condition that triggered the incident.' },
  { value: 'contributing',  label: 'Contributing Factor',  colour: 'orange', description: 'A condition or action that increased the likelihood or severity of the incident.' },
  { value: 'root',          label: 'Root Cause',           colour: 'purple', description: 'The underlying systemic reason — if eliminated, would prevent recurrence.' },
  { value: 'latent',        label: 'Latent Condition',     colour: 'blue',   description: 'A dormant system weakness that became active during the incident.' },
];

const CAUSAL_TYPE_COLOURS: Record<string, string> = {
  immediate:    'bg-red-100 text-red-700 border-red-300',
  contributing: 'bg-orange-100 text-orange-700 border-orange-300',
  root:         'bg-purple-100 text-purple-700 border-purple-300',
  latent:       'bg-blue-100 text-blue-700 border-blue-300',
};

const FISHBONE_CATEGORIES = [
  { id: 'people',     label: 'People',          colour: '#2563eb', description: 'Human actions, decisions, skills, competency, and behaviour.' },
  { id: 'procedure',  label: 'Procedure',        colour: '#7c3aed', description: 'Written procedures, work instructions, standards, and specifications.' },
  { id: 'plant',      label: 'Plant/Equipment',  colour: '#0891b2', description: 'Equipment condition, design, maintenance, and fitness for purpose.' },
  { id: 'environment',label: 'Environment',      colour: '#059669', description: 'Physical and external conditions: weather, housekeeping, noise, lighting.' },
  { id: 'management', label: 'Management Systems',colour: '#d97706', description: 'Organisational processes, supervision, planning, and safety management.' },
  { id: 'external',   label: 'External Factors', colour: '#dc2626', description: 'Regulatory, contractor, supply chain, or third-party influences.' },
];

const WHY_FACTOR_TYPES = [
  { value: 'individual',     label: 'Individual Factor' },
  { value: 'task',           label: 'Task/Work Factor' },
  { value: 'organisational', label: 'Organisational Factor' },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function Visualisations() {
  const searchParams = useSearchParams();
  const investigationId = searchParams.get('investigationId');

  const [loading, setLoading] = useState(true);
  const [investigation, setInvestigation] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'5whys' | 'causalTree' | 'fishbone'>('fishbone');

  // ── 5 Whys state ────────────────────────────────────────────────────────────
  const [whyChain, setWhyChain] = useState<any[]>([]);
  const [showAddWhy, setShowAddWhy] = useState(false);
  const [editingWhyId, setEditingWhyId] = useState<string | null>(null);
  const [editWhy, setEditWhy] = useState({ answer: '', isRootCause: false, factorType: 'individual', isCausalFactor: false, causalFactorType: 'contributing' });
  const [newWhy, setNewWhy] = useState({ answer: '', isRootCause: false, factorType: 'individual', isCausalFactor: false, causalFactorType: 'contributing' });

  // ── Causal Tree state ────────────────────────────────────────────────────────
  const [causalTree, setCausalTree] = useState<any[]>([]);
  const [showAddNode, setShowAddNode] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [newNode, setNewNode] = useState({ text: '', nodeType: 'cause', isCausalFactor: false, causalFactorType: 'contributing' });
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editNode, setEditNode] = useState({ text: '', nodeType: 'cause', isCausalFactor: false, causalFactorType: 'contributing' });

  // ── Fishbone state ───────────────────────────────────────────────────────────
  const [fishboneCauses, setFishboneCauses] = useState<any[]>([]);
  const [fishboneProblemStatement, setFishboneProblemStatement] = useState('');
  const [editingCauseId, setEditingCauseId] = useState<string | null>(null);
  const [editingSubcauseId, setEditingSubcauseId] = useState<string | null>(null);
  const [showAddCause, setShowAddCause] = useState<string | null>(null);
  const [showAddSubcause, setShowAddSubcause] = useState<string | null>(null);
  const [fishboneView, setFishboneView] = useState<'list' | 'diagram'>('list');
  const [newCause, setNewCause] = useState({
    categoryId: '',
    text: '',
    isCausalFactor: false,
    causalFactorType: 'contributing',
  });
  const [newSubcause, setNewSubcause] = useState({ text: '', isCausalFactor: false, causalFactorType: 'contributing' });
  const [editCauseData, setEditCauseData] = useState({ text: '', isCausalFactor: false, causalFactorType: 'contributing' });
  const [editSubcauseData, setEditSubcauseData] = useState({ text: '', isCausalFactor: false, causalFactorType: 'contributing' });
  const [showGuidance, setShowGuidance] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(FISHBONE_CATEGORIES.map(c => c.id)));
  const [hoveredCauseId, setHoveredCauseId] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // DATA LOADING
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (investigationId) {
      loadAll();
    }
  }, [investigationId]);

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadInvestigation(), loadWhyChain(), loadCausalTree(), loadFishbone()]);
    setLoading(false);
  }

  async function loadInvestigation() {
    const { data } = await supabase.from('investigations').select('*').eq('id', investigationId).single();
    if (data) {
      setInvestigation(data);
      if (data.problem_statement) setFishboneProblemStatement(data.problem_statement);
    }
  }

  async function loadWhyChain() {
    const { data } = await supabase
      .from('visualization_5whys')
      .select('*')
      .eq('investigation_id', investigationId)
      .order('order_index', { ascending: true });
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
    const { data } = await supabase
      .from('fishbone_causes')
      .select('*')
      .eq('investigation_id', investigationId)
      .order('created_at', { ascending: true });
    if (data) setFishboneCauses(data);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5 WHYS FUNCTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  async function handleAddWhy() {
    if (!newWhy.answer.trim()) return;
    const { error } = await supabase.from('visualization_5whys').insert([{
      investigation_id: investigationId,
      answer: newWhy.answer.trim(),
      is_root_cause: newWhy.isRootCause,
      factor_type: newWhy.factorType,
      is_causal_factor: newWhy.isCausalFactor,
      causal_factor_type: newWhy.isCausalFactor ? newWhy.causalFactorType : null,
      order_index: whyChain.length,
    }]);
    if (!error) {
      setNewWhy({ answer: '', isRootCause: false, factorType: 'individual', isCausalFactor: false, causalFactorType: 'contributing' });
      setShowAddWhy(false);
      loadWhyChain();
    }
  }

  async function handleUpdateWhy(id: string) {
    const { error } = await supabase.from('visualization_5whys').update({
      answer: editWhy.answer,
      is_root_cause: editWhy.isRootCause,
      factor_type: editWhy.factorType,
      is_causal_factor: editWhy.isCausalFactor,
      causal_factor_type: editWhy.isCausalFactor ? editWhy.causalFactorType : null,
    }).eq('id', id);
    if (!error) {
      setEditingWhyId(null);
      loadWhyChain();
    }
  }

  async function handleDeleteWhy(id: string) {
    if (!confirm('Delete this Why entry?')) return;
    await supabase.from('visualization_5whys').delete().eq('id', id);
    loadWhyChain();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CAUSAL TREE FUNCTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  async function handleAddNode() {
    if (!newNode.text.trim()) return;
    const { error } = await supabase.from('visualization_causal_tree').insert([{
      investigation_id: investigationId,
      title: newNode.text.trim(),
      node_type: newNode.nodeType || null,
      factor_category: null,
      parent_node_id: selectedParentId,
      is_causal_factor: newNode.isCausalFactor,
      causal_factor_type: newNode.isCausalFactor ? newNode.causalFactorType : null,
    }]);
    if (!error) {
      setNewNode({ text: '', nodeType: 'cause', isCausalFactor: false, causalFactorType: 'contributing' });
      setShowAddNode(false);
      setSelectedParentId(null);
      loadCausalTree();
    }
  }

  async function handleUpdateNode(id: string) {
    const { error } = await supabase.from('visualization_causal_tree').update({
      title: editNode.text,
      node_type: editNode.nodeType || null,
      is_causal_factor: editNode.isCausalFactor,
      causal_factor_type: editNode.isCausalFactor ? editNode.causalFactorType : null,
    }).eq('id', id);
    if (!error) {
      setEditingNodeId(null);
      loadCausalTree();
    }
  }

  async function handleDeleteNode(id: string) {
    if (!confirm('Delete this node and all its children?')) return;
    const children = causalTree.filter(n => n.parent_id === id);
    for (const child of children) await handleDeleteNode(child.id);
    await supabase.from('visualization_causal_tree').delete().eq('id', id);
    loadCausalTree();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FISHBONE FUNCTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  async function saveProblemStatement(value: string) {
    await supabase.from('investigations').update({ problem_statement: value }).eq('id', investigationId);
  }

  async function handleAddCause(categoryId: string) {
    if (!newCause.text.trim()) return;
    const { error } = await supabase.from('fishbone_causes').insert([{
      investigation_id: investigationId,
      category_id: categoryId,
      cause_text: newCause.text.trim(),
      is_causal_factor: newCause.isCausalFactor,
      causal_factor_type: newCause.isCausalFactor ? newCause.causalFactorType : null,
    }]);
    if (!error) {
      setNewCause({ categoryId: '', text: '', isCausalFactor: false, causalFactorType: 'contributing' });
      setShowAddCause(null);
      loadFishbone();
    }
  }

  async function handleAddSubcause(parentId: string) {
    if (!newSubcause.text.trim()) return;
    const { error } = await supabase.from('fishbone_causes').insert([{
      investigation_id: investigationId,
      category_id: fishboneCauses.find(c => c.id === parentId)?.category_id,
      cause_text: newSubcause.text.trim(),
      parent_cause_id: parentId,
      is_causal_factor: newSubcause.isCausalFactor,
      causal_factor_type: newSubcause.isCausalFactor ? newSubcause.causalFactorType : null,
    }]);
    if (!error) {
      setNewSubcause({ text: '', isCausalFactor: false, causalFactorType: 'contributing' });
      setShowAddSubcause(null);
      loadFishbone();
    }
  }

  async function handleUpdateCause(id: string) {
    const { error } = await supabase.from('fishbone_causes').update({
      cause_text: editCauseData.text,
      is_causal_factor: editCauseData.isCausalFactor,
      causal_factor_type: editCauseData.isCausalFactor ? editCauseData.causalFactorType : null,
    }).eq('id', id);
    if (!error) {
      setEditingCauseId(null);
      setEditingSubcauseId(null);
      loadFishbone();
    }
  }

  async function handleDeleteCause(id: string) {
    if (!confirm('Delete this cause and any contributing factors beneath it?')) return;
    const subcauses = fishboneCauses.filter(c => c.parent_cause_id === id);
    for (const sub of subcauses) await supabase.from('fishbone_causes').delete().eq('id', sub.id);
    await supabase.from('fishbone_causes').delete().eq('id', id);
    loadFishbone();
  }

  async function exportFishbone() {
    const lines: string[] = [`FISHBONE DIAGRAM — ${investigation?.title || 'Investigation'}`, ''];
    lines.push(`Problem: ${fishboneProblemStatement || 'Not defined'}`, '');
    for (const cat of FISHBONE_CATEGORIES) {
      const causes = fishboneCauses.filter(c => c.category_id === cat.id && !c.parent_cause_id);
      if (causes.length === 0) continue;
      lines.push(`${cat.label.toUpperCase()}:`);
      for (const cause of causes) {
        const cfBadge = cause.is_causal_factor ? ` [${CAUSAL_FACTOR_TYPES.find(t => t.value === cause.causal_factor_type)?.label || 'Causal Factor'}]` : '';
        lines.push(`  • ${cause.cause_text}${cfBadge}`);
        const subs = fishboneCauses.filter(c => c.parent_cause_id === cause.id);
        for (const sub of subs) {
          const subCfBadge = sub.is_causal_factor ? ` [${CAUSAL_FACTOR_TYPES.find(t => t.value === sub.causal_factor_type)?.label || 'Causal Factor'}]` : '';
          lines.push(`      ↳ ${sub.cause_text}${subCfBadge}`);
        }
      }
      lines.push('');
    }
    const totalCf = fishboneCauses.filter(c => c.is_causal_factor).length;
    lines.push(`Total causes: ${fishboneCauses.length}  |  Identified as causal factors: ${totalCf}`);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fishbone-diagram.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  function getCausalFactorBadge(isCausalFactor: boolean, causalFactorType: string | null) {
    if (!isCausalFactor) return null;
    const type = CAUSAL_FACTOR_TYPES.find(t => t.value === causalFactorType);
    return type ? type : CAUSAL_FACTOR_TYPES[1];
  }

  function countFlaggedItems() {
    const fishboneFlags = fishboneCauses.filter(c => c.is_causal_factor).length;
    const whyFlags = whyChain.filter(w => w.is_causal_factor).length;
    const treeFlags = causalTree.filter(n => n.is_causal_factor).length;
    return fishboneFlags + whyFlags + treeFlags;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CAUSAL FACTOR FLAG FORM — reusable inline fragment
  // ─────────────────────────────────────────────────────────────────────────────

  function CausalFactorFlagForm({
    isCausalFactor,
    causalFactorType,
    onToggle,
    onTypeChange,
  }: {
    isCausalFactor: boolean;
    causalFactorType: string;
    onToggle: () => void;
    onTypeChange: (val: string) => void;
  }) {
    return (
      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isCausalFactor}
            onChange={onToggle}
            className="w-4 h-4 accent-amber-600"
          />
          <div className="flex items-center gap-1.5">
            <Flag className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">Flag as Causal Factor</span>
          </div>
        </label>
        <p className="text-xs text-amber-600 mt-1 ml-6">
          Flagging an item as a causal factor makes it available for detailed analysis in Step 5.
        </p>
        {isCausalFactor && (
          <div className="mt-2 ml-6">
            <label className="block text-xs font-medium text-amber-800 mb-1">Type of Causal Factor</label>
            <select
              value={causalFactorType}
              onChange={e => onTypeChange(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-400"
            >
              {CAUSAL_FACTOR_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <p className="text-xs text-amber-600 mt-1">
              {CAUSAL_FACTOR_TYPES.find(t => t.value === causalFactorType)?.description}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FISHBONE DIAGRAM (SVG visual — pure SVG, no foreignObject)
  // ─────────────────────────────────────────────────────────────────────────────

  function FishboneDiagramVisual() {
    const svgWidth = 1100;
    const svgHeight = 580;
    const spineY = svgHeight / 2;
    const headX = svgWidth - 80;
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

    function svgTruncate(text: string, max: number) {
      return text.length > max ? text.slice(0, max - 1) + '…' : text;
    }

    const problemLabel = svgTruncate(fishboneProblemStatement || 'Problem Statement', 18);

    return (
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full min-w-[700px]"
          style={{ fontFamily: 'Arial, sans-serif' }}
        >
          {/* Spine */}
          <line x1={tailX} y1={spineY} x2={headX - 10} y2={spineY} stroke="#1e293b" strokeWidth="3" />
          {/* Arrowhead */}
          <polygon
            points={`${headX - 10},${spineY - 9} ${headX + 10},${spineY} ${headX - 10},${spineY + 9}`}
            fill="#1e293b"
          />

          {/* Problem statement box (head) */}
          <rect x={headX + 12} y={spineY - 30} width={60} height={60} rx={5}
            fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
          <title>{fishboneProblemStatement || 'Problem Statement'}</title>
          <text x={headX + 42} y={spineY - 6} textAnchor="middle" fontSize="8" fontWeight="700" fill="white">
            {svgTruncate(problemLabel.split(' ').slice(0, 3).join(' '), 12)}
          </text>
          <text x={headX + 42} y={spineY + 6} textAnchor="middle" fontSize="8" fontWeight="700" fill="white">
            {svgTruncate(problemLabel.split(' ').slice(3, 6).join(' '), 12)}
          </text>
          <text x={headX + 42} y={spineY + 18} textAnchor="middle" fontSize="8" fontWeight="700" fill="white">
            {svgTruncate(problemLabel.split(' ').slice(6).join(' '), 12)}
          </text>

          {bonePositions.map(({ x, side, cat }) => {
            const dir = side === 'top' ? -1 : 1;
            const tipY = spineY + dir * boneLen;
            const causes = fishboneCauses.filter(c => c.category_id === cat.id && !c.parent_cause_id);

            return (
              <g key={cat.id}>
                {/* Main bone */}
                <line x1={x} y1={spineY} x2={x} y2={tipY} stroke={cat.colour} strokeWidth="2.5" />

                {/* Category label */}
                <text x={x} y={tipY + dir * 16} textAnchor="middle" fontSize="11" fontWeight="700" fill={cat.colour}>
                  {cat.label}
                </text>

                {/* Causes — up to 4 per bone, alternating left/right branches */}
                {causes.slice(0, 4).map((cause, i) => {
                  const causeY = spineY + dir * (30 + i * 26);
                  const branchDir = i % 2 === 0 ? -1 : 1;
                  const branchLen = 68;
                  const tipCX = x + branchDir * branchLen;
                  const isCF = cause.is_causal_factor;
                  const subs = fishboneCauses.filter(c => c.parent_cause_id === cause.id);
                  const labelX = branchDir > 0 ? tipCX + 4 : tipCX - 4;
                  const labelAnchor = branchDir > 0 ? 'start' : 'end';
                  const causeLabel = svgTruncate(cause.cause_text, 22);

                  return (
                    <g key={cause.id}>
                      <title>{cause.cause_text}{isCF ? ` ▶ ${CAUSAL_FACTOR_TYPES.find(t => t.value === cause.causal_factor_type)?.label || 'Causal Factor'}` : ''}
{subs.length > 0 ? `\n${subs.length} contributing factor(s) — see List View` : ''}</title>

                      {/* Branch line */}
                      <line x1={x} y1={causeY} x2={tipCX} y2={causeY}
                        stroke={cat.colour} strokeWidth="1.5"
                        strokeDasharray={isCF ? '0' : '4,3'} />

                      {/* CF flag marker */}
                      {isCF && (
                        <circle cx={branchDir > 0 ? tipCX - 4 : tipCX + 4} cy={causeY} r="4" fill="#d97706" />
                      )}

                      {/* Cause text */}
                      <text
                        x={labelX}
                        y={causeY - 3}
                        textAnchor={labelAnchor}
                        fontSize="9"
                        fill={isCF ? '#92400e' : '#1e293b'}
                        fontWeight={isCF ? '700' : '400'}
                      >
                        {causeLabel}
                      </text>

                      {/* Sub-cause count badge */}
                      {subs.length > 0 && (
                        <text
                          x={labelX}
                          y={causeY + 9}
                          textAnchor={labelAnchor}
                          fontSize="7"
                          fill="#64748b"
                        >
                          +{subs.length} contributing factor{subs.length !== 1 ? 's' : ''}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Overflow indicator */}
                {causes.length > 4 && (
                  <text
                    x={x}
                    y={spineY + dir * (30 + 4 * 26 + 10)}
                    textAnchor="middle"
                    fontSize="8"
                    fill="#94a3b8"
                    fontStyle="italic"
                  >
                    +{causes.length - 4} more (List View)
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-6 justify-center text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-amber-500"></span>
            <span>Flagged as Causal Factor (bold, amber dot)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4,3" /></svg>
            <span>Dashed = not yet flagged</span>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 mt-1 italic">
          Hover over any label to see full text. Switch to List View to add, edit, or flag items.
        </p>
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

  if (!investigation) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-slate-700 font-medium">Investigation not found.</p>
          <p className="text-slate-500 text-sm mt-1">Please return to the dashboard and select an investigation.</p>
        </div>
      </div>
    );
  }

  const totalFlagged = countFlaggedItems();

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      <StepNavigation
        investigationId={investigationId!}
        currentStep={4}
        investigationNumber={investigation.investigation_number}
      />

      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Step 4: Visualisations</h1>
                <p className="text-slate-500 mt-1">
                  Use visual analysis tools to identify and map causal factors before deep-dive analysis in Step 5.
                </p>
              </div>
              {totalFlagged > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <Flag className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">
                    {totalFlagged} item{totalFlagged !== 1 ? 's' : ''} flagged as causal factors
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Flagged items summary banner */}
          {totalFlagged > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    {totalFlagged} item{totalFlagged !== 1 ? 's' : ''} identified as causal factors across your visualisation tools
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    In Step 5, use the "Add Causal Factor" button and select "Expand from visualisation" to pull these into your formal analysis.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
            <div className="flex border-b border-slate-200">
              {[
                { key: '5whys',     label: '5 Whys',          count: whyChain.filter(w => w.is_causal_factor).length,    total: whyChain.length },
                { key: 'causalTree',label: 'Causal Tree',     count: causalTree.filter(n => n.is_causal_factor).length,  total: causalTree.length },
                { key: 'fishbone',  label: 'Fishbone Diagram',count: fishboneCauses.filter(c => c.is_causal_factor).length, total: fishboneCauses.length },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-1 px-4 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <span>{tab.label}</span>
                    {tab.total > 0 && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                        {tab.total}
                      </span>
                    )}
                    {tab.count > 0 && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs flex items-center gap-1">
                        <Flag className="w-2.5 h-2.5" />{tab.count}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="p-6">
            {/* ══════════════════════════════════════════════════════════════
                  5 WHYS TAB
              ══════════════════════════════════════════════════════════════ */}
              {activeTab === '5whys' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">5 Whys Analysis</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Starting from the incident, ask "Why?" repeatedly to trace causes back to root systemic factors.
                        Flag any answer that represents a meaningful causal factor for analysis in Step 5.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddWhy(!showAddWhy)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />Add Why
                    </button>
                  </div>

                  {showAddWhy && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="font-medium text-blue-900 mb-3">Add Why Answer</h3>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Why #{whyChain.length + 1} Answer</label>
                        <textarea
                          value={newWhy.answer}
                          onChange={e => setNewWhy({ ...newWhy, answer: e.target.value })}
                          placeholder="What is the answer to this 'Why?'…"
                          rows={3}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Factor Classification</label>
                        <select
                          value={newWhy.factorType}
                          onChange={e => setNewWhy({ ...newWhy, factorType: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        >
                          {WHY_FACTOR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <label className="flex items-center gap-2 mb-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newWhy.isRootCause}
                          onChange={e => setNewWhy({ ...newWhy, isRootCause: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-slate-700">This is the root cause (stop asking Why here)</span>
                      </label>

                      <CausalFactorFlagForm
                        isCausalFactor={newWhy.isCausalFactor}
                        causalFactorType={newWhy.causalFactorType}
                        onToggle={() => setNewWhy({ ...newWhy, isCausalFactor: !newWhy.isCausalFactor })}
                        onTypeChange={val => setNewWhy({ ...newWhy, causalFactorType: val })}
                      />

                      <div className="flex gap-2 mt-4">
                        <button onClick={handleAddWhy} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Save</button>
                        <button onClick={() => setShowAddWhy(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
                      </div>
                    </div>
                  )}

                  {whyChain.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <HelpCircle className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                      <p>No Why answers recorded yet.</p>
                      <p className="text-sm mt-1">Start from the incident and ask: "Why did this happen?"</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {whyChain.map((why, idx) => {
                        const cfBadge = getCausalFactorBadge(why.is_causal_factor, why.causal_factor_type);
                        return (
                          <div key={why.id} className={`rounded-lg border p-4 ${why.isRootCause ? 'bg-purple-50 border-purple-200' : 'bg-white border-slate-200'}`}>
                            {editingWhyId === why.id ? (
                              <div>
                                <textarea
                                  value={editWhy.answer}
                                  onChange={e => setEditWhy({ ...editWhy, answer: e.target.value })}
                                  rows={3}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 mb-2"
                                />
                                <select
                                  value={editWhy.factorType}
                                  onChange={e => setEditWhy({ ...editWhy, factorType: e.target.value })}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-2"
                                >
                                  {WHY_FACTOR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                                <label className="flex items-center gap-2 mb-2 cursor-pointer">
                                  <input type="checkbox" checked={editWhy.isRootCause}
                                    onChange={e => setEditWhy({ ...editWhy, isRootCause: e.target.checked })} className="w-4 h-4" />
                                  <span className="text-sm">Root cause</span>
                                </label>
                                <CausalFactorFlagForm
                                  isCausalFactor={editWhy.isCausalFactor}
                                  causalFactorType={editWhy.causalFactorType}
                                  onToggle={() => setEditWhy({ ...editWhy, isCausalFactor: !editWhy.isCausalFactor })}
                                  onTypeChange={val => setEditWhy({ ...editWhy, causalFactorType: val })}
                                />
                                <div className="flex gap-2 mt-3">
                                  <button onClick={() => handleUpdateWhy(why.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Save</button>
                                  <button onClick={() => setEditingWhyId(null)} className="px-3 py-1.5 border border-slate-300 rounded text-sm hover:bg-slate-50">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Why {idx + 1}</span>
                                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                                        {WHY_FACTOR_TYPES.find(t => t.value === why.factor_type)?.label}
                                      </span>
                                      {why.is_root_cause && (
                                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">Root Cause</span>
                                      )}
                                      {cfBadge && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${CAUSAL_TYPE_COLOURS[cfBadge.value]}`}>
                                          <Flag className="w-2.5 h-2.5" />{cfBadge.label}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-slate-800 text-sm">{why.answer}</p>
                                  </div>
                                  <div className="flex gap-1 flex-shrink-0">
                                    <button onClick={() => { setEditingWhyId(why.id); setEditWhy({ answer: why.answer, isRootCause: why.is_root_cause, factorType: why.factor_type, isCausalFactor: why.is_causal_factor || false, causalFactorType: why.causal_factor_type || 'contributing' }); }}
                                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50">
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDeleteWhy(why.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════════
                  CAUSAL TREE TAB
              ══════════════════════════════════════════════════════════════ */}
              {activeTab === 'causalTree' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Causal Tree</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Build a hierarchical tree of causes branching from the incident. Flag nodes as causal factors for Step 5 analysis.
                      </p>
                    </div>
                    <button
                      onClick={() => { setShowAddNode(true); setSelectedParentId(null); }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />Add Node
                    </button>
                  </div>

                  {showAddNode && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="font-medium text-blue-900 mb-3">
                        {selectedParentId ? `Add child of: "${causalTree.find(n => n.id === selectedParentId)?.title}"` : 'Add top-level node'}
                      </h3>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Node Description</label>
                        <textarea
                          value={newNode.text}
                          onChange={e => setNewNode({ ...newNode, text: e.target.value })}
                          placeholder="Describe this cause or event…"
                          rows={2}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Node Type (optional)</label>
                        <select value={newNode.nodeType} onChange={e => setNewNode({ ...newNode, nodeType: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                          <option value="">Not specified</option>
                          <option value="immediate">Immediate Cause</option>
                          <option value="contributing">Contributing Factor</option>
                          <option value="root">Root Cause</option>
                        </select>
                      </div>
                      {causalTree.length > 0 && (
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Parent Node (optional)</label>
                          <select value={selectedParentId || ''} onChange={e => setSelectedParentId(e.target.value || null)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                            <option value="">None (top-level)</option>
                            {causalTree.map(n => <option key={n.id} value={n.id}>{(n.title || '').slice(0, 60)}</option>)}
                          </select>
                        </div>
                      )}
                      <CausalFactorFlagForm
                        isCausalFactor={newNode.isCausalFactor}
                        causalFactorType={newNode.causalFactorType}
                        onToggle={() => setNewNode({ ...newNode, isCausalFactor: !newNode.isCausalFactor })}
                        onTypeChange={val => setNewNode({ ...newNode, causalFactorType: val })}
                      />
                      <div className="flex gap-2 mt-4">
                        <button onClick={handleAddNode} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Save</button>
                        <button onClick={() => { setShowAddNode(false); setSelectedParentId(null); }} className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
                      </div>
                    </div>
                  )}

                  {causalTree.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <Network className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                      <p>No causal tree nodes yet.</p>
                      <p className="text-sm mt-1">Start with the incident or top event, then branch outward.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {causalTree.filter(n => !n.parent_node_id).map(node => (
                        <div key={node.id}>
                          {/* Recursive node render */}
                          {(function renderNode(n: any, depth: number): React.ReactNode {
                            const children = causalTree.filter(c => c.parent_node_id === n.id);
                            const cfBadge = getCausalFactorBadge(n.is_causal_factor, n.causal_factor_type);
                            return (
                              <div key={n.id} style={{ marginLeft: depth * 24 }}>
                                <div className={`border rounded-lg p-3 ${n.is_causal_factor ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'}`}>
                                  {editingNodeId === n.id ? (
                                    <div>
                                      <textarea value={editNode.text} onChange={e => setEditNode({ ...editNode, text: e.target.value })}
                                        rows={2} className="w-full px-3 py-2 border border-slate-300 rounded text-sm mb-2 focus:ring-2 focus:ring-blue-500" />
                                      <select value={editNode.nodeType} onChange={e => setEditNode({ ...editNode, nodeType: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm mb-2">
                                        <option value="">Not specified</option>
                                        <option value="immediate">Immediate Cause</option>
                                        <option value="contributing">Contributing Factor</option>
                                        <option value="root">Root Cause</option>
                                      </select>
                                      <CausalFactorFlagForm
                                        isCausalFactor={editNode.isCausalFactor}
                                        causalFactorType={editNode.causalFactorType}
                                        onToggle={() => setEditNode({ ...editNode, isCausalFactor: !editNode.isCausalFactor })}
                                        onTypeChange={val => setEditNode({ ...editNode, causalFactorType: val })}
                                      />
                                      <div className="flex gap-2 mt-2">
                                        <button onClick={() => handleUpdateNode(n.id)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Save</button>
                                        <button onClick={() => setEditingNodeId(null)} className="px-3 py-1 border border-slate-300 rounded text-sm hover:bg-slate-50">Cancel</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1">
                                        <div className="flex flex-wrap gap-1.5 mb-1">
                                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            n.node_type === 'immediate' ? 'bg-red-100 text-red-700' :
                                            n.node_type === 'root' ? 'bg-purple-100 text-purple-700' :
                                            n.node_type === 'contributing' ? 'bg-orange-100 text-orange-700' :
                                            'bg-slate-100 text-slate-600'
                                          }`}>{n.node_type || 'node'}</span>
                                          {cfBadge && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${CAUSAL_TYPE_COLOURS[cfBadge.value]}`}>
                                              <Flag className="w-2.5 h-2.5" />{cfBadge.label}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-sm text-slate-800">{n.title}</p>
                                      </div>
                                      <div className="flex gap-1 flex-shrink-0">
                                        <button
                                          onClick={() => { setShowAddNode(true); setSelectedParentId(n.id); }}
                                          className="p-1.5 text-slate-400 hover:text-green-600 rounded hover:bg-green-50"
                                          title="Add child node"
                                        >
                                          <Plus className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => { setEditingNodeId(n.id); setEditNode({ text: n.title, nodeType: n.node_type || '', isCausalFactor: n.is_causal_factor || false, causalFactorType: n.causal_factor_type || 'contributing' }); }}
                                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteNode(n.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50">
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                {children.map(child => renderNode(child, depth + 1))}
                              </div>
                            );
                          })(node, 0)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════════
                  FISHBONE TAB
              ══════════════════════════════════════════════════════════════ */}
              {activeTab === 'fishbone' && (
                <div>
                  {/* Fishbone header */}
                  <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Fishbone (Ishikawa) Diagram</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Map causes across six categories to the problem. Flag entries as causal factors to carry them into Step 5.
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                        <button
                          onClick={() => setFishboneView('list')}
                          className={`px-3 py-2 text-sm font-medium transition-colors ${fishboneView === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                        >
                          ☰ List View
                        </button>
                        <button
                          onClick={() => setFishboneView('diagram')}
                          className={`px-3 py-2 text-sm font-medium transition-colors ${fishboneView === 'diagram' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                        >
                          🐟 Diagram View
                        </button>
                      </div>
                      <button
                        onClick={exportFishbone}
                        disabled={fishboneCauses.length === 0}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 flex items-center gap-1.5 disabled:opacity-40"
                      >
                        <Download className="w-4 h-4" />Export
                      </button>
                    </div>
                  </div>

                  {/* Guidance banner */}
                  {showGuidance && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-blue-900 mb-1">How to use the Fishbone Diagram</p>
                            <ol className="text-xs text-blue-800 space-y-1 list-decimal ml-4">
                              <li>Set the <strong>Problem Statement</strong> — the specific outcome you are investigating (e.g. "Uncontrolled hydrocarbon release from flange connection").</li>
                              <li>For each of the six categories, identify <strong>causes</strong> that contributed to the problem. Keep cause text short — 6–10 words is ideal.</li>
                              <li>For any cause, add <strong>contributing factors</strong> beneath it — these are conditions or events that led to that cause.</li>
                              <li><strong>Flag</strong> any cause or contributing factor as a Causal Factor if it requires detailed analysis in Step 5. Select the appropriate type (Immediate, Contributing, Root, or Latent).</li>
                              <li>Switch to <strong>Diagram View</strong> at any time to see a visual overview. Hover over items to read full text. Use List View to add and edit.</li>
                            </ol>
                          </div>
                        </div>
                        <button onClick={() => setShowGuidance(false)} className="text-blue-400 hover:text-blue-600 flex-shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {!showGuidance && (
                    <button onClick={() => setShowGuidance(true)} className="mb-4 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                      <Info className="w-3 h-3" />Show guidance
                    </button>
                  )}

                  {/* Problem statement */}
                  <div className="mb-5 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Problem Statement <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-slate-500 mb-2">
                      The specific outcome at the head of the fishbone. Be precise and factual — avoid conclusions at this stage.
                      Example: "Scaffold board fell from 8m, striking worker below."
                    </p>
                    <textarea
                      value={fishboneProblemStatement}
                      onChange={e => setFishboneProblemStatement(e.target.value)}
                      onBlur={e => saveProblemStatement(e.target.value)}
                      placeholder="Describe the specific problem or incident outcome…"
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* DIAGRAM VIEW */}
                  {fishboneView === 'diagram' && (
                    <div className="border border-slate-200 rounded-xl p-4 bg-white">
                      {fishboneCauses.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                          <p className="text-sm">No causes added yet — switch to List View to add your first cause.</p>
                        </div>
                      ) : (
                        <FishboneDiagramVisual />
                      )}
                    </div>
                  )}

                  {/* LIST VIEW */}
                  {fishboneView === 'list' && (
                    <div className="space-y-4">
                      {FISHBONE_CATEGORIES.map(cat => {
                        const causes = fishboneCauses.filter(c => c.category_id === cat.id && !c.parent_cause_id);
                        const isExpanded = expandedCategories.has(cat.id);

                        return (
                          <div key={cat.id} className="border border-slate-200 rounded-xl overflow-hidden">
                            {/* Category header */}
                            <div
                              className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50"
                              style={{ borderLeft: `4px solid ${cat.colour}` }}
                              onClick={() => {
                                const next = new Set(expandedCategories);
                                isExpanded ? next.delete(cat.id) : next.add(cat.id);
                                setExpandedCategories(next);
                              }}
                            >
                              <div className="flex items-center gap-3">
                                {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                <span className="font-semibold text-sm" style={{ color: cat.colour }}>{cat.label}</span>
                                <span className="text-xs text-slate-400">{cat.description}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {causes.filter(c => c.is_causal_factor).length > 0 && (
                                  <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                                    <Flag className="w-2.5 h-2.5" />
                                    {causes.filter(c => c.is_causal_factor).length} flagged
                                  </span>
                                )}
                                <span className="text-xs text-slate-400">{causes.length} cause{causes.length !== 1 ? 's' : ''}</span>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="p-3 bg-slate-50 border-t border-slate-100">
                                {/* Causes */}
                                {causes.map(cause => {
                                  const subcauses = fishboneCauses.filter(c => c.parent_cause_id === cause.id);
                                  const cfBadge = getCausalFactorBadge(cause.is_causal_factor, cause.causal_factor_type);

                                  return (
                                    <div key={cause.id} className="mb-3">
                                      {/* Cause row */}
                                      <div className={`rounded-lg border p-3 ${cause.is_causal_factor ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
                                        {editingCauseId === cause.id ? (
                                          <div>
                                            <div className="mb-2">
                                              <label className="block text-xs font-medium text-slate-600 mb-1">Cause text (keep concise — 6–10 words ideal)</label>
                                              <input
                                                value={editCauseData.text}
                                                onChange={e => setEditCauseData({ ...editCauseData, text: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                              />
                                            </div>
                                            <CausalFactorFlagForm
                                              isCausalFactor={editCauseData.isCausalFactor}
                                              causalFactorType={editCauseData.causalFactorType}
                                              onToggle={() => setEditCauseData({ ...editCauseData, isCausalFactor: !editCauseData.isCausalFactor })}
                                              onTypeChange={val => setEditCauseData({ ...editCauseData, causalFactorType: val })}
                                            />
                                            <div className="flex gap-2 mt-3">
                                              <button onClick={() => handleUpdateCause(cause.id)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Save</button>
                                              <button onClick={() => setEditingCauseId(null)} className="px-3 py-1 border border-slate-300 rounded text-sm hover:bg-slate-50">Cancel</button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                              <div className="flex flex-wrap gap-1.5 mb-1">
                                                {cfBadge && (
                                                  <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${CAUSAL_TYPE_COLOURS[cfBadge.value]}`}>
                                                    <Flag className="w-2.5 h-2.5" />{cfBadge.label}
                                                  </span>
                                                )}
                                              </div>
                                              <p className="text-sm text-slate-800 font-medium">{cause.cause_text}</p>
                                              {subcauses.length > 0 && (
                                                <p className="text-xs text-slate-400 mt-0.5">{subcauses.length} contributing factor{subcauses.length !== 1 ? 's' : ''} below</p>
                                              )}
                                            </div>
                                            <div className="flex gap-1 flex-shrink-0">
                                              <button
                                                onClick={() => setShowAddSubcause(showAddSubcause === cause.id ? null : cause.id)}
                                                className="p-1.5 text-slate-400 hover:text-green-600 rounded hover:bg-green-50"
                                                title="Add contributing factor to this cause"
                                              >
                                                <Plus className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                onClick={() => { setEditingCauseId(cause.id); setEditCauseData({ text: cause.cause_text, isCausalFactor: cause.is_causal_factor || false, causalFactorType: cause.causal_factor_type || 'contributing' }); }}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50"
                                              >
                                                <Edit2 className="w-4 h-4" />
                                              </button>
                                              <button onClick={() => handleDeleteCause(cause.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50">
                                                <Trash2 className="w-4 h-4" />
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {/* Add contributing factor form */}
                                      {showAddSubcause === cause.id && (
                                        <div className="ml-6 mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                          <p className="text-xs font-semibold text-green-800 mb-2 flex items-center gap-1.5">
                                            <Plus className="w-3 h-3" />
                                            Add Contributing Factor to: <em>"{cause.cause_text.slice(0, 40)}{cause.cause_text.length > 40 ? '…' : ''}"</em>
                                          </p>
                                          <p className="text-xs text-green-700 mb-2">
                                            A contributing factor is a condition, action, or circumstance that led to or worsened this cause.
                                            Example: if the cause is "Isolation procedure not followed", a contributing factor might be "Procedure not available at worksite".
                                          </p>
                                          <input
                                            value={newSubcause.text}
                                            onChange={e => setNewSubcause({ ...newSubcause, text: e.target.value })}
                                            placeholder="Describe the contributing factor (6–10 words)…"
                                            className="w-full px-3 py-2 border border-green-300 rounded-lg text-sm focus:ring-2 focus:ring-green-400 mb-2"
                                            autoFocus
                                          />
                                          <CausalFactorFlagForm
                                            isCausalFactor={newSubcause.isCausalFactor}
                                            causalFactorType={newSubcause.causalFactorType}
                                            onToggle={() => setNewSubcause({ ...newSubcause, isCausalFactor: !newSubcause.isCausalFactor })}
                                            onTypeChange={val => setNewSubcause({ ...newSubcause, causalFactorType: val })}
                                          />
                                          <div className="flex gap-2 mt-2">
                                            <button onClick={() => handleAddSubcause(cause.id)} className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700">Add</button>
                                            <button onClick={() => setShowAddSubcause(null)} className="px-3 py-1.5 border border-slate-300 rounded text-sm hover:bg-slate-50">Cancel</button>
                                          </div>
                                        </div>
                                      )}

                                      {/* Sub-causes */}
                                      {subcauses.map(sub => {
                                        const subCfBadge = getCausalFactorBadge(sub.is_causal_factor, sub.causal_factor_type);
                                        return (
                                          <div key={sub.id} className="ml-6 mt-1.5">
                                            <div className={`rounded-lg border p-2.5 ${sub.is_causal_factor ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}>
                                              {editingSubcauseId === sub.id ? (
                                                <div>
                                                  <input
                                                    value={editCauseData.text}
                                                    onChange={e => setEditCauseData({ ...editCauseData, text: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 mb-2"
                                                  />
                                                  <CausalFactorFlagForm
                                                    isCausalFactor={editCauseData.isCausalFactor}
                                                    causalFactorType={editCauseData.causalFactorType}
                                                    onToggle={() => setEditCauseData({ ...editCauseData, isCausalFactor: !editCauseData.isCausalFactor })}
                                                    onTypeChange={val => setEditCauseData({ ...editCauseData, causalFactorType: val })}
                                                  />
                                                  <div className="flex gap-2 mt-2">
                                                    <button onClick={() => handleUpdateCause(sub.id)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Save</button>
                                                    <button onClick={() => setEditingSubcauseId(null)} className="px-3 py-1 border border-slate-300 rounded text-sm hover:bg-slate-50">Cancel</button>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="flex items-start justify-between gap-2">
                                                  <div className="flex-1">
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                      <span className="text-xs text-slate-400">↳ Contributing factor</span>
                                                      {subCfBadge && (
                                                        <span className={`text-xs px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${CAUSAL_TYPE_COLOURS[subCfBadge.value]}`}>
                                                          <Flag className="w-2 h-2" />{subCfBadge.label}
                                                        </span>
                                                      )}
                                                    </div>
                                                    <p className="text-sm text-slate-700">{sub.cause_text}</p>
                                                  </div>
                                                  <div className="flex gap-1 flex-shrink-0">
                                                    <button
                                                      onClick={() => { setEditingSubcauseId(sub.id); setEditCauseData({ text: sub.cause_text, isCausalFactor: sub.is_causal_factor || false, causalFactorType: sub.causal_factor_type || 'contributing' }); }}
                                                      className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50"
                                                    >
                                                      <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => handleDeleteCause(sub.id)} className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50">
                                                      <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })}

                                {/* Add cause button */}
                                {showAddCause === cat.id ? (
                                  <div className="mt-2 p-3 bg-white border border-slate-200 rounded-lg">
                                    <p className="text-xs font-semibold text-slate-700 mb-2">Add cause to {cat.label}</p>
                                    <p className="text-xs text-slate-500 mb-2">{cat.description} Keep the cause text brief and factual (6–10 words). You can add contributing factors after saving.</p>
                                    <input
                                      value={newCause.text}
                                      onChange={e => setNewCause({ ...newCause, text: e.target.value, categoryId: cat.id })}
                                      placeholder={`e.g. ${cat.id === 'people' ? 'Competency not verified before task' : cat.id === 'procedure' ? 'Isolation procedure out of date' : cat.id === 'plant' ? 'Pressure relief valve not calibrated' : cat.id === 'environment' ? 'Poor lighting in confined space' : cat.id === 'management' ? 'Pre-task risk assessment not completed' : 'Contractor supervision not specified in contract'}`}
                                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 mb-2"
                                      autoFocus
                                    />
                                    <CausalFactorFlagForm
                                      isCausalFactor={newCause.isCausalFactor}
                                      causalFactorType={newCause.causalFactorType}
                                      onToggle={() => setNewCause({ ...newCause, isCausalFactor: !newCause.isCausalFactor })}
                                      onTypeChange={val => setNewCause({ ...newCause, causalFactorType: val })}
                                    />
                                    <div className="flex gap-2 mt-2">
                                      <button onClick={() => handleAddCause(cat.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Add Cause</button>
                                      <button onClick={() => setShowAddCause(null)} className="px-3 py-1.5 border border-slate-300 rounded text-sm hover:bg-slate-50">Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => { setShowAddCause(cat.id); setNewCause({ categoryId: cat.id, text: '', isCausalFactor: false, causalFactorType: 'contributing' }); }}
                                    className="mt-2 w-full py-2 border border-dashed rounded-lg text-sm text-slate-400 hover:text-slate-600 hover:border-slate-400 transition-colors flex items-center justify-center gap-2"
                                  >
                                    <Plus className="w-4 h-4" />Add cause to {cat.label}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Fishbone footer summary */}
                  <div className="mt-4 flex items-center justify-between text-sm text-slate-500 border-t border-slate-200 pt-4">
                    <span>
                      {fishboneCauses.length} cause{fishboneCauses.length !== 1 ? 's' : ''} across {new Set(fishboneCauses.map(c => c.category_id)).size} categor{new Set(fishboneCauses.map(c => c.category_id)).size !== 1 ? 'ies' : 'y'} · {fishboneCauses.filter(c => c.is_causal_factor).length} flagged as causal factors
                    </span>
                  </div>
                </div>
              )}

            </div>{/* end tab content */}
          </div>{/* end tab card */}

        </div>
      </div>
    </>
  );
}         
