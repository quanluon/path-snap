'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CameraCapture from '@/components/CameraCapture';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePlan } from '@/contexts/PlanContext';

export default function UploadPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user, isLoading } = useAuth();
  const { activePlan } = usePlan();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const handleUpload = async (
    file: File,
    location: { latitude: number; longitude: number } | null,
    description: string
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Only append coordinates if location is provided
    if (location) {
      formData.append('latitude', location.latitude.toString());
      formData.append('longitude', location.longitude.toString());
    }
    
    if (description) {
      formData.append('description', description);
    }
    if (activePlan) {
      formData.append('planId', activePlan.id);
    }

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Upload failed:', errorData);
      throw new Error(`Upload failed: ${errorData.error || 'Unknown error'}`);
    }

    // Redirect to home page after successful upload
    router.push('/');
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex justify-center items-center py-20">
          <div className="text-dark-muted">{t.common.loading}</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-dark-primary mb-4">
            {t.auth.unauthorized}
          </h1>
          <p className="text-dark-secondary mb-6">
            {t.auth.loginToUpload}
          </p>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="px-6 py-3 bg-dark-primary text-dark-secondary font-medium rounded-lg hover:bg-dark-hover transition-colors border border-dark-primary"
          >
            {t.auth.login}
          </button>
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
    <div>
      <CameraCapture onCapture={handleUpload} />
    </div>
  );
}

