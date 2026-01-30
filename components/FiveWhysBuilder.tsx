'use client'

import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus, Edit2, Trash2, Save, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface FiveWhysProps {
  causalFactorId: string;
  initialFactor: string;
}

interface WhyLevel {
  id: string;
  level: number;
  question: string;
  answer: string;
  is_root_cause: boolean;
  factor_type: string;
}

export default function FiveWhysBuilder({ causalFactorId, initialFactor }: FiveWhysProps) {
  const [whyChain, setWhyChain] = useState<WhyLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  
  const [newWhy, setNewWhy] = useState({
    answer: '',
    isRootCause: false,
    factorType: 'individual'
  });

  const factorTypes = [
    { value: 'individual', label: 'Individual Action', color: 'text-red-600', warning: true },
    { value: 'team', label: 'Team/Group', color: 'text-orange-600', warning: true },
    { value: 'equipment', label: 'Equipment/System', color: 'text-yellow-600', warning: false },
    { value: 'procedural', label: 'Procedure/Process', color: 'text-blue-600', warning: false },
    { value: 'organizational', label: 'Organizational System', color: 'text-green-600', warning: false }
  ];

  useEffect(() => {
    loadWhyChain();
  }, [causalFactorId]);

  async function loadWhyChain() {
    try {
      const { data, error } = await supabase
        .from('five_whys_analysis')
        .select('*')
        .eq('causal_factor_id', causalFactorId)
        .order('level', { ascending: true });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setWhyChain(data);
        setCurrentLevel(data.length + 1);
      } else {
        // Start with initial factor as level 0
        setWhyChain([{
          id: 'initial',
          level: 0,
          question: 'What happened?',
          answer: initialFactor,
          is_root_cause: false,
          factor_type: 'event'
        }]);
        setCurrentLevel(1);
      }
    } catch (error) {
      console.error('Error loading why chain:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addWhyLevel() {
    if (!newWhy.answer.trim()) {
      alert('Please provide an answer');
      return;
    }

    try {
      const whyData = {
        causal_factor_id: causalFactorId,
        level: currentLevel,
        question: `Why ${currentLevel}: Why ${whyChain[whyChain.length - 1]?.answer || initialFactor}?`,
        answer: newWhy.answer.trim(),
        is_root_cause: newWhy.isRootCause,
        factor_type: newWhy.factorType
      };

      const { data, error } = await supabase
        .from('five_whys_analysis')
        .insert([whyData])
        .select()
        .single();

      if (error) throw error;

      setWhyChain([...whyChain, data]);
      setCurrentLevel(currentLevel + 1);
      setNewWhy({
        answer: '',
        isRootCause: false,
        factorType: 'individual'
      });

      if (newWhy.isRootCause) {
        alert('Root cause identified! 5 Whys analysis complete.');
        setEditing(false);
      }
    } catch (error: any) {
      console.error('Error adding why level:', error);
      alert(`Error: ${error.message}`);
    }
  }

  async function deleteWhyLevel(id: string, level: number) {
    if (!confirm('Delete this level? This will also remove all subsequent levels.')) return;

    try {
      // Delete this level and all subsequent levels
      const { error } = await supabase
        .from('five_whys_analysis')
        .delete()
        .eq('causal_factor_id', causalFactorId)
        .gte('level', level);

      if (error) throw error;

      // Reload to get clean state
      loadWhyChain();
    } catch (error) {
      console.error('Error deleting level:', error);
      alert('Error deleting level');
    }
  }

  const hasReachedOrganizational = whyChain.some(w => 
    w.factor_type === 'organizational' || w.factor_type === 'procedural'
  );

  const lastLevel = whyChain[whyChain.length - 1];
  const showWarning = lastLevel && 
    (lastLevel.factor_type === 'individual' || lastLevel.factor_type === 'team') &&
    !lastLevel.is_root_cause;

  if (loading) {
    return <div className="text-sm text-gray-500">Loading 5 Whys analysis...</div>;
  }

  return (
    <div className="mt-3 pt-3 border-t">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-600" />
          <h4 className="font-medium text-sm">5 Whys Analysis</h4>
        </div>
        {!editing && !lastLevel?.is_root_cause && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            {whyChain.length > 1 ? 'Continue Analysis' : 'Start Analysis'}
          </button>
        )}
      </div>

      {/* Why Chain Display */}
      <div className="space-y-3">
        {whyChain.map((why, index) => (
          <div key={why.id} className="relative">
            {/* Connector Line */}
            {index > 0 && (
              <div className="absolute left-6 -top-3 w-0.5 h-3 bg-gray-300" />
            )}

            <div className={`flex gap-3 ${
              why.level === 0 
                ? 'bg-slate-50 border border-slate-200' 
                : why.is_root_cause 
                ? 'bg-green-50 border-2 border-green-500' 
                : 'bg-white border border-gray-200'
            } rounded-lg p-3`}>
              {/* Level Badge */}
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                why.level === 0 
                  ? 'bg-slate-200 text-slate-700'
                  : why.is_root_cause 
                  ? 'bg-green-500 text-white' 
                  : 'bg-indigo-100 text-indigo-700'
              }`}>
                {why.level === 0 ? 'START' : `WHY ${why.level}`}
              </div>

              {/* Content */}
              <div className="flex-1">
                {why.level > 0 && (
                  <p className="text-xs font-medium text-gray-600 mb-1">{why.question}</p>
                )}
                <p className="text-sm text-gray-900 mb-2">
                  <strong>→</strong> {why.answer}
                </p>

                {/* Factor Type Badge */}
                {why.level > 0 && (
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      factorTypes.find(f => f.value === why.factor_type)?.color
                    } bg-opacity-10`}>
                      {factorTypes.find(f => f.value === why.factor_type)?.label || why.factor_type}
                    </span>
                    {why.is_root_cause && (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
                        ✓ ROOT CAUSE
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              {why.level > 0 && !why.is_root_cause && (
                <button
                  onClick={() => deleteWhyLevel(why.id, why.level)}
                  className="flex-shrink-0 p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Warning if stopped at individual level */}
        {showWarning && !editing && (
          <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900 mb-1">
                  ⚠️ Analysis may be incomplete
                </p>
                <p className="text-xs text-amber-800 mb-2">
                  You've identified an individual or team factor, but haven't reached organizational/system causes yet. 
                  Consider asking "why" at least one more time to identify system-level factors.
                </p>
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700"
                >
                  Continue Analysis
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success message when root cause reached */}
        {lastLevel?.is_root_cause && (
          <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-900 mb-1">
                  ✓ Root Cause Analysis Complete
                </p>
                <p className="text-xs text-green-800">
                  Analysis reached depth level {lastLevel.level} and identified {lastLevel.factor_type} factors.
                  {hasReachedOrganizational && ' Organizational/system factors have been identified.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add New Why Level */}
      {editing && !lastLevel?.is_root_cause && (
        <div className="mt-4 bg-indigo-50 border-2 border-indigo-300 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm">
              WHY {currentLevel}
            </div>
            <p className="text-sm font-medium text-indigo-900">
              Why {whyChain[whyChain.length - 1]?.answer || initialFactor}?
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Answer (Why did this happen?) *
              </label>
              <textarea
                value={newWhy.answer}
                onChange={(e) => setNewWhy({...newWhy, answer: e.target.value})}
                className="w-full border rounded px-3 py-2 text-sm"
                rows={2}
                placeholder="e.g., Because the inspection program was not implemented..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                What type of factor is this? *
              </label>
              <select
                value={newWhy.factorType}
                onChange={(e) => setNewWhy({...newWhy, factorType: e.target.value})}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                {factorTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Warning for individual/team factors */}
            {(newWhy.factorType === 'individual' || newWhy.factorType === 'team') && (
              <div className="bg-amber-50 border border-amber-300 rounded p-2">
                <p className="text-xs text-amber-800">
                  <strong>⚠️ Warning:</strong> This is still an individual/team factor. 
                  Consider asking "why" again to identify system-level causes.
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isRootCause"
                checked={newWhy.isRootCause}
                onChange={(e) => setNewWhy({...newWhy, isRootCause: e.target.checked})}
                className="w-4 h-4"
              />
              <label htmlFor="isRootCause" className="text-xs font-medium text-gray-700">
                This is a root cause (organizational/system factor that can be corrected)
              </label>
            </div>

            {newWhy.isRootCause && (newWhy.factorType === 'individual' || newWhy.factorType === 'team') && (
              <div className="bg-red-50 border border-red-300 rounded p-2">
                <p className="text-xs text-red-800">
                  <strong>❌ Not Recommended:</strong> Individual/team actions are rarely true root causes. 
                  Root causes should be organizational systems that can be improved.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={addWhyLevel}
              disabled={!newWhy.answer.trim()}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-300 text-sm"
            >
              <Plus className="w-4 h-4 inline mr-1" />
              Add Why Level {currentLevel}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setNewWhy({ answer: '', isRootCause: false, factorType: 'individual' });
              }}
              className="px-4 py-2 border rounded hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Guidance Box */}
      {whyChain.length <= 1 && !editing && (
        <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-xs text-blue-900 mb-2">
            <strong>5 Whys Technique:</strong> Ask "why" repeatedly (typically 5 times) to drill down from symptoms to root causes.
          </p>
          <ul className="text-xs text-blue-800 space-y-1 ml-4">
            <li>• Start with the immediate cause</li>
            <li>• Keep asking "why" until you reach organizational/system factors</li>
            <li>• Don't stop at "human error" - that's just a symptom</li>
            <li>• Root causes should be correctable through system improvements</li>
          </ul>
        </div>
      )}
    </div>
  );
}
