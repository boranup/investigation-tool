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
    id: 'inv-001', // Added id property
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
      title: 'Valve maintenance interval exceeded without inspection',
      description: 'Last valve inspection was 18 months ago, exceeds 12-month maintenance schedule',
      factorType: 'root',
      factorCategory: 'organizational',
      analysisStatus: 'identified',
      parentFactorId: '2',
      linkedHFAT: null,
      linkedHOP: null,
      evidenceLinks: ['Maintenance records', 'Maintenance procedures']
    }
  ]);

  const factorTypeLabels: Record<string, string> = {
    immediate: 'Immediate Cause',
    contributing: 'Contributing Factor',
    root: 'Root Cause',
    latent: 'Latent Condition'
  };

  const factorCategoryLabels: Record<string, string> = {
    equipment: 'Equipment/Hardware',
    human_performance: 'Human Performance',
    procedure: 'Procedure/Process',
    organizational: 'Organizational/System',
    external: 'External Factor'
  };

  const analysisStatusLabels: Record<string, string> = {
    identified: 'Identified Only',
    analysis_required: 'Analysis Required',
    analysis_in_progress: 'Analysis In Progress',
    analysis_complete: 'Analysis Complete'
  };

  const addCausalFactor = () => {
    const newFactor = {
      id: String(causalFactors.length + 1),
      title: '',
      description: '',
      factorType: 'contributing',
      factorCategory: 'equipment',
      analysisStatus: 'identified',
      linkedHFAT: null,
      linkedHOP: null,
      evidenceLinks: []
    };
    setFactors([...causalFactors, newFactor]);
    setShowAddFactor(false);
  };

  const deleteFactor = (id: string) => {
    if (confirm('Are you sure you want to delete this causal factor?')) {
      setFactors(causalFactors.filter(f => f.id !== id));
    }
  };

  const getFactorTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      immediate: 'bg-red-100 text-red-800 border-red-200',
      contributing: 'bg-orange-100 text-orange-800 border-orange-200',
      root: 'bg-purple-100 text-purple-800 border-purple-200',
      latent: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      identified: 'bg-gray-100 text-gray-700',
      analysis_required: 'bg-amber-100 text-amber-700',
      analysis_in_progress: 'bg-blue-100 text-blue-700',
      analysis_complete: 'bg-green-100 text-green-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const filteredFactors = causalFactors.filter(factor => {
    const matchesType = filterType === 'all' || factor.factorType === filterType;
    const matchesStatus = filterStatus === 'all' || factor.analysisStatus === filterStatus;
    return matchesType && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Step 4: Causal Analysis</h1>
              <p className="text-slate-600 mt-1">Identify and analyze causal factors</p>
              <div className="mt-2 text-sm">
                <span className="text-slate-500">Investigation:</span>{' '}
                <span className="font-medium text-slate-700">{investigation.number}</span>
                {' - '}
                <span className="text-slate-600">{investigation.description}</span>
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

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Type:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-slate-300 rounded px-3 py-1 text-sm"
              >
                <option value="all">All Types</option>
                <option value="immediate">Immediate Cause</option>
                <option value="contributing">Contributing Factor</option>
                <option value="root">Root Cause</option>
                <option value="latent">Latent Condition</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-slate-300 rounded px-3 py-1 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="identified">Identified Only</option>
                <option value="analysis_required">Analysis Required</option>
                <option value="analysis_in_progress">Analysis In Progress</option>
                <option value="analysis_complete">Analysis Complete</option>
              </select>
            </div>
            <div className="ml-auto text-sm text-slate-600">
              Showing {filteredFactors.length} of {causalFactors.length} factors
            </div>
          </div>
        </div>

        {/* Causal Factors Tree */}
        <div className="space-y-4">
          {filteredFactors.map((factor) => {
            const needsHFAT = factor.factorCategory === 'equipment' && factor.analysisStatus === 'analysis_required';
            const needsHOP = factor.factorCategory === 'human_performance' && factor.analysisStatus === 'analysis_required';

            return (
              <div key={factor.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <GitBranch className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-slate-900 mb-2">{factor.title}</h3>
                        <p className="text-slate-600 text-sm mb-3">{factor.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getFactorTypeColor(factor.factorType)}`}>
                            {factorTypeLabels[factor.factorType]}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            {factorCategoryLabels[factor.factorCategory]}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(factor.analysisStatus)}`}>
                            {analysisStatusLabels[factor.analysisStatus]}
                          </span>
                        </div>

                        {factor.evidenceLinks && factor.evidenceLinks.length > 0 && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                            <Lock className="w-4 h-4" />
                            <span>Linked to {factor.evidenceLinks.length} evidence item(s)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Deep Analysis Section */}
                    {(needsHFAT || needsHOP) && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-500" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">Deep Analysis Required</p>
                            <p className="text-xs text-slate-600 mt-1">
                              This causal factor requires deeper investigation using specialized tools
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {needsHFAT && (
                              <button
                                onClick={() => router.push(`/hfat-new?investigationId=${investigation.id}&causalFactorId=${factor.id}`)}
                                className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                              >
                                <ArrowRight className="w-4 h-4" />
                                Launch HFAT Assessment
                              </button>
                            )}
                            {needsHOP && (
                              <button
                                onClick={() => router.push(`/hop-new?investigationId=${investigation.id}&causalFactorId=${factor.id}`)}
                                className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
                              >
                                <ArrowRight className="w-4 h-4" />
                                Launch HOP Assessment
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Completed Assessments */}
                    {(factor.linkedHFAT || factor.linkedHOP) && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-sm font-medium text-slate-900 mb-2">Completed Assessments:</p>
                        <div className="flex gap-2">
                          {factor.linkedHFAT && (
                            <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium border border-purple-200">
                              ✓ HFAT Complete
                            </span>
                          )}
                          {factor.linkedHOP && (
                            <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-lg text-xs font-medium border border-teal-200">
                              ✓ HOP Complete
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit factor"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteFactor(factor.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete factor"
                    >
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
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Causal Factors Yet</h3>
            <p className="text-slate-600 mb-4">Start by adding your first causal factor to begin the analysis</p>
            <button
              onClick={() => setShowAddFactor(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Causal Factor
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Previous Step
          </button>
          <button
            onClick={() => alert('Proceeding to Step 5: Recommendations')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Next: Recommendations
          </button>
        </div>
      </div>

      {/* Add Factor Modal (simplified for now) */}
      {showAddFactor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-xl font-bold mb-4">Add New Causal Factor</h2>
            <p className="text-sm text-slate-600 mb-4">
              This is a simplified version. In production, you'd have a full form here.
            </p>
            <div className="flex gap-3">
              <button
                onClick={addCausalFactor}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Factor
              </button>
              <button
                onClick={() => setShowAddFactor(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
