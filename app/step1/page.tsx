'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, MapPin, Users, ClipboardList, AlertTriangle, Save, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import StepNavigation from '@/components/StepNavigation';

export default function InvestigationOverview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const investigationId = searchParams.get('investigationId');
  
  // Check if we're creating new or editing existing
  const isNewInvestigation = !investigationId;

  const [investigation, setInvestigation] = useState<any>(null);
  const [loading, setLoading] = useState(!isNewInvestigation);
  const [formData, setFormData] = useState({
    incidentDate: '',
    incidentTime: '',
    locationFacility: '',
    locationUnit: '',
    locationArea: '',
    incidentType: 'Actual Incident',
    consequenceCategory: '',
    potentialSeverity: '',
    actualSeverity: '',
    highPotential: false,
    incidentDescription: '',
    immediateActions: '',
    investigationLeader: '',
    targetCompletionDate: ''
  });

  const [submitting, setSubmitting] = useState(false);

  const incidentTypes = [
    'Actual Incident',
    'Near Miss'
  ];

  // Auto-save function for navigation
  const handleAutoSave = async (): Promise<boolean> => {
    // Check if there's any data to save
    if (!formData.incidentDate || !formData.locationFacility || !formData.incidentDescription) {
      // If required fields are missing, don't save, just allow navigation
      return true;
    }

    // If this is a new investigation and no ID yet, don't auto-save
    if (isNewInvestigation) {
      return true;
    }

    try {
      const investigationData = {
        incident_date: formData.incidentDate,
        incident_time: formData.incidentTime || null,
        location_facility: formData.locationFacility,
        location_unit: formData.locationUnit || null,
        location_area: formData.locationArea || null,
        incident_type: formData.incidentType,
        high_potential: formData.highPotential,
        consequence_category: formData.consequenceCategory || null,
        potential_severity: formData.potentialSeverity || null,
        actual_severity: formData.actualSeverity || null,
        incident_description: formData.incidentDescription,
        immediate_actions_taken: formData.immediateActions || null,
        investigation_leader: formData.investigationLeader || null,
        target_completion_date: formData.targetCompletionDate || null,
        status: 'initiated'
      };

      const { error } = await supabase
        .from('investigations')
        .update(investigationData)
        .eq('id', investigationId);

      if (error) {
        console.error('Auto-save error:', error);
        // Don't block navigation on auto-save failure
      }

      return true; // Always allow navigation
    } catch (error) {
      console.error('Auto-save error:', error);
      return true; // Always allow navigation even if save fails
    }
  };

  const consequenceCategories = [
    'Fatality',
    'Lost Time Injury',
    'Restricted Work Injury',
    'Medical Treatment Case',
    'First Aid Only',
    'Property Damage',
    'Environmental Release',
    'No Harm'
  ];

  const severityLevels = [
    { value: '1', label: '1 - Minor' },
    { value: '2', label: '2 - Significant' },
    { value: '3', label: '3 - Serious' },
    { value: '4', label: '4 - Major' },
    { value: '5', label: '5 - Catastrophic' }
  ];

  useEffect(() => {
    if (investigationId) {
      loadInvestigation();
    }
  }, [investigationId]);

  const loadInvestigation = async () => {
    try {
      const { data, error } = await supabase
        .from('investigations')
        .select('*')
        .eq('id', investigationId)
        .single();

      if (error) {
        console.error('Error loading investigation:', error);
        return;
      }

      setInvestigation(data);
      
      // Populate form with existing data
      setFormData({
        incidentDate: data.incident_date || '',
        incidentTime: data.incident_time || '',
        locationFacility: data.location_facility || '',
        locationUnit: data.location_unit || '',
        locationArea: data.location_area || '',
        incidentType: data.incident_type || 'Actual Incident',
        consequenceCategory: data.consequence_category || '',
        potentialSeverity: data.potential_severity || '',
        actualSeverity: data.actual_severity || '',
        highPotential: data.high_potential || false,
        incidentDescription: data.incident_description || '',
        immediateActions: data.immediate_actions_taken || '',
        investigationLeader: data.investigation_leader || '',
        targetCompletionDate: data.target_completion_date || ''
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInvestigationNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}-${random}`;
  };

  const handleSave = async () => {
    if (!formData.incidentDate || !formData.locationFacility || !formData.incidentDescription) {
      alert('Please fill in required fields: Date, Location, and Description');
      return;
    }

    setSubmitting(true);

    try {
      const investigationData = {
        incident_date: formData.incidentDate,
        incident_time: formData.incidentTime || null,
        location_facility: formData.locationFacility,
        location_unit: formData.locationUnit || null,
        location_area: formData.locationArea || null,
        incident_type: formData.incidentType,
        consequence_category: formData.consequenceCategory || null,
        potential_severity: formData.potentialSeverity || null,
        actual_severity: formData.actualSeverity || null,
        high_potential: formData.highPotential,
        incident_description: formData.incidentDescription,
        immediate_actions_taken: formData.immediateActions || null,
        investigation_leader: formData.investigationLeader || null,
        target_completion_date: formData.targetCompletionDate || null,
        status: 'initiated'
      };

      if (isNewInvestigation) {
        // Create new investigation
        const investigationNumber = generateInvestigationNumber();
        
        const { data, error } = await supabase
          .from('investigations')
          .insert([{
            ...investigationData,
            investigation_number: investigationNumber
          }])
          .select()
          .single();

        if (error) {
          console.error('Error creating investigation:', error);
          alert('Error creating investigation: ' + (error.message || JSON.stringify(error)));
          return;
        }

        alert('Investigation created successfully!');
        // Redirect to Step 2 with the new investigation ID
        router.push(`/step2?investigationId=${data.id}`);
      } else {
        // Update existing investigation
        const { error } = await supabase
          .from('investigations')
          .update(investigationData)
          .eq('id', investigationId);

        if (error) {
          console.error('Error updating investigation:', error);
          alert('Error updating investigation');
          return;
        }

        alert('Investigation updated successfully!');
        // Reload the investigation data
        loadInvestigation();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving investigation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading investigation...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!isNewInvestigation && investigation && (
        <StepNavigation 
          investigationId={investigationId!} 
          currentStep={1}
          investigationNumber={investigation.investigation_number}
          onBeforeNavigate={handleAutoSave}
        />
      )}
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {isNewInvestigation ? 'New Investigation' : 'Investigation Overview'}
            </h1>
            <p className="text-slate-600">
              {isNewInvestigation 
                ? 'Create a new incident investigation' 
                : 'View and update investigation details'}
            </p>
            {investigation && (
              <div className="mt-3 text-sm">
                <span className="font-medium text-slate-700">{investigation.investigation_number}</span>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="space-y-6">
              {/* Incident Details Section */}
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Incident Details
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Incident Date *
                    </label>
                    <input
                      type="date"
                      value={formData.incidentDate}
                      onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Incident Time
                    </label>
                    <input
                      type="time"
                      value={formData.incidentTime}
                      onChange={(e) => setFormData({ ...formData, incidentTime: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2"
                    />
                  </div>
                </div>
              </div>

              {/* Location Section */}
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  Location
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Facility *
                    </label>
                    <input
                      type="text"
                      value={formData.locationFacility}
                      onChange={(e) => setFormData({ ...formData, locationFacility: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2"
                      placeholder="e.g., Refinery Unit 3"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Unit/Area
                    </label>
                    <input
                      type="text"
                      value={formData.locationUnit}
                      onChange={(e) => setFormData({ ...formData, locationUnit: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2"
                      placeholder="e.g., Distillation"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Specific Location
                    </label>
                    <input
                      type="text"
                      value={formData.locationArea}
                      onChange={(e) => setFormData({ ...formData, locationArea: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2"
                      placeholder="e.g., Near Tank 101"
                    />
                  </div>
                </div>
              </div>

              {/* Classification Section */}
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-purple-500" />
                  Classification
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Incident Type
                    </label>
                    <select
                      value={formData.incidentType}
                      onChange={(e) => setFormData({ ...formData, incidentType: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2"
                    >
                      {incidentTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Consequence Category
                    </label>
                    <select
                      value={formData.consequenceCategory}
                      onChange={(e) => setFormData({ ...formData, consequenceCategory: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2"
                    >
                      <option value="">Select...</option>
                      {consequenceCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Potential Severity (IOGP)
                    </label>
                    <select
                      value={formData.potentialSeverity}
                      onChange={(e) => setFormData({ ...formData, potentialSeverity: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2"
                    >
                      <option value="">Select...</option>
                      {severityLevels.map(level => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Actual Severity (IOGP)
                    </label>
                    <select
                      value={formData.actualSeverity}
                      onChange={(e) => setFormData({ ...formData, actualSeverity: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2"
                    >
                      <option value="">Select...</option>
                      {severityLevels.map(level => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <input
                        type="checkbox"
                        id="highPotential"
                        checked={formData.highPotential}
                        onChange={(e) => setFormData({ ...formData, highPotential: e.target.checked })}
                        className="w-5 h-5 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                      />
                      <label htmlFor="highPotential" className="text-sm font-medium text-amber-900 cursor-pointer">
                        <span className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          High Potential Incident - An event that had the potential to cause a fatality or permanent disabling injury
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Incident Description *
                </label>
                <textarea
                  value={formData.incidentDescription}
                  onChange={(e) => setFormData({ ...formData, incidentDescription: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  rows={4}
                  placeholder="Briefly describe what happened..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Immediate Actions Taken
                </label>
                <textarea
                  value={formData.immediateActions}
                  onChange={(e) => setFormData({ ...formData, immediateActions: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  rows={3}
                  placeholder="Describe immediate response actions..."
                />
              </div>

              {/* Investigation Team Section */}
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-500" />
                  Investigation Team
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Investigation Leader
                    </label>
                    <input
                      type="text"
                      value={formData.investigationLeader}
                      onChange={(e) => setFormData({ ...formData, investigationLeader: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2"
                      placeholder="Name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Target Completion Date
                    </label>
                    <input
                      type="date"
                      value={formData.targetCompletionDate}
                      onChange={(e) => setFormData({ ...formData, targetCompletionDate: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-slate-200">
              <button
                onClick={handleSave}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-5 h-5" />
                {submitting ? 'Saving...' : isNewInvestigation ? 'Create Investigation' : 'Save Changes'}
              </button>
              
              {!isNewInvestigation && (
                <button
                  onClick={() => router.push(`/step2?investigationId=${investigationId}`)}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Continue to Evidence
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
              
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
