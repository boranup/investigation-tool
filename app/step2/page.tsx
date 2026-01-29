'use client'

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Upload, FileText, Camera, Video, Database, Users, Search, Filter, Tag, Calendar, MapPin, Trash2, Eye, Plus, Download, X, Edit2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import StepNavigation from '@/components/StepNavigation';

export default function EvidenceDataCollection() {
  const searchParams = useSearchParams();
  const investigationId = searchParams.get('investigationId');

  const [activeTab, setActiveTab] = useState('evidence');
  const [showAddEvidence, setShowAddEvidence] = useState(false);
  const [showAddInterview, setShowAddInterview] = useState(false);
  const [editingEvidenceId, setEditingEvidenceId] = useState<string | null>(null);
  const [editingInterviewId, setEditingInterviewId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [uploading, setUploading] = useState(false);

  const [investigation, setInvestigation] = useState<any>(null);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);

  const [newEvidence, setNewEvidence] = useState({
    type: 'photo',
    title: '',
    description: '',
    collectedDate: new Date().toISOString().split('T')[0],
    collectedBy: '',
    location: '',
    tags: '',
    file: null as File | null
  });

  const [newInterview, setNewInterview] = useState({
    interviewee: '',
    role: '',
    department: '',
    interviewer: '',
    interviewDate: new Date().toISOString().split('T')[0],
    interviewTime: '',
    type: 'witness',
    keyFindings: ''
  });

  useEffect(() => {
    if (investigationId) {
      loadInvestigation();
      loadEvidence();
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

  const loadEvidence = async () => {
    if (!investigationId) return;
    
    try {
      // Load evidence from database
      const { data: evidenceData, error: evidenceError } = await supabase
        .from('evidence')
        .select('*')
        .eq('investigation_id', investigationId)
        .order('collected_date', { ascending: false });

      if (evidenceError) {
        console.error('Error loading evidence:', evidenceError);
      } else {
        setEvidence(evidenceData || []);
      }

      // Load interviews from database
      const { data: interviewData, error: interviewError } = await supabase
        .from('interviews')
        .select('*')
        .eq('investigation_id', investigationId)
        .order('interview_date', { ascending: false });

      if (interviewError) {
        console.error('Error loading interviews:', interviewError);
      } else {
        setInterviews(interviewData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewEvidence({ ...newEvidence, file: e.target.files[0] });
    }
  };

  const uploadFileToSupabase = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${investigationId}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('investigation-evidence')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('investigation-evidence')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Upload exception:', error);
      return null;
    }
  };

  const handleAddEvidence = async () => {
    if (!newEvidence.title || !newEvidence.collectedDate) {
      alert('Please fill in required fields');
      return;
    }

    if (!investigationId) {
      alert('No investigation selected');
      return;
    }

    setUploading(true);
    let fileUrl = null;

    try {
      // Upload file if present
      if (newEvidence.file) {
        fileUrl = await uploadFileToSupabase(newEvidence.file);
        if (!fileUrl) {
          alert('File upload failed');
          setUploading(false);
          return;
        }
      }

      // Insert into database with CORRECTED column name
      const { data, error } = await supabase
        .from('evidence')
        .insert([{
          investigation_id: investigationId,
          evidence_type: newEvidence.type, // CORRECTED: was 'type'
          title: newEvidence.title,
          description: newEvidence.description,
          file_url: fileUrl,
          collected_date: newEvidence.collectedDate,
          collected_by: newEvidence.collectedBy || null,
          location: newEvidence.location || null,
          tags: newEvidence.tags ? newEvidence.tags.split(',').map(t => t.trim()).filter(t => t) : []
        }])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        alert('Error saving evidence to database');
        return;
      }

      // Add to local state
      setEvidence([data, ...evidence]);
      
      // Reset form
      setNewEvidence({
        type: 'photo',
        title: '',
        description: '',
        collectedDate: new Date().toISOString().split('T')[0],
        collectedBy: '',
        location: '',
        tags: '',
        file: null
      });
      
      setShowAddEvidence(false);
      alert('Evidence added successfully!');
    } catch (error) {
      console.error('Error adding evidence:', error);
      alert('Error adding evidence');
    } finally {
      setUploading(false);
    }
  };

  const handleAddInterview = async () => {
    if (!newInterview.interviewee || !newInterview.interviewDate) {
      alert('Please fill in required fields');
      return;
    }

    if (!investigationId) {
      alert('No investigation selected');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('interviews')
        .insert([{
          investigation_id: investigationId,
          interviewee: newInterview.interviewee,
          role: newInterview.role || null,
          department: newInterview.department || null,
          interviewer: newInterview.interviewer || null,
          interview_date: newInterview.interviewDate,
          interview_time: newInterview.interviewTime || null,
          interview_type: newInterview.type, // CORRECTED: was 'type'
          key_findings: newInterview.keyFindings || null,
          status: 'completed'
        }])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        alert('Error saving interview');
        return;
      }

      // Add to local state
      setInterviews([data, ...interviews]);
      
      // Reset form
      setNewInterview({
        interviewee: '',
        role: '',
        department: '',
        interviewer: '',
        interviewDate: new Date().toISOString().split('T')[0],
        interviewTime: '',
        type: 'witness',
        keyFindings: ''
      });
      
      setShowAddInterview(false);
      alert('Interview record added!');
    } catch (error) {
      console.error('Error adding interview:', error);
      alert('Error adding interview');
    }
  };

  const deleteEvidence = async (id: string) => {
    if (!confirm('Delete this evidence item?')) return;

    try {
      const { error } = await supabase
        .from('evidence')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting evidence:', error);
        alert('Error deleting evidence');
        return;
      }

      setEvidence(evidence.filter(e => e.id !== id));
      alert('Evidence deleted');
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting evidence');
    }
  };

  const deleteInterview = async (id: string) => {
    if (!confirm('Delete this interview record?')) return;

    try {
      const { error } = await supabase
        .from('interviews')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting interview:', error);
        alert('Error deleting interview');
        return;
      }

      setInterviews(interviews.filter(i => i.id !== id));
      alert('Interview deleted');
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting interview');
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      photo: Camera,
      video: Video,
      document: FileText,
      data: Database
    };
    const Icon = icons[type] || FileText;
    return <Icon className="w-5 h-5" />;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      photo: 'bg-purple-100 text-purple-700 border-purple-200',
      video: 'bg-blue-100 text-blue-700 border-blue-200',
      document: 'bg-green-100 text-green-700 border-green-200',
      data: 'bg-orange-100 text-orange-700 border-orange-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const filteredEvidence = evidence.filter(item => {
    const matchesType = filterType === 'all' || item.evidence_type === filterType;
    const matchesSearch = !searchTerm || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
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

  // CONTINUED IN PART 2...
  // CONTINUED FROM PART 1...

  return (
    <>
      {investigation && (
        <StepNavigation 
          investigationId={investigationId} 
          currentStep={2}
          investigationNumber={investigation.investigation_number}
        />
      )}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Step 2: Evidence & Data Collection</h1>
                <p className="text-slate-600 mt-1">Gather and organize investigation evidence</p>
                {investigation && (
                  <div className="mt-2 text-sm">
                    <span className="text-slate-500">Investigation:</span>{' '}
                    <span className="font-medium text-slate-700">{investigation.investigation_number}</span>
                    {' - '}
                  <span className="text-slate-600">{investigation.incident_description}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-6">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('evidence')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'evidence'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Physical Evidence ({evidence.length})
            </button>
            <button
              onClick={() => setActiveTab('interviews')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'interviews'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Interviews ({interviews.length})
            </button>
          </div>
        </div>

        {/* Evidence Tab */}
        {activeTab === 'evidence' && (
          <div>
            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search evidence..."
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-600" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="border border-slate-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="photo">Photos</option>
                    <option value="video">Videos</option>
                    <option value="document">Documents</option>
                    <option value="data">Data/Logs</option>
                  </select>
                </div>
                <button
                  onClick={() => setShowAddEvidence(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Evidence
                </button>
              </div>
            </div>

            {/* Evidence Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvidence.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`p-2 rounded-lg border ${getTypeColor(item.evidence_type)}`}>
                          {getTypeIcon(item.evidence_type)}
                        </span>
                        <div>
                          <h3 className="font-semibold text-slate-900">{item.title}</h3>
                          <span className="text-xs text-slate-500">{item.evidence_type}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {item.file_url && (
                          <button
                            onClick={() => window.open(item.file_url, '_blank')}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View file"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingEvidenceId(item.id);
                            setNewEvidence({
                              type: item.evidence_type,
                              title: item.title,
                              description: item.description,
                              collectedDate: item.collected_date,
                              collectedBy: item.collected_by || '',
                              location: item.location || '',
                              tags: item.tags ? item.tags.join(', ') : '',
                              file: null
                            });
                            setShowAddEvidence(true);
                          }}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteEvidence(item.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 mb-3">{item.description}</p>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {item.collected_date}
                      </div>
                      {item.collected_by && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Users className="w-3 h-3" />
                          {item.collected_by}
                        </div>
                      )}
                      {item.location && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <MapPin className="w-3 h-3" />
                          {item.location}
                        </div>
                      )}
                    </div>

                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {item.tags.map((tag: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredEvidence.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
                <Upload className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No Evidence Items Yet</h3>
                <p className="text-slate-600 mb-4">Start collecting evidence by adding photos, documents, or data files</p>
                <button
                  onClick={() => setShowAddEvidence(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add First Evidence Item
                </button>
              </div>
            )}
          </div>
        )}

        {/* Interviews Tab */}
        {activeTab === 'interviews' && (
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6 flex justify-between items-center">
              <p className="text-sm text-slate-600">
                {interviews.length} interview{interviews.length !== 1 ? 's' : ''} recorded
              </p>
              <button
                onClick={() => setShowAddInterview(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Interview
              </button>
            </div>

            <div className="space-y-4">
              {interviews.map((interview) => (
                <div key={interview.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-slate-900 mb-1">{interview.interviewee}</h3>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span>{interview.role}</span>
                        {interview.department && <span>• {interview.department}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        interview.status === 'completed' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {interview.status}
                      </span>
                      <button
                        onClick={() => {
                          setEditingInterviewId(interview.id);
                          setNewInterview({
                            interviewee: interview.interviewee,
                            role: interview.role || '',
                            department: interview.department || '',
                            interviewer: interview.interviewer || '',
                            interviewDate: interview.interview_date,
                            interviewTime: interview.interview_time || '',
                            type: interview.interview_type,
                            keyFindings: interview.key_findings || ''
                          });
                          setShowAddInterview(true);
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteInterview(interview.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {interview.key_findings && (
                    <div className="bg-slate-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-slate-700">
                        <strong>Key Findings:</strong> {interview.key_findings}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {interview.interview_date} {interview.interview_time && `at ${interview.interview_time}`}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Interviewer: {interview.interviewer}
                    </div>
                    <div>Type: {interview.interview_type}</div>
                  </div>
                </div>
              ))}
            </div>

            {interviews.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No Interviews Recorded</h3>
                <p className="text-slate-600 mb-4">Document witness and expert interviews to gather perspectives</p>
                <button
                  onClick={() => setShowAddInterview(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add First Interview
                </button>
              </div>
            )}
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
              window.location.href = `/step3?investigationId=${investigationId}`;
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Next: Timeline
          </button>
        </div>
      </div>

      {/* Add Evidence Modal */}
      {showAddEvidence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{editingEvidenceId ? 'Edit Evidence Item' : 'Add Evidence Item'}</h2>
              <button
                onClick={() => setShowAddEvidence(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Evidence Type *
                </label>
                <select
                  value={newEvidence.type}
                  onChange={(e) => setNewEvidence({ ...newEvidence, type: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                >
                  <option value="photo">Photo</option>
                  <option value="video">Video</option>
                  <option value="document">Document</option>
                  <option value="data">Data/Log File</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={newEvidence.title}
                  onChange={(e) => setNewEvidence({ ...newEvidence, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  placeholder="e.g., Failed valve close-up"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newEvidence.description}
                  onChange={(e) => setNewEvidence({ ...newEvidence, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  rows={3}
                  placeholder="Describe what this evidence shows..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Upload File
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer"
                  >
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-slate-500">
                      Photos, videos, documents, or data files
                    </p>
                  </label>
                  {newEvidence.file && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-900">{newEvidence.file.name}</span>
                      </div>
                      <button
                        onClick={() => setNewEvidence({ ...newEvidence, file: null })}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Collection Date *
                  </label>
                  <input
                    type="date"
                    value={newEvidence.collectedDate}
                    onChange={(e) => setNewEvidence({ ...newEvidence, collectedDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Collected By
                  </label>
                  <input
                    type="text"
                    value={newEvidence.collectedBy}
                    onChange={(e) => setNewEvidence({ ...newEvidence, collectedBy: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2"
                    placeholder="Name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={newEvidence.location}
                  onChange={(e) => setNewEvidence({ ...newEvidence, location: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  placeholder="e.g., Unit 3, Near PSV-101"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={newEvidence.tags}
                  onChange={(e) => setNewEvidence({ ...newEvidence, tags: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  placeholder="e.g., equipment, corrosion, valve"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddEvidence}
                disabled={uploading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? 'Uploading...' : editingEvidenceId ? 'Update Evidence' : 'Add Evidence'}
              </button>
              <button
                onClick={() => {
                  setShowAddEvidence(false);
                  setEditingEvidenceId(null);
                  setNewEvidence({
                    type: 'photo',
                    title: '',
                    description: '',
                    collectedDate: new Date().toISOString().split('T')[0],
                    collectedBy: '',
                    location: '',
                    tags: '',
                    file: null
                  });
                }}
                disabled={uploading}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Interview Modal */}
      {showAddInterview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{editingInterviewId ? 'Edit Interview Record' : 'Add Interview Record'}</h2>
              <button
                onClick={() => setShowAddInterview(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Interviewee Name *
                  </label>
                  <input
                    type="text"
                    value={newInterview.interviewee}
                    onChange={(e) => setNewInterview({ ...newInterview, interviewee: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Role/Position
                  </label>
                  <input
                    type="text"
                    value={newInterview.role}
                    onChange={(e) => setNewInterview({ ...newInterview, role: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={newInterview.department}
                  onChange={(e) => setNewInterview({ ...newInterview, department: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Interview Date *
                  </label>
                  <input
                    type="date"
                    value={newInterview.interviewDate}
                    onChange={(e) => setNewInterview({ ...newInterview, interviewDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={newInterview.interviewTime}
                    onChange={(e) => setNewInterview({ ...newInterview, interviewTime: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Type
                  </label>
                  <select
                    value={newInterview.type}
                    onChange={(e) => setNewInterview({ ...newInterview, type: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  >
                    <option value="witness">Witness</option>
                    <option value="expert">Expert/SME</option>
                    <option value="involved">Involved Party</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Interviewer
                </label>
                <input
                  type="text"
                  value={newInterview.interviewer}
                  onChange={(e) => setNewInterview({ ...newInterview, interviewer: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Key Findings/Summary
                </label>
                <textarea
                  value={newInterview.keyFindings}
                  onChange={(e) => setNewInterview({ ...newInterview, keyFindings: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  rows={4}
                  placeholder="Summarize the key points from this interview..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddInterview}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingInterviewId ? 'Update Interview' : 'Add Interview'}
              </button>
              <button
                onClick={() => {
                  setShowAddInterview(false);
                  setEditingInterviewId(null);
                  setNewInterview({
                    interviewee: '',
                    role: '',
                    department: '',
                    interviewer: '',
                    interviewDate: new Date().toISOString().split('T')[0],
                    interviewTime: '',
                    type: 'witness',
                    keyFindings: ''
                  });
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
