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
    <div className="w-full max-w-2xl mx-auto bg-dark-card rounded-lg shadow-dark-primary border border-dark-primary p-6">
      <div className="flex items-center gap-3 mb-6">
        <MapIcon className="w-8 h-8 text-dark-primary" />
        <h2 className="text-2xl font-bold text-dark-primary">{t.plan.title}</h2>
      </div>

      {/* Message Display */}
      {message && (
        <div className="mb-4 p-4 rounded-lg bg-dark-secondary border border-dark-primary">
          <p className="text-sm font-medium text-dark-primary">{message.text}</p>
        </div>
      )}

      {activePlan ? (
        <div className="space-y-4">
          {/* Active Plan Info */}
          <div className="bg-dark-secondary border border-dark-primary rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-dark-primary">
                {t.plan.activePlan}
              </h3>
              <span className="px-3 py-1 bg-dark-primary text-dark-secondary text-sm rounded-full">
                Active
              </span>
            </div>
            <p className="text-dark-primary font-medium mb-2">{activePlan.name}</p>
            <p className="text-sm text-dark-secondary">
              Started: {new Date(activePlan.startTime).toLocaleString()}
            </p>
          </div>

          {/* End Plan Button */}
          <button
            onClick={handleEnd}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-dark-primary text-dark-secondary font-medium rounded-lg hover:bg-dark-hover disabled:opacity-50 transition-colors border border-dark-primary"
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
          <div className="bg-dark-secondary border border-dark-primary rounded-lg p-4 text-center">
            <p className="text-dark-secondary">{t.plan.noPlan}</p>
          </div>

          {/* Start Plan Form */}
          <div>
            <label className="block text-sm font-medium text-dark-secondary mb-2">
              {t.plan.planName}
            </label>
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder={t.plan.planNamePlaceholder}
              className="w-full px-4 py-2 border border-dark-primary rounded-lg focus:ring-2 focus:ring-dark-primary focus:border-transparent mb-4 bg-dark-secondary text-dark-primary placeholder-dark-muted"
            />

            <button
              onClick={handleStart}
              disabled={isLoading || !planName.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-dark-primary text-dark-secondary font-medium rounded-lg hover:bg-dark-hover disabled:opacity-50 transition-colors border border-dark-primary"
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

