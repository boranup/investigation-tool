'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, CheckCircle } from 'lucide-react';

export default function HFATAssessment() {
  const router = useRouter();
  
  // Mock data - in real implementation, get from URL params and database
  const investigation = {
    id: 'inv-001',
    number: 'INV-2026-001',
    description: 'Pressure relief valve failure during startup'
  };

  const causalFactor = {
    id: 'cf-001',
    title: 'Relief valve PSV-101 failed to lift at set pressure',
    description: 'Valve did not open at design set pressure of 150 psig'
  };

  const [formData, setFormData] = useState({
    // Equipment Details
    equipmentName: 'PSV-101',
    equipmentType: 'Pressure Relief Valve',
    manufacturer: '',
    modelNumber: '',
    serviceLife: '',
    
    // Failure Description
    failureMode: '',
    failureEffect: '',
    failureCause: '',
    
    // Barrier Analysis
    designBarriers: '',
    proceduralBarriers: '',
    maintenanceBarriers: '',
    
    // Root Cause
    immediateRootCause: '',
    underlyingCauses: '',
    organizationalFactors: '',
    
    // Recommendations
    recommendations: '',
    
    // Assessment Status
    assessmentStatus: 'in_progress'
  });

  const [currentSection, setCurrentSection] = useState(1);

  const handleSave = () => {
    console.log('Saving HFAT Assessment:', formData);
    alert('HFAT Assessment saved successfully!');
  };

  const handleComplete = () => {
    const updated = { ...formData, assessmentStatus: 'complete' };
    console.log('Completing HFAT Assessment:', updated);
    alert('HFAT Assessment completed! Returning to causal analysis...');
    router.push('/step4');
  };

  const sections = [
    { id: 1, name: 'Equipment Details', icon: '🔧' },
    { id: 2, name: 'Failure Analysis', icon: '⚠️' },
    { id: 3, name: 'Barrier Analysis', icon: '🛡️' },
    { id: 4, name: 'Root Cause', icon: '🎯' },
    { id: 5, name: 'Recommendations', icon: '💡' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <button
            onClick={() => router.push('/step4')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Causal Analysis
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">
                HFAT Assessment
              </h1>
              <p className="text-sm text-slate-600">
                Hardware Failure Analysis Tool
              </p>
              <div className="mt-2 text-sm">
                <span className="text-slate-500">Investigation:</span>{' '}
                <span className="font-medium text-slate-700">{investigation.number}</span>
              </div>
              <div className="text-sm">
                <span className="text-slate-500">Causal Factor:</span>{' '}
                <span className="font-medium text-slate-700">{causalFactor.title}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Draft
              </button>
              <button
                onClick={handleComplete}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Complete Assessment
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {/* Section Navigation */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sticky top-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Sections</h3>
              <div className="space-y-2">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setCurrentSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      currentSection === section.id
                        ? 'bg-blue-100 text-blue-900 font-medium'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="mr-2">{section.icon}</span>
                    {section.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              
              {/* Section 1: Equipment Details */}
              {currentSection === 1 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Equipment Details</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Equipment Name/Tag *
                        </label>
                        <input
                          type="text"
                          value={formData.equipmentName}
                          onChange={(e) => setFormData({...formData, equipmentName: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Equipment Type *
                        </label>
                        <input
                          type="text"
                          value={formData.equipmentType}
                          onChange={(e) => setFormData({...formData, equipmentType: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Manufacturer
                        </label>
                        <input
                          type="text"
                          value={formData.manufacturer}
                          onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Model Number
                        </label>
                        <input
                          type="text"
                          value={formData.modelNumber}
                          onChange={(e) => setFormData({...formData, modelNumber: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Service Life / Operating Conditions
                      </label>
                      <textarea
                        value={formData.serviceLife}
                        onChange={(e) => setFormData({...formData, serviceLife: e.target.value})}
                        rows={3}
                        placeholder="Describe the service conditions, operating environment, age of equipment..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Section 2: Failure Analysis */}
              {currentSection === 2 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Failure Analysis</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Failure Mode *
                      </label>
                      <textarea
                        value={formData.failureMode}
                        onChange={(e) => setFormData({...formData, failureMode: e.target.value})}
                        rows={3}
                        placeholder="How did the equipment fail? (e.g., failed to operate, operated prematurely, degraded performance)"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Failure Effect *
                      </label>
                      <textarea
                        value={formData.failureEffect}
                        onChange={(e) => setFormData({...formData, failureEffect: e.target.value})}
                        rows={3}
                        placeholder="What was the consequence of this failure? What happened as a result?"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Failure Cause / Mechanism *
                      </label>
                      <textarea
                        value={formData.failureCause}
                        onChange={(e) => setFormData({...formData, failureCause: e.target.value})}
                        rows={4}
                        placeholder="Why did it fail? What was the physical/chemical/mechanical mechanism? (e.g., corrosion, fatigue, wear, design deficiency)"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-blue-900 mb-2">Guidance</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Be specific about the failure mechanism</li>
                        <li>• Reference any inspection findings or test results</li>
                        <li>• Consider environmental factors and operating conditions</li>
                        <li>• Note any design or material deficiencies</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 3: Barrier Analysis */}
              {currentSection === 3 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Barrier Analysis</h2>
                  <p className="text-sm text-slate-600 mb-4">
                    Identify what barriers existed and why they failed to prevent this failure
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Design Barriers
                      </label>
                      <textarea
                        value={formData.designBarriers}
                        onChange={(e) => setFormData({...formData, designBarriers: e.target.value})}
                        rows={3}
                        placeholder="What design features were intended to prevent this failure? Why did they fail? (e.g., safety factors, redundancy, fail-safe design)"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Procedural Barriers
                      </label>
                      <textarea
                        value={formData.proceduralBarriers}
                        onChange={(e) => setFormData({...formData, proceduralBarriers: e.target.value})}
                        rows={3}
                        placeholder="What procedures or operating limits should have prevented this? Why were they ineffective?"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Maintenance/Inspection Barriers
                      </label>
                      <textarea
                        value={formData.maintenanceBarriers}
                        onChange={(e) => setFormData({...formData, maintenanceBarriers: e.target.value})}
                        rows={3}
                        placeholder="What maintenance or inspection activities should have detected or prevented this? Why did they fail?"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Section 4: Root Cause */}
              {currentSection === 4 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Root Cause Analysis</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Immediate Root Cause *
                      </label>
                      <textarea
                        value={formData.immediateRootCause}
                        onChange={(e) => setFormData({...formData, immediateRootCause: e.target.value})}
                        rows={3}
                        placeholder="What was the direct technical cause of the failure?"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Underlying Causes
                      </label>
                      <textarea
                        value={formData.underlyingCauses}
                        onChange={(e) => setFormData({...formData, underlyingCauses: e.target.value})}
                        rows={3}
                        placeholder="Why did the immediate cause occur? (e.g., inadequate design specification, unsuitable materials, insufficient testing)"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Organizational Factors
                      </label>
                      <textarea
                        value={formData.organizationalFactors}
                        onChange={(e) => setFormData({...formData, organizationalFactors: e.target.value})}
                        rows={3}
                        placeholder="What organizational decisions or systems contributed? (e.g., maintenance philosophy, design standards, change management)"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Section 5: Recommendations */}
              {currentSection === 5 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Recommendations</h2>
                  <p className="text-sm text-slate-600 mb-4">
                    These will feed into the main investigation recommendations
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        HFAT Findings & Recommendations
                      </label>
                      <textarea
                        value={formData.recommendations}
                        onChange={(e) => setFormData({...formData, recommendations: e.target.value})}
                        rows={6}
                        placeholder="Based on this analysis, what actions should be taken? Consider: design changes, material upgrades, inspection frequency, operating limits, etc."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-green-900 mb-2">Assessment Summary</h4>
                      <div className="text-sm text-green-800 space-y-1">
                        <p><strong>Equipment:</strong> {formData.equipmentName}</p>
                        <p><strong>Failure Mode:</strong> {formData.failureMode || 'Not specified'}</p>
                        <p><strong>Status:</strong> {formData.assessmentStatus === 'complete' ? 'Complete' : 'In Progress'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
                <button
                  onClick={() => setCurrentSection(Math.max(1, currentSection - 1))}
                  disabled={currentSection === 1}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous Section
                </button>
                <button
                  onClick={() => setCurrentSection(Math.min(5, currentSection + 1))}
                  disabled={currentSection === 5}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next Section
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
