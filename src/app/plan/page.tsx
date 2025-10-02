'use client';

import { useState } from 'react';
import PlanManager from '@/components/PlanManager';
import PlanList from '@/components/PlanList';
import PlanDetails from '@/components/PlanDetails';
import AuthModal from '@/components/AuthModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { usePlan } from '@/contexts/PlanContext';
import type { Plan } from '@/types';

type ViewMode = 'manager' | 'list' | 'details';

export default function PlanPage() {
  const { t } = useLanguage();
  const { user, isLoading } = useAuth();
  const { activePlan, startPlan, endPlan } = usePlan();
  const [viewMode, setViewMode] = useState<ViewMode>('manager');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const handleStartPlan = async (name: string) => {
    try {
      await startPlan(name);
    } catch (error) {
      console.error('Error starting plan:', error);
    }
  };

  const handleEndPlan = async (planId: string) => {
    try {
      await endPlan(planId);
    } catch (error) {
      console.error('Error ending plan:', error);
    }
  };

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    setViewMode('details');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedPlan(null);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center py-20">
          <div className="text-dark-muted">{t.common.loading}</div>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-dark-card rounded-lg shadow-dark-primary border border-dark-primary p-8">
            <h1 className="text-2xl font-bold text-dark-primary mb-4">
              {t.plan.title}
            </h1>
            <p className="text-dark-secondary mb-6">
              Please login to create and manage your travel plans.
            </p>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-6 py-3 bg-dark-primary text-dark-secondary font-medium rounded-lg hover:bg-dark-hover transition-colors border border-dark-primary"
            >
              {t.auth.login}
            </button>
          </div>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          mode={authMode}
          onModeChange={setAuthMode}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Navigation */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setViewMode('manager')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'manager'
                ? 'bg-dark-primary text-dark-secondary'
                : 'bg-dark-card text-dark-secondary hover:bg-dark-hover border border-dark-primary'
            }`}
          >
            Quản lý kế hoạch
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-dark-primary text-dark-secondary'
                : 'bg-dark-card text-dark-secondary hover:bg-dark-hover border border-dark-primary'
            }`}
          >
            Danh sách kế hoạch
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'manager' && (
        <PlanManager
          activePlan={activePlan}
          onStartPlan={handleStartPlan}
          onEndPlan={handleEndPlan}
        />
      )}

      {viewMode === 'list' && (
        <PlanList onPlanSelect={handlePlanSelect} />
      )}

      {viewMode === 'details' && selectedPlan && (
        <PlanDetails
          planId={selectedPlan.id}
          onBack={handleBackToList}
        />
      )}
    </div>
  );
}

