'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { Home, Upload, Clock, Network, GitBranch, Lightbulb, FileText } from 'lucide-react';
interface StepNavigationProps {
  investigationId: string;
  currentStep: number;
  investigationNumber?: string;
  onBeforeNavigate?: () => Promise<boolean>;
}
export default function StepNavigation({ investigationId, currentStep, investigationNumber, onBeforeNavigate }: StepNavigationProps) {
  const router = useRouter();
  const handleNavigate = async (path: string) => {
    if (onBeforeNavigate) {
      const canNavigate = await onBeforeNavigate();
      if (!canNavigate) return;
    }
    router.push(path);
  };
  const steps = [
    { number: 1, label: 'Overview',          icon: Home,       path: `/step1?investigationId=${investigationId}` },
    { number: 2, label: 'Evidence',          icon: Upload,     path: `/step2?investigationId=${investigationId}` },
    { number: 3, label: 'Timeline',          icon: Clock,      path: `/step3?investigationId=${investigationId}` },
    { number: 4, label: 'Visualisations',    icon: Network,    path: `/step4?investigationId=${investigationId}` },
    { number: 5, label: 'Causal Analysis',   icon: GitBranch,  path: `/step5?investigationId=${investigationId}` },
    { number: 6, label: 'Recommendations',   icon: Lightbulb,  path: `/step6?investigationId=${investigationId}` },
    { number: 7, label: 'Report',            icon: FileText,   path: `/report?investigationId=${investigationId}` }
  ];
  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3">
        {/* Investigation Info Bar */}
        {investigationNumber && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </button>
              <span className="text-slate-400">/</span>
              <span className="text-sm font-medium text-slate-900">{investigationNumber}</span>
            </div>
          </div>
        )}
        {/* Step Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {steps.map((step) => {
            const Icon = step.icon;
            const isCurrent = step.number === currentStep;
            return (
              <button
                key={step.number}
                onClick={() => handleNavigate(step.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all whitespace-nowrap ${
                  isCurrent 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
                }`}
              >
                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                  isCurrent ? 'bg-white text-blue-600' : 'bg-slate-100 text-slate-600'
                }`}>
                  {step.number}
                </div>
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm">{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
