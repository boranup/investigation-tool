'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Users, ClipboardList, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function InvestigationInitiationForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    incidentDate: '',
    incidentTime: '',
    locationFacility: '',
    locationUnit: '',
    locationArea: '',
    incidentType: '',
    consequenceCategory: '',
    potentialSeverity: '',
    actualSeverity: '',
    incidentDescription: '',
    immediateActions: '',
    investigationLeader: '',
    teamMembers: [],
    targetCompletionDate: ''
  });

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const incidentTypes = [
    'Actual Incident',
    'Near Miss',
    'High Potential Near Miss'
  ];

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

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.incidentDate || !formData.locationFacility || !formData.incidentDescription || !formData.incidentType) {
      alert('Please fill in all required fields (marked with *)');
      return;
    }

    setSubmitting(true);
    
    try {
      // Generate investigation number
      const year = new Date().getFullYear();
      const { count } = await supabase
        .from('investigations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${year}-01-01`);
      
      const invNumber = `INV-${year}-${String((count || 0) + 1).padStart(3, '0')}`;

      // Insert investigation
      const { data, error } = await supabase
        .from('investigations')
        .insert([{
          investigation_number: invNumber,
          incident_date: formData.incidentDate,
          incident_time: formData.incidentTime || null,
          location_facility: formData.locationFacility,
          location_unit: formData.locationUnit || null,
          location_area: formData.locationArea || null,
          incident_type: formData.incidentType,
          consequence_category: formData.consequenceCategory || null,
          potential_severity: formData.potentialSeverity || null,
          actual_severity: formData.actualSeverity || null,
          incident_description: formData.incidentDescription,
          immediate_actions_taken: formData.immediateActions || null,
          target_completion_date: formData.targetCompletionDate || null,
          status: 'initiated'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating investigation:', error);
        alert('Error creating investigation: ' + error.message);
        return;
      }

      alert(`Investigation ${invNumber} created successfully!`);
      // Navigate to step 2 (evidence collection) for this investigation
      router.push(`/step2?investigationId=${data.id}`);
      
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Investigation Initiation</h1>
            <p className="text-slate-600 mt-2">Begin a new incident investigation</p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
                Incident Details
              </span>
              <span className={`text-sm font-medium ${step >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>
                Classification
              </span>
              <span className={`text-sm font-medium ${step >= 3 ? 'text-blue-600' : 'text-slate-400'}`}>
                Investigation Setup
              </span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* Step 1: Incident Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Incident Date *
                  </label>
                  <input
                    type="date"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.incidentDate}
                    onChange={(e) => handleChange('incidentDate', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Incident Time
                  </label>
                  <input
                    type="time"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.incidentTime}
                    onChange={(e) => handleChange('incidentTime', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Facility/Location *
                </label>
                <input
                  type="text"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Offshore Platform Alpha, Refinery Unit 3"
                  value={formData.locationFacility}
                  onChange={(e) => handleChange('locationFacility', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Unit/Area
                  </label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Compressor Station, Processing Unit"
                    value={formData.locationUnit}
                    onChange={(e) => handleChange('locationUnit', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Specific Area
                  </label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Control Room, Pump Room"
                    value={formData.locationArea}
                    onChange={(e) => handleChange('locationArea', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <ClipboardList className="w-4 h-4 inline mr-1" />
                  Incident Description *
                </label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Provide a brief description of what happened..."
                  value={formData.incidentDescription}
                  onChange={(e) => handleChange('incidentDescription', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Immediate Actions Taken
                </label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="What immediate actions were taken to secure the scene, provide aid, prevent escalation, etc.?"
                  value={formData.immediateActions}
                  onChange={(e) => handleChange('immediateActions', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 2: Classification */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  Incident Type *
                </label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.incidentType}
                  onChange={(e) => handleChange('incidentType', e.target.value)}
                  required
                >
                  <option value="">Select incident type...</option>
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
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.consequenceCategory}
                  onChange={(e) => handleChange('consequenceCategory', e.target.value)}
                >
                  <option value="">Select consequence...</option>
                  {consequenceCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Potential Severity (IOGP Scale)
                  </label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.potentialSeverity}
                    onChange={(e) => handleChange('potentialSeverity', e.target.value)}
                  >
                    <option value="">Select potential severity...</option>
                    {severityLevels.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">What could have happened?</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Actual Severity (IOGP Scale)
                  </label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.actualSeverity}
                    onChange={(e) => handleChange('actualSeverity', e.target.value)}
                  >
                    <option value="">Select actual severity...</option>
                    {severityLevels.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">What actually happened?</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Investigation Setup */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Investigation Leader
                </label>
                <input
                  type="text"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Name of investigation leader"
                  value={formData.investigationLeader}
                  onChange={(e) => handleChange('investigationLeader', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Target Completion Date
                </label>
                <input
                  type="date"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.targetCompletionDate}
                  onChange={(e) => handleChange('targetCompletionDate', e.target.value)}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Ready to Initiate Investigation</h3>
                <p className="text-sm text-blue-800">
                  Review your information and click "Initiate Investigation" to create the investigation record and proceed to evidence collection.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="px-6 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Creating...' : 'Initiate Investigation'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
