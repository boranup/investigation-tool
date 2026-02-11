// ============================================================================
// INVESTIGATION DASHBOARD
// Main landing page for investigation with progress tracking and navigation
// Path: app/investigation/[id]/dashboard/page.tsx
// Created: 3 February 2026
// COMPLETE FILE - Ready to use as-is
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Circle,
  ChevronRight,
  TrendingUp,
  FileText,
  Calendar,
  AlertTriangle,
  BarChart3,
  ArrowRight
} from 'lucide-react';

import {
  calculateInvestigationProgress,
  fetchCachedProgress,
  fetchRecentActivity,
  fetchOutstandingItems,
  updateInvestigationProgress,
  getStatusColour,
  getStatusTextColour,
  formatRelativeTime,
  type InvestigationProgress,
  type StepProgress,
  type ActivityLogEntry,
  type OutstandingItem,
  type StepStatus
} from '@/utils/progressUtils';

import { supabase } from '@/lib/supabase';

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export default function InvestigationDashboard() {
  const params = useParams();
  const router = useRouter();
  const investigationId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [investigation, setInvestigation] = useState<any>(null);
  const [progress, setProgress] = useState<InvestigationProgress | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityLogEntry[]>([]);
  const [outstandingItems, setOutstandingItems] = useState<OutstandingItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    console.log('Dashboard params:', params);
    console.log('Investigation ID:', investigationId);
    if (investigationId) {
      loadDashboardData();
    }
  }, [investigationId]);

  const loadDashboardData = async () => {
    setLoading(true);

    try {
      const { data: invData, error: invError } = await supabase
        .from('investigations')
        .select('*')
        .eq('id', investigationId)
        .single();

      if (invError) throw invError;
      setInvestigation(invData);

      let progressData = await fetchCachedProgress(investigationId);

      if (!progressData) {
        progressData = await calculateInvestigationProgress(investigationId);
        await updateInvestigationProgress(investigationId);
      }

      setProgress(progressData);

      const activity = await fetchRecentActivity(investigationId, 10);
      setRecentActivity(activity);

      const outstanding = await fetchOutstandingItems(investigationId);
      setOutstandingItems(outstanding);

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshProgress = async () => {
    setRefreshing(true);
    try {
      const progressData = await calculateInvestigationProgress(investigationId);
      await updateInvestigationProgress(investigationId);
      setProgress(progressData);

      const outstanding = await fetchOutstandingItems(investigationId);
      setOutstandingItems(outstanding);
    } catch (error) {
      console.error('Error refreshing progress:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const navigateToStep = (stepNumber: number) => {
    const stepRoutes = [
      `/step1?investigationId=${investigationId}`,
      `/step2?investigationId=${investigationId}`,
      `/step3?investigationId=${investigationId}`,
      `/step4?investigationId=${investigationId}`,
      `/step5?investigationId=${investigationId}`,
      `/step6?investigationId=${investigationId}`,
      `/step7?investigationId=${investigationId}`
    ];
    router.push(stepRoutes[stepNumber - 1]);
  };

  const getStatusIcon = (status: StepStatus) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'attention_required':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Circle className="w-5 h-5 text-grey-400" />;
    }
  };

  const getSeverityIcon = (severity: 'info' | 'warning' | 'critical') => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityColour = (severity: 'info' | 'warning' | 'critical') => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-grey-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-grey-600">Loading investigation dashboard...</p>
        </div>
      </div>
    );
  }

  if (!investigation || !progress) {
    return (
      <div className="min-h-screen bg-grey-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-grey-600">Investigation not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grey-50">
      <div className="bg-white border-b border-grey-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-grey-900">
                Investigation Dashboard
              </h1>
              <p className="mt-1 text-sm text-grey-600">
                {investigation.investigation_number || 'Investigation'} 
                {investigation.incident_date && (
                  <span className="ml-2">
                    • {new Date(investigation.incident_date).toLocaleDateString('en-GB')}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={handleRefreshProgress}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {refreshing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Refreshing...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  Refresh Progress
                </>
              )}
            </button>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-grey-700">
                Overall Progress
              </span>
              <span className="text-sm font-bold text-blue-600">
                {progress.overallProgress}%
              </span>
            </div>
            <div className="w-full bg-grey-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress.overallProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white rounded-lg shadow-sm border border-grey-200 p-6">
              <h2 className="text-lg font-semibold text-grey-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Investigation Summary
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-grey-600">Location</p>
                  <p className="font-medium text-grey-900">
                    {investigation.location_facility || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-grey-600">Type</p>
                  <p className="font-medium text-grey-900">
                    {investigation.incident_type || 'Not classified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-grey-600">Lead Investigator</p>
                  <p className="font-medium text-grey-900">
                    {investigation.investigation_leader || 'Not assigned'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-grey-600">Status</p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${investigation.status === 'closed' ? 'bg-green-100 text-green-800' : 
                        investigation.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                        'bg-grey-100 text-grey-800'}`}>
                      {investigation.status || 'Open'}
                    </span>
                    {investigation.high_potential && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        High Potential
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-grey-200 p-6">
              <h2 className="text-lg font-semibold text-grey-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Investigation Steps
              </h2>

              <div className="space-y-3">
                {progress.steps.map((step) => (
                  <StepProgressCard
                    key={step.stepNumber}
                    step={step}
                    onNavigate={() => navigateToStep(step.stepNumber)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            
            {outstandingItems.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-grey-200 p-6">
                <h2 className="text-lg font-semibold text-grey-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  Outstanding Items
                  <span className="ml-auto text-sm font-normal text-grey-600">
                    {outstandingItems.length}
                  </span>
                </h2>

                <div className="space-y-3">
                  {outstandingItems.slice(0, 5).map((item, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${getSeverityColour(item.severity)}`}
                    >
                      <div className="flex items-start gap-2">
                        {getSeverityIcon(item.severity)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-grey-900">
                            Step {item.stepNumber}: {item.message}
                          </p>
                          {item.action && (
                            <p className="text-xs text-grey-600 mt-1">
                              {item.action}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {outstandingItems.length > 5 && (
                  <p className="text-sm text-grey-600 mt-3 text-center">
                    +{outstandingItems.length - 5} more items
                  </p>
                )}
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-grey-200 p-6">
              <h2 className="text-lg font-semibold text-grey-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Recent Activity
              </h2>

              {recentActivity.length === 0 ? (
                <p className="text-sm text-grey-500 text-center py-4">
                  No recent activity
                </p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-grey-900">
                          {activity.description}
                        </p>
                        <p className="text-xs text-grey-500 mt-1">
                          {formatRelativeTime(activity.createdAt)}
                          {activity.stepNumber && (
                            <span className="ml-2">• Step {activity.stepNumber}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-grey-200 p-6">
              <h2 className="text-lg font-semibold text-grey-900 mb-4">
                Quick Actions
              </h2>

              <div className="space-y-2">
                <button
                  onClick={() => router.push(`/step2?investigationId=${investigationId}`)}
                  className="w-full px-4 py-3 bg-grey-50 hover:bg-grey-100 rounded-lg 
                           text-left flex items-center justify-between group"
                >
                  <span className="text-sm font-medium text-grey-900">Add Evidence</span>
                  <ArrowRight className="w-4 h-4 text-grey-400 group-hover:text-grey-600" />
                </button>

                <button
                  onClick={() => router.push(`/step3?investigationId=${investigationId}`)}
                  className="w-full px-4 py-3 bg-grey-50 hover:bg-grey-100 rounded-lg 
                           text-left flex items-center justify-between group"
                >
                  <span className="text-sm font-medium text-grey-900">Build Timeline</span>
                  <ArrowRight className="w-4 h-4 text-grey-400 group-hover:text-grey-600" />
                </button>

                <button
                  onClick={() => router.push(`/step7?investigationId=${investigationId}`)}
                  className="w-full px-4 py-3 bg-grey-50 hover:bg-grey-100 rounded-lg 
                           text-left flex items-center justify-between group"
                >
                  <span className="text-sm font-medium text-grey-900">Generate Report</span>
                  <ArrowRight className="w-4 h-4 text-grey-400 group-hover:text-grey-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STEP PROGRESS CARD COMPONENT
// ============================================================================

interface StepProgressCardProps {
  step: StepProgress;
  onNavigate: () => void;
}

function StepProgressCard({ step, onNavigate }: StepProgressCardProps) {
  const getStatusColour = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 border-green-300';
      case 'in_progress':
        return 'bg-amber-100 border-amber-300';
      case 'attention_required':
        return 'bg-red-100 border-red-300';
      default:
        return 'bg-grey-100 border-grey-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'attention_required':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Circle className="w-5 h-5 text-grey-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'complete':
        return 'Complete';
      case 'in_progress':
        return 'In Progress';
      case 'attention_required':
        return 'Needs Attention';
      default:
        return 'Not Started';
    }
  };

  return (
    <button
      onClick={onNavigate}
      className={`w-full p-4 rounded-lg border-2 transition-all hover:shadow-md group
                ${getStatusColour(step.status)}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-white border-2 border-grey-300 
                        flex items-center justify-center font-semibold text-sm text-grey-700">
            {step.stepNumber}
          </div>
        </div>

        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 mb-2">
            {getStatusIcon(step.status)}
            <h3 className="font-semibold text-grey-900">{step.stepName}</h3>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-grey-700">
              {getStatusText(step.status)}
            </span>
            {step.status !== 'not_started' && (
              <>
                <span className="text-xs text-grey-500">•</span>
                <span className="text-sm text-grey-600">
                  {step.itemsComplete}/{step.itemsCount} items
                </span>
              </>
            )}
          </div>

          {step.status !== 'not_started' && (
            <div className="w-full bg-white rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full transition-all duration-300
                  ${step.status === 'complete' ? 'bg-green-600' : 
                    step.status === 'in_progress' ? 'bg-amber-600' : 'bg-red-600'}`}
                style={{ width: `${step.percentComplete}%` }}
              ></div>
            </div>
          )}

          {step.warnings.length > 0 && (
            <div className="mt-2 space-y-1">
              {step.warnings.slice(0, 2).map((warning, index) => (
                <div
                  key={index}
                  className="text-xs text-grey-700 flex items-start gap-1"
                >
                  <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>{warning.message}</span>
                </div>
              ))}
              {step.warnings.length > 2 && (
                <p className="text-xs text-grey-600 ml-4">
                  +{step.warnings.length - 2} more warning{step.warnings.length - 2 > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 self-center">
          <ChevronRight className="w-5 h-5 text-grey-400 group-hover:text-grey-600 transition-colors" />
        </div>
      </div>
    </button>
  );
}
