'use client'

import React, { useState } from 'react';
import { Upload, FileText, Camera, Video, Database, Users, Search, Filter, Tag, Calendar, MapPin, Trash2, Eye, Plus } from 'lucide-react';

export default function EvidenceDataCollection() {
  const [activeTab, setActiveTab] = useState('evidence');
  const [showAddEvidence, setShowAddEvidence] = useState(false);
  const [showAddInterview, setShowAddInterview] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const investigation = {
    number: 'INV-2026-001',
    description: 'Pressure relief valve failure during startup',
    facility: 'Offshore Platform Alpha'
  };

  const [evidence, setEvidence] = useState([
    {
      id: '1',
      type: 'photo',
      title: 'Failed Relief Valve - Close-up',
      description: 'Shows corrosion on valve seat',
      collectedDate: '2026-01-20',
      collectedBy: 'J. Smith',
      location: 'Compression Train 1',
      tags: ['valve', 'corrosion', 'critical'],
      linkedEvents: 2,
      fileSize: '2.4 MB'
    },
    {
      id: '2',
      type: 'document',
      title: 'Valve Maintenance Records',
      description: 'Last 3 years maintenance history',
      collectedDate: '2026-01-20',
      collectedBy: 'M. Johnson',
      location: 'CMMS Database',
      tags: ['maintenance', 'records'],
      linkedEvents: 1,
      fileSize: '156 KB'
    },
    {
      id: '3',
      type: 'data_log',
      title: 'Process Data - Pressure & Temp',
      description: '24 hours before and after incident',
      collectedDate: '2026-01-21',
      collectedBy: 'R. Lee',
      location: 'DCS Historian',
      tags: ['pressure', 'temperature', 'trending'],
      linkedEvents: 5,
      fileSize: '8.2 MB'
    }
  ]);

  const [interviews, setInterviews] = useState([
    {
      id: '1',
      intervieweeName: 'John Anderson',
      role: 'Control Room Operator',
      department: 'Operations',
      interviewDate: '2026-01-21',
      interviewer: 'Lead Investigator',
      type: 'witness',
      keyFindings: 'Noticed pressure anomaly 30 minutes before trip',
      linkedEvents: 3,
      status: 'complete'
    },
    {
      id: '2',
      intervieweeName: 'Sarah Chen',
      role: 'Maintenance Supervisor',
      department: 'Mechanical',
      interviewDate: '2026-01-21',
      interviewer: 'Team Member 2',
      type: 'subject_matter_expert',
      keyFindings: 'Valve was due for replacement next quarter',
      linkedEvents: 2,
      status: 'complete'
    }
  ]);

  const [newEvidence, setNewEvidence] = useState({
    type: '',
    title: '',
    description: '',
    collectedDate: new Date().toISOString().split('T')[0],
    collectedBy: '',
    location: '',
    tags: ''
  });

  const [newInterview, setNewInterview] = useState({
    intervieweeName: '',
    role: '',
    department: '',
    interviewDate: new Date().toISOString().split('T')[0],
    interviewTime: '',
    interviewer: '',
    type: '',
    notes: ''
  });

  const evidenceTypes = [
    { value: 'photo', label: 'Photo/Image', icon: Camera },
    { value: 'video', label: 'Video', icon: Video },
    { value: 'document', label: 'Document', icon: FileText },
    { value: 'data_log', label: 'Data Log', icon: Database },
    { value: 'physical_sample', label: 'Physical Sample', icon: Tag },
    { value: 'other', label: 'Other', icon: FileText }
  ];

  const interviewTypes = [
    { value: 'witness', label: 'Witness' },
    { value: 'subject_matter_expert', label: 'Subject Matter Expert' },
    { value: 'management', label: 'Management' },
    { value: 'other', label: 'Other' }
  ];

  const handleAddEvidence = () => {
    const evidence_item = {
      id: String(evidence.length + 1),
      ...newEvidence,
      tags: newEvidence.tags.split(',').map(t => t.trim()),
      linkedEvents: 0,
      fileSize: '0 KB'
    };
    setEvidence([...evidence, evidence_item]);
    setShowAddEvidence(false);
    setNewEvidence({
      type: '',
      title: '',
      description: '',
      collectedDate: new Date().toISOString().split('T')[0],
      collectedBy: '',
      location: '',
      tags: ''
    });
  };

  const handleAddInterview = () => {
    const interview = {
      id: String(interviews.length + 1),
      ...newInterview,
      linkedEvents: 0,
      status: 'draft'
    };
    setInterviews([...interviews, interview]);
    setShowAddInterview(false);
    setNewInterview({
      intervieweeName: '',
      role: '',
      department: '',
      interviewDate: new Date().toISOString().split('T')[0],
      interviewTime: '',
      interviewer: '',
      type: '',
      notes: ''
    });
  };

  const getTypeIcon = (type: string) => {
    const typeObj = evidenceTypes.find(t => t.value === type);
    return typeObj ? typeObj.icon : FileText;
  };

  const filteredEvidence = evidence.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Data Collection & Evidence Management
                  </h1>
                  <p className="text-sm text-slate-600">
                    {investigation.number} - {investigation.description}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-600">Total Items</div>
              <div className="text-2xl font-bold text-blue-600">
                {evidence.length + interviews.length}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-6">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('evidence')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === 'evidence'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              Evidence ({evidence.length})
            </button>
            <button
              onClick={() => setActiveTab('interviews')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === 'interviews'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              Interviews ({interviews.length})
            </button>
          </div>

          {activeTab === 'evidence' && (
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search evidence..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  {evidenceTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowAddEvidence(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Evidence
                </button>
              </div>

              {showAddEvidence && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Add New Evidence</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Evidence Type *</label>
                      <select
                        value={newEvidence.type}
                        onChange={(e) => setNewEvidence({...newEvidence, type: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select type...</option>
                        {evidenceTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Title *</label>
                      <input
                        type="text"
                        value={newEvidence.title}
                        onChange={(e) => setNewEvidence({...newEvidence, title: e.target.value})}
                        placeholder="Brief descriptive title"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                      <textarea
                        value={newEvidence.description}
                        onChange={(e) => setNewEvidence({...newEvidence, description: e.target.value})}
                        rows={3}
                        placeholder="What does this evidence show?"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Collection Date *</label>
                      <input
                        type="date"
                        value={newEvidence.collectedDate}
                        onChange={(e) => setNewEvidence({...newEvidence, collectedDate: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Collected By *</label>
                      <input
                        type="text"
                        value={newEvidence.collectedBy}
                        onChange={(e) => setNewEvidence({...newEvidence, collectedBy: e.target.value})}
                        placeholder="Name of collector"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                      <input
                        type="text"
                        value={newEvidence.location}
                        onChange={(e) => setNewEvidence({...newEvidence, location: e.target.value})}
                        placeholder="Where was this collected?"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Tags (comma-separated)</label>
                      <input
                        type="text"
                        value={newEvidence.tags}
                        onChange={(e) => setNewEvidence({...newEvidence, tags: e.target.value})}
                        placeholder="e.g., critical, valve, corrosion"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowAddEvidence(false)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddEvidence}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save Evidence
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {filteredEvidence.map(item => {
                  const Icon = getTypeIcon(item.type);
                  return (
                    <div key={item.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-slate-100 rounded-lg">
                          <Icon className="w-5 h-5 text-slate-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-slate-900">{item.title}</h3>
                              <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="View">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {item.collectedDate}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {item.collectedBy}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {item.location}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            {item.tags.map((tag, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredEvidence.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No evidence found matching your criteria</p>
                </div>
              )}
            </div>
          )}
          {activeTab === 'interviews' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900">Interview Records</h2>
                <button
                  onClick={() => setShowAddInterview(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Interview
                </button>
              </div>

              {showAddInterview && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Record New Interview</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Interviewee Name *</label>
                      <input
                        type="text"
                        value={newInterview.intervieweeName}
                        onChange={(e) => setNewInterview({...newInterview, intervieweeName: e.target.value})}
                        placeholder="Full name"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Role/Position *</label>
                      <input
                        type="text"
                        value={newInterview.role}
                        onChange={(e) => setNewInterview({...newInterview, role: e.target.value})}
                        placeholder="e.g., Control Room Operator"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                      <input
                        type="text"
                        value={newInterview.department}
                        onChange={(e) => setNewInterview({...newInterview, department: e.target.value})}
                        placeholder="e.g., Operations"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Interview Type *</label>
                      <select
                        value={newInterview.type}
                        onChange={(e) => setNewInterview({...newInterview, type: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select type...</option>
                        {interviewTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Interview Date *</label>
                      <input
                        type="date"
                        value={newInterview.interviewDate}
                        onChange={(e) => setNewInterview({...newInterview, interviewDate: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Interview Time</label>
                      <input
                        type="time"
                        value={newInterview.interviewTime}
                        onChange={(e) => setNewInterview({...newInterview, interviewTime: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Interviewer</label>
                      <input
                        type="text"
                        value={newInterview.interviewer}
                        onChange={(e) => setNewInterview({...newInterview, interviewer: e.target.value})}
                        placeholder="Name of interviewer"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Interview Notes / Key Findings</label>
                      <textarea
                        value={newInterview.notes}
                        onChange={(e) => setNewInterview({...newInterview, notes: e.target.value})}
                        rows={4}
                        placeholder="Document key findings, observations, and important statements..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-amber-800">
                      <strong>Just Culture Reminder:</strong> Focus on understanding what made sense to the person at the time. 
                      Avoid hindsight bias and blame. Ask about context, not just actions.
                    </p>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowAddInterview(false)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddInterview}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save Interview
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {interviews.map(interview => (
                  <div key={interview.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-slate-900">{interview.intervieweeName}</h3>
                            <p className="text-sm text-slate-600">{interview.role} - {interview.department}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              interview.status === 'complete' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {interview.status}
                            </span>
                            <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="View">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3 mb-3">
                          <p className="text-sm text-slate-700">
                            <strong>Key Findings:</strong> {interview.keyFindings}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {interview.interviewDate}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Interviewer: {interview.interviewer}
                          </div>
                          <div>Type: {interview.type}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {interviews.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No interviews recorded yet</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            Data Collection Best Practices
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Collect evidence as soon as possible to preserve scene integrity</li>
            <li>• Tag evidence items to make them searchable and easy to reference</li>
            <li>• Conduct interviews using Just Culture principles - focus on understanding, not blame</li>
            <li>• Document chain of custody for critical physical evidence</li>
            <li>• Review collected data regularly to identify gaps in information</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
