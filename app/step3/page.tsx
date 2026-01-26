'use client'

import React, { useState } from 'react';
import { Clock, Plus, Edit2, Trash2, AlertCircle, CheckCircle, Calendar, Filter } from 'lucide-react';

export default function TimelineBuilder() {
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');

  // Mock investigation data
  const investigation = {
    number: 'INV-2026-001',
    description: 'Pressure relief valve failure during startup',
    incidentDateTime: '2026-01-19T14:30:00'
  };

  // Mock timeline events
  const [events, setEvents] = useState([
    {
      id: '1',
      datetime: '2026-01-19T06:00:00',
      certainty: 'exact',
      title: 'Day shift handover',
      description: 'Night shift reported normal operations, no issues flagged',
      category: 'operational',
      evidenceLinks: ['Interview - Shift supervisor'],
      verified: true
    },
    {
      id: '2',
      datetime: '2026-01-19T08:30:00',
      certainty: 'exact',
      title: 'Startup procedure initiated',
      description: 'Operator began startup sequence per SOP-100',
      category: 'operational',
      evidenceLinks: ['Process data log', 'SOP-100'],
      verified: true
    },
    {
      id: '3',
      datetime: '2026-01-19T13:45:00',
      certainty: 'approximate',
      title: 'Pressure anomaly first noticed',
      description: 'Operator noticed pressure trending higher than normal on compressor discharge',
      category: 'human_action',
      evidenceLinks: ['Interview - Control room operator'],
      verified: false
    },
    {
      id: '4',
      datetime: '2026-01-19T14:15:00',
      certainty: 'exact',
      title: 'High pressure alarm',
      description: 'DCS high pressure alarm activated at 145 psig',
      category: 'equipment',
      evidenceLinks: ['DCS alarm log', 'Process data'],
      verified: true
    },
    {
      id: '5',
      datetime: '2026-01-19T14:30:00',
      certainty: 'exact',
      title: 'Relief valve failed to lift - INCIDENT',
      description: 'Pressure reached 165 psig, relief valve PSV-101 did not lift at set pressure of 150 psig',
      category: 'equipment',
      evidenceLinks: ['Process data', 'Photo - valve', 'Maintenance records'],
      verified: true,
      isIncident: true
    },
    {
      id: '6',
      datetime: '2026-01-19T14:31:00',
      certainty: 'exact',
      title: 'Emergency shutdown initiated',
      description: 'Operator initiated ESD, system safely shut down',
      category: 'operational',
      evidenceLinks: ['DCS log', 'Interview - operator'],
      verified: true
    }
  ]);

  const [newEvent, setNewEvent] = useState({
    datetime: '',
    time: '',
    certainty: 'exact',
    title: '',
    description: '',
    category: ''
  });

  const eventCategories = [
    { value: 'operational', label: 'Operational', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    { value: 'equipment', label: 'Equipment', color: 'bg-purple-100 text-purple-700 border-purple-300' },
    { value: 'human_action', label: 'Human Action', color: 'bg-green-100 text-green-700 border-green-300' },
    { value: 'environmental', label: 'Environmental', color: 'bg-amber-100 text-amber-700 border-amber-300' },
    { value: 'organizational', label: 'Organizational', color: 'bg-slate-100 text-slate-700 border-slate-300' }
  ];

  const certaintyCriteria = [
    { value: 'exact', label: 'Exact', description: 'Confirmed by logs, records, or multiple sources' },
    { value: 'approximate', label: 'Approximate', description: 'Best estimate, within ±15 minutes' },
    { value: 'estimated', label: 'Estimated', description: 'Rough estimate, may need refinement' }
  ];

  const getCategoryColor = (category: string) => {
    const cat = eventCategories.find(c => c.value === category);
    return cat ? cat.color : 'bg-slate-100 text-slate-700 border-slate-300';
  };

  const handleAddEvent = () => {
    if (!newEvent.datetime || !newEvent.title || !newEvent.category) {
      alert('Please fill in required fields: Date/Time, Title, and Category');
      return;
    }

    const datetimeStr = newEvent.time 
      ? `${newEvent.datetime}T${newEvent.time}:00`
      : `${newEvent.datetime}T12:00:00`;

    const event = {
      id: String(events.length + 1),
      datetime: datetimeStr,
      certainty: newEvent.certainty,
      title: newEvent.title,
      description: newEvent.description,
      category: newEvent.category,
      evidenceLinks: [],
      verified: false
    };

    setEvents([...events, event].sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()));
    setShowAddEvent(false);
    setNewEvent({
      datetime: '',
      time: '',
      certainty: 'exact',
      title: '',
      description: '',
      category: ''
    });
  };

  const formatDateTime = (datetime: string) => {
    const date = new Date(datetime);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    };
  };

  const filteredEvents = filterCategory === 'all' 
    ? events 
    : events.filter(e => e.category === filterCategory);

  const sortedEvents = [...filteredEvents].sort((a, b) => 
    new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Timeline Construction
                </h1>
                <p className="text-sm text-slate-600">
                  {investigation.number} - Build chronological sequence of events
                </p>
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

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Filter:</span>
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {eventCategories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <div className="ml-auto text-sm text-slate-600">
              {sortedEvents.length} events in timeline
            </div>
          </div>
        </div>

        {/* Add Event Form */}
        {showAddEvent && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Timeline Event</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={newEvent.datetime}
                  onChange={(e) => setNewEvent({...newEvent, datetime: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Time Certainty *
                </label>
                <select
                  value={newEvent.certainty}
                  onChange={(e) => setNewEvent({...newEvent, certainty: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {certaintyCriteria.map(cert => (
                    <option key={cert.value} value={cert.value}>
                      {cert.label} - {cert.description}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Event Category *
                </label>
                <select
                  value={newEvent.category}
                  onChange={(e) => setNewEvent({...newEvent, category: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category...</option>
                  {eventCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  placeholder="Brief descriptive title"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Event Description
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  rows={3}
                  placeholder="Detailed description of what happened..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAddEvent(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEvent}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Event
              </button>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Event Timeline</h3>
          
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200"></div>

            {/* Timeline events */}
            <div className="space-y-6">
              {sortedEvents.map((event) => {
                const dt = formatDateTime(event.datetime);
                const categoryColor = getCategoryColor(event.category);
                
                return (
                  <div key={event.id} className="relative pl-20">
                    {/* Time marker */}
                    <div className="absolute left-0 top-0 flex items-center gap-3">
                      <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center ${
                        event.isIncident 
                          ? 'bg-red-100 border-red-500' 
                          : event.verified 
                            ? 'bg-green-100 border-green-500' 
                            : 'bg-amber-100 border-amber-500'
                      }`}>
                        {event.isIncident ? (
                          <AlertCircle className="w-6 h-6 text-red-600" />
                        ) : event.verified ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <Clock className="w-6 h-6 text-amber-600" />
                        )}
                      </div>
                    </div>

                    {/* Event card */}
                    <div className={`border-2 rounded-lg p-4 ${
                      event.isIncident 
                        ? 'bg-red-50 border-red-300' 
                        : 'bg-white border-slate-200 hover:shadow-md transition-shadow'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-mono text-slate-500">
                              {dt.time}
                            </span>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              event.certainty === 'exact' 
                                ? 'bg-green-100 text-green-700'
                                : event.certainty === 'approximate'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-700'
                            }`}>
                              {event.certainty}
                            </span>
                            <span className={`px-2 py-0.5 text-xs rounded-full border ${categoryColor}`}>
                              {eventCategories.find(c => c.value === event.category)?.label}
                            </span>
                          </div>
                          <h4 className={`font-semibold mb-1 ${
                            event.isIncident ? 'text-red-900 text-lg' : 'text-slate-900'
                          }`}>
                            {event.title}
                          </h4>
                          <p className="text-sm text-slate-600">{event.description}</p>
                          
                          {event.evidenceLinks && event.evidenceLinks.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-200">
                              <p className="text-xs text-slate-500 mb-1">Evidence:</p>
                              <div className="flex flex-wrap gap-1">
                                {event.evidenceLinks.map((link, idx) => (
                                  <span key={idx} className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded">
                                    {link}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-4">
                          <button className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {sortedEvents.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No events in timeline yet</p>
              <p className="text-sm text-slate-500">Click "Add Event" to start building your timeline</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Timeline Legend</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-slate-700 mb-2">Event Status:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-100 border-2 border-red-500 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-xs text-slate-600">Incident Event</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-xs text-slate-600">Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-amber-500 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-xs text-slate-600">Needs Verification</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-700 mb-2">Event Categories:</p>
              <div className="space-y-1">
                {eventCategories.map(cat => (
                  <div key={cat.value} className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full border ${cat.color}`}>
                      {cat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
