import { useState, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface UseProfileReturn {
  isUpdating: boolean;
  error: string | null;
  success: string | null;
  updateProfile: (name: string, email: string) => Promise<boolean>;
  clearMessages: () => void;
}

export function useProfile(): UseProfileReturn {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { refreshUser } = useUser();
  const { t } = useLanguage();

  const updateProfile = useCallback(async (name: string, email: string): Promise<boolean> => {
    setIsUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Refresh user data to get updated information
      await refreshUser();
      
      setSuccess(t.profile.profileUpdated);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t.profile.updateError;
      setError(errorMessage);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [refreshUser, t]);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    isUpdating,
    error,
    success,
    updateProfile,
    clearMessages,
  };
}
