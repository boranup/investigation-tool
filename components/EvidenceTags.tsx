'use client'

import React, { useState, useEffect } from 'react';
import { Tag, Plus, X, Link as LinkIcon, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface EvidenceTagsProps {
  evidenceId: string;
  investigationId: string;
}

interface TagData {
  id: string;
  tag_type: string;
  tag_value: string;
  linked_causal_factor_id?: string;
  linked_timeline_event_id?: string;
}

export default function EvidenceTags({ evidenceId, investigationId }: EvidenceTagsProps) {
  const [tags, setTags] = useState<TagData[]>([]);
  const [showAddTag, setShowAddTag] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [causalFactors, setCausalFactors] = useState<any[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);

  const [newTag, setNewTag] = useState({
    tagType: 'type',
    tagValue: '',
    linkedCausalFactor: '',
    linkedTimelineEvent: ''
  });

  const tagTypes = [
    { value: 'type', label: 'Evidence Type', description: 'Physical, digital, testimonial, etc.' },
    { value: 'source', label: 'Source', description: 'Where evidence came from' },
    { value: 'category', label: 'Category', description: 'Classification or grouping' }
  ];

  const commonTags = {
    type: [
      'Physical Evidence',
      'Digital Evidence',
      'Photographic',
      'Video',
      'Document',
      'Log File',
      'Testimonial',
      'Equipment Data',
      'Sensor Data'
    ],
    source: [
      'DCS System',
      'CCTV',
      'Operator Log',
      'Maintenance Record',
      'Training Record',
      'Procedure',
      'Interview',
      'Inspection Report',
      'Third Party'
    ],
    category: [
      'Critical',
      'Supporting',
      'Background',
      'Timeline',
      'Causal Factor',
      'Barrier',
      'Root Cause',
      'Systemic'
    ]
  };

  useEffect(() => {
    loadTags();
    loadCausalFactors();
    loadTimelineEvents();
  }, [evidenceId]);

  async function loadTags() {
    try {
      const { data, error } = await supabase
        .from('evidence_tags')
        .select('*')
        .eq('evidence_id', evidenceId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Error loading tags:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadCausalFactors() {
    try {
      const { data, error } = await supabase
        .from('causal_factors')
        .select('id, causal_factor_title')
        .eq('investigation_id', investigationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setCausalFactors(data || []);
    } catch (error) {
      console.error('Error loading causal factors:', error);
    }
  }

  async function loadTimelineEvents() {
    try {
      const { data, error } = await supabase
        .from('timeline_events')
        .select('id, title, event_date, event_time')
        .eq('investigation_id', investigationId)
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true });

      if (error) throw error;
      setTimelineEvents(data || []);
    } catch (error) {
      console.error('Error loading timeline events:', error);
    }
  }

  async function addTag() {
    if (!newTag.tagValue.trim()) {
      alert('Please enter a tag value');
      return;
    }

    try {
      const tagData = {
        evidence_id: evidenceId,
        tag_type: newTag.tagType,
        tag_value: newTag.tagValue.trim(),
        linked_causal_factor_id: newTag.linkedCausalFactor || null,
        linked_timeline_event_id: newTag.linkedTimelineEvent || null
      };

      const { error } = await supabase
        .from('evidence_tags')
        .insert([tagData]);

      if (error) throw error;

      setNewTag({
        tagType: 'type',
        tagValue: '',
        linkedCausalFactor: '',
        linkedTimelineEvent: ''
      });
      setShowAddTag(false);
      loadTags();
    } catch (error: any) {
      console.error('Error adding tag:', error);
      alert(`Error: ${error.message}`);
    }
  }

  async function deleteTag(tagId: string) {
    if (!confirm('Delete this tag?')) return;

    try {
      const { error } = await supabase
        .from('evidence_tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;
      loadTags();
    } catch (error) {
      console.error('Error deleting tag:', error);
      alert('Error deleting tag');
    }
  }

  const getTagColor = (type: string) => {
    switch (type) {
      case 'type':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'source':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'category':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const tagsByType = tags.reduce((acc, tag) => {
    if (!acc[tag.tag_type]) acc[tag.tag_type] = [];
    acc[tag.tag_type].push(tag);
    return acc;
  }, {} as Record<string, TagData[]>);

  if (loading) {
    return <div className="text-xs text-gray-500">Loading tags...</div>;
  }

  return (
    <div className="mt-3 pt-3 border-t">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-gray-600" />
          <h4 className="font-medium text-sm">Evidence Tags & Links</h4>
        </div>
        <button
          onClick={() => setShowAddTag(true)}
          className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          Add Tag
        </button>
      </div>

      {/* Display Tags Grouped by Type */}
      {tags.length > 0 ? (
        <div className="space-y-2">
          {Object.entries(tagsByType).map(([type, typeTags]) => (
            <div key={type}>
              <p className="text-xs font-semibold text-gray-700 mb-1">
                {tagTypes.find(t => t.value === type)?.label}:
              </p>
              <div className="flex flex-wrap gap-1">
                {typeTags.map(tag => (
                  <div
                    key={tag.id}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${getTagColor(tag.tag_type)}`}
                  >
                    <span>{tag.tag_value}</span>
                    {(tag.linked_causal_factor_id || tag.linked_timeline_event_id) && (
                      <LinkIcon className="w-3 h-3" />
                    )}
                    <button
                      onClick={() => deleteTag(tag.id)}
                      className="ml-1 hover:bg-black hover:bg-opacity-10 rounded p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Show Linked Items */}
          {tags.some(t => t.linked_causal_factor_id || t.linked_timeline_event_id) && (
            <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded">
              <p className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <LinkIcon className="w-3 h-3" />
                Linked To:
              </p>
              <div className="space-y-1 text-xs text-gray-600">
                {tags.filter(t => t.linked_causal_factor_id).map(tag => {
                  const factor = causalFactors.find(f => f.id === tag.linked_causal_factor_id);
                  return factor ? (
                    <div key={tag.id} className="flex items-center gap-1">
                      <span className="text-purple-600">→</span>
                      <span>Causal Factor: {factor.causal_factor_title}</span>
                    </div>
                  ) : null;
                })}
                {tags.filter(t => t.linked_timeline_event_id).map(tag => {
                  const event = timelineEvents.find(e => e.id === tag.linked_timeline_event_id);
                  return event ? (
                    <div key={tag.id} className="flex items-center gap-1">
                      <span className="text-blue-600">→</span>
                      <span>Timeline: {event.title} ({event.event_date} {event.event_time})</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-500 italic">No tags yet - click Add Tag to organize this evidence</p>
      )}

      {/* Add Tag Modal */}
      {showAddTag && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Add Evidence Tag</h3>
              <button
                onClick={() => {
                  setShowAddTag(false);
                  setNewTag({
                    tagType: 'type',
                    tagValue: '',
                    linkedCausalFactor: '',
                    linkedTimelineEvent: ''
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tag Type *</label>
                <select
                  value={newTag.tagType}
                  onChange={(e) => {
                    setNewTag({...newTag, tagType: e.target.value, tagValue: ''});
                  }}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  {tagTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label} - {type.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tag Value *</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newTag.tagValue}
                    onChange={(e) => setNewTag({...newTag, tagValue: e.target.value})}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="Enter custom tag or select from common tags below..."
                  />
                  
                  {/* Common Tags Buttons */}
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Common tags:</p>
                    <div className="flex flex-wrap gap-1">
                      {commonTags[newTag.tagType as keyof typeof commonTags]?.map(tag => (
                        <button
                          key={tag}
                          onClick={() => setNewTag({...newTag, tagValue: tag})}
                          className={`px-2 py-1 text-xs border rounded hover:bg-gray-50 ${
                            newTag.tagValue === tag ? 'bg-blue-100 border-blue-300' : 'bg-white'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Optional: Link to Investigation Elements</p>
                
                <div>
                  <label className="block text-sm mb-1">Link to Causal Factor</label>
                  <select
                    value={newTag.linkedCausalFactor}
                    onChange={(e) => setNewTag({...newTag, linkedCausalFactor: e.target.value})}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    <option value="">None</option>
                    {causalFactors.map(factor => (
                      <option key={factor.id} value={factor.id}>
                        {factor.causal_factor_title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-2">
                  <label className="block text-sm mb-1">Link to Timeline Event</label>
                  <select
                    value={newTag.linkedTimelineEvent}
                    onChange={(e) => setNewTag({...newTag, linkedTimelineEvent: e.target.value})}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    <option value="">None</option>
                    {timelineEvents.map(event => (
                      <option key={event.id} value={event.id}>
                        {event.event_date} {event.event_time} - {event.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={addTag}
                disabled={!newTag.tagValue.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
              >
                Add Tag
              </button>
              <button
                onClick={() => {
                  setShowAddTag(false);
                  setNewTag({
                    tagType: 'type',
                    tagValue: '',
                    linkedCausalFactor: '',
                    linkedTimelineEvent: ''
                  });
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
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
