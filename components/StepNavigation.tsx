'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { Home, Upload, Clock, GitBranch, Lightbulb, CheckCircle, FileText } from 'lucide-react';

interface StepNavigationProps {
  investigationId: string;
  currentStep: number;
  investigationNumber?: string;
  onBeforeNavigate?: () => Promise<boolean>; // Returns true if navigation should proceed
}

export default function StepNavigation({ investigationId, currentStep, investigationNumber, onBeforeNavigate }: StepNavigationProps) {
  const router = useRouter();

  const handleNavigation = async (path: string) => {
    // If there's a before-navigate handler, call it first
    if (onBeforeNavigate) {
      const shouldProceed = await onBeforeNavigate();
      if (!shouldProceed) {
        return; // Don't navigate if save failed
      }
    }
    router.push(path);
  };

  const steps = [
    { 
      number: 1, 
      label: 'Overview', 
      icon: Home, 
      path: `/step1?investigationId=${investigationId}`,
      color: 'blue'
    },
    { 
      number: 2, 
      label: 'Evidence', 
      icon: Upload, 
      path: `/step2?investigationId=${investigationId}`,
      color: 'purple'
    },
    { 
      number: 3, 
      label: 'Timeline', 
      icon: Clock, 
      path: `/step3?investigationId=${investigationId}`,
      color: 'cyan'
    },
    { 
      number: 4, 
      label: 'Causal Analysis', 
      icon: GitBranch, 
      path: `/step4?investigationId=${investigationId}`,
      color: 'orange'
    },
    { 
      number: 5, 
      label: 'Recommendations', 
      icon: Lightbulb, 
      path: `/step5?investigationId=${investigationId}`,
      color: 'green'
    },
    { 
      number: 6, 
      label: 'Report', 
      icon: FileText, 
      path: `/report?investigationId=${investigationId}`,
      color: 'indigo'
    }
  ];

  const getStepColor = (step: any, isCurrent: boolean) => {
    if (isCurrent) {
      return {
        bg: `bg-${step.color}-600`,
        text: 'text-white',
        border: `border-${step.color}-600`
      };
    }
    return {
      bg: 'bg-white hover:bg-slate-50',
      text: 'text-slate-700',
      border: 'border-slate-300'
    };
  };

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
            const colors = getStepColor(step, isCurrent);

            return (
              <button
                key={step.number}
                onClick={() => handleNavigation(step.path)}
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
