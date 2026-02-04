'use client'

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { FileText, Copy, Check, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import StepNavigation from '@/components/StepNavigation';

// ─── HFAT key → human-readable label map ────────────────────────────────────
const hfatLabels: Record<string, string> = {
  fatigue:      'Fatigue / Alertness',
  competency:   'Competency / Training',
  situational:  'Situational Awareness',
  stress:       'Stress / Workload',
  health:       'Physical / Mental Health',
  procedure:    'Procedure Quality',
  complexity:   'Task Complexity',
  time:         'Time Pressure',
  tools:        'Tools / Equipment Design',
  communication:'Communication',
  culture:      'Safety Culture',
  resources:    'Resource Allocation',
  supervision:  'Supervision / Leadership',
  planning:     'Work Planning',
  change:       'Change Management',
};

// ─── HOP sections with their DB field mappings ──────────────────────────────
const hopSections = [
  {
    title: 'Context',
    fields: [
      { key: 'task_description',   label: 'Task Description' },
      { key: 'work_conditions',    label: 'Work Conditions' },
      { key: 'time_of_day',        label: 'Time of Day' },
    ]
  },
  {
    title: 'Performance Influencing Factors — Task & Environment',
    fields: [
      { key: 'workload_demands',      label: 'Workload Demands' },
      { key: 'time_available',        label: 'Time Available' },
      { key: 'procedural_guidance',   label: 'Procedural Guidance' },
      { key: 'equipment_design',      label: 'Equipment Design' },
    ]
  },
  {
    title: 'Performance Influencing Factors — Individual & Team',
    fields: [
      { key: 'training_experience',       label: 'Training & Experience' },
      { key: 'communication_teamwork',    label: 'Communication & Teamwork' },
      { key: 'supervisory_support',       label: 'Supervisory Support' },
    ]
  },
  {
    title: 'Organisational Factors',
    fields: [
      { key: 'organizational_culture', label: 'Organisational Culture' },
    ]
  },
  {
    title: 'Local Rationality',
    fields: [
      { key: 'what_made_sense',       label: 'What Made Sense at the Time' },
      { key: 'local_rationality',     label: 'Local Rationality Analysis' },
      { key: 'tradeoffs_decisions',   label: 'Trade-offs & Decisions' },
    ]
  },
  {
    title: 'Learning & Improvements',
    fields: [
      { key: 'system_improvements', label: 'System Improvements' },
      { key: 'learning_points',     label: 'Learning Points' },
    ]
  },
];

export default function ReportPage() {
  const searchParams = useSearchParams();
  const investigationId = searchParams.get('investigationId');

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [investigation, setInvestigation]     = useState<any>(null);
  const [evidence, setEvidence]               = useState<any[]>([]);
  const [interviews, setInterviews]           = useState<any[]>([]);
  const [timeline, setTimeline]               = useState<any[]>([]);
  const [causalFactors, setCausalFactors]     = useState<any[]>([]);
  const [hfatAssessments, setHfatAssessments] = useState<any[]>([]);
  const [hopAssessments, setHopAssessments]   = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [barriers, setBarriers]               = useState<any[]>([]);

  useEffect(() => {
    if (investigationId) loadData();
  }, [investigationId]);

  const loadData = async () => {
    try {
      const { data: inv } = await supabase
        .from('investigations').select('*').eq('id', investigationId!).single();
      setInvestigation(inv);

      const { data: ev } = await supabase
        .from('evidence').select('*').eq('investigation_id', investigationId!).order('created_at');
      setEvidence(ev || []);

      const { data: iv } = await supabase
        .from('interviews').select('*').eq('investigation_id', investigationId!).order('interview_date');
      setInterviews(iv || []);

      const { data: tl } = await supabase
        .from('timeline_events').select('*').eq('investigation_id', investigationId!).order('event_date', { ascending: true });
      setTimeline(tl || []);

      const { data: cf } = await supabase
        .from('causal_factors').select('*').eq('investigation_id', investigationId!).order('created_at');
      setCausalFactors(cf || []);

      const { data: hf } = await supabase
        .from('hfat_assessments').select('*').eq('investigation_id', investigationId!);
      setHfatAssessments(hf || []);

      const { data: hp } = await supabase
        .from('hop_assessments').select('*').eq('investigation_id', investigationId!);
      setHopAssessments(hp || []);

      const { data: rc } = await supabase
        .from('recommendations').select('*').eq('investigation_id', investigationId!).order('priority');
      setRecommendations(rc || []);

      const { data: ba } = await supabase
        .from('visualization_barriers').select('*').eq('investigation_id', investigationId!).order('created_at');
      setBarriers(ba || []);

    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── helpers ──────────────────────────────────────────────────────────────
  const formatDate = (d: string) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatDateTime = (date: string, time?: string) => {
    if (!date) return 'N/A';
    const d = new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    return time ? `${d} at ${time}` : d;
  };

  const copyToClipboard = () => {
    const el = document.getElementById('report-content');
    if (el) {
      navigator.clipboard.writeText(el.innerText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  // ── timeline helpers ─────────────────────────────────────────────────────
  const parentEvents = timeline.filter(e => !e.parent_event_id);
  const childrenOf   = (id: string) => timeline.filter(e => e.parent_event_id === id);

  // ── HFAT helpers ─────────────────────────────────────────────────────────
  // Group humanFactors object into the three IOGP sections
  const groupHfat = (humanFactors: Record<string, any>) => {
    const groups: Record<string, { label: string; items: { label: string; rating: string; notes: string }[] }> = {
      individual:     { label: 'Individual Factors (IOGP 621: 4.2.1)', items: [] },
      task:           { label: 'Task / Work Factors (IOGP 621: 4.2.2)', items: [] },
      organisational: { label: 'Organisational Factors (IOGP 621: 4.2.3)', items: [] },
    };
    Object.entries(humanFactors).forEach(([key, value]: [string, any]) => {
      if (!value?.rating && !value?.notes) return;          // skip empty
      const [section, ...rest] = key.split('_');
      const itemId = rest.join('_');
      const target =
        section === 'individual'     ? groups.individual :
        section === 'task'           ? groups.task :
        section === 'organizational' || section === 'organisational' ? groups.organisational :
        null;
      if (target) {
        target.items.push({
          label:  hfatLabels[itemId] || itemId.replace(/_/g, ' '),
          rating: value.rating || '',
          notes:  value.notes  || '',
        });
      }
    });
    return groups;
  };

  // ── barrier status colour ────────────────────────────────────────────────
  const barrierStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'present':  return 'bg-green-100 text-green-800';
      case 'absent':   return 'bg-red-100 text-red-800';
      case 'degraded': return 'bg-orange-100 text-orange-800';
      default:         return 'bg-slate-100 text-slate-700';
    }
  };

  const performedStyle = (performed: string) => {
    switch (performed?.toLowerCase()) {
      case 'yes':     return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-orange-100 text-orange-800';
      case 'no':      return 'bg-red-100 text-red-800';
      default:        return 'bg-slate-100 text-slate-700';
    }
  };

  // ── loading ──────────────────────────────────────────────────────────────
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

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      {investigation && (
        <StepNavigation
          investigationId={investigationId!}
          currentStep={7}
          investigationNumber={investigation.investigation_number}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-5xl mx-auto">

          {/* ── header actions ─────────────────────────────────────────── */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              Investigation Report
            </h1>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Report</>}
            </button>
          </div>

          {/* ── report body ────────────────────────────────────────────── */}
          <div id="report-content" className="bg-white rounded-xl shadow-sm border border-slate-200 p-10">

            {/* ── 1. EXECUTIVE SUMMARY ─────────────────────────────────── */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-300">
                1. EXECUTIVE SUMMARY
              </h2>

              {/* High Potential callout */}
              {investigation?.high_potential && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-300 rounded-lg p-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-red-800 font-semibold text-sm">HIGH POTENTIAL INCIDENT — This event has been classified as High Potential and may require elevated regulatory reporting.</p>
                </div>
              )}

              {/* Summary stats box */}
              <div className="grid grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'Evidence Items',   value: evidence.length,       colour: 'blue' },
                  { label: 'Interviews',       value: interviews.length,     colour: 'purple' },
                  { label: 'Causal Factors',   value: causalFactors.length,  colour: 'orange' },
                  { label: 'Recommendations',  value: recommendations.length,colour: 'green' },
                ].map(item => (
                  <div key={item.label} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-slate-800">{item.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div><span className="font-semibold text-slate-600">Investigation Number:</span> <span className="text-slate-900">{investigation?.investigation_number || 'N/A'}</span></div>
                <div><span className="font-semibold text-slate-600">Incident Date:</span>         <span className="text-slate-900">{formatDate(investigation?.incident_date)}</span></div>
                <div><span className="font-semibold text-slate-600">Location / Facility:</span>   <span className="text-slate-900">{investigation?.location_facility || 'N/A'}</span></div>
                <div><span className="font-semibold text-slate-600">Investigation Leader:</span>  <span className="text-slate-900">{investigation?.investigation_leader || 'N/A'}</span></div>
                <div><span className="font-semibold text-slate-600">IOGP Severity:</span>         <span className="text-slate-900">{investigation?.iogp_severity || 'N/A'}</span></div>
                <div><span className="font-semibold text-slate-600">Classification:</span>        <span className="text-slate-900">{investigation?.incident_type || 'N/A'}</span></div>
                <div><span className="font-semibold text-slate-600">Investigation Started:</span> <span className="text-slate-900">{formatDate(investigation?.created_at)}</span></div>
                <div><span className="font-semibold text-slate-600">Status:</span>                <span className="text-slate-900">{investigation?.status || 'In Progress'}</span></div>
              </div>
            </section>

            {/* ── 2. INCIDENT DESCRIPTION ──────────────────────────────── */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-300">
                2. INCIDENT DESCRIPTION
              </h2>

              {/* Structured details */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
                {investigation?.location_facility && (
                  <div><span className="font-semibold text-slate-600">Location:</span> <span className="text-slate-900">{investigation.location_facility}</span></div>
                )}
                {investigation?.incident_date && (
                  <div><span className="font-semibold text-slate-600">Date:</span> <span className="text-slate-900">{formatDate(investigation.incident_date)}</span></div>
                )}
                {investigation?.incident_time && (
                  <div><span className="font-semibold text-slate-600">Time:</span> <span className="text-slate-900">{investigation.incident_time}</span></div>
                )}
                {investigation?.incident_type && (
                  <div><span className="font-semibold text-slate-600">Classification:</span> <span className="text-slate-900">{investigation.incident_type}</span></div>
                )}
              </div>

              {/* Narrative description */}
              <p className="text-slate-700 whitespace-pre-wrap mb-4">{investigation?.incident_description || 'No description provided.'}</p>

              {/* Immediate actions */}
              {investigation?.immediate_actions && (
                <div className="pl-4 border-l-2 border-blue-400">
                  <p className="font-semibold text-slate-800 text-sm mb-1">Immediate Actions Taken</p>
                  <p className="text-slate-700 whitespace-pre-wrap">{investigation.immediate_actions}</p>
                </div>
              )}
            </section>

            {/* ── 3. TIMELINE OF EVENTS ────────────────────────────────── */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-300">
                3. TIMELINE OF EVENTS
              </h2>
              {parentEvents.length > 0 ? (
                <div className="space-y-1">
                  {parentEvents.map(event => {
                    const children = childrenOf(event.id);
                    return (
                      <div key={event.id}>
                        {/* parent event */}
                        <div className="flex gap-4 pl-4 border-l-2 border-cyan-500 py-2">
                          <div className="font-mono text-sm text-slate-600 min-w-[130px] flex-shrink-0">
                            {formatDateTime(event.event_date, event.event_time)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {event.event_category && (
                                <span className="inline-block px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-700">{event.event_category}</span>
                              )}
                              {event.is_incident_event && (
                                <span className="inline-block px-2 py-0.5 text-xs rounded bg-red-100 text-red-700 font-semibold">INCIDENT EVENT</span>
                              )}
                              {event.verified && (
                                <span className="inline-block px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">Verified</span>
                              )}
                            </div>
                            <p className="text-slate-900 font-medium mt-1">{event.event_title}</p>
                            {event.event_description && <p className="text-sm text-slate-600 mt-0.5">{event.event_description}</p>}
                          </div>
                        </div>
                        {/* child events — indented */}
                        {children.map(child => (
                          <div key={child.id} className="flex gap-4 pl-12 border-l-2 border-cyan-300 py-1.5 bg-slate-50">
                            <div className="font-mono text-xs text-slate-500 min-w-[130px] flex-shrink-0">
                              {formatDateTime(child.event_date, child.event_time)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {child.event_category && (
                                  <span className="inline-block px-1.5 py-0.5 text-xs rounded bg-slate-100 text-slate-600">{child.event_category}</span>
                                )}
                                {child.verified && (
                                  <span className="inline-block px-1.5 py-0.5 text-xs rounded bg-green-100 text-green-700">Verified</span>
                                )}
                              </div>
                              <p className="text-sm text-slate-800">{child.event_title}</p>
                              {child.event_description && <p className="text-xs text-slate-600 mt-0.5">{child.event_description}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 italic">No timeline events recorded.</p>
              )}
            </section>

            {/* ── 4. BARRIER ANALYSIS ──────────────────────────────────── */}
            {barriers.length > 0 && (
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-300">
                  4. BARRIER ANALYSIS
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="text-left p-3 font-semibold text-slate-700 border-b border-slate-200">#</th>
                        <th className="text-left p-3 font-semibold text-slate-700 border-b border-slate-200">Barrier</th>
                        <th className="text-left p-3 font-semibold text-slate-700 border-b border-slate-200">Type</th>
                        <th className="text-left p-3 font-semibold text-slate-700 border-b border-slate-200">Status</th>
                        <th className="text-left p-3 font-semibold text-slate-700 border-b border-slate-200">Performed</th>
                        <th className="text-left p-3 font-semibold text-slate-700 border-b border-slate-200">Failure Reason / Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {barriers.map((b, idx) => (
                        <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-3 text-slate-600">{idx + 1}</td>
                          <td className="p-3 font-medium text-slate-900">{b.barrier_name}</td>
                          <td className="p-3 text-slate-700">{b.barrier_type || '—'}</td>
                          <td className="p-3">
                            <span className={`inline-block px-2 py-0.5 text-xs rounded font-medium ${barrierStatusStyle(b.status)}`}>
                              {b.status || '—'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`inline-block px-2 py-0.5 text-xs rounded font-medium ${performedStyle(b.performed)}`}>
                              {b.performed || '—'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 whitespace-pre-wrap">
                            {b.failure_reason || b.notes || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ── 6. CAUSAL ANALYSIS ───────────────────────────────────── */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-300">
                5. CAUSAL ANALYSIS
              </h2>
              {causalFactors.length > 0 ? causalFactors.map((factor, idx) => {
                const hfat = hfatAssessments.find((h: any) => h.causal_factor_id === factor.id);
                const hop  = hopAssessments.find((h: any)  => h.causal_factor_id === factor.id);
                const hfatGroups = hfat?.notes?.humanFactors ? groupHfat(hfat.notes.humanFactors) : null;
                const justCulture = hfat?.notes?.justCulture;

                return (
                  <div key={factor.id} className="mb-6 pb-6 border-b border-slate-200 last:border-0">
                    <h3 className="font-semibold text-lg text-slate-900 mb-2">
                      5.{idx + 1}&nbsp; {factor.causal_factor_title}
                    </h3>

                    {/* type + category badges */}
                    <div className="flex gap-2 flex-wrap mb-2">
                      {factor.factor_type && (
                        <span className={`inline-block px-2 py-0.5 text-xs rounded font-medium ${
                          factor.factor_type === 'immediate' ? 'bg-red-100 text-red-700' :
                          factor.factor_type === 'contributing' ? 'bg-orange-100 text-orange-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {factor.factor_type.charAt(0).toUpperCase() + factor.factor_type.slice(1)} Cause
                        </span>
                      )}
                      {factor.factor_category && (
                        <span className="inline-block px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-700">
                          {factor.factor_category}
                        </span>
                      )}
                      {factor.subcategory && (
                        <span className="inline-block px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-600 italic">
                          {factor.subcategory}
                        </span>
                      )}
                    </div>

                    {factor.causal_factor_description && (
                      <p className="text-slate-700 mb-4 whitespace-pre-wrap">{factor.causal_factor_description}</p>
                    )}

                    {/* ── HFAT grouped by IOGP section ──────────────────── */}
                    {(() => {
                      if (!hfatGroups) return null;
                      const hasAny = Object.values(hfatGroups).some(g => g.items.length > 0);
                      if (!hasAny) return null;  // Don't render section if no data
                      
                      return (
                        <div className="mt-4 pl-4 border-l-2 border-purple-500">
                          <h4 className="font-semibold text-slate-900 mb-3">Human Factors Analysis (HFAT) — IOGP 621</h4>
                          {Object.entries(hfatGroups).map(([sectionKey, section]) => {
                            if (section.items.length === 0) return null;
                            return (
                              <div key={sectionKey} className="mb-3">
                                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1.5">{section.label}</p>
                                <div className="space-y-1.5 pl-3">
                                  {section.items.map((item, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                      <span className={`inline-block mt-0.5 px-2 py-0.5 text-xs rounded flex-shrink-0 ${
                                        item.rating === 'causal' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                      }`}>
                                        {item.rating.charAt(0).toUpperCase() + item.rating.slice(1)}
                                      </span>
                                      <div>
                                        <span className="text-sm font-medium text-slate-800">{item.label}</span>
                                        {item.notes && <p className="text-sm text-slate-600">{item.notes}</p>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* ── Just Culture ──────────────────────────────────── */}
                    {justCulture?.classification && (
                      <div className="mt-4 pl-4 border-l-2 border-blue-500">
                        <h4 className="font-semibold text-slate-900 mb-1">Just Culture Assessment</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-block px-2 py-0.5 text-xs rounded font-medium ${
                            justCulture.classification === 'Human Error'       ? 'bg-green-100 text-green-800' :
                            justCulture.classification === 'At-Risk Behavior'  ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {justCulture.classification}
                          </span>
                        </div>
                        {justCulture.justification && (
                          <p className="text-sm text-slate-700 mt-1.5 whitespace-pre-wrap">{justCulture.justification}</p>
                        )}
                      </div>
                    )}

                    {/* ── HOP ───────────────────────────────────────────── */}
                    {(() => {
                      if (!hop) return null;
                      // Check if ANY field across all sections has data
                      const hasAnyField = hopSections.some(s => s.fields.some(f => hop[f.key]));
                      if (!hasAnyField) return null;  // Don't render section if no data

                      return (
                        <div className="mt-4 pl-4 border-l-2 border-green-500">
                          <h4 className="font-semibold text-slate-900 mb-1">Human and Organisational Performance (HOP)</h4>
                          {hopSections.map((section, sIdx) => {
                            const sectionFields = section.fields.filter(f => hop[f.key]);
                            if (sectionFields.length === 0) return null;
                            return (
                              <div key={sIdx} className="mb-3">
                                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1.5">{section.title}</p>
                                <div className="space-y-1.5 pl-3">
                                  {sectionFields.map(f => (
                                    <div key={f.key}>
                                      <p className="text-sm font-medium text-slate-700">{f.label}</p>
                                      <p className="text-sm text-slate-600 whitespace-pre-wrap">{hop[f.key]}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                );
              }) : (
                <p className="text-slate-500 italic">No causal factors recorded.</p>
              )}
            </section>

            {/* ── 7. RECOMMENDATIONS ───────────────────────────────────── */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-300">
                6. RECOMMENDATIONS
              </h2>
              {recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.map((rec, idx) => {
                    const linkedFactor = causalFactors.find((cf: any) => cf.id === rec.causal_factor_id);
                    return (
                      <div key={rec.id} className="pl-4 border-l-2 border-blue-500">
                        <div className="flex items-start gap-3">
                          <span className="font-bold text-slate-900 flex-shrink-0">{idx + 1}.</span>
                          <div className="flex-1">
                            {/* Title with priority badge */}
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <p className="font-semibold text-lg text-slate-900">{rec.recommendation_title}</p>
                              {rec.priority && (
                                <span className={`inline-block px-2 py-0.5 text-xs rounded font-medium ${
                                  rec.priority === 'Critical' || rec.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                                  rec.priority === 'High' || rec.priority === 'MEDIUM' ? 'bg-orange-100 text-orange-800' :
                                  rec.priority === 'Medium' || rec.priority === 'LOW' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {rec.priority}
                                </span>
                              )}
                            </div>

                            {/* Description */}
                            {rec.recommendation_description && (
                              <p className="text-slate-700 mt-2 whitespace-pre-wrap">{rec.recommendation_description}</p>
                            )}

                            {/* linked causal factor */}
                            {linkedFactor && (
                              <div className="mt-2 pl-3 border-l border-slate-300">
                                <p className="text-xs text-slate-500">Addresses causal factor:</p>
                                <p className="text-sm text-slate-700 font-medium">{linkedFactor.causal_factor_title}</p>
                              </div>
                            )}

                            {/* metadata row */}
                            <div className="flex gap-4 mt-2 text-xs text-slate-600 flex-wrap">
                              {rec.recommendation_type && (
                                <span><strong>Hierarchy of Controls:</strong> {rec.recommendation_type}</span>
                              )}
                              {rec.responsible_party && (
                                <span><strong>Owner:</strong> {rec.responsible_party}</span>
                              )}
                              {rec.target_completion_date && (
                                <span><strong>Target Date:</strong> {formatDate(rec.target_completion_date)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 italic">No recommendations recorded.</p>
              )}
            </section>

            {/* ── 8. CONCLUSION ────────────────────────────────────────── */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-300">
                7. CONCLUSION
              </h2>
              <p className="text-slate-700">
                This investigation identified {causalFactors.length} causal factor{causalFactors.length !== 1 ? 's' : ''} and
                resulted in {recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''} to prevent recurrence.
                {barriers.length > 0 && ` Barrier analysis identified ${barriers.length} barrier${barriers.length !== 1 ? 's' : ''}, of which ${barriers.filter((b: any) => b.status?.toLowerCase() === 'absent' || b.performed?.toLowerCase() === 'no').length} failed or were absent.`}
                {' '}Implementation of these recommendations will improve safety and operational reliability.
              </p>
            </section>

            {/* ── SIGN-OFF ─────────────────────────────────────────────── */}
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

            {/* ── FOOTER ───────────────────────────────────────────────── */}
            <div className="mt-8 pt-6 border-t border-slate-200 text-center text-sm text-slate-500">
              <p>Investigation Tool Report | Generated {formatDate(new Date().toISOString())}</p>
            </div>

          </div> {/* end report-content */}
        </div>
      </div>
    </>
  );
}
