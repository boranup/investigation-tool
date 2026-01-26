'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GitBranch, Plus, Edit2, Trash2, AlertTriangle, Lock, Unlock, ArrowRight } from 'lucide-react';

export default function CausalAnalysis() {
  const router = useRouter();
  const [showAddFactor, setShowAddFactor] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const investigation = {
    number: 'INV-2026-001',
    description: 'Pressure relief valve failure during startup'
  };

  const [causalFactors, setFactors] = useState([
    {
      id: '1',
      title: 'Relief valve PSV-101 failed to lift at set pressure',
      description: 'Valve did not open at design set pressure of 150 psig, pressure reached 165 psig',
      factorType: 'immediate',
      factorCategory: 'equipment',
      analysisStatus: 'analysis_required',
      linkedHFAT: null,
      linkedHOP: null,
      evidenceLinks: ['Valve inspection photo', 'Process data', 'Maintenance records']
    },
    {
      id: '2',
      title: 'Valve seat corrosion degraded spring tension',
      description: 'Inspection revealed severe corrosion on valve seat reducing effective spring force',
      factorType: 'contributing',
      factorCategory: 'equipment',
      analysisStatus: 'identified',
      parentFactorId: '1',
      linkedHFAT: null,
      linkedHOP: null,
      evidenceLinks: ['Valve inspection photo', 'Metallurgy report']
    },
    {
      id: '3',
      title: 'Operator did not recognize early pressure trend deviation',
      description: 'Pressure began trending above normal 45 minutes before alarm, operator did not investigate',
      factorType: 'contributing',
      factorCategory: 'human_performance',
      analysisStatus: 'analysis_required',
      linkedHFAT: null,
      linkedHOP: null,
      evidenceLinks: ['Interview - Operator', 'Process trend data']
    },
    {
      id: '4',
      title: 'Valve maintenance interval exceeded recommended frequency',
      description: 'Last inspection was 18 months ago, manufacturer recommends 12 months for this service',
      factorType: 'root',
      factorCategory: 'organizational',
      analysisStatus: 'identified',
      linkedHFAT: null,
      linkedHOP: null,
      evidenceLinks: ['Maintenance records', 'Manufacturer manual']
    }
  ]);

  const [newFactor, setNewFactor] = useState({
    title: '',
    description: '',
    factorType: '',
    factorCategory: '',
    parentFactorId: ''
  });

  const factorTypes = [
    { value: 'immediate', label: 'Immediate Cause', description: 'Direct cause of the incident' },
    { value: 'contributing', label: 'Contributing Factor', description: 'Conditions that enabled or influenced the incident' },
    { value: 'root', label: 'Root Cause', description: 'Underlying organizational/systemic issues' }
  ];

  const factorCategories = [
    { value: 'equipment', label: 'Equipment/Hardware', color: 'bg-purple-100 text-purple-700' },
    { value: 'human_performance', label: 'Human Performance', color: 'bg-green-100 text-green-700' },
    { value: 'procedural', label: 'Procedural', color: 'bg-blue-100 text-blue-700' },
    { value: 'organizational', label: 'Organizational', color: 'bg-amber-100 text-amber-700' },
    { value: 'external', label: 'External', color: 'bg-slate-100 text-slate-700' }
  ];

  const analysisStatuses = [
    { value: 'identified', label: 'Identified', color: 'bg-slate-100 text-slate-700', icon: null },
    { value: 'analysis_required', label: 'Analysis Required', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
    { value: 'hfat_in_progress', label: 'HFAT In Progress', color: 'bg-blue-100 text-blue-700', icon: null },
    { value: 'hop_in_progress', label: 'HOP In Progress', color: 'bg-blue-100 text-blue-700', icon: null },
    { value: 'analysis_complete', label: 'Analysis Complete', color: 'bg-green-100 text-green-700', icon: null },
    { value: 'validated', label: 'Validated', color: 'bg-green-100 text-green-700', icon: Lock }
  ];

  const getCategoryColor = (category: string) => {
    const cat = factorCategories.find(c => c.value === category);
    return cat ? cat.color : 'bg-slate-100 text-slate-700';
  };

  const getStatusInfo = (status: string) => {
    return analysisStatuses.find(s => s.value === status) || analysisStatuses[0];
  };

  const handleAddFactor = () => {
    if (!newFactor.title || !newFactor.factorType || !newFactor.factorCategory) {
      alert('Please fill in required fields: Title, Factor Type, and Category');
      return;
    }

    const factor = {
      id: String(causalFactors.length + 1),
      ...newFactor,
      analysisStatus: 'identified',
      linkedHFAT: null,
      linkedHOP: null,
      evidenceLinks: []
    };

    setFactors([...causalFactors, factor]);
    setShowAddFactor(false);
    setNewFactor({
      title: '',
      description: '',
      factorType: '',
      factorCategory: '',
      parentFactorId: ''
    });
  };

  const requiresHFAT = (factor: any) => {
    return factor.factorCategory === 'equipment' || factor.factorCategory === 'procedural';
  };

  const requiresHOP = (factor: any) => {
    return factor.factorCategory === 'human_performance';
  };

  const canMoveToRecommendations = () => {
    const analysisRequired = causalFactors.filter(f => 
      f.analysisStatus !== 'analysis_complete' && f.analysisStatus !== 'validated'
    );
    return analysisRequired.length === 0;
  };

  const filteredFactors = causalFactors.filter(f => {
    const typeMatch = filterType === 'all' || f.factorType === filterType;
    const statusMatch = filterStatus === 'all' || f.analysisStatus === filterStatus;
    return typeMatch && statusMatch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <GitBranch className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Causal Factor Analysis
                </h1>
                <p className="text-sm text-slate-600">
                  {investigation.number} - Identify and analyze causes
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddFactor(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Causal Factor
            </button>
          </div>
        </div>

        <div className={`rounded-lg shadow-sm border p-4 mb-6 ${
          canMoveToRecommendations() 
            ? 'bg-green-50 border-green-200' 
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            {canMoveToRecommendations() ? (
              <>
                <Unlock className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900">Ready for Recommendations</h3>
                  <p className="text-sm text-green-700">
                    All causal factors have been analyzed and validated. You can proceed to develop recommendations.
                  </p>
                </div>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Proceed to Recommendations
                </button>
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 text-amber-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900">Analysis Required</h3>
                  <p className="text-sm text-amber-700">
                    {causalFactors.filter(f => f.analysisStatus === 'identified' || f.analysisStatus === 'analysis_required').length} causal factor(s) 
                    require further analysis through HFAT or HOP before recommendations can be developed.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">Filter by Type:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                {factorTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">Filter by Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                {analysisStatuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
            <div className="ml-auto text-sm text-slate-600">
              {filteredFactors.length} factor(s)
            </div>
          </div>
        </div>

        {showAddFactor && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Causal Factor</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Causal Factor Title *
                </label>
                <input
                  type="text"
                  value={newFactor.title}
                  onChange={(e) => setNewFactor({...newFactor, title: e.target.value})}
                  placeholder="Brief statement of the causal factor"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newFactor.description}
                  onChange={(e) => setNewFactor({...newFactor, description: e.target.value})}
                  rows={3}
                  placeholder="Detailed explanation of this causal factor..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Factor Type *
                  </label>
                  <select
                    value={newFactor.factorType}
                    onChange={(e) => setNewFactor({...newFactor, factorType: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select type...</option>
                    {factorTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={newFactor.factorCategory}
                    onChange={(e) => setNewFactor({...newFactor, factorCategory: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select category...</option>
                    {factorCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Parent Causal Factor (if this is a sub-cause)
                </label>
                <select
                  value={newFactor.parentFactorId}
                  onChange={(e) => setNewFactor({...newFactor, parentFactorId: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None - this is a top-level cause</option>
                  {causalFactors.map(factor => (
                    <option key={factor.id} value={factor.id}>{factor.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowAddFactor(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFactor}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Causal Factor
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {filteredFactors.map(factor => {
            const statusInfo = getStatusInfo(factor.analysisStatus);
            const categoryColor = getCategoryColor(factor.factorCategory);
            const needsHFAT = requiresHFAT(factor);
            const needsHOP = requiresHOP(factor);
            const StatusIcon = statusInfo.icon;

            return (
              <div key={factor.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        factor.factorType === 'immediate' 
                          ? 'bg-red-100 text-red-700'
                          : factor.factorType === 'contributing'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                      }`}>
                        {factorTypes.find(t => t.value === factor.factorType)?.label}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${categoryColor}`}>
                        {factorCategories.find(c => c.value === factor.factorCategory)?.label}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 ${statusInfo.color}`}>
                        {StatusIcon && <StatusIcon className="w-3 h-3" />}
                        {statusInfo.label}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 text-lg mb-1">{factor.title}</h3>
                    <p className="text-sm text-slate-600 mb-3">{factor.description}</p>

                    {factor.evidenceLinks && factor.evidenceLinks.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-slate-500 mb-1">Supporting Evidence:</p>
                        <div className="flex flex-wrap gap-1">
                          {factor.evidenceLinks.map((link, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded">
                              {link}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {(factor.analysisStatus === 'identified' || factor.analysisStatus === 'analysis_required') && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                        <p className="text-sm font-medium text-amber-900 mb-2">Further Analysis Required:</p>
                        <div className="flex gap-2">
                          {needsHFAT && (
                            <button 
                              onClick={() => router.push(`/hfat-new?investigationId=${investigation.id}&causalFactorId=${factor.id}`)}
                              className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm">
                              <ArrowRight className="w-4 h-4" />
                              Launch HFAT Assessment
                            </button>
                          )}
                          {needsHOP && (
                            <button 
                              onClick={() => router.push(`/hop-new?investigationId=${investigation.id}&causalFactorId=${factor.id}`)}
                              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                              <ArrowRight className="w-4 h-4" />
                              Launch HOP Assessment
                            </button>
                          )}
                          {!needsHFAT && !needsHOP && (
                            <p className="text-sm text-amber-700">
                              This factor type does not require HFAT or HOP analysis. Mark as validated when ready.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {(factor.analysisStatus === 'hfat_in_progress' || factor.analysisStatus === 'hop_in_progress') && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                        <p className="text-sm text-blue-800">
                          {factor.analysisStatus === 'hfat_in_progress' ? 'HFAT' : 'HOP'} assessment in progress...
                        </p>
                      </div>
                    )}

                    {factor.analysisStatus === 'analysis_complete' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                        <p className="text-sm font-medium text-green-900 mb-2">Analysis Complete</p>
                        <div className="flex gap-2">
                          <button className="px-3 py-1.5 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors text-sm">
                            View HFAT Results
                          </button>
                          <button className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                            Mark as Validated
                          </button>
                        </div>
                      </div>
                    )}

                    {factor.analysisStatus === 'validated' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-green-600" />
                        <p className="text-sm text-green-800">
                          Causal factor fully understood and validated. Ready for recommendations.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 ml-4">
                    <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredFactors.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <GitBranch className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No causal factors match your filters</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            Causal Analysis Best Practices
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Start with immediate causes (what directly caused the incident)</li>
            <li>• Ask why to identify contributing factors and root causes</li>
            <li>• Equipment and procedural factors require HFAT analysis</li>
            <li>• Human performance factors require HOP analysis</li>
            <li>• Validate all causal factors before developing recommendations</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
