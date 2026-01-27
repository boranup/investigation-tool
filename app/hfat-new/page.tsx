'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, CheckCircle, ChevronDown, ChevronRight, Users, Brain, Building2, GraduationCap, MessageSquare, MapPin, AlertTriangle, Target, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function HFATAssessment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const investigationId = searchParams.get('investigationId');
  const causalFactorId = searchParams.get('causalFactorId');
  const assessmentId = searchParams.get('assessmentId');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [investigation, setInvestigation] = useState<any>(null);
  const [causalFactor, setCausalFactor] = useState<any>(null);

  const humanFactorsCategories = {
    individual: {
      icon: Users,
      color: 'blue',
      label: 'Individual Factors (IOGP 621: 4.2.1)',
      items: [
        { 
          id: 'fatigue', 
          label: 'Fatigue / Alertness', 
          reference: 'IOGP 4.2.1.1 | Human Performance',
          tooltip: 'Was the person adequately rested? Consider shift patterns, work hours, and alertness levels.'
        },
        { 
          id: 'competency', 
          label: 'Competency / Training', 
          reference: 'IOGP 4.2.1.2 | Human Performance',
          tooltip: 'Did the person have adequate training and competency for the task?'
        },
        { 
          id: 'awareness', 
          label: 'Situational Awareness', 
          reference: 'IOGP 4.2.1.3 | Human Performance',
          tooltip: 'Did the person have adequate awareness of the situation and hazards?'
        },
        { 
          id: 'stress', 
          label: 'Stress / Workload', 
          reference: 'IOGP 4.2.1.4 | Human Performance',
          tooltip: 'Was there excessive workload or stress affecting performance?'
        },
        { 
          id: 'health', 
          label: 'Physical/Mental Health', 
          reference: 'IOGP 4.2.1.5 | Human Performance',
          tooltip: 'Were there health factors affecting capability?'
        }
      ]
    },
    task: {
      icon: Target,
      color: 'green',
      label: 'Task/Work Factors (IOGP 621: 4.2.2)',
      items: [
        { 
          id: 'task_design', 
          label: 'Task Design / Complexity', 
          reference: 'IOGP 4.2.2.1 | Human Performance',
          tooltip: 'Was the task appropriately designed? Was complexity manageable?'
        },
        { 
          id: 'procedures', 
          label: 'Procedures / Work Instructions', 
          reference: 'IOGP 4.2.2.2 | Human Performance',
          tooltip: 'Were procedures available, accurate, and usable?'
        },
        { 
          id: 'tools', 
          label: 'Tools / Equipment', 
          reference: 'IOGP 4.2.2.3 | Human Performance',
          tooltip: 'Were appropriate tools and equipment available and functioning?'
        },
        { 
          id: 'environment', 
          label: 'Work Environment', 
          reference: 'IOGP 4.2.2.4 | Human Performance',
          tooltip: 'Were environmental conditions (noise, lighting, weather) adequate?'
        }
      ]
    },
    team: {
      icon: MessageSquare,
      color: 'purple',
      label: 'Team/Communication (IOGP 621: 4.2.3)',
      items: [
        { 
          id: 'communication', 
          label: 'Communication', 
          reference: 'IOGP 4.2.3.1 | Human Performance',
          tooltip: 'Was communication clear and effective?'
        },
        { 
          id: 'teamwork', 
          label: 'Teamwork / Coordination', 
          reference: 'IOGP 4.2.3.2 | Human Performance',
          tooltip: 'Did the team work together effectively?'
        },
        { 
          id: 'supervision', 
          label: 'Supervision / Leadership', 
          reference: 'IOGP 4.2.3.3 | Human Performance',
          tooltip: 'Was supervision adequate and supportive?'
        }
      ]
    },
    organizational: {
      icon: Building2,
      color: 'orange',
      label: 'Organizational Factors (IOGP 621: 4.2.4)',
      items: [
        { 
          id: 'culture', 
          label: 'Safety Culture', 
          reference: 'IOGP 4.2.4.1 | Human Performance',
          tooltip: 'Did organizational culture support safe operations?'
        },
        { 
          id: 'resources', 
          label: 'Resources / Staffing', 
          reference: 'IOGP 4.2.4.2 | Human Performance',
          tooltip: 'Were adequate resources and staffing provided?'
        },
        { 
          id: 'planning', 
          label: 'Work Planning / Scheduling', 
          reference: 'IOGP 4.2.4.3 | Human Performance',
          tooltip: 'Was work adequately planned and scheduled?'
        },
        { 
          id: 'policies', 
          label: 'Policies / Standards', 
          reference: 'IOGP 4.2.4.4 | Human Performance',
          tooltip: 'Were policies and standards clear and appropriate?'
        }
      ]
    }
  };

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    individual: true,
    task: false,
    team: false,
    organizational: false
  });

  useEffect(() => {
    loadData();
  }, [investigationId, causalFactorId, assessmentId]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (investigationId) {
        const { data: invData } = await supabase
          .from('investigations')
          .select('*')
          .eq('id', investigationId)
          .single();
        setInvestigation(invData);
      }

      if (causalFactorId) {
        const { data: cfData } = await supabase
          .from('causal_factors')
          .select('*')
          .eq('id', causalFactorId)
          .single();
        setCausalFactor(cfData);
      }

      if (assessmentId) {
        const { data: assessmentData } = await supabase
          .from('hfat_assessments')
          .select('*')
          .eq('id', assessmentId)
          .single();
        
        if (assessmentData && assessmentData.ratings) {
          setRatings(assessmentData.ratings);
          setNotes(assessmentData.notes || {});
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  const updateRating = (categoryKey: string, itemId: string, rating: number) => {
    const key = `${categoryKey}_${itemId}`;
    setRatings(prev => ({ ...prev, [key]: rating }));
  };

  const updateNotes = (categoryKey: string, itemId: string, note: string) => {
    const key = `${categoryKey}_${itemId}`;
    setNotes(prev => ({ ...prev, [key]: note }));
  };

  const getRatingColor = (rating: number) => {
    if (rating === 0) return 'bg-slate-100';
    if (rating <= 2) return 'bg-green-500';
    if (rating <= 3) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getRatingLabel = (rating: number) => {
    if (rating === 0) return 'Not Rated';
    if (rating === 1) return 'Not a Factor';
    if (rating === 2) return 'Minor Factor';
    if (rating === 3) return 'Moderate Factor';
    if (rating === 4) return 'Significant Factor';
    if (rating === 5) return 'Critical Factor';
    return 'Not Rated';
  };

  const getCategoryColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200'
    };
    return colors[color] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const handleSave = async () => {
    if (!investigationId || !causalFactorId) {
      alert('Missing investigation or causal factor ID');
      return;
    }

    setSaving(true);
    try {
      const assessmentData = {
        investigation_id: investigationId,
        causal_factor_id: causalFactorId,
        ratings: ratings,
        notes: notes,
        status: 'draft',
        updated_at: new Date().toISOString()
      };

      if (assessmentId) {
        const { error } = await supabase
          .from('hfat_assessments')
          .update(assessmentData)
          .eq('id', assessmentId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hfat_assessments')
          .insert([assessmentData]);
        
        if (error) throw error;
      }

      alert('HFAT Assessment saved successfully!');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error saving assessment');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!investigationId || !causalFactorId) {
      alert('Missing investigation or causal factor ID');
      return;
    }

    setSaving(true);
    try {
      const assessmentData = {
        investigation_id: investigationId,
        causal_factor_id: causalFactorId,
        ratings: ratings,
        notes: notes,
        status: 'complete',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (assessmentId) {
        const { error } = await supabase
          .from('hfat_assessments')
          .update(assessmentData)
          .eq('id', assessmentId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hfat_assessments')
          .insert([assessmentData]);
        
        if (error) throw error;
      }

      await supabase
        .from('causal_factors')
        .update({ analysis_status: 'analysis_complete' })
        .eq('id', causalFactorId);

      alert('HFAT Assessment completed! Returning to causal analysis...');
      router.push('/step4');
    } catch (error) {
      console.error('Error completing:', error);
      alert('Error completing assessment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-slate-600">Loading assessment...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
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
              <h1 className="text-2xl font-bold text-slate-900">HFAT Assessment</h1>
              <p className="text-slate-600 mt-1">Human Factors Analysis Tool (IOGP 621)</p>
              <div className="mt-2 text-sm">
                <span className="text-slate-500">Investigation:</span>{' '}
                <span className="font-medium text-slate-700">{investigation?.investigation_number || 'Loading...'}</span>
              </div>
              <div className="text-sm">
                <span className="text-slate-500">Causal Factor:</span>{' '}
                <span className="font-medium text-slate-700">{causalFactor?.causal_factor_title || 'Loading...'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={handleComplete}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                {saving ? 'Completing...' : 'Complete Assessment'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Rating Scale</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-medium">0</span>
              <span className="text-blue-800">Not Rated</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-medium">1</span>
              <span className="text-blue-800">Not a Factor</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-medium">2</span>
              <span className="text-blue-800">Minor Factor</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-medium">3</span>
              <span className="text-blue-800">Moderate</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-medium">4-5</span>
              <span className="text-blue-800">Significant/Critical</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(humanFactorsCategories).map(([categoryKey, category]) => {
            const Icon = category.icon;
            const isExpanded = expandedCategories[categoryKey];

            return (
              <div key={categoryKey} className="bg-white rounded-lg shadow-sm border border-slate-200">
                <button
                  onClick={() => toggleCategory(categoryKey)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`p-2 rounded-lg border ${getCategoryColor(category.color)}`}>
                      <Icon className="w-5 h-5" />
                    </span>
                    <h3 className="font-semibold text-lg text-slate-900">{category.label}</h3>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="p-4 pt-0 space-y-4">
                    {category.items.map((item) => {
                      const ratingKey = `${categoryKey}_${item.id}`;
                      const currentRating = ratings[ratingKey] || 0;

                      return (
                        <div key={item.id} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-900 mb-1">{item.label}</h4>
                              <p className="text-sm text-slate-600 mb-1">{item.reference}</p>
                              <p className="text-xs text-slate-500 italic">{item.tooltip}</p>
                            </div>
                          </div>

                          <div className="mt-3">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Rating
                            </label>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <button
                                    key={rating}
                                    onClick={() => updateRating(categoryKey, item.id, rating)}
                                    className={`w-10 h-10 rounded-full font-medium transition-colors ${
                                      currentRating === rating
                                        ? getRatingColor(rating) + ' text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    <span className={currentRating === rating ? 'text-white' : 'text-slate-600'}>
                                      {rating}
                                    </span>
                                  </button>
                                ))}
                              </div>
                              <span className={`ml-3 text-sm font-medium px-3 py-1 rounded ${
                                currentRating > 0 ? getRatingColor(currentRating) + ' text-white' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {getRatingLabel(currentRating)}
                              </span>
                            </div>
                          </div>
                          
                          {currentRating > 0 && (
                            <div className="mt-3">
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Notes / Evidence
                              </label>
                              <textarea
                                value={notes[ratingKey] || ''}
                                onChange={(e) => updateNotes(categoryKey, item.id, e.target.value)}
                                rows={2}
                                placeholder="Describe how this factor contributed to the incident..."
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 mt-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Assessment Progress</h3>
          <div className="text-sm text-slate-700">
            <p>Rated Factors: {Object.values(ratings).filter(r => r > 0).length} / {
              Object.values(humanFactorsCategories).reduce((sum, cat) => sum + cat.items.length, 0)
            }</p>
            <p className="mt-1">
              Significant Factors (4-5): {Object.values(ratings).filter(r => r >= 4).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
