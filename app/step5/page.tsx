'use client'

import React, { useState } from 'react';
import { Lightbulb, Plus, Edit2, Trash2, CheckCircle, Clock, XCircle, Target } from 'lucide-react';

export default function Recommendations() {
  const [showAddRecommendation, setShowAddRecommendation] = useState(false);
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const investigation = {
    number: 'INV-2026-001',
    description: 'Pressure relief valve failure during startup'
  };

  const validatedCausalFactors = [
    { id: '1', title: 'Relief valve PSV-101 failed to lift at set pressure' },
    { id: '2', title: 'Valve seat corrosion degraded spring tension' },
    { id: '3', title: 'Operator did not recognize early pressure trend deviation' },
    { id: '4', title: 'Valve maintenance interval exceeded recommended frequency' }
  ];

  const [recommendations, setRecommendations] = useState([
    {
      id: '1',
      title: 'Replace PSV-101 and implement enhanced inspection protocol',
      description: 'Immediate replacement of failed valve. Implement quarterly visual inspections and annual functional testing for all critical relief valves in corrosive service.',
      controlType: 'engineering',
      linkedCausalFactorIds: ['1', '2'],
      linkedHFATFindings: ['Valve design inadequate for service conditions', 'Corrosion mechanism not anticipated'],
      linkedHOPFindings: [],
      specificAction: 'Replace PSV-101 with corrosion-resistant design, update PM program',
      assignedTo: 'Mechanical Integrity Lead',
      assignedDepartment: 'Engineering',
      targetCompletionDate: '2026-03-31',
      priority: 'critical',
      status: 'accepted'
    },
    {
      id: '2',
      title: 'Enhance DCS alarming and operator training on trend recognition',
      description: 'Implement predictive alarming on pressure trends. Provide targeted training on early deviation recognition and appropriate response actions.',
      controlType: 'administrative',
      linkedCausalFactorIds: ['3'],
      linkedHFATFindings: [],
      linkedHOPFindings: ['High workload during startup reduced vigilance', 'Alarm system did not provide early warning'],
      specificAction: 'Configure trend-based alarms, develop and deliver training module',
      assignedTo: 'Operations Manager',
      assignedDepartment: 'Operations',
      targetCompletionDate: '2026-04-30',
      priority: 'high',
      status: 'in_progress'
    },
    {
      id: '3',
      title: 'Revise critical equipment PM intervals to align with OEM recommendations',
      description: 'Review all critical safety equipment maintenance schedules. Update CMMS to reflect manufacturer recommended intervals. Implement management of change process for any deviations.',
      controlType: 'administrative',
      linkedCausalFactorIds: ['4'],
      linkedHFATFindings: ['Maintenance interval not based on equipment criticality'],
      linkedHOPFindings: [],
      specificAction: 'Audit all critical equipment PM schedules, update CMMS, implement MOC for deviations',
      assignedTo: 'Reliability Manager',
      assignedDepartment: 'Maintenance',
      targetCompletionDate: '2026-06-30',
      priority: 'medium',
      status: 'proposed'
    }
  ]);

  const [newRecommendation, setNewRecommendation] = useState({
    title: '',
    description: '',
    controlType: '',
    linkedCausalFactorIds: [] as string[],
    specificAction: '',
    assignedTo: '',
    assignedDepartment: '',
    targetCompletionDate: '',
    priority: ''
  });

  const controlTypes = [
    { value: 'elimination', label: 'Elimination', description: 'Remove the hazard entirely', order: 1 },
    { value: 'substitution', label: 'Substitution', description: 'Replace with less hazardous alternative', order: 2 },
    { value: 'engineering', label: 'Engineering Controls', description: 'Physical changes to equipment/process', order: 3 },
    { value: 'administrative', label: 'Administrative Controls', description: 'Procedures, training, work practices', order: 4 },
    { value: 'ppe', label: 'PPE', description: 'Personal protective equipment (least effective)', order: 5 }
  ];

  const priorities = [
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700 border-red-300' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-300' },
    { value: 'medium', label: 'Medium', color: 'bg-amber-100 text-amber-700 border-amber-300' },
    { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-700 border-blue-300' }
  ];

  const statuses = [
    { value: 'proposed', label: 'Proposed', color: 'bg-slate-100 text-slate-700', icon: Clock },
    { value: 'accepted', label: 'Accepted', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: Clock },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle }
  ];

  const getPriorityColor = (priority: string) => {
    const p = priorities.find(pr => pr.value === priority);
    return p ? p.color : 'bg-slate-100 text-slate-700';
  };

  const getStatusInfo = (status: string) => {
    return statuses.find(s => s.value === status) || statuses[0];
  };

  const handleToggleCausalFactor = (factorId: string) => {
    const current = newRecommendation.linkedCausalFactorIds;
    const updated = current.includes(factorId)
      ? current.filter(id => id !== factorId)
      : [...current, factorId];
    setNewRecommendation({...newRecommendation, linkedCausalFactorIds: updated});
  };

  const handleAddRecommendation = () => {
    if (!newRecommendation.title || !newRecommendation.controlType || 
        !newRecommendation.specificAction || newRecommendation.linkedCausalFactorIds.length === 0) {
      alert('Please fill in required fields: Title, Control Type, Specific Action, and link to at least one Causal Factor');
      return;
    }

    const recommendation = {
      id: String(recommendations.length + 1),
      ...newRecommendation,
      linkedHFATFindings: [],
      linkedHOPFindings: [],
      status: 'proposed'
    };

    setRecommendations([...recommendations, recommendation]);
    setShowAddRecommendation(false);
    setNewRecommendation({
      title: '',
      description: '',
      controlType: '',
      linkedCausalFactorIds: [],
      specificAction: '',
      assignedTo: '',
      assignedDepartment: '',
      targetCompletionDate: '',
      priority: ''
    });
  };

  const filteredRecommendations = recommendations.filter(r => {
    const priorityMatch = filterPriority === 'all' || r.priority === filterPriority;
    const statusMatch = filterStatus === 'all' || r.status === filterStatus;
    return priorityMatch && statusMatch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Lightbulb className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Recommendations
                </h1>
                <p className="text-sm text-slate-600">
                  {investigation.number} - Develop actionable recommendations from validated causal factors
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddRecommendation(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Recommendation
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">SMART Recommendations</h3>
              <p className="text-sm text-blue-800">
                Ensure recommendations are Specific, Measurable, Assignable, Realistic, and Time-bound. 
                Each recommendation must link to validated causal factors and follow the Hierarchy of Controls.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">Priority:</span>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priorities</option>
                {priorities.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                {statuses.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="ml-auto text-sm text-slate-600">
              {filteredRecommendations.length} recommendation(s)
            </div>
          </div>
        </div>

        {showAddRecommendation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Recommendation</h3>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-amber-900 mb-2">
                Link to Causal Factors * (select at least one)
              </p>
              <div className="space-y-2">
                {validatedCausalFactors.map(factor => (
                  <label key={factor.id} className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRecommendation.linkedCausalFactorIds.includes(factor.id)}
                      onChange={() => handleToggleCausalFactor(factor.id)}
                      className="mt-1"
                    />
                    <span className="text-sm text-slate-700">{factor.title}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Recommendation Title *
                </label>
                <input
                  type="text"
                  value={newRecommendation.title}
                  onChange={(e) => setNewRecommendation({...newRecommendation, title: e.target.value})}
                  placeholder="Brief, action-oriented title"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newRecommendation.description}
                  onChange={(e) => setNewRecommendation({...newRecommendation, description: e.target.value})}
                  rows={3}
                  placeholder="Detailed description of the recommendation and expected outcome..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Control Type (Hierarchy of Controls) *
                </label>
                <select
                  value={newRecommendation.controlType}
                  onChange={(e) => setNewRecommendation({...newRecommendation, controlType: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select control type...</option>
                  {controlTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label} - {type.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Specific Action (SMART) *
                </label>
                <textarea
                  value={newRecommendation.specificAction}
                  onChange={(e) => setNewRecommendation({...newRecommendation, specificAction: e.target.value})}
                  rows={2}
                  placeholder="What specific actions will be taken? Be clear and measurable..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Assigned To
                  </label>
                  <input
                    type="text"
                    value={newRecommendation.assignedTo}
                    onChange={(e) => setNewRecommendation({...newRecommendation, assignedTo: e.target.value})}
                    placeholder="Person or role responsible"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={newRecommendation.assignedDepartment}
                    onChange={(e) => setNewRecommendation({...newRecommendation, assignedDepartment: e.target.value})}
                    placeholder="Responsible department"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Target Completion Date
                  </label>
                  <input
                    type="date"
                    value={newRecommendation.targetCompletionDate}
                    onChange={(e) => setNewRecommendation({...newRecommendation, targetCompletionDate: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={newRecommendation.priority}
                    onChange={(e) => setNewRecommendation({...newRecommendation, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select priority...</option>
                    {priorities.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowAddRecommendation(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRecommendation}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Recommendation
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {filteredRecommendations.map(rec => {
            const statusInfo = getStatusInfo(rec.status);
            const priorityColor = getPriorityColor(rec.priority);
            const controlType = controlTypes.find(c => c.value === rec.controlType);
            const StatusIcon = statusInfo.icon;

            return (
              <div key={rec.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${priorityColor}`}>
                        {priorities.find(p => p.value === rec.priority)?.label}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-700">
                        {controlType?.label}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 ${statusInfo.color}`}>
                        {StatusIcon && <StatusIcon className="w-3 h-3" />}
                        {statusInfo.label}
                      </span>
                    </div>

                    <h3 className="font-semibold text-slate-900 text-lg mb-1">{rec.title}</h3>
                    <p className="text-sm text-slate-600 mb-3">{rec.description}</p>

                    <div className="bg-slate-50 rounded-lg p-3 mb-3">
                      <p className="text-xs font-medium text-slate-700 mb-1">Specific Action:</p>
                      <p className="text-sm text-slate-900">{rec.specificAction}</p>
                    </div>

                    <div className="mb-3">
                      <p className="text-xs text-slate-500 mb-1">Addresses Causal Factors:</p>
                      <div className="space-y-1">
                        {rec.linkedCausalFactorIds.map(factorId => {
                          const factor = validatedCausalFactors.find(f => f.id === factorId);
                          return factor ? (
                            <div key={factorId} className="text-xs px-2 py-1 bg-blue-50 text-blue-800 rounded">
                              {factor.title}
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>

                    {(rec.linkedHFATFindings.length > 0 || rec.linkedHOPFindings.length > 0) && (
                      <div className="mb-3 space-y-2">
                        {rec.linkedHFATFindings.length > 0 && (
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Based on HFAT Findings:</p>
                            <div className="space-y-1">
                              {rec.linkedHFATFindings.map((finding, idx) => (
                                <div key={idx} className="text-xs px-2 py-1 bg-purple-50 text-purple-800 rounded">
                                  {finding}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {rec.linkedHOPFindings.length > 0 && (
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Based on HOP Findings:</p>
                            <div className="space-y-1">
                              {rec.linkedHOPFindings.map((finding, idx) => (
                                <div key={idx} className="text-xs px-2 py-1 bg-green-50 text-green-800 rounded">
                                  {finding}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {rec.assignedTo && (
                        <div>Assigned to: <span className="text-slate-700">{rec.assignedTo}</span></div>
                      )}
                      {rec.assignedDepartment && (
                        <div>Department: <span className="text-slate-700">{rec.assignedDepartment}</span></div>
                      )}
                      {rec.targetCompletionDate && (
                        <div>Target: <span className="text-slate-700">{rec.targetCompletionDate}</span></div>
                      )}
                    </div>
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

        {filteredRecommendations.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <Lightbulb className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No recommendations match your filters</p>
          </div>
        )}

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Hierarchy of Controls (Most to Least Effective)</h3>
          <div className="space-y-2">
            {controlTypes.map((type, idx) => (
              <div key={type.value} className="flex items-center gap-3">
                <span className="text-lg font-bold text-slate-400">{idx + 1}</span>
                <div>
                  <p className="text-sm font-medium text-slate-900">{type.label}</p>
                  <p className="text-xs text-slate-600">{type.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
