'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Plan } from '@/types';

interface PlanContextType {
  activePlan: Plan | null;
  setActivePlan: (plan: Plan | null) => void;
  startPlan: (name: string) => Promise<void>;
  endPlan: (planId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function usePlan() {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
}

interface PlanProviderProps {
  children: ReactNode;
}

export function PlanProvider({ children }: PlanProviderProps) {
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load active plan from localStorage on mount
  useEffect(() => {
    const savedPlan = localStorage.getItem('activePlan');
    if (savedPlan) {
      try {
        setActivePlan(JSON.parse(savedPlan));
      } catch (error) {
        console.error('Error parsing saved plan:', error);
        localStorage.removeItem('activePlan');
      }
    }
  }, []);

  // Save active plan to localStorage when it changes
  useEffect(() => {
    if (activePlan) {
      localStorage.setItem('activePlan', JSON.stringify(activePlan));
    } else {
      localStorage.removeItem('activePlan');
    }
  }, [activePlan]);

  const startPlan = async (name: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/plan/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start plan');
      }

      const data = await response.json();
      setActivePlan(data.plan);
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const endPlan = async (planId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/plan/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to end plan');
      }

      setActivePlan(null);
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: PlanContextType = {
    activePlan,
    setActivePlan,
    startPlan,
    endPlan,
    isLoading,
    error,
  };

  return (
    <PlanContext.Provider value={value}>
      {children}
    </PlanContext.Provider>
  );
}
