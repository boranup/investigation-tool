// ============================================================================
// INVESTIGATION DASHBOARD - PART 1
// Main landing page for investigation with progress tracking and navigation
// Path: app/investigation/[id]/dashboard/page.tsx
// Created: 3 February 2026
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Circle,
  ChevronRight,
  TrendingUp,
  FileText,
  Users,
  Calendar,
  AlertTriangle,
  BarChart3,
  ArrowRight
} from 'lucide-react';

// Import progress utilities
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

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export default function InvestigationDashboard() {
  const params = useParams();
  const router = useRouter();
  const investigationId = params?.id as string;

  // State management
  const [loading, setLoading] = useState(true);
  const [investigation, setInvestigation] = useState<any>(null);
  const [progress, setProgress] = useState<InvestigationProgress | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityLogEntry[]>([]);
  const [outstandingItems, setOutstandingItems] = useState<OutstandingItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    if (investigationId) {
      loadDashboardData();
    }
  }, [investigationId]);

  const loadDashboardData = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // Load investigation details
      const { data: invData, error: invError } = await supabase
        .from('investigations')
        .select('*')
        .eq('id', investigationId)
        .single();

      if (invError) throw invError;
      setInvestigation(invData);

      // Try to load cached progress first (faster)
      let progressData = await fetchCachedProgress(investigationId);

      // If no cached data, calculate fresh
      if (!progressData) {
        progressData = await calculateInvestigationProgress(investigationId);
        await updateInvestigationProgress(investigationId);
      }

      setProgress(progressData);

      // Load recent activity
      const activity = await fetchRecentActivity(investigationId, 10);
      setRecentActivity(activity);

      // Load outstanding items
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
      'initiation',
      'evidence',
      'timeline',
      'visualisations',
      'analysis',
      'recommendations',
      'report'
    ];
    router.push(`/investigation/${investigationId}/${stepRoutes[stepNumber - 1]}`);
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

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

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-grey-50 flex items-centre justify-centre">
        <div className="text-centre">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-grey-600">Loading investigation dashboard...</p>
        </div>
      </div>
    );
  }

  if (!investigation || !progress) {
    return (
      <div className="min-h-screen bg-grey-50 flex items-centre justify-centre">
        <div className="text-centre">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-grey-600">Investigation not found</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-grey-50">
      {/* Header */}
      <div className="bg-white border-b border-grey-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-centre justify-between">
            <div>
              <h1 className="text-2xl font-bold text-grey-900">
                Investigation Dashboard
              </h1>
              <p className="mt-1 text-sm text-grey-600">
                {investigation.incident_title || 'Untitled Investigation'} 
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
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-centre gap-2"
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

          {/* Overall Progress Bar */}
          <div className="mt-6">
            <div className="flex items-centre justify-between mb-2">
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

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Progress & Navigation */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Investigation Summary Card */}
            <div className="bg-white rounded-lg shadow-sm border border-grey-200 p-6">
              <h2 className="text-lg font-semibold text-grey-900 mb-4 flex items-centre gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Investigation Summary
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-grey-600">Location</p>
                  <p className="font-medium text-grey-900">
                    {investigation.location || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-grey-600">Classification</p>
                  <p className="font-medium text-grey-900">
                    {investigation.actual_or_near_miss || 'Not classified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-grey-600">Lead Investigator</p>
                  <p className="font-medium text-grey-900">
                    {investigation.lead_investigator || 'Not assigned'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-grey-600">Status</p>
                  <div className="flex items-centre gap-2">
                    <span className={`inline-flex items-centre px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${investigation.status === 'closed' ? 'bg-green-100 text-green-800' : 
                        investigation.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                        'bg-grey-100 text-grey-800'}`}>
                      {investigation.status || 'Open'}
                    </span>
                    {investigation.high_potential && (
                      <span className="inline-flex items-centre px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        High Potential
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Step Progress Cards */}
            <div className="bg-white rounded-lg shadow-sm border border-grey-200 p-6">
              <h2 className="text-lg font-semibold text-grey-900 mb-4 flex items-centre gap-2">
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

          {/* Right Column - Activity & Alerts */}
          <div className="space-y-6">
            
            {/* Outstanding Items */}
            {outstandingItems.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-grey-200 p-6">
                <h2 className="text-lg font-semibold text-grey-900 mb-4 flex items-centre gap-2">
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
                  <p className="text-sm text-grey-600 mt-3 text-centre">
                    +{outstandingItems.length - 5} more items
                  </p>
                )}
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border border-grey-200 p-6">
              <h2 className="text-lg font-semibold text-grey-900 mb-4 flex items-centre gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Recent Activity
              </h2>

              {recentActivity.length === 0 ? (
                <p className="text-sm text-grey-500 text-centre py-4">
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

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-grey-200 p-6">
              <h2 className="text-lg font-semibold text-grey-900 mb-4">
                Quick Actions
              </h2>

              <div className="space-y-2">
                <button
                  onClick={() => router.push(`/investigation/${investigationId}/evidence`)}
                  className="w-full px-4 py-3 bg-grey-50 hover:bg-grey-100 rounded-lg 
                           text-left flex items-centre justify-between group"
                >
                  <span className="text-sm font-medium text-grey-900">Add Evidence</span>
                  <ArrowRight className="w-4 h-4 text-grey-400 group-hover:text-grey-600" />
                </button>

                <button
                  onClick={() => router.push(`/investigation/${investigationId}/timeline`)}
                  className="w-full px-4 py-3 bg-grey-50 hover:bg-grey-100 rounded-lg 
                           text-left flex items-centre justify-between group"
                >
                  <span className="text-sm font-medium text-grey-900">Build Timeline</span>
                  <ArrowRight className="w-4 h-4 text-grey-400 group-hover:text-grey-600" />
                </button>

                <button
                  onClick={() => router.push(`/investigation/${investigationId}/report`)}
                  className="w-full px-4 py-3 bg-grey-50 hover:bg-grey-100 rounded-lg 
                           text-left flex items-centre justify-between group"
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

// Continue in PART 2 with StepProgressCard component...
// ============================================================================
// INVESTIGATION DASHBOARD - PART 2
// StepProgressCard component and supporting UI elements
// ============================================================================

'use client';

import React from 'react';
import {
  CheckCircle2,
  Clock,
  Circle,
  AlertCircle,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

// Types (imported from PART 1 in actual implementation)
interface ValidationWarning {
  severity: 'info' | 'warning' | 'critical';
  message: string;
  action?: string;
}

interface StepProgress {
  stepNumber: number;
  stepName: string;
  status: 'not_started' | 'in_progress' | 'complete' | 'attention_required';
  itemsCount: number;
  itemsComplete: number;
  percentComplete: number;
  warnings: ValidationWarning[];
  lastUpdated: Date | null;
}

// ============================================================================
// STEP PROGRESS CARD COMPONENT
// ============================================================================

interface StepProgressCardProps {
  step: StepProgress;
  onNavigate: () => void;
}

const StepProgressCard: React.FC<StepProgressCardProps> = ({ step, onNavigate }) => {
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
        {/* Step Number Badge */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-white border-2 border-grey-300 
                        flex items-centre justify-centre font-semibold text-sm text-grey-700">
            {step.stepNumber}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 min-w-0 text-left">
          {/* Step Name and Status */}
          <div className="flex items-centre gap-2 mb-2">
            {getStatusIcon(step.status)}
            <h3 className="font-semibold text-grey-900">{step.stepName}</h3>
          </div>

          {/* Status Text and Progress */}
          <div className="flex items-centre gap-3 mb-2">
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

          {/* Progress Bar */}
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

          {/* Warnings */}
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

        {/* Navigation Arrow */}
        <div className="flex-shrink-0 self-centre">
          <ChevronRight className="w-5 h-5 text-grey-400 group-hover:text-grey-600 transition-colours" />
        </div>
      </div>
    </button>
  );
};

// ============================================================================
// PROGRESS RING COMPONENT
// Circular progress indicator (alternative visualization)
// ============================================================================

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  colour?: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  colour = '#3b82f6'
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-centre justify-centre">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colour}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-centre justify-centre">
        <span className="text-2xl font-bold text-grey-900">{progress}%</span>
      </div>
    </div>
  );
};

// ============================================================================
// STATUS BADGE COMPONENT
// Reusable status indicator badge
// ============================================================================

interface StatusBadgeProps {
  status: 'not_started' | 'in_progress' | 'complete' | 'attention_required';
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  showIcon = true,
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'complete':
        return {
          colour: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle2,
          text: 'Complete'
        };
      case 'in_progress':
        return {
          colour: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: Clock,
          text: 'In Progress'
        };
      case 'attention_required':
        return {
          colour: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertCircle,
          text: 'Attention Required'
        };
      default:
        return {
          colour: 'bg-grey-100 text-grey-800 border-grey-200',
          icon: Circle,
          text: 'Not Started'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-centre gap-1.5 rounded-full border font-medium
                    ${config.colour} ${sizeClasses[size]}`}>
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.text}
    </span>
  );
};

// ============================================================================
// ACTIVITY TIMELINE COMPONENT
// Visual timeline for recent activities
// ============================================================================

interface ActivityTimelineProps {
  activities: Array<{
    id: string;
    description: string;
    createdAt: Date;
    stepNumber: number | null;
  }>;
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities }) => {
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-GB');
  };

  if (activities.length === 0) {
    return (
      <p className="text-sm text-grey-500 text-centre py-8">
        No activity yet
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={activity.id} className="flex gap-3">
          {/* Timeline dot and line */}
          <div className="flex flex-col items-centre">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            {index < activities.length - 1 && (
              <div className="w-0.5 h-full bg-grey-200 mt-1"></div>
            )}
          </div>

          {/* Activity content */}
          <div className="flex-1 pb-4">
            <p className="text-sm text-grey-900 font-medium">
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
  );
};

// ============================================================================
// MINI STATS CARD COMPONENT
// Small stat display for dashboard metrics
// ============================================================================

interface MiniStatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colour?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
}

const MiniStatsCard: React.FC<MiniStatsCardProps> = ({
  label,
  value,
  icon,
  colour = 'blue',
  trend
}) => {
  const colourClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    grey: 'bg-grey-50 text-grey-600'
  };

  return (
    <div className="bg-white rounded-lg border border-grey-200 p-4">
      <div className="flex items-centre justify-between">
        <div className="flex-1">
          <p className="text-sm text-grey-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-grey-900">{value}</p>
          {trend && (
            <div className={`flex items-centre gap-1 mt-1 text-xs
                          ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`w-3 h-3 ${!trend.positive && 'transform rotate-180'}`} />
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colourClasses[colour as keyof typeof colourClasses]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default StepProgressCard;
export {
  ProgressRing,
  StatusBadge,
  ActivityTimeline,
  MiniStatsCard
};
