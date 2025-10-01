'use client';

import { useState } from 'react';
import PlanManager from '@/components/PlanManager';
import PlanList from '@/components/PlanList';
import PlanDetails from '@/components/PlanDetails';
// import { useLanguage } from '@/contexts/LanguageContext';
import { usePlan } from '@/contexts/PlanContext';
import type { Plan } from '@/types';

type ViewMode = 'manager' | 'list' | 'details';

export default function PlanPage() {
  const { activePlan, startPlan, endPlan } = usePlan();
  const [viewMode, setViewMode] = useState<ViewMode>('manager');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

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

  // const handleBackToManager = () => {
  //   setViewMode('manager');
  //   setSelectedPlan(null);
  // };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Navigation */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setViewMode('manager')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'manager'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Quản lý kế hoạch
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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

