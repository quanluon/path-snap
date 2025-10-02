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
    formData.append('image', file);
    
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center py-20">
          <div className="text-gray-500">{t.common.loading}</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t.auth.unauthorized}
          </h1>
          <p className="text-gray-600 mb-6">
            Please login to upload photos and create checkpoints.
          </p>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CameraCapture onCapture={handleUpload} />
    </div>
  );
}

