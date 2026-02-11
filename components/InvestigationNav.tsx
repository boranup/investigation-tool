// ============================================================================
// ENHANCED INVESTIGATION NAVIGATION
// Navigation component with step progress indicators
// Path: components/InvestigationNav.tsx
// Created: 3 February 2026
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Database,
  Clock,
  GitBranch,
  Search,
  CheckSquare,
  FileCheck,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock as ClockIcon,
  ChevronLeft,
  Menu,
  X
} from 'lucide-react';
import { fetchCachedProgress, type StepProgress, type StepStatus } from '@/utils/progressUtils';

// ============================================================================
// NAVIGATION CONFIGURATION
// ============================================================================

const NAV_ITEMS = [
  {
    stepNumber: 0,
    name: 'Dashboard',
    href: 'dashboard',
    icon: LayoutDashboard,
    description: 'Investigation overview and progress'
  },
  {
    stepNumber: 1,
    name: 'Initiation',
    href: 'initiation',
    icon: FileText,
    description: 'Incident details and classification'
  },
  {
    stepNumber: 2,
    name: 'Evidence & Data',
    href: 'evidence',
    icon: Database,
    description: 'Evidence collection and witness interviews'
  },
  {
    stepNumber: 3,
    name: 'Timeline',
    href: 'timeline',
    icon: Clock,
    description: 'Chronological event mapping'
  },
  {
    stepNumber: 4,
    name: 'Visualisations',
    href: 'visualisations',
    icon: GitBranch,
    description: '5 Whys, Causal Tree, Barriers'
  },
  {
    stepNumber: 5,
    name: 'Analysis',
    href: 'analysis',
    icon: Search,
    description: 'HFAT and HOP assessments'
  },
  {
    stepNumber: 6,
    name: 'Recommendations',
    href: 'recommendations',
    icon: CheckSquare,
    description: 'SMART recommendations development'
  },
  {
    stepNumber: 7,
    name: 'Report',
    href: 'report',
    icon: FileCheck,
    description: 'Final report generation'
  }
];

// ============================================================================
// MAIN NAVIGATION COMPONENT
// ============================================================================

interface InvestigationNavProps {
  investigationId: string;
}

export default function InvestigationNav({ investigationId }: InvestigationNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [stepProgress, setStepProgress] = useState<StepProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  // Load progress data
  useEffect(() => {
    loadProgress();
  }, [investigationId]);

  const loadProgress = async () => {
    try {
      const progress = await fetchCachedProgress(investigationId);
      if (progress) {
        setStepProgress(progress.steps);
        setOverallProgress(progress.overallProgress);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (stepNumber: number): StepStatus => {
    if (stepNumber === 0) return 'not_started'; // Dashboard has no status
    const step = stepProgress.find(s => s.stepNumber === stepNumber);
    return step?.status || 'not_started';
  };

  const getStatusIcon = (status: StepStatus) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'in_progress':
        return <ClockIcon className="w-4 h-4" />;
      case 'attention_required':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  const getStatusColour = (status: StepStatus) => {
    switch (status) {
      case 'complete':
        return 'text-green-600';
      case 'in_progress':
        return 'text-amber-600';
      case 'attention_required':
        return 'text-red-600';
      default:
        return 'text-grey-400';
    }
  };

  const isActiveRoute = (href: string) => {
    return pathname?.includes(`/${href}`);
  };

  const handleNavigation = (href: string, stepNumber: number) => {
    if (stepNumber === 0) {
      // Dashboard
      router.push(`/investigation/${investigationId}/dashboard`);
    } else {
      // Existing step pages
      router.push(`/step${stepNumber}?investigationId=${investigationId}`);
    }
    setMobileMenuOpen(false);
  };

  const handleBackToList = () => {
    router.push('/');
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 bg-white rounded-lg shadow-lg border border-grey-200"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6 text-grey-700" />
          ) : (
            <Menu className="w-6 h-6 text-grey-700" />
          )}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <nav
        className={`fixed left-0 top-0 h-full bg-white border-r border-grey-200 
                   transition-transform duration-300 z-40 w-72
                   ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex flex-col h-full">
          
          {/* Header */}
          <div className="p-4 border-b border-grey-200">
            <button
              onClick={handleBackToList}
              className="flex items-centre gap-2 text-sm text-grey-600 hover:text-grey-900 mb-3"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Investigations
            </button>
            
            <h2 className="font-semibold text-grey-900">Investigation Steps</h2>
            
            {/* Overall Progress Bar */}
            {!loading && (
              <div className="mt-3">
                <div className="flex items-centre justify-between text-xs text-grey-600 mb-1">
                  <span>Overall Progress</span>
                  <span className="font-semibold">{overallProgress}%</span>
                </div>
                <div className="w-full bg-grey-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${overallProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto py-2">
            <div className="space-y-1 px-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.href);
                const status = getStepStatus(item.stepNumber);
                const StatusIcon = item.stepNumber > 0 ? getStatusIcon(status) : null;

                return (
                  <button
                    key={item.href}
                    onClick={() => handleNavigation(item.href, item.stepNumber)}
                    className={`w-full px-3 py-3 rounded-lg flex items-start gap-3 group
                              transition-all hover:bg-grey-50
                              ${isActive ? 'bg-blue-50 border border-blue-200' : 'border border-transparent'}`}
                  >
                    {/* Step Icon */}
                    <div className={`flex-shrink-0 p-2 rounded-lg transition-colours
                                  ${isActive ? 'bg-blue-600 text-white' : 'bg-grey-100 text-grey-600 group-hover:bg-grey-200'}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-centre gap-2">
                        {item.stepNumber > 0 && (
                          <span className={`text-xs font-medium ${getStatusColour(status)}`}>
                            {StatusIcon}
                          </span>
                        )}
                        <span className={`font-medium text-sm
                                      ${isActive ? 'text-blue-900' : 'text-grey-900'}`}>
                          {item.name}
                        </span>
                      </div>
                      <p className="text-xs text-grey-600 mt-0.5 line-clamp-1">
                        {item.description}
                      </p>

                      {/* Progress indicator for active steps */}
                      {item.stepNumber > 0 && !loading && status !== 'not_started' && (
                        <div className="mt-2">
                          <div className="flex items-centre gap-2 text-xs text-grey-600">
                            <div className="flex-1 bg-grey-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all
                                  ${status === 'complete' ? 'bg-green-600' : 
                                    status === 'in_progress' ? 'bg-amber-600' : 'bg-red-600'}`}
                                style={{
                                  width: `${stepProgress.find(s => s.stepNumber === item.stepNumber)?.percentComplete || 0}%`
                                }}
                              ></div>
                            </div>
                            <span className="font-medium">
                              {stepProgress.find(s => s.stepNumber === item.stepNumber)?.percentComplete || 0}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-grey-200">
            <div className="text-xs text-grey-600">
              <p className="font-medium mb-1">Investigation Tool</p>
              <p>Navigate flexibly between steps</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}
    </>
  );
}

// ============================================================================
// MINI STEP INDICATOR (for page headers)
// ============================================================================

interface StepIndicatorProps {
  currentStep: number;
  totalSteps?: number;
}

export function StepIndicator({ currentStep, totalSteps = 7 }: StepIndicatorProps) {
  return (
    <div className="flex items-centre gap-2">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div
          key={step}
          className={`w-2 h-2 rounded-full transition-colours
            ${step === currentStep ? 'bg-blue-600 w-6' : 
              step < currentStep ? 'bg-green-600' : 'bg-grey-300'}`}
        ></div>
      ))}
    </div>
  );
}

// ============================================================================
// PROGRESS HEADER (for use in page layouts)
// ============================================================================

interface ProgressHeaderProps {
  investigationId: string;
  currentStep: number;
  stepName: string;
}

export function ProgressHeader({ investigationId, currentStep, stepName }: ProgressHeaderProps) {
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<StepStatus>('not_started');

  useEffect(() => {
    loadStepProgress();
  }, [investigationId, currentStep]);

  const loadStepProgress = async () => {
    const cached = await fetchCachedProgress(investigationId);
    if (cached) {
      const step = cached.steps.find(s => s.stepNumber === currentStep);
      if (step) {
        setProgress(step.percentComplete);
        setStatus(step.status);
      }
    }
  };

  const getStatusText = (status: StepStatus) => {
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

  const getStatusColour = (status: StepStatus) => {
    switch (status) {
      case 'complete':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'in_progress':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'attention_required':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-grey-600 bg-grey-50 border-grey-200';
    }
  };

  return (
    <div className="bg-white border-b border-grey-200 px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-centre justify-between mb-3">
          <div>
            <div className="flex items-centre gap-3">
              <span className="text-sm font-medium text-grey-600">
                Step {currentStep} of 7
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border
                             ${getStatusColour(status)}`}>
                {getStatusText(status)}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-grey-900 mt-1">{stepName}</h1>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{progress}%</div>
            <div className="text-xs text-grey-600">Complete</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-grey-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Step indicator dots */}
        <div className="mt-3">
          <StepIndicator currentStep={currentStep} />
        </div>
      </div>
    </div>
  );
}
