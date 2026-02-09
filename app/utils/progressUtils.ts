// ============================================================================
// PROGRESS UTILITIES
// Investigation Tool - Step Progress Calculation and Status Management
// Created: 3 February 2026
// ============================================================================

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type StepStatus = 'not_started' | 'in_progress' | 'complete' | 'attention_required';

export interface ValidationWarning {
  severity: 'info' | 'warning' | 'critical';
  message: string;
  action?: string;
}

export interface StepProgress {
  stepNumber: number;
  stepName: string;
  status: StepStatus;
  itemsCount: number;
  itemsComplete: number;
  percentComplete: number;
  warnings: ValidationWarning[];
  lastUpdated: Date | null;
}

export interface InvestigationProgress {
  investigationId: string;
  steps: StepProgress[];
  overallProgress: number;
  lastActivity: Date | null;
}

export interface ActivityLogEntry {
  id: string;
  activityType: string;
  stepNumber: number | null;
  itemType: string | null;
  description: string;
  createdAt: Date;
}

export interface OutstandingItem {
  stepNumber: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  action: string;
  count?: number;
}

// ============================================================================
// STEP CONFIGURATION
// ============================================================================

export const INVESTIGATION_STEPS = [
  { number: 1, name: 'Investigation Initiation' },
  { number: 2, name: 'Data Collection & Evidence' },
  { number: 3, name: 'Timeline Construction' },
  { number: 4, name: 'Visualisations' },
  { number: 5, name: 'Causal Factor Analysis' },
  { number: 6, name: 'Recommendations Development' },
  { number: 7, name: 'Report Generation' }
];

// ============================================================================
// PROGRESS CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate progress for Step 1: Investigation Initiation
 */
export async function calculateStep1Progress(investigationId: string): Promise<StepProgress> {
  const supabase = createClientComponentClient();
  const warnings: ValidationWarning[] = [];

  const { data: investigation, error } = await supabase
    .from('investigations')
    .select('*')
    .eq('id', investigationId)
    .single();

  if (error || !investigation) {
    return {
      stepNumber: 1,
      stepName: 'Investigation Initiation',
      status: 'not_started',
      itemsCount: 0,
      itemsComplete: 0,
      percentComplete: 0,
      warnings: [],
      lastUpdated: null
    };
  }

  const requiredFields = [
    'incident_date',
    'location_facility',
    'incident_type',
    'incident_description'
  ];

  let completedFields = 0;
  requiredFields.forEach(field => {
    if (investigation[field]) completedFields++;
  });

  let status: StepStatus = 'not_started';
  if (completedFields === 0) {
    status = 'not_started';
  } else if (completedFields < requiredFields.length) {
    status = 'in_progress';
    warnings.push({
      severity: 'warning',
      message: `${requiredFields.length - completedFields} required fields incomplete`,
      action: 'Complete all incident details to proceed effectively'
    });
  } else {
    status = 'complete';
  }

  if (!investigation.investigation_leader) {
    warnings.push({
      severity: 'info',
      message: 'No lead investigator assigned',
      action: 'Assign a lead investigator to ensure accountability'
    });
  }

  return {
    stepNumber: 1,
    stepName: 'Investigation Initiation',
    status,
    itemsCount: requiredFields.length,
    itemsComplete: completedFields,
    percentComplete: Math.round((completedFields / requiredFields.length) * 100),
    warnings,
    lastUpdated: investigation.updated_at ? new Date(investigation.updated_at) : null
  };
}

/**
 * Calculate progress for Step 2: Data Collection & Evidence
 */
export async function calculateStep2Progress(investigationId: string): Promise<StepProgress> {
  const supabase = createClientComponentClient();
  const warnings: ValidationWarning[] = [];

  const { data: evidence } = await supabase
    .from('evidence')
    .select('id')
    .eq('investigation_id', investigationId);

  const { data: interviews } = await supabase
    .from('interviews')
    .select('id')
    .eq('investigation_id', investigationId);

  const evidenceCount = evidence?.length || 0;
  const interviewCount = interviews?.length || 0;
  const totalItems = evidenceCount + interviewCount;

  let status: StepStatus = 'not_started';
  if (totalItems === 0) {
    status = 'not_started';
  } else if (evidenceCount === 0 || interviewCount === 0) {
    status = 'in_progress';
    if (evidenceCount === 0) {
      warnings.push({
        severity: 'warning',
        message: 'No evidence items collected',
        action: 'Add evidence documents, photos, or files to support findings'
      });
    }
    if (interviewCount === 0) {
      warnings.push({
        severity: 'warning',
        message: 'No interviews conducted',
        action: 'Interview witnesses and involved personnel'
      });
    }
  } else {
    status = 'complete';
  }

  if (interviewCount > 0 && interviewCount < 2) {
    warnings.push({
      severity: 'info',
      message: 'Limited witness perspectives',
      action: 'Consider interviewing additional personnel for comprehensive understanding'
    });
  }

  return {
    stepNumber: 2,
    stepName: 'Data Collection & Evidence',
    status,
    itemsCount: totalItems,
    itemsComplete: totalItems,
    percentComplete: totalItems > 0 ? 100 : 0,
    warnings,
    lastUpdated: new Date()
  };
}

/**
 * Calculate progress for Step 3: Timeline Construction
 */
export async function calculateStep3Progress(investigationId: string): Promise<StepProgress> {
  const supabase = createClientComponentClient();
  const warnings: ValidationWarning[] = [];

  const { data: events } = await supabase
    .from('timeline_events')
    .select('*')
    .eq('investigation_id', investigationId)
    .order('event_date', { ascending: true });

  const totalEvents = events?.length || 0;
  const verifiedEvents = events?.filter(e => e.verification_status === 'verified').length || 0;

  let status: StepStatus = 'not_started';
  if (totalEvents === 0) {
    status = 'not_started';
  } else if (verifiedEvents < totalEvents) {
    status = 'in_progress';
    const unverifiedCount = totalEvents - verifiedEvents;
    warnings.push({
      severity: 'warning',
      message: `${unverifiedCount} timeline event${unverifiedCount > 1 ? 's' : ''} remain unverified`,
      action: 'Verify all events with supporting evidence before proceeding to analysis'
    });
  } else if (totalEvents < 3) {
    status = 'in_progress';
    warnings.push({
      severity: 'warning',
      message: 'Timeline may be incomplete',
      action: 'Ensure timeline captures key events before, during, and after incident'
    });
  } else {
    status = 'complete';
  }

  return {
    stepNumber: 3,
    stepName: 'Timeline Construction',
    status,
    itemsCount: totalEvents,
    itemsComplete: verifiedEvents,
    percentComplete: totalEvents > 0 ? Math.round((verifiedEvents / totalEvents) * 100) : 0,
    warnings,
    lastUpdated: new Date()
  };
}

/**
 * Calculate progress for Step 4: Visualisations
 */
export async function calculateStep4Progress(investigationId: string): Promise<StepProgress> {
  const supabase = createClientComponentClient();
  const warnings: ValidationWarning[] = [];

  const { data: causalFactors } = await supabase
    .from('causal_factors')
    .select('*')
    .eq('investigation_id', investigationId);

  const totalFactors = causalFactors?.length || 0;

  let status: StepStatus = 'not_started';
  if (totalFactors === 0) {
    status = 'not_started';
  } else if (totalFactors < 3) {
    status = 'in_progress';
    warnings.push({
      severity: 'info',
      message: 'Limited causal factors identified',
      action: 'Consider using 5 Whys or Causal Tree to identify additional factors'
    });
  } else {
    status = 'complete';
  }

  return {
    stepNumber: 4,
    stepName: 'Visualisations',
    status,
    itemsCount: totalFactors,
    itemsComplete: totalFactors,
    percentComplete: totalFactors > 0 ? 100 : 0,
    warnings,
    lastUpdated: new Date()
  };
}

/**
 * Calculate progress for Step 5: Causal Factor Analysis
 */
export async function calculateStep5Progress(investigationId: string): Promise<StepProgress> {
  const supabase = createClientComponentClient();
  const warnings: ValidationWarning[] = [];

  const { data: causalFactors } = await supabase
    .from('causal_factors')
    .select('*')
    .eq('investigation_id', investigationId);

  const totalFactors = causalFactors?.length || 0;

  if (totalFactors === 0) {
    return {
      stepNumber: 5,
      stepName: 'Causal Factor Analysis',
      status: 'not_started',
      itemsCount: 0,
      itemsComplete: 0,
      percentComplete: 0,
      warnings: [{
        severity: 'warning',
        message: 'No causal factors identified',
        action: 'Complete Step 4 visualisations to identify causal factors'
      }],
      lastUpdated: null
    };
  }

  const { data: hfatAssessments } = await supabase
    .from('hfat_assessments')
    .select('causal_factor_id')
    .eq('investigation_id', investigationId);

  const { data: hopAssessments } = await supabase
    .from('hop_assessments')
    .select('causal_factor_id')
    .eq('investigation_id', investigationId);

  const assessedFactors = new Set([
    ...(hfatAssessments?.map(a => a.causal_factor_id) || []),
    ...(hopAssessments?.map(a => a.causal_factor_id) || [])
  ]);

  const assessedCount = assessedFactors.size;

  let status: StepStatus = 'in_progress';
  if (assessedCount === 0) {
    warnings.push({
      severity: 'warning',
      message: 'No causal factors have been assessed with HFAT or HOP',
      action: 'Apply HFAT or HOP analysis to understand underlying factors'
    });
  } else if (assessedCount < totalFactors) {
    warnings.push({
      severity: 'info',
      message: `${totalFactors - assessedCount} causal factor${totalFactors - assessedCount > 1 ? 's' : ''} not yet assessed`,
      action: 'Consider assessing all significant causal factors'
    });
  } else {
    status = 'complete';
  }

  return {
    stepNumber: 5,
    stepName: 'Causal Factor Analysis',
    status,
    itemsCount: totalFactors,
    itemsComplete: assessedCount,
    percentComplete: totalFactors > 0 ? Math.round((assessedCount / totalFactors) * 100) : 0,
    warnings,
    lastUpdated: new Date()
  };
}

/**
 * Calculate progress for Step 6: Recommendations Development
 */
export async function calculateStep6Progress(investigationId: string): Promise<StepProgress> {
  const supabase = createClientComponentClient();
  const warnings: ValidationWarning[] = [];

  const { data: causalFactors } = await supabase
    .from('causal_factors')
    .select('id')
    .eq('investigation_id', investigationId);

  const totalFactors = causalFactors?.length || 0;

  const { data: recommendations } = await supabase
    .from('recommendations')
    .select('*')
    .eq('investigation_id', investigationId);

  const totalRecommendations = recommendations?.length || 0;

  const completeRecommendations = recommendations?.filter(
    r => r.responsibility && r.target_date
  ).length || 0;

  let status: StepStatus = 'not_started';
  if (totalRecommendations === 0) {
    status = 'not_started';
    if (totalFactors > 0) {
      warnings.push({
        severity: 'warning',
        message: 'No recommendations developed',
        action: 'Create SMART recommendations to address identified causal factors'
      });
    }
  } else if (completeRecommendations < totalRecommendations) {
    status = 'in_progress';
    const incompleteCount = totalRecommendations - completeRecommendations;
    warnings.push({
      severity: 'warning',
      message: `${incompleteCount} recommendation${incompleteCount > 1 ? 's' : ''} lack owner or due date`,
      action: 'Assign owners and target dates to ensure accountability'
    });
  } else {
    status = 'complete';
  }

  return {
    stepNumber: 6,
    stepName: 'Recommendations Development',
    status,
    itemsCount: totalRecommendations,
    itemsComplete: completeRecommendations,
    percentComplete: totalRecommendations > 0 ? Math.round((completeRecommendations / totalRecommendations) * 100) : 0,
    warnings,
    lastUpdated: new Date()
  };
}

/**
 * Calculate progress for Step 7: Report Generation
 */
export async function calculateStep7Progress(investigationId: string): Promise<StepProgress> {
  const supabase = createClientComponentClient();
  const warnings: ValidationWarning[] = [];

  const { data: investigation } = await supabase
    .from('investigations')
    .select('status, completion_date')
    .eq('id', investigationId)
    .single();

  let status: StepStatus = 'not_started';
  
  if (!investigation?.completion_date) {
    status = 'not_started';
    warnings.push({
      severity: 'info',
      message: 'Report not yet generated',
      action: 'Generate formal investigation report when analysis is complete'
    });
  } else if (investigation.status !== 'closed') {
    status = 'in_progress';
    warnings.push({
      severity: 'info',
      message: 'Report generated but investigation not finalised',
      action: 'Review and mark investigation as closed when complete'
    });
  } else {
    status = 'complete';
  }

  return {
    stepNumber: 7,
    stepName: 'Report Generation',
    status,
    itemsCount: 1,
    itemsComplete: investigation?.completion_date ? 1 : 0,
    percentComplete: investigation?.completion_date ? 100 : 0,
    warnings,
    lastUpdated: investigation?.completion_date ? new Date(investigation.completion_date) : null
  };
}

// ============================================================================
// MASTER PROGRESS CALCULATION
// ============================================================================

export async function calculateInvestigationProgress(
  investigationId: string
): Promise<InvestigationProgress> {
  const stepPromises = [
    calculateStep1Progress(investigationId),
    calculateStep2Progress(investigationId),
    calculateStep3Progress(investigationId),
    calculateStep4Progress(investigationId),
    calculateStep5Progress(investigationId),
    calculateStep6Progress(investigationId),
    calculateStep7Progress(investigationId)
  ];

  const steps = await Promise.all(stepPromises);

  const overallProgress = Math.round(
    steps.reduce((sum, step) => sum + step.percentComplete, 0) / steps.length
  );

  const lastActivity = steps
    .map(s => s.lastUpdated)
    .filter((date): date is Date => date !== null)
    .sort((a, b) => b.getTime() - a.getTime())[0] || null;

  return {
    investigationId,
    steps,
    overallProgress,
    lastActivity
  };
}

export async function updateInvestigationProgress(
  investigationId: string
): Promise<InvestigationProgress> {
  const supabase = createClientComponentClient();
  
  const progress = await calculateInvestigationProgress(investigationId);

  for (const step of progress.steps) {
    await supabase
      .from('investigation_progress')
      .upsert({
        investigation_id: investigationId,
        step_number: step.stepNumber,
        status: step.status,
        items_count: step.itemsCount,
        items_complete: step.itemsComplete,
        validation_warnings: step.warnings,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'investigation_id,step_number'
      });
  }

  return progress;
}

export async function fetchCachedProgress(
  investigationId: string
): Promise<InvestigationProgress | null> {
  const supabase = createClientComponentClient();

  const { data, error } = await supabase
    .from('investigation_progress')
    .select('*')
    .eq('investigation_id', investigationId)
    .order('step_number');

  if (error || !data || data.length === 0) {
    return null;
  }

  const stepNames = [
    'Investigation Initiation',
    'Data Collection & Evidence',
    'Timeline Construction',
    'Visualisations',
    'Causal Factor Analysis',
    'Recommendations Development',
    'Report Generation'
  ];

  const steps: StepProgress[] = data.map(row => ({
    stepNumber: row.step_number,
    stepName: stepNames[row.step_number - 1],
    status: row.status as StepStatus,
    itemsCount: row.items_count,
    itemsComplete: row.items_complete,
    percentComplete: row.items_count > 0 
      ? Math.round((row.items_complete / row.items_count) * 100) 
      : 0,
    warnings: row.validation_warnings as ValidationWarning[],
    lastUpdated: row.last_updated ? new Date(row.last_updated) : null
  }));

  const overallProgress = Math.round(
    steps.reduce((sum, step) => sum + step.percentComplete, 0) / steps.length
  );

  const lastActivity = steps
    .map(s => s.lastUpdated)
    .filter((date): date is Date => date !== null)
    .sort((a, b) => b.getTime() - a.getTime())[0] || null;

  return {
    investigationId,
    steps,
    overallProgress,
    lastActivity
  };
}

// ============================================================================
// ACTIVITY LOGGING
// ============================================================================

export async function logActivity(
  investigationId: string,
  activityType: string,
  stepNumber: number | null,
  itemType: string | null,
  itemId: string | null,
  description: string
): Promise<void> {
  const supabase = createClientComponentClient();

  await supabase.from('investigation_activity').insert({
    investigation_id: investigationId,
    activity_type: activityType,
    step_number: stepNumber,
    item_type: itemType,
    item_id: itemId,
    description: description
  });
}

export async function fetchRecentActivity(
  investigationId: string,
  limit: number = 10
): Promise<ActivityLogEntry[]> {
  const supabase = createClientComponentClient();

  const { data, error } = await supabase
    .from('investigation_activity')
    .select('*')
    .eq('investigation_id', investigationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map(row => ({
    id: row.id,
    activityType: row.activity_type,
    stepNumber: row.step_number,
    itemType: row.item_type,
    description: row.description,
    createdAt: new Date(row.created_at)
  }));
}

// ============================================================================
// RELATIONSHIP MANAGEMENT
// ============================================================================

export async function createRelationship(
  investigationId: string,
  sourceType: string,
  sourceId: string,
  targetType: string,
  targetId: string,
  relationshipType: string,
  notes?: string
): Promise<void> {
  const supabase = createClientComponentClient();

  await supabase.from('item_relationships').insert({
    investigation_id: investigationId,
    source_type: sourceType,
    source_id: sourceId,
    target_type: targetType,
    target_id: targetId,
    relationship_type: relationshipType,
    notes
  });
}

export async function fetchRelationships(
  itemType: string,
  itemId: string
): Promise<any[]> {
  const supabase = createClientComponentClient();

  const { data: asSource } = await supabase
    .from('item_relationships')
    .select('*')
    .eq('source_type', itemType)
    .eq('source_id', itemId);

  const { data: asTarget } = await supabase
    .from('item_relationships')
    .select('*')
    .eq('target_type', itemType)
    .eq('target_id', itemId);

  return [...(asSource || []), ...(asTarget || [])];
}

export async function deleteRelationship(relationshipId: string): Promise<void> {
  const supabase = createClientComponentClient();

  await supabase
    .from('item_relationships')
    .delete()
    .eq('id', relationshipId);
}

// ============================================================================
// OUTSTANDING ITEMS DETECTION
// ============================================================================

export async function fetchOutstandingItems(
  investigationId: string
): Promise<OutstandingItem[]> {
  const progress = await calculateInvestigationProgress(investigationId);
  const outstanding: OutstandingItem[] = [];

  progress.steps.forEach(step => {
    step.warnings.forEach(warning => {
      outstanding.push({
        stepNumber: step.stepNumber,
        severity: warning.severity,
        message: warning.message,
        action: warning.action || ''
      });
    });
  });

  const severityOrder = { critical: 0, warning: 1, info: 2 };
  outstanding.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return outstanding;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

export async function initializeProgressTracking(investigationId: string): Promise<void> {
  const supabase = createClientComponentClient();

  await supabase.rpc('initialize_investigation_progress', {
    inv_id: investigationId
  });

  await logActivity(
    investigationId,
    'investigation_created',
    1,
    'investigation',
    investigationId,
    'Investigation created and progress tracking initialized'
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getStepName(stepNumber: number): string {
  const names = [
    'Investigation Initiation',
    'Data Collection & Evidence',
    'Timeline Construction',
    'Visualisations',
    'Causal Factor Analysis',
    'Recommendations Development',
    'Report Generation'
  ];
  return names[stepNumber - 1] || 'Unknown Step';
}

export function getStatusColour(status: StepStatus): string {
  switch (status) {
    case 'complete':
      return 'bg-green-500';
    case 'in_progress':
      return 'bg-amber-500';
    case 'attention_required':
      return 'bg-red-500';
    default:
      return 'bg-grey-400';
  }
}

export function getStatusTextColour(status: StepStatus): string {
  switch (status) {
    case 'complete':
      return 'text-green-700';
    case 'in_progress':
      return 'text-amber-700';
    case 'attention_required':
      return 'text-red-700';
    default:
      return 'text-grey-700';
  }
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}
