'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileText, Download, Copy, CheckCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import StepNavigation from '@/components/StepNavigation';

export default function InvestigationReport() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const investigationId = searchParams.get('investigationId');

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [investigation, setInvestigation] = useState<any>(null);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [causalFactors, setFactors] = useState<any[]>([]);
  const [hfatAssessments, setHfatAssessments] = useState<any[]>([]);
  const [hopAssessments, setHopAssessments] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    if (investigationId) {
      loadData();
    }
  }, [investigationId]);

  const loadData = async () => {
    try {
      // Load investigation
      const { data: invData } = await supabase
        .from('investigations')
        .select('*')
        .eq('id', investigationId)
        .single();
      setInvestigation(invData);

      // Load evidence
      const { data: evidenceData } = await supabase
        .from('evidence')
        .select('*')
        .eq('investigation_id', investigationId)
        .order('created_at', { ascending: false });
      setEvidence(evidenceData || []);

      // Load interviews
      const { data: interviewData } = await supabase
        .from('interviews')
        .select('*')
        .eq('investigation_id', investigationId)
        .order('interview_date', { ascending: false });
      setInterviews(interviewData || []);

      // Load timeline
      const { data: timelineData } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('investigation_id', investigationId)
        .order('event_date', { ascending: true });
      setTimeline(timelineData || []);

      // Load causal factors
      const { data: factorsData } = await supabase
        .from('causal_factors')
        .select('*')
        .eq('investigation_id', investigationId);
      setFactors(factorsData || []);

      // Load HFAT assessments
      const { data: hfatData } = await supabase
        .from('hfat_assessments')
        .select('*')
        .eq('investigation_id', investigationId);
      setHfatAssessments(hfatData || []);

      // Load HOP assessments
      const { data: hopData } = await supabase
        .from('hop_assessments')
        .select('*')
        .eq('investigation_id', investigationId);
      setHopAssessments(hopData || []);

      // Load recommendations
      const { data: recsData } = await supabase
        .from('recommendations')
        .select('*')
        .eq('investigation_id', investigationId)
        .order('priority', { ascending: true });
      setRecommendations(recsData || []);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const reportElement = document.getElementById('report-content');
    if (reportElement) {
      const text = reportElement.innerText;
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatDateTime = (dateString: string, timeString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    return timeString ? `${date} at ${timeString}` : date;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading report...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {investigation && (
        <StepNavigation 
          investigationId={investigationId!} 
          currentStep={6}
          investigationNumber={investigation.investigation_number}
        />
      )}
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header Actions */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              Investigation Report
            </h1>
            <div className="flex gap-3">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
          </div>

          {/* Report Content */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8" id="report-content">
            
            {/* Title */}
            <div className="text-center mb-8 pb-6 border-b-2 border-slate-200">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                INCIDENT INVESTIGATION REPORT
              </h1>
              <p className="text-xl text-slate-600 mb-1">{investigation?.investigation_number}</p>
              <p className="text-sm text-slate-500">
                Report Generated: {formatDate(new Date().toISOString())}
              </p>
            </div>

            {/* Executive Summary */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-300">
                1. EXECUTIVE SUMMARY
              </h2>
              <div className="space-y-3 text-slate-700">
                <p><strong>Investigation Number:</strong> {investigation?.investigation_number}</p>
                <p><strong>Incident Date:</strong> {formatDateTime(investigation?.incident_date, investigation?.incident_time)}</p>
                <p><strong>Location:</strong> {investigation?.location_facility}{investigation?.location_unit ? ` - ${investigation.location_unit}` : ''}{investigation?.location_area ? `, ${investigation.location_area}` : ''}</p>
                <p><strong>Incident Type:</strong> {investigation?.incident_type}</p>
                {investigation?.consequence_category && (
                  <p><strong>Consequence Category:</strong> {investigation.consequence_category}</p>
                )}
                {investigation?.actual_severity && (
                  <p><strong>Severity (IOGP):</strong> Level {investigation.actual_severity}</p>
                )}
                <p><strong>Investigation Leader:</strong> {investigation?.investigation_leader || 'Not specified'}</p>
                <p><strong>Status:</strong> {investigation?.status}</p>
              </div>
            </section>

            {/* Incident Description */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-300">
                2. INCIDENT DESCRIPTION
              </h2>
              <p className="text-slate-700 whitespace-pre-wrap">
                {investigation?.incident_description || 'No description provided.'}
              </p>
              {investigation?.immediate_actions_taken && (
                <div className="mt-4">
                  <h3 className="font-semibold text-lg text-slate-900 mb-2">Immediate Actions Taken</h3>
                  <p className="text-slate-700 whitespace-pre-wrap">{investigation.immediate_actions_taken}</p>
                </div>
              )}
            </section>

            {/* Evidence & Data Collection */}
            {(evidence.length > 0 || interviews.length > 0) && (
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-300">
                  3. EVIDENCE & DATA COLLECTION
                </h2>
                
                {evidence.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-lg text-slate-900 mb-3">3.1 Physical Evidence</h3>
                    <div className="space-y-3">
                      {evidence.map((item, idx) => (
                        <div key={item.id} className="pl-4 border-l-2 border-blue-500">
                          <p className="font-medium text-slate-900">{idx + 1}. {item.evidence_type}</p>
                          <p className="text-slate-700">{item.evidence_description}</p>
                          {item.collected_by && (
                            <p className="text-sm text-slate-600">Collected by: {item.collected_by}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {interviews.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900 mb-3">3.2 Witness Interviews</h3>
                    <div className="space-y-3">
                      {interviews.map((interview, idx) => (
                        <div key={interview.id} className="pl-4 border-l-2 border-purple-500">
                          <p className="font-medium text-slate-900">{idx + 1}. {interview.interviewee_name} - {interview.interview_role}</p>
                          <p className="text-sm text-slate-600">
                            Interviewed: {formatDateTime(interview.interview_date, interview.interview_time)} by {interview.interviewer_name}
                          </p>
                          {interview.key_points && (
                            <p className="text-slate-700 mt-2">{interview.key_points}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Timeline */}
            {timeline.length > 0 && (
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-300">
                  4. TIMELINE OF EVENTS
                </h2>
                <div className="space-y-2">
                  {timeline.map((event) => (
                    <div key={event.id} className="flex gap-4 pl-4 border-l-2 border-cyan-500">
                      <div className="font-mono text-sm text-slate-600 min-w-[120px]">
                        {formatDateTime(event.event_date, event.event_time)}
                      </div>
                      <div className="flex-1">
                        <span className="inline-block px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-700 mr-2">
                          {event.event_category}
                        </span>
                        <span className="text-slate-900">{event.event_description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Causal Analysis */}
            {causalFactors.length > 0 && (
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-300">
                  5. CAUSAL ANALYSIS
                </h2>
                
                {causalFactors.map((factor, idx) => {
                  const hfat = hfatAssessments.find(h => h.causal_factor_id === factor.id);
                  const hop = hopAssessments.find(h => h.causal_factor_id === factor.id);
                  
                  return (
                    <div key={factor.id} className="mb-6 pb-6 border-b border-slate-200 last:border-0">
                      <h3 className="font-semibold text-lg text-slate-900 mb-2">
                        5.{idx + 1} {factor.causal_factor_title}
                      </h3>
                      <div className="mb-3">
                        <span className="inline-block px-2 py-1 text-xs rounded bg-orange-100 text-orange-700 mr-2">
                          {factor.factor_type}
                        </span>
                        <span className="inline-block px-2 py-1 text-xs rounded bg-slate-100 text-slate-700">
                          {factor.factor_category}
                        </span>
                      </div>
                      {factor.causal_factor_description && (
                        <p className="text-slate-700 mb-4 whitespace-pre-wrap">{factor.causal_factor_description}</p>
                      )}

                      {/* HFAT Assessment */}
                      {hfat && hfat.notes && (
                        <div className="mt-4 pl-4 border-l-2 border-purple-500">
                          <h4 className="font-semibold text-slate-900 mb-2">Human Factors Analysis (HFAT)</h4>
                          {hfat.notes.humanFactors && Object.entries(hfat.notes.humanFactors).map(([key, value]: [string, any]) => {
                            if (value?.notes) {
                              return (
                                <div key={key} className="mb-2">
                                  <p className="text-sm font-medium text-slate-700">{key.replace(/_/g, ' ')}</p>
                                  <p className="text-sm text-slate-600">
                                    <span className={`inline-block px-2 py-0.5 text-xs rounded mr-2 ${
                                      value.rating === 'contributing' ? 'bg-orange-100 text-orange-700' :
                                      value.rating === 'causal' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                                    }`}>
                                      {value.rating || 'Not rated'}
                                    </span>
                                    {value.notes}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          })}
                          
                          {hfat.notes.justCulture && hfat.notes.justCulture.classification && (
                            <div className="mt-3 pt-3 border-t border-slate-200">
                              <p className="font-semibold text-slate-900">Just Culture Assessment</p>
                              <p className="text-sm text-slate-700 mt-1">
                                <strong>Classification:</strong> {hfat.notes.justCulture.classification}
                              </p>
                              {hfat.notes.justCulture.justification && (
                                <p className="text-sm text-slate-700 mt-1">
                                  <strong>Justification:</strong> {hfat.notes.justCulture.justification}
                                </p>
                              )}
                              {hfat.notes.justCulture.responseActions && (
                                <p className="text-sm text-slate-700 mt-1">
                                  <strong>Response Actions:</strong> {hfat.notes.justCulture.responseActions}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* HOP Assessment */}
                      {hop && (
                        <div className="mt-4 pl-4 border-l-2 border-green-500">
                          <h4 className="font-semibold text-slate-900 mb-2">Human & Organizational Performance (HOP)</h4>
                          {hop.workload_demands && (
                            <div className="mb-2">
                              <p className="text-sm font-medium text-slate-700">Error Precursors</p>
                              <p className="text-sm text-slate-600">{hop.workload_demands}</p>
                            </div>
                          )}
                          {hop.procedural_guidance && (
                            <div className="mb-2">
                              <p className="text-sm font-medium text-slate-700">System Defenses</p>
                              <p className="text-sm text-slate-600">{hop.procedural_guidance}</p>
                            </div>
                          )}
                          {hop.what_made_sense && (
                            <div className="mb-2">
                              <p className="text-sm font-medium text-slate-700">System Vulnerabilities</p>
                              <p className="text-sm text-slate-600">{hop.what_made_sense}</p>
                            </div>
                          )}
                          {hop.system_improvements && (
                            <div className="mb-2">
                              <p className="text-sm font-medium text-slate-700">System Improvements</p>
                              <p className="text-sm text-slate-600">{hop.system_improvements}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-300">
                  6. RECOMMENDATIONS
                </h2>
                <div className="space-y-4">
                  {recommendations.map((rec, idx) => (
                    <div key={rec.id} className="pl-4 border-l-2 border-blue-500">
                      <div className="flex items-start gap-3 mb-2">
                        <span className="font-bold text-slate-900">{idx + 1}.</span>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{rec.recommendation_title}</p>
                          <p className="text-slate-700 mt-1">{rec.recommendation_description}</p>
                          <div className="flex gap-4 mt-2 text-sm text-slate-600">
                            <span><strong>Priority:</strong> {rec.priority}</span>
                            <span><strong>Type:</strong> {rec.recommendation_type}</span>
                            {rec.responsible_party && <span><strong>Owner:</strong> {rec.responsible_party}</span>}
                            {rec.target_completion_date && (
                              <span><strong>Due:</strong> {formatDate(rec.target_completion_date)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Conclusion */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-300">
                7. CONCLUSION
              </h2>
              <p className="text-slate-700">
                This investigation identified {causalFactors.length} causal factor{causalFactors.length !== 1 ? 's' : ''} and 
                resulted in {recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''} to prevent recurrence. 
                Implementation of these recommendations will improve safety and operational reliability.
              </p>
            </section>

            {/* Sign-off */}
            <section className="mt-12 pt-6 border-t-2 border-slate-300">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-slate-700 mb-1"><strong>Prepared By:</strong></p>
                  <p className="text-slate-700">{investigation?.investigation_leader || '________________________'}</p>
                  <p className="text-slate-700 mt-4">Date: ________________________</p>
                </div>
                <div>
                  <p className="text-slate-700 mb-1"><strong>Reviewed By:</strong></p>
                  <p className="text-slate-700">________________________</p>
                  <p className="text-slate-700 mt-4">Date: ________________________</p>
                </div>
              </div>
            </section>

            {/* Footer Note */}
            <div className="mt-8 pt-6 border-t border-slate-200 text-center text-sm text-slate-500">
              <p>Investigation Tool Report | Generated {formatDate(new Date().toISOString())}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
