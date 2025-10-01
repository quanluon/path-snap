'use client';

import { useState } from 'react';
import { PlayIcon, StopIcon, MapIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Plan } from '@/types';

interface PlanManagerProps {
  activePlan: Plan | null;
  onStartPlan: (name: string) => Promise<void>;
  onEndPlan: (planId: string) => Promise<void>;
}

export default function PlanManager({ activePlan, onStartPlan, onEndPlan }: PlanManagerProps) {
  const { t } = useLanguage();
  const [planName, setPlanName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const handleStart = async () => {
    if (!planName.trim()) {
      setMessage({ type: 'error', text: t.validation.requiredField });
      return;
    }

    setIsLoading(true);
    setMessage(null);
    try {
      await onStartPlan(planName);
      setPlanName('');
      setMessage({ type: 'success', text: t.plan.planStarted });
    } catch (error) {
      console.error('Error starting plan:', error);
      setMessage({ type: 'error', text: 'Failed to start plan' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnd = async () => {
    if (!activePlan) return;

    setIsLoading(true);
    setMessage(null);
    try {
      await onEndPlan(activePlan.id);
      setMessage({ type: 'success', text: t.plan.planEnded });
    } catch (error) {
      console.error('Error ending plan:', error);
      setMessage({ type: 'error', text: 'Failed to end plan' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <MapIcon className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">{t.plan.title}</h2>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
          message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
          'bg-blue-50 border border-blue-200 text-blue-800'
        }`}>
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {activePlan ? (
        <div className="space-y-4">
          {/* Active Plan Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-green-800">
                {t.plan.activePlan}
              </h3>
              <span className="px-3 py-1 bg-green-600 text-white text-sm rounded-full">
                Active
              </span>
            </div>
            <p className="text-green-700 font-medium mb-2">{activePlan.name}</p>
            <p className="text-sm text-green-600">
              Started: {new Date(activePlan.startTime).toLocaleString()}
            </p>
          </div>

          {/* End Plan Button */}
          <button
            onClick={handleEnd}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            title={isLoading ? t.common.loading : t.plan.endPlan}
          >
            <StopIcon className="w-5 h-5" />
            <span className="hidden sm:inline">
              {isLoading ? t.common.loading : t.plan.endPlan}
            </span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* No Active Plan */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-gray-600">{t.plan.noPlan}</p>
          </div>

          {/* Start Plan Form */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.plan.planName}
            </label>
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder={t.plan.planNamePlaceholder}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            />

            <button
              onClick={handleStart}
              disabled={isLoading || !planName.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <PlayIcon className="w-5 h-5" />
              {isLoading ? t.common.loading : t.plan.startPlan}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

