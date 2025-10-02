'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CameraCapture from '@/components/CameraCapture';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePlan } from '@/contexts/PlanContext';
import { useServiceWorker } from '@/components/ServiceWorkerProvider';

export default function UploadPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user, isLoading } = useAuth();
  const { activePlan } = usePlan();
  const { storeUploadForSync, enableNotifications } = useServiceWorker();
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

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Upload failed:', errorData);
        
        // Store upload for background sync on failure
        await storeUploadForSync({
          formData,
          metadata: {
            description,
            latitude: location?.latitude,
            longitude: location?.longitude,
            planId: activePlan?.id
          }
        });
        
        throw new Error(`Upload failed: ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      
      // Signal that a new image was uploaded
      if (result.image) {
        localStorage.setItem('newImageUploaded', JSON.stringify({
          image: result.image,
          timestamp: Date.now()
        }));
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('imageUploaded', {
          detail: { image: result.image }
        }));
      }

      // Redirect to home page after successful upload
      router.push('/');
    } catch (error) {
      // If network fails, store for background sync
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.log('Network error, storing upload for background sync');
        await storeUploadForSync({
          formData,
          metadata: {
            description,
            latitude: location?.latitude,
            longitude: location?.longitude,
            planId: activePlan?.id
          }
        });
      }
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center py-20">
          <div className="text-dark-muted">{t.common.loading}</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-dark-primary mb-4">
            {t.auth.unauthorized}
          </h1>
          <p className="text-dark-secondary mb-6">
            Please login to upload photos and create checkpoints.
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CameraCapture onCapture={handleUpload} />
    </div>
  );
}

