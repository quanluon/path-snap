'use client';

import { useState, useEffect } from 'react';
import { MapIcon, CalendarIcon, PhotoIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Plan } from '@/types';

interface PlanWithCount extends Plan {
  imageCount?: number;
}

interface PlanListProps {
  onPlanSelect: (plan: PlanWithCount) => void;
}

export default function PlanList({ onPlanSelect }: PlanListProps) {
  const { t } = useLanguage();
  const [plans, setPlans] = useState<PlanWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/plans');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch plans');
      }
      
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDuration = (startTime: string, endTime: string | null) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} ngày`;
    } else if (diffHours > 0) {
      return `${diffHours} giờ`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} phút`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-dark-muted">{t.common.loading}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-dark-primary mb-4">{error}</p>
        <button
          onClick={fetchPlans}
          className="px-4 py-2 bg-dark-primary text-dark-secondary rounded-lg hover:bg-dark-hover border border-dark-primary"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-20">
        <MapIcon className="w-16 h-16 text-dark-muted mx-auto mb-4" />
        <h3 className="text-lg font-medium text-dark-primary mb-2">
          {t.plan.noPlans}
        </h3>
        <p className="text-dark-secondary">
          {t.plan.startCreating}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-dark-primary mb-6">
        {t.plan.myPlans} ({plans.length})
      </h2>
      
      <div className="grid gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => onPlanSelect(plan)}
            className="bg-dark-card rounded-lg border border-dark-primary p-4 hover:border-dark-secondary hover:shadow-dark-secondary transition-all cursor-pointer hover-dark-card"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-dark-primary mb-1">
                  {plan.name}
                </h3>
                <div className="flex items-center text-sm text-dark-secondary space-x-4">
                  <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    <span>{formatDate(plan.startTime.toString())}</span>
                  </div>
                  {plan.endTime && (
                    <div className="flex items-center">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      <span>{getDuration(plan.startTime.toString(), plan.endTime.toString())}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center text-sm text-dark-muted">
                <PhotoIcon className="w-4 h-4 mr-1" />
                <span>{plan.imageCount || 0} {t.plan.images}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  plan.endTime ? 'bg-dark-muted' : 'bg-dark-primary'
                }`} />
                <span className="text-sm text-dark-secondary">
                  {plan.endTime ? t.plan.ended : t.plan.ongoing}
                </span>
              </div>
              
              <div className="text-sm text-dark-primary font-medium">
                {t.plan.viewDetails} →
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
