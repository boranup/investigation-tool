'use client';

// ============================================================================
// STANDARDS & REFERENCES PAGE
// Path: app/standards/page.tsx
// Displays the full standards and reference framework underpinning the tool
// ============================================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, ExternalLink, ChevronDown, ChevronRight, Home, Shield, Users, BarChart2, FileText, Globe, Layers } from 'lucide-react';

// ============================================================================
// DATA
// ============================================================================

const iogpReports = [
  {
    group: 'Investigation & Human Factors',
    icon: Users,
    colour: 'blue',
    reports: [
      {
        ref: 'IOGP 459',
        title: 'Life-Saving Rules',
        year: '2018',
        relevance: 'Derived from analysis of 1,484 fatal incidents. Provides the industry-standard framework for linking incident causation to Life-Saving Rule breaches and informing the Just Culture assessment.',
        steps: ['Step 1 — Incident Overview', 'Step 5 — Just Culture Assessment'],
      },
      {
        ref: 'IOGP 517',
        title: 'Incident Management System for the Oil and Gas Industry',
        year: '',
        relevance: 'Provides the systematic framework for incident classification, escalation, and management. Informs how incidents are categorised and structured at the point of initiation.',
        steps: ['Step 1 — Incident Overview'],
      },
      {
        ref: 'IOGP 552',
        title: 'Components of Organisational Learning from Events',
        year: '2016',
        relevance: 'Describes the components an organisation needs to learn from operating experience and prevent incident recurrence. Informs the recommendations and report stages of the workflow.',
        steps: ['Step 6 — Recommendations', 'Step 7 — Investigation Report'],
      },
      {
        ref: 'IOGP 621',
        title: 'Demystifying Human Factors: Building Confidence in Human Factors Investigation',
        year: '2018',
        relevance: 'Primary backbone of the tool. Provides the HFAT category structure (Individual Factors 4.2.1, Task & Work Factors 4.2.2, Organisational Factors 4.2.3), the HOP assessment framework, and the overarching approach to human factors in investigations.',
        steps: ['Step 5 — Causal Factor Analysis', 'Step 2 — Evidence & Interviews', 'Step 3 — Timeline'],
      },
      {
        ref: 'IOGP 642',
        title: 'Learning from Normal Work',
        year: '',
        relevance: 'Represents the shift from purely reactive investigation to proactive learning. Frames investigation reports not just as records of what went wrong, but as contributions to organisational learning from everyday operations.',
        steps: ['Step 7 — Investigation Report', 'Step 5 — HOP Assessment'],
      },
    ],
  },
  {
    group: 'Barrier Management & Process Safety',
    icon: Shield,
    colour: 'amber',
    reports: [
      {
        ref: 'IOGP 415',
        title: 'Asset Integrity — The Key to Managing Major Incident Risks',
        year: '2008',
        relevance: 'The original IOGP source for the bow-tie model and Swiss Cheese model concepts. Provides guidance on barrier monitoring and the development of leading and lagging key performance indicators.',
        steps: ['Step 4 — Barrier Analysis', 'Step 6 — Recommendations'],
      },
      {
        ref: 'IOGP 456',
        title: 'Process Safety — Recommended Practice on Key Performance Indicators',
        year: '2023 (3rd ed.)',
        relevance: 'Enables companies to establish leading and lagging indicators that assess the health of barriers. Informs Tier 1/Tier 2 Process Safety Event classification and barrier-focused corrective action recommendations. Incorporates API RP 754.',
        steps: ['Step 1 — Severity Classification', 'Step 6 — Recommendations'],
      },
      {
        ref: 'IOGP 544',
        title: 'Standardisation of Barrier Definitions',
        year: '2016',
        relevance: 'Standardises the types and categories of process safety barriers. Directly underpins the tool\'s barrier analysis bow-tie model, barrier type classifications, and Swiss Cheese diagram. Defines hardware, human, and management system barrier categories.',
        steps: ['Step 4 — Barrier Analysis', 'Step 4 — Swiss Cheese Diagram'],
      },
      {
        ref: 'IOGP 638',
        title: 'Process Safety Fundamentals',
        year: '2020',
        relevance: '10 core process safety fundamentals derived from analysis of 56 fatal process safety events. The PSFs map directly to organisational and task causal factor categories in the HFAT assessment.',
        steps: ['Step 5 — Causal Factor Analysis'],
      },
    ],
  },
  {
    group: 'Safety Culture & Leadership',
    icon: Layers,
    colour: 'purple',
    reports: [
      {
        ref: 'IOGP 452',
        title: 'Shaping Safety Culture Through Safety Leadership',
        year: '2013',
        relevance: 'The primary IOGP reference for safety culture and leadership characteristics that influence organisational safety performance. Informs organisational causal factors and management system failures in the HFAT assessment.',
        steps: ['Step 5 — Organisational Factors (HFAT 4.2.3)'],
      },
      {
        ref: 'IOGP 453',
        title: 'Safety Leadership in Practice: A Guide for Managers',
        year: '',
        relevance: 'Companion to IOGP 452. Provides practical guidance on applying safety leadership characteristics. Informs leadership-related contributing factors and leadership-focused recommendations.',
        steps: ['Step 5 — Causal Factor Analysis', 'Step 6 — Recommendations'],
      },
    ],
  },
  {
    group: 'Management Systems & Contracting',
    icon: BarChart2,
    colour: 'green',
    reports: [
      {
        ref: 'IOGP 423',
        title: 'HSE Management — Guidelines for Working Together in a Contract Environment',
        year: '2017',
        relevance: 'Provides the framework for client and contractor HSE management. Informs causal factor analysis where contractor management, capability, or oversight is identified as a contributing factor.',
        steps: ['Step 5 — Organisational Factors (HFAT 4.2.3)'],
      },
      {
        ref: 'IOGP 510',
        title: 'Operating Management System (OMS) Framework',
        year: '',
        relevance: 'Defines the OMS Framework comprising four fundamentals and ten Management System Elements. Provides the structure for mapping organisational causal factors to specific management system failures.',
        steps: ['Step 5 — Organisational Factors (HFAT 4.2.3)'],
      },
      {
        ref: 'IOGP 511',
        title: 'OMS in Practice — Supplement to Report 510',
        year: '',
        relevance: 'Describes the ten Management System Elements in detail. Supports precise identification of which element of the management system contributed to the incident.',
        steps: ['Step 5 — Organisational Factors (HFAT 4.2.3)'],
      },
    ],
  },
  {
    group: 'Safety Performance Data',
    icon: FileText,
    colour: 'slate',
    reports: [
      {
        ref: 'IOGP Safety Data Reporting User Guide',
        title: 'Safety Data Reporting User Guide — Scope and Definitions (Annual)',
        year: 'Annual (current: 2024su)',
        relevance: 'The authoritative IOGP source for incident classification definitions, severity thresholds, High Potential (HiPo) event definitions, and safety performance data reporting requirements.',
        steps: ['Step 1 — Incident Overview'],
      },
    ],
  },
];

const externalStandards = [
  {
    group: 'Norwegian Industry',
    icon: Globe,
    colour: 'red',
    standards: [
      {
        ref: 'Norsk Industri — HOP Guide',
        title: 'Safety, Leadership and Learning — HOP in Practice',
        body: 'Norsk Industri (Federation of Norwegian Industries)',
        year: '2024 (updated edition)',
        relevance: 'A comprehensive practical guide to Human and Organisational Performance (HOP). Covers safety indicators, Just Culture principles, incident report writing, and proactive safety management. Directly informs the tool\'s HOP assessment framework and interview approach.',
        steps: ['Step 5 — HOP Assessment', 'Step 2 — Stakeholder Interviews', 'Step 7 — Investigation Report'],
        url: 'https://www.norskindustri.no/hms-og-ia/safety-leadership-learning/',
      },
    ],
  },
  {
    group: 'International Standards',
    icon: Globe,
    colour: 'blue',
    standards: [
      {
        ref: 'ISO 45001:2018',
        title: 'Occupational Health and Safety Management Systems — Requirements with Guidance for Use',
        body: 'International Organisation for Standardisation (ISO)',
        year: '2018',
        relevance: 'The international standard for OHS management systems. Incident investigation requirements are defined in Clause 10.2 (Incident, nonconformity, and corrective action). Informs the recommendations stage and the overall investigation management framework.',
        steps: ['Step 1 — Incident Overview', 'Step 6 — Recommendations'],
        url: '',
      },
      {
        ref: 'ISO 14001:2015',
        title: 'Environmental Management Systems — Requirements with Guidance for Use',
        body: 'International Organisation for Standardisation (ISO)',
        year: '2015',
        relevance: 'Applicable where incidents involve environmental consequences such as spills or releases. Informs environmental incident classification and the development of environmentally-focused corrective actions.',
        steps: ['Step 1 — Incident Classification', 'Step 6 — Recommendations'],
        url: '',
      },
    ],
  },
  {
    group: 'American Petroleum Institute',
    icon: Globe,
    colour: 'orange',
    standards: [
      {
        ref: 'API RP 754',
        title: 'Process Safety Performance Indicators for the Refining and Petrochemical Industries',
        body: 'American Petroleum Institute (API)',
        year: '2021 (3rd ed.)',
        relevance: 'Defines the Tier 1–4 Process Safety Event (PSE) classification system. Directly aligned with IOGP 456 for upstream operations. Informs severity classification and process safety event reporting at the point of investigation initiation.',
        steps: ['Step 1 — Severity Classification'],
        url: '',
      },
      {
        ref: 'API 770',
        title: "A Manager's Guide to Reducing Human Errors — Improving Human Performance in the Process Industries",
        body: 'American Petroleum Institute (API)',
        year: '',
        relevance: 'Provides practical guidance on human error reduction and human performance improvement in process industries. Informs the individual factors section of the HFAT assessment.',
        steps: ['Step 5 — Individual Factors (HFAT 4.2.1)'],
        url: '',
      },
    ],
  },
  {
    group: 'UK Health & Safety Executive',
    icon: Globe,
    colour: 'teal',
    standards: [
      {
        ref: 'HSE HSG48',
        title: 'Reducing Error and Influencing Behaviour',
        body: 'UK Health & Safety Executive (HSE)',
        year: '',
        relevance: 'The definitive UK HSE reference for human error classification — slips, lapses, mistakes, and violations. Directly informs the individual factors section of the HFAT assessment and the error type classification used throughout the tool.',
        steps: ['Step 5 — Individual Factors (HFAT 4.2.1)'],
        url: '',
      },
      {
        ref: 'HSE HSG65',
        title: 'Managing for Health and Safety',
        body: 'UK Health & Safety Executive (HSE)',
        year: '',
        relevance: 'Provides the POPMAR model for health and safety management. Informs the identification of management system failures as organisational causal factors.',
        steps: ['Step 5 — Organisational Factors (HFAT 4.2.3)', 'Step 6 — Recommendations'],
        url: '',
      },
    ],
  },
  {
    group: 'Energy Institute',
    icon: Globe,
    colour: 'yellow',
    standards: [
      {
        ref: 'EI — Learning from Incidents',
        title: 'Learning from Incidents, Accidents and Events',
        body: 'Energy Institute (EI) / HPOG',
        year: '2016',
        relevance: 'A comprehensive resource covering the full Learning from Incidents lifecycle — from reporting through investigation to embedding learning. Cited alongside IOGP 621 throughout industry literature as a companion reference. Covers information gathering, interviewing, causal analysis, and reporting.',
        steps: ['Step 2 — Evidence & Interviews', 'Step 3 — Timeline', 'Step 5 — Causal Factor Analysis', 'Step 7 — Investigation Report'],
        url: '',
      },
      {
        ref: 'EI — HF & Incidents Guidance',
        title: 'Guidance on Investigating and Analysing Human and Organisational Factors Aspects of Incidents and Accidents',
        body: 'Energy Institute (EI)',
        year: '2008',
        relevance: 'An earlier but foundational EI publication on HOF investigation methodology. Directly informed the development of IOGP 621 and provides the theoretical underpinning for the HOP and HFAT assessment approaches in the tool.',
        steps: ['Step 5 — HOP Assessment', 'Step 5 — HFAT Assessment'],
        url: '',
      },
    ],
  },
  {
    group: 'Center for Chemical Process Safety',
    icon: Globe,
    colour: 'indigo',
    standards: [
      {
        ref: 'CCPS — Investigating PSIs',
        title: 'Guidelines for Investigating Process Safety Incidents',
        body: 'Center for Chemical Process Safety (CCPS) / AIChE',
        year: '',
        relevance: 'A comprehensive reference for process safety incident investigation methodology, widely used in upstream oil and gas. Provides detailed guidance on team composition, evidence gathering, causal analysis techniques, and report writing.',
        steps: ['Step 2 — Evidence & Interviews', 'Step 5 — Causal Factor Analysis'],
        url: '',
      },
      {
        ref: 'CCPS/EI — Bow Ties in Risk Management',
        title: 'Bow Ties in Risk Management — A Concept Book for Process Safety',
        body: 'CCPS / Energy Institute',
        year: '2018',
        relevance: 'The definitive reference for bow-tie methodology in process safety. Provides the conceptual basis for the tool\'s bow-tie barrier analysis diagram and the Prevention / Mitigation barrier classification.',
        steps: ['Step 4 — Barrier Analysis', 'Step 4 — Swiss Cheese / Bow-Tie Diagram'],
        url: '',
      },
    ],
  },
  {
    group: 'Australian Offshore Regulator',
    icon: Globe,
    colour: 'green',
    standards: [
      {
        ref: 'NOPSEMA',
        title: 'Investigation Guidelines for Offshore Petroleum Operations',
        body: 'National Offshore Petroleum Safety and Environmental Management Authority (NOPSEMA)',
        year: '',
        relevance: 'The primary regulatory framework governing incident investigations for offshore petroleum operations in Australia. The tool\'s investigation structure and report format are designed to be consistent with NOPSEMA\'s expectations for systematic causal factor analysis and documented corrective actions.',
        steps: ['Step 1 — Incident Overview', 'Step 5 — Causal Factor Analysis', 'Step 7 — Investigation Report'],
        url: 'https://www.nopsema.gov.au',
      },
    ],
  },
];

const colourMap: Record<string, { bg: string; border: string; text: string; badge: string; dot: string }> = {
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500' },
  amber:  { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  green:  { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  badge: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  slate:  { bg: 'bg-slate-50',  border: 'border-slate-200',  text: 'text-slate-700',  badge: 'bg-slate-100 text-slate-700',  dot: 'bg-slate-500' },
  red:    { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    badge: 'bg-red-100 text-red-700',    dot: 'bg-red-500' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  teal:   { bg: 'bg-teal-50',   border: 'border-teal-200',   text: 'text-teal-700',   badge: 'bg-teal-100 text-teal-700',   dot: 'bg-teal-500' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ReportCard({ report, colour }: { report: any; colour: string }) {
  const [expanded, setExpanded] = useState(false);
  const c = colourMap[colour] || colourMap.slate;

  return (
    <div className={`border rounded-lg overflow-hidden transition-shadow hover:shadow-sm ${c.border}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full text-left p-4 flex items-start gap-3 ${c.bg}`}
      >
        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${c.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-bold ${c.text}`}>{report.ref}</span>
            {report.year && (
              <span className="text-xs text-slate-500">{report.year}</span>
            )}
          </div>
          <p className="text-sm text-slate-700 mt-0.5 leading-snug">{report.title}</p>
          {report.body && (
            <p className="text-xs text-slate-500 mt-0.5">{report.body}</p>
          )}
        </div>
        <div className="flex-shrink-0 mt-0.5">
          {expanded
            ? <ChevronDown className="w-4 h-4 text-slate-400" />
            : <ChevronRight className="w-4 h-4 text-slate-400" />
          }
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-3 bg-white border-t border-slate-100">
          <p className="text-sm text-slate-600 leading-relaxed mb-3">{report.relevance}</p>
          <div className="flex flex-wrap gap-2">
            {(report.steps || []).map((step: string) => (
              <span key={step} className={`text-xs px-2 py-1 rounded-full font-medium ${c.badge}`}>
                {step}
              </span>
            ))}
          </div>
          {report.url && (
            <a
              href={report.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 text-xs mt-3 font-medium ${c.text} hover:underline`}
            >
              <ExternalLink className="w-3 h-3" />
              Visit source
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function GroupSection({ group, colour, icon: Icon, items }: { group: string; colour: string; icon: any; items: any[] }) {
  const c = colourMap[colour] || colourMap.slate;
  return (
    <div className="mb-8">
      <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${c.border}`}>
        <Icon className={`w-4 h-4 ${c.text}`} />
        <h3 className={`text-sm font-semibold uppercase tracking-wide ${c.text}`}>{group}</h3>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <ReportCard key={i} report={item} colour={colour} />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function StandardsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'iogp' | 'external' | 'mapping'>('iogp');

  const stepMappings = [
    {
      step: 'Step 1 — Incident Overview',
      refs: ['IOGP 517', 'IOGP 459', 'IOGP 2022su / 2024su', 'IOGP 456', 'API RP 754', 'ISO 45001 Cl. 10.2', 'NOPSEMA'],
    },
    {
      step: 'Step 2 — Evidence & Interviews',
      refs: ['IOGP 621 §3', 'Norsk Industri HOP Guide', 'EI — Learning from Incidents', 'CCPS — Investigating PSIs'],
    },
    {
      step: 'Step 3 — Incident Timeline',
      refs: ['IOGP 621 §3.3', 'EI — Learning from Incidents'],
    },
    {
      step: 'Step 4 — Causal Visualisations',
      refs: ['IOGP 621 §4.1–4.2 (5 Whys, Causal Tree)', 'IOGP 544 (Barriers / Bow-Tie)', 'IOGP 415 (Swiss Cheese)', 'CCPS/EI Bow Ties in Risk Management'],
    },
    {
      step: 'Step 5 — Causal Factor Analysis',
      refs: ['IOGP 621 §4.2.1 (Individual Factors)', 'IOGP 621 §4.2.2 (Task & Work Factors)', 'IOGP 621 §4.2.3 (Organisational Factors)', 'IOGP 621 §4.3 (HOP)', 'IOGP 621 §5 (Just Culture)', 'IOGP 459 (Just Culture / LSR)', 'IOGP 638 (PSF)', 'IOGP 452 / 453 (Safety Culture & Leadership)', 'IOGP 510 / 511 (OMS Elements)', 'IOGP 423 (Contractor Management)', 'Norsk Industri HOP Guide', 'API 770', 'HSE HSG48', 'EI — HF & Incidents Guidance'],
    },
    {
      step: 'Step 6 — Recommendations',
      refs: ['ISO 45001 (Hierarchy of Controls)', 'IOGP 544 (Barrier Hierarchy)', 'IOGP 456 / IOGP 556 (Leading Indicators)', 'IOGP 452 / 453 (Leadership Recommendations)', 'HSE HSG65 (Management System)'],
    },
    {
      step: 'Step 7 — Investigation Report',
      refs: ['IOGP 621', 'IOGP 517', 'IOGP 552 (Organisational Learning)', 'IOGP 642 (Learning from Normal Work)', 'Norsk Industri HOP Guide', 'EI — Learning from Incidents', 'CCPS — Driving Continuous Improvement', 'NOPSEMA Investigation Guidelines'],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1.5"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </button>
              <span className="text-slate-300">/</span>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-slate-900">Standards & References</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Intro */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Industry Standards & Reference Framework</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            This investigation tool is designed in alignment with recognised industry standards and published guidance rather than proprietary methodologies.
            The frameworks listed here underpin the tool's workflow, analysis categories, terminology, and report structure. Each reference is mapped
            to the specific step or feature it informs.
          </p>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700 leading-relaxed">
              <span className="font-semibold">Framework alignment: </span>
              IOGP Reports 415, 423, 452, 453, 456, 459, 510, 511, 517, 544, 552, 621, 638, 642 and the IOGP Safety Data Reporting User Guide &bull; ISO 45001:2018 &bull; API RP 754 &bull; UK HSE HSG48 / HSG65 &bull; Energy Institute Learning from Incidents (2016) &bull; Norsk Industri — Safety, Leadership and Learning: HOP in Practice (2024) &bull; NOPSEMA Investigation Guidelines
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-6">
          {[
            { key: 'iogp',     label: 'IOGP Reports' },
            { key: 'external', label: 'Industry & Regulatory Standards' },
            { key: 'mapping',  label: 'Step-by-Step Mapping' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* IOGP Reports Tab */}
        {activeTab === 'iogp' && (
          <div>
            <p className="text-sm text-slate-500 mb-5">
              Click any report to expand its description and see which steps it informs.
              All IOGP publications are available via{' '}
              <a href="https://www.iogp.org/bookstore" target="_blank" rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-0.5">
                iogp.org/bookstore <ExternalLink className="w-3 h-3" />
              </a>.
            </p>
            {iogpReports.map((group) => (
              <GroupSection
                key={group.group}
                group={group.group}
                colour={group.colour}
                icon={group.icon}
                items={group.reports}
              />
            ))}
          </div>
        )}

        {/* External Standards Tab */}
        {activeTab === 'external' && (
          <div>
            <p className="text-sm text-slate-500 mb-5">
              These standards and publications complement the IOGP framework and provide additional depth in specific areas of the investigation workflow.
            </p>
            {externalStandards.map((group) => (
              <GroupSection
                key={group.group}
                group={group.group}
                colour={group.colour}
                icon={group.icon}
                items={group.standards}
              />
            ))}
          </div>
        )}

        {/* Step Mapping Tab */}
        {activeTab === 'mapping' && (
          <div>
            <p className="text-sm text-slate-500 mb-5">
              A quick-reference view of which standards apply to each step of the investigation workflow.
            </p>
            <div className="space-y-3">
              {stepMappings.map((mapping, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900">{mapping.step}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {mapping.refs.map((ref) => (
                      <span key={ref} className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full font-medium border border-slate-200">
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
