'use client'

import React, { useState } from 'react';
import { Clock, Plus, Edit2, Trash2, AlertCircle, CheckCircle, Filter, Search, Calendar, Users, MapPin, FileText, Link as LinkIcon } from 'lucide-react';

export default function TimelineBuilder() {
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'chronological' | 'category'>('chronological');

  const investigation = {
    number: 'INV-2026-001',
    description: 'Pressure relief valve failure during startup'
  };

  const eventCategories = [
    { value: 'action', label: 'Action', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'observation', label: 'Observation', color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'condition', label: 'Condition', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { value: 'decision', label: 'Decision', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { value: 'communication', label: 'Communication', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' }
  ];

  const [timelineEvents, setEvents] = useState([
    {
      id: '1',
      time: '08:00',
      date: '2026-01-15',
      category: 'action',
      title: 'Startup procedure initiated',
      description: 'Operator began startup sequence for Unit 3',
      source: 'Operator log',
      evidenceLinks: ['Log entry #45'],
      verificationStatus: 'verified',
      involvedPersonnel: ['J. Smith - Operator']
    },
    {
      id: '2',
      time: '08:15',
      date: '2026-01-15',
      category: 'observation',
      title: 'Pressure trending upward',
      description: 'Pressure began climbing above normal operating range',
      source: 'DCS data',
      evidenceLinks: ['Process trend data'],
      verificationStatus: 'verified',
      involvedPersonnel: []
    },
    {
      id: '3',
      time: '09:00',
      date: '2026-01-15',
      category: 'condition',
      title: 'Incident: PSV-101 failure',
      description: 'Relief valve failed to lift at set pressure of 150 psig, pressure reached 165 psig',
      source: 'Incident report',
      evidenceLinks: ['Incident report', 'Process data', 'Equipment inspection'],
      verificationStatus: 'verified',
      involvedPersonnel: ['J. Smith - Operator', 'M. Jones - Supervisor'],
      isIncidentEvent: true
    }
  ]);

  const getCategoryColor = (category: string) => {
    const cat = eventCategories.find(c => c.value === category);
    return cat?.color || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusIcon = (status: string, isIncident: boolean) => {
    if (isIncident) {
      return (
        <div className="w-10 h-10 rounded-full bg-red-100 border-2 border-red-500 flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-red-600" />
        </div>
      );
    }
    if (status === 'verified') {
      return (
        <div className="w-10 h-10 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-green-600" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-amber-100 border-2 border-amber-500 flex items-center justify-center">
        <Clock className="w-5 h-5 text-amber-600" />
      </div>
    );
  };

  const deleteEvent = (id: string) => {
    if (confirm('Delete this timeline event?')) {
      setEvents(timelineEvents.filter(e => e.id !== id));
    }
  };

  const filteredEvents = timelineEvents.filter(event => {
    const matchesCategory = filterCategory === 'all' || event.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || event.verificationStatus === filterStatus;
    const matchesSearch = !searchTerm || 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`).getTime();
    const dateB = new Date(`${b.date} ${b.time}`).getTime();
    return dateA - dateB;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Step 3: Timeline Builder</h1>
              <p className="text-slate-600 mt-1">Construct chronological sequence of events</p>
              <div className="mt-2 text-sm">
                <span className="text-slate-500">Investigation:</span>{' '}
                <span className="font-medium text-slate-700">{investigation.number}</span>
                {' - '}
                <span className="text-slate-600">{investigation.description}</span>
              </div>
            </div>
            <button
              onClick={() => setShowAddEvent(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Event
            </button>
          </div>
        </div>

        {/* Compact Legend at Top */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column - Event Status */}
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">Event Status:</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-red-100 border-2 border-red-500 flex items-center justify-center">
                    <AlertCircle className="w-3 h-3 text-red-600" />
                  </div>
                  <span className="text-xs text-slate-600">Incident</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-xs text-slate-600">Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-100 border-2 border-amber-500 flex items-center justify-center">
                    <Clock className="w-3 h-3 text-amber-600" />
                  </div>
                  <span className="text-xs text-slate-600">Needs Verification</span>
                </div>
              </div>
            </div>

            {/* Right Column - Event Categories */}
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">Categories:</p>
              <div className="flex flex-wrap gap-2">
                {eventCategories.map(cat => (
                  <span key={cat.value} className={`px-2 py-0.5 text-xs rounded-full border ${cat.color}`}>
                    {cat.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Filters and View Toggle */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-600" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border border-slate-300 rounded px-3 py-2 text-sm"
              >
                <option value="all">All Categories</option>
                {eventCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-slate-300 rounded px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="verified">Verified</option>
                <option value="needs_verification">Needs Verification</option>
              </select>
            </div>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => setViewMode('chronological')}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  viewMode === 'chronological'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Chronological
              </button>
              <button
                onClick={() => setViewMode('category')}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  viewMode === 'category'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                By Category
              </button>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-300" />

          {/* Events */}
          <div className="space-y-6">
            {sortedEvents.map((event, index) => (
              <div key={event.id} className="relative flex gap-6">
                {/* Timeline marker */}
                <div className="relative z-10 flex-shrink-0">
                  {getStatusIcon(event.verificationStatus, event.isIncidentEvent || false)}
                </div>

                {/* Event card */}
                <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(event.category)}`}>
                          {eventCategories.find(c => c.value === event.category)?.label}
                        </span>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4" />
                          {event.date}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Clock className="w-4 h-4" />
                          {event.time}
                        </div>
                      </div>
                      <h3 className="font-semibold text-lg text-slate-900 mb-2">{event.title}</h3>
                      <p className="text-slate-600 text-sm mb-3">{event.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          Source: {event.source}
                        </div>
                        {event.evidenceLinks.length > 0 && (
                          <div className="flex items-center gap-1">
                            <LinkIcon className="w-3 h-3" />
                            {event.evidenceLinks.length} evidence item(s)
                          </div>
                        )}
                      </div>

                      {event.involvedPersonnel.length > 0 && (
                        <div className="mt-3 flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-400" />
                          <div className="flex flex-wrap gap-2">
                            {event.involvedPersonnel.map((person, idx) => (
                              <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                                {person}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit event"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteEvent(event.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {filteredEvents.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Timeline Events Yet</h3>
            <p className="text-slate-600 mb-4">Start building the timeline by adding key events</p>
            <button
              onClick={() => setShowAddEvent(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add First Event
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
            onClick={() => alert('Proceeding to Step 4: Causal Analysis')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Next: Causal Analysis
          </button>
        </div>
      </div>

      {/* Add Event Modal (simplified placeholder) */}
      {showAddEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-xl font-bold mb-4">Add Timeline Event</h2>
            <p className="text-sm text-slate-600 mb-4">
              This is a simplified version. In production, you'd have a full form here.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddEvent(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
