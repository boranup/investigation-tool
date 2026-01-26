'use client'

import React, { useState } from 'react';
import { Calendar, MapPin, Users, ClipboardList, AlertTriangle } from 'lucide-react';

export default function InvestigationInitiationForm() {
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
    investigationMethod: '',
    investigationLeader: '',
    teamMembers: [],
    targetCompletionDate: ''
  });

  const [step, setStep] = useState(1);

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

  const investigationMethods = [
    'ICAM (Incident Cause Analysis Method)',
    'TapRooT',
    '5-Whys',
    'Bow-Tie Analysis',
    'AcciMap',
    'Custom/Hybrid'
  ];

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.incidentDate || !formData.locationFacility || !formData.incidentDescription || !formData.incidentType || !formData.investigationLeader) {
      alert('Please fill in all required fields (marked with *)');
      return;
    }
    console.log('Investigation Initiated:', formData);
    // Here you would submit to Supabase
    alert('Investigation initiated successfully!\nInvestigation Number: INV-2026-001');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClipboardList className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Investigation Initiation
              </h1>
              <p className="text-sm text-slate-600">
                Step 1: Initial Response & Incident Details
              </p>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
                1
              </div>
              <span className="text-sm font-medium">Incident Details</span>
            </div>
            <div className="h-px bg-slate-200 flex-1 mx-4"></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
                2
              </div>
              <span className="text-sm font-medium">Classification</span>
            </div>
            <div className="h-px bg-slate-200 flex-1 mx-4"></div>
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
                3
              </div>
              <span className="text-sm font-medium">Investigation Setup</span>
            </div>
          </div>
        </div>

        {/* Step 1: Incident Details */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">
                Incident Details
              </h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Incident Date *
                  </label>
                  <input
                    type="date"
                    value={formData.incidentDate}
                    onChange={(e) => handleChange('incidentDate', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Incident Time
                  </label>
                  <input
                    type="time"
                    value={formData.incidentTime}
                    onChange={(e) => handleChange('incidentTime', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Facility *
                </label>
                <input
                  type="text"
                  value={formData.locationFacility}
                  onChange={(e) => handleChange('locationFacility', e.target.value)}
                  placeholder="e.g., Offshore Platform Alpha, Refinery B"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Unit/Process Area
                  </label>
                  <input
                    type="text"
                    value={formData.locationUnit}
                    onChange={(e) => handleChange('locationUnit', e.target.value)}
                    placeholder="e.g., Crude Unit, Compression Train 1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Specific Area
                  </label>
                  <input
                    type="text"
                    value={formData.locationArea}
                    onChange={(e) => handleChange('locationArea', e.target.value)}
                    placeholder="e.g., Pump Room, Control Room"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Brief Description of Incident *
                </label>
                <textarea
                  value={formData.incidentDescription}
                  onChange={(e) => handleChange('incidentDescription', e.target.value)}
                  rows={4}
                  placeholder="Provide a brief factual description of what happened..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Immediate Actions Taken
                </label>
                <textarea
                  value={formData.immediateActions}
                  onChange={(e) => handleChange('immediateActions', e.target.value)}
                  rows={3}
                  placeholder="Describe immediate response actions, scene preservation, emergency response..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next: Classification
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Classification */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">
                Incident Classification (IOGP)
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Incident Type *
                </label>
                <select
                  value={formData.incidentType}
                  onChange={(e) => handleChange('incidentType', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select incident type...</option>
                  {incidentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Actual Consequence Category
                </label>
                <select
                  value={formData.consequenceCategory}
                  onChange={(e) => handleChange('consequenceCategory', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select consequence...</option>
                  {consequenceCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Actual Severity (IOGP 1-5)
                  </label>
                  <select
                    value={formData.actualSeverity}
                    onChange={(e) => handleChange('actualSeverity', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select severity...</option>
                    {severityLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Potential Severity (IOGP 1-5)
                  </label>
                  <select
                    value={formData.potentialSeverity}
                    onChange={(e) => handleChange('potentialSeverity', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select severity...</option>
                    {severityLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    What could have happened in credible worst case?
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next: Investigation Setup
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Investigation Setup */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">
                Investigation Team & Methodology
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Investigation Methodology
                </label>
                <select
                  value={formData.investigationMethod}
                  onChange={(e) => handleChange('investigationMethod', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select methodology...</option>
                  {investigationMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  This can be changed later as investigation progresses
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Investigation Leader *
                </label>
                <input
                  type="text"
                  value={formData.investigationLeader}
                  onChange={(e) => handleChange('investigationLeader', e.target.value)}
                  placeholder="Enter name or select from team"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Target Completion Date
                </label>
                <input
                  type="date"
                  value={formData.targetCompletionDate}
                  onChange={(e) => handleChange('targetCompletionDate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  IOGP recommends 30-90 days depending on complexity
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Note: Team Member Management
                </h3>
                <p className="text-sm text-blue-800">
                  Additional team members can be added after initiation through the 
                  investigation dashboard. This allows flexibility as the investigation 
                  progresses and specialist expertise is identified.
                </p>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                Initiate Investigation
              </button>
            </div>
          </div>
        )}

        {/* Information Box */}
        <div className="bg-slate-100 border border-slate-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">
            What happens next?
          </h3>
          <ul className="text-sm text-slate-700 space-y-1">
            <li>• Investigation workspace will be created with unique investigation number</li>
            <li>• Investigation team will have access to data collection tools</li>
            <li>• Timeline builder and evidence management will be activated</li>
            <li>• Progress will be tracked through the investigation workflow stages</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
