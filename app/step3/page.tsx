'use client'

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Clock, Plus, Edit2, Trash2, AlertCircle, CheckCircle, Filter, Search, Calendar, Users, MapPin, FileText, Link as LinkIcon, X, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function TimelineBuilder() {
  const searchParams = useSearchParams();
  const investigationId = searchParams.get('investigationId');

  const [showAddEvent, setShowAddEvent] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'chronological' | 'category'>('chronological');
  const [saving, setSaving] = useState(false);

  const [investigation, setInvestigation] = useState<any>(null);
  const [timelineEvents, setEvents] = useState<any[]>([]);

  const [newEvent, setNewEvent] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '12:00',
    category: 'action',
    title: '',
    description: '',
    source: '',
    verificationStatus: 'needs_verification',
    involvedPersonnel: '',
    isIncidentEvent: false
  });

  const eventCategories = [
    { value: 'action', label: 'Action', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'observation', label: 'Observation', color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'condition', label: 'Condition', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { value: 'decision', label: 'Decision', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { value: 'communication', label: 'Communication', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' }
  ];

  useEffect(() => {
    if (investigationId) {
      loadInvestigation();
      loadTimelineEvents();
    }
  }, [investigationId]);

  const loadInvestigation = async () => {
    const { data } = await supabase
      .from('investigations')
      .select('*')
      .eq('id', investigationId)
      .single();
    
    setInvestigation(data);
  };

  const loadTimelineEvents = async () => {
    if (!investigationId) return;

    try {
      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('investigation_id', investigationId)
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true });

      if (error) {
        console.error('Error loading timeline events:', error);
      } else {
        setEvents(data || []);
      }
    } catch (error) {
      console.error('Error loading timeline:', error);
    }
  };

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time) {
      alert('Please fill in required fields (title, date, time)');
      return;
    }

    if (!investigationId) {
      alert('No investigation selected');
      return;
    }

    setSaving(true);

    try {
      const { data, error } = await supabase
        .from('timeline_events')
        .insert([{
          investigation_id: investigationId,
          event_date: newEvent.date,
          event_time: newEvent.time,
          category: newEvent.category,
          title: newEvent.title,
          description: newEvent.description || null,
          source: newEvent.source || null,
          verification_status: newEvent.verificationStatus,
          involved_personnel: newEvent.involvedPersonnel 
            ? newEvent.involvedPersonnel.split(',').map(p => p.trim()).filter(p => p)
            : [],
          is_incident_event: newEvent.isIncidentEvent
        }])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        alert('Error saving timeline event');
        return;
      }

      // Add to local state
      setEvents([...timelineEvents, data]);

      // Reset form
      setNewEvent({
        date: new Date().toISOString().split('T')[0],
        time: '12:00',
        category: 'action',
        title: '',
        description: '',
        source: '',
        verificationStatus: 'needs_verification',
        involvedPersonnel: '',
        isIncidentEvent: false
      });

      setShowAddEvent(false);
      alert('Timeline event added successfully!');
    } catch (error) {
      console.error('Error adding event:', error);
      alert('Error adding timeline event');
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Delete this timeline event?')) return;

    try {
      const { error } = await supabase
        .from('timeline_events')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting event:', error);
        alert('Error deleting event');
        return;
      }

      setEvents(timelineEvents.filter(e => e.id !== id));
      alert('Event deleted');
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting event');
    }
  };

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

  const filteredEvents = timelineEvents.filter(event => {
    const matchesCategory = filterCategory === 'all' || event.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || event.verification_status === filterStatus;
    const matchesSearch = !searchTerm || 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const dateA = new Date(`${a.event_date} ${a.event_time}`).getTime();
    const dateB = new Date(`${b.event_date} ${b.event_time}`).getTime();
    return dateA - dateB;
  });

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Step 3: Timeline Builder</h1>
              <p className="text-slate-600 mt-1">Construct chronological sequence of events</p>
              {investigation && (
                <div className="mt-2 text-sm">
                  <span className="text-slate-500">Investigation:</span>{' '}
                  <span className="font-medium text-slate-700">{investigation.investigation_number}</span>
                  {' - '}
                  <span className="text-slate-600">{investigation.incident_description}</span>
                </div>
              )}
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
          </div>
        </div>

        {/* Timeline */}
        {sortedEvents.length > 0 && (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-300" />

            {/* Events */}
            <div className="space-y-6">
              {sortedEvents.map((event) => (
                <div key={event.id} className="relative flex gap-6">
                  {/* Timeline marker */}
                  <div className="relative z-10 flex-shrink-0">
                    {getStatusIcon(event.verification_status, event.is_incident_event || false)}
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
                            {event.event_date}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Clock className="w-4 h-4" />
                            {event.event_time}
                          </div>
                        </div>
                        <h3 className="font-semibold text-lg text-slate-900 mb-2">{event.title}</h3>
                        <p className="text-slate-600 text-sm mb-3">{event.description}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          {event.source && (
                            <div className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              Source: {event.source}
                            </div>
                          )}
                        </div>

                        {event.involved_personnel && event.involved_personnel.length > 0 && (
                          <div className="mt-3 flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-400" />
                            <div className="flex flex-wrap gap-2">
                              {event.involved_personnel.map((person: string, idx: number) => (
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
        )}

        {sortedEvents.length === 0 && (
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
            onClick={() => {
              if (!investigationId) {
                alert('No investigation ID found');
                return;
              }
              window.location.href = `/step4?investigationId=${investigationId}`;
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Next: Causal Analysis
          </button>
        </div>
      </div>

      {/* Add Event Modal - CONTINUED IN NEXT FILE */}
      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Add Timeline Event</h2>
              <button
                onClick={() => setShowAddEvent(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Event Time *
                  </label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category *
                </label>
                <select
                  value={newEvent.category}
                  onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                >
                  {eventCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  placeholder="e.g., Operator started startup procedure"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  rows={3}
                  placeholder="Provide details about what happened..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Source of Information
                </label>
                <input
                  type="text"
                  value={newEvent.source}
                  onChange={(e) => setNewEvent({ ...newEvent, source: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  placeholder="e.g., Operator log, DCS data, Interview with J. Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Involved Personnel (comma-separated)
                </label>
                <input
                  type="text"
                  value={newEvent.involvedPersonnel}
                  onChange={(e) => setNewEvent({ ...newEvent, involvedPersonnel: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  placeholder="e.g., J. Smith - Operator, M. Jones - Supervisor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Verification Status
                </label>
                <select
                  value={newEvent.verificationStatus}
                  onChange={(e) => setNewEvent({ ...newEvent, verificationStatus: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                >
                  <option value="needs_verification">Needs Verification</option>
                  <option value="verified">Verified</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isIncidentEvent"
                  checked={newEvent.isIncidentEvent}
                  onChange={(e) => setNewEvent({ ...newEvent, isIncidentEvent: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded"
                />
                <label htmlFor="isIncidentEvent" className="text-sm font-medium text-slate-700">
                  This is the incident event
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddEvent}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Adding...' : 'Add Event'}
              </button>
              <button
                onClick={() => setShowAddEvent(false)}
                disabled={saving}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
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
