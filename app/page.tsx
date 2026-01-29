'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, Calendar, MapPin, AlertCircle, Clock, CheckCircle, FileText, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function InvestigationDashboard() {
  const router = useRouter();
  
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadInvestigations();
  }, []);

  const loadInvestigations = async () => {
    try {
      const { data, error } = await supabase
        .from('investigations')
        .select('*')
        .order('incident_date', { ascending: false });

      if (error) {
        console.error('Error loading investigations:', error);
      } else {
        setInvestigations(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statuses: Record<string, any> = {
      initiated: { label: 'Initiated', color: 'bg-slate-100 text-slate-700', icon: Clock },
      data_collection: { label: 'Data Collection', color: 'bg-blue-100 text-blue-700', icon: FileText },
      timeline_construction: { label: 'Timeline', color: 'bg-purple-100 text-purple-700', icon: Clock },
      causal_analysis: { label: 'Analysis', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
      recommendations: { label: 'Recommendations', color: 'bg-orange-100 text-orange-700', icon: FileText },
      completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle }
    };
    return statuses[status] || statuses.initiated;
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      '1': 'bg-green-100 text-green-700 border-green-200',
      '2': 'bg-blue-100 text-blue-700 border-blue-200',
      '3': 'bg-amber-100 text-amber-700 border-amber-200',
      '4': 'bg-orange-100 text-orange-700 border-orange-200',
      '5': 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[severity] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const filteredInvestigations = investigations.filter(inv => {
    const matchesSearch = !searchTerm || 
      inv.investigation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.incident_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.location_facility.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
    const matchesType = filterType === 'all' || inv.incident_type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading investigations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Investigation Tool</h1>
              <p className="text-slate-600 mt-1">Manage and track incident investigations</p>
            </div>
            <button
              onClick={() => router.push('/step1')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              New Investigation
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by number, description, or location..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="initiated">Initiated</option>
                <option value="data_collection">Data Collection</option>
                <option value="timeline_construction">Timeline</option>
                <option value="causal_analysis">Analysis</option>
                <option value="recommendations">Recommendations</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Types</option>
                <option value="Actual Incident">Actual Incident</option>
                <option value="Near Miss">Near Miss</option>
                <option value="High Potential Near Miss">High Potential</option>
              </select>
            </div>
          </div>
          <div className="mt-2 text-sm text-slate-600">
            Showing {filteredInvestigations.length} of {investigations.length} investigations
          </div>
        </div>

        {/* Investigations Grid */}
        {filteredInvestigations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {investigations.length === 0 ? 'No Investigations Yet' : 'No Matching Investigations'}
            </h3>
            <p className="text-slate-600 mb-6">
              {investigations.length === 0 
                ? 'Start by creating your first investigation'
                : 'Try adjusting your search or filters'}
            </p>
            {investigations.length === 0 && (
              <button
                onClick={() => router.push('/step1')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create First Investigation
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInvestigations.map((investigation) => {
              const statusInfo = getStatusInfo(investigation.status);
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={investigation.id}
                  onClick={() => router.push(`/step1?investigationId=${investigation.id}`)}
                  className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-6">
                    {/* Left: Investigation Number and Status */}
                    <div className="flex-shrink-0 w-40">
                      <div className="text-sm font-mono font-bold text-blue-600 mb-2">
                        {investigation.investigation_number}
                      </div>
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </div>
                    </div>

                    {/* Middle: Description and Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 mb-2 line-clamp-1">
                        {investigation.incident_description}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>{investigation.incident_date}</span>
                          {investigation.incident_time && (
                            <span className="text-slate-400">• {investigation.incident_time}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="truncate max-w-xs">{investigation.location_facility}</span>
                        </div>
                        {investigation.incident_type && (
                          <div className="flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-slate-400" />
                            <span>{investigation.incident_type}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Severity and Arrow */}
                    <div className="flex items-center gap-4">
                      {investigation.actual_severity && (
                        <div className="text-right">
                          <div className="text-xs text-slate-500 mb-1">Severity</div>
                          <span className={`inline-block px-3 py-1 rounded text-xs font-semibold border ${getSeverityColor(investigation.actual_severity)}`}>
                            Level {investigation.actual_severity}
                          </span>
                        </div>
                      )}
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
