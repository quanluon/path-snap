'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ArrowLeftIcon, MapPinIcon, CalendarIcon, PhotoIcon, StopIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePlan } from '@/contexts/PlanContext';
import ImageCarousel from '@/components/ImageCarousel';
import CheckpointMap from '@/components/CheckpointMap';
import ImageDetailModal from '@/components/ImageDetailModal';
import type { images } from '@/db/schema';

interface PlanWithImages {
  id: string;
  name: string;
  startTime: string;
  endTime: string | null;
  userId: string;
  createdAt: string;
  images: typeof images.$inferSelect[];
  imageCount: number;
}

interface PlanDetailsProps {
  planId: string;
  onBack: () => void;
}

export default function PlanDetails({ planId, onBack }: PlanDetailsProps) {
  const { t } = useLanguage();
  const { endPlan } = usePlan();
  const [plan, setPlan] = useState<PlanWithImages | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<typeof images.$inferSelect | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEndingPlan, setIsEndingPlan] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'map'>('timeline');
  const [showCarousel, setShowCarousel] = useState(false);
  const [carouselImages, setCarouselImages] = useState<typeof images.$inferSelect[]>([]);
  const [carouselStartIndex, setCarouselStartIndex] = useState(0);

  const fetchPlanDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/plans/${planId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch plan details');
      }
      
      setPlan(data.plan);
    } catch (error) {
      console.error('Error fetching plan details:', error);
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    fetchPlanDetails();
  }, [planId, fetchPlanDetails]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
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
      return `${diffDays} ${t.plan.days} ${diffHours % 24} ${t.plan.hours}`;
    } else if (diffHours > 0) {
      return `${diffHours} ${t.plan.hours}`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} ${t.plan.minutes}`;
    }
  };

  const handleImageClick = (image: typeof images.$inferSelect) => {
    console.log('PlanDetails: Image clicked:', image);
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleShowCarousel = (images: any[], startIndex: number) => {
    setCarouselImages(images);
    setCarouselStartIndex(startIndex);
    setShowCarousel(true);
  };

  const handleCloseCarousel = () => {
    setShowCarousel(false);
    setCarouselImages([]);
    setCarouselStartIndex(0);
  };

  const openGoogleMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const handleEndPlan = async () => {
    if (!plan) return;
    
    setIsEndingPlan(true);
    setMessage(null);
    
    try {
      await endPlan(plan.id);
      setMessage({ type: 'success', text: t.plan.planEnded });
      // Refresh plan details to show updated status
      await fetchPlanDetails();
    } catch (error) {
      console.error('Error ending plan:', error);
      setMessage({ type: 'error', text: 'Failed to end plan' });
    } finally {
      setIsEndingPlan(false);
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
          onClick={fetchPlanDetails}
          className="px-4 py-2 bg-dark-primary text-dark-secondary rounded-lg hover:bg-dark-hover border border-dark-primary"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-20">
        <p className="text-dark-secondary">Không tìm thấy kế hoạch</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-dark-primary hover:text-dark-secondary font-medium"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Quay lại
        </button>
        
        {/* End Plan Button - Only show if plan is active */}
        {!plan.endTime && (
          <button
            onClick={handleEndPlan}
            disabled={isEndingPlan}
            className="flex items-center px-4 py-2 bg-dark-primary text-dark-secondary rounded-lg hover:bg-dark-hover disabled:opacity-50 transition-colors border border-dark-primary"
          >
            <StopIcon className="w-4 h-4 mr-2" />
            {isEndingPlan ? t.plan.ending : t.plan.endPlanButton}
          </button>
        )}
      </div>

      {/* Message Display */}
      {message && (
        <div className="p-4 rounded-lg bg-dark-secondary border border-dark-primary">
          <p className="text-sm font-medium text-dark-primary">{message.text}</p>
        </div>
      )}

      {/* Plan Info */}
      <div className="bg-dark-card rounded-lg border border-dark-primary p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-dark-primary mb-2">
              {plan.name}
            </h1>
            <div className="flex items-center space-x-6 text-sm text-dark-secondary">
              <div className="flex items-center">
                <CalendarIcon className="w-4 h-4 mr-1" />
                <span>{t.plan.started}: {formatDate(plan.startTime)}</span>
              </div>
              {plan.endTime && (
                <div className="flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  <span>{t.plan.ended}: {formatDate(plan.endTime)}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center text-sm text-dark-secondary mb-1">
              <PhotoIcon className="w-4 h-4 mr-1" />
              <span>{plan.imageCount} {t.plan.images}</span>
            </div>
            <div className="text-sm text-dark-secondary">
              {getDuration(plan.startTime, plan.endTime)}
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${
            plan.endTime ? 'bg-dark-muted' : 'bg-dark-primary'
          }`} />
          <span className="text-sm font-medium text-dark-primary">
            {plan.endTime ? t.plan.ended : t.plan.ongoing}
          </span>
        </div>
      </div>

      {/* View Mode Toggle */}
      {plan.images.length > 0 && (
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'timeline'
                ? 'bg-dark-primary text-dark-secondary'
                : 'bg-dark-card text-dark-secondary hover:bg-dark-hover border border-dark-primary'
            }`}
          >
            {t.plan.timeline}
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'map'
                ? 'bg-dark-primary text-dark-secondary'
                : 'bg-dark-card text-dark-secondary hover:bg-dark-hover border border-dark-primary'
            }`}
          >
            {t.plan.map}
          </button>
        </div>
      )}

      {/* Images Timeline or Map */}
      {plan.images.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-dark-primary">
            Hành trình ({plan.images.length} ảnh)
          </h2>
          
          {viewMode === 'timeline' ? (
            <>
              <ImageCarousel 
                images={plan.images} 
                onImageClick={handleImageClick}
              />
              
              {/* Timeline List */}
              <div className="bg-dark-card rounded-lg border border-dark-primary p-6">
                <h3 className="text-lg font-semibold text-dark-primary mb-4">
                  Chi tiết theo thời gian
                </h3>
                <div className="space-y-4">
                  {plan.images.map((image, index) => (
                    <div key={image.id} className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 relative rounded-lg overflow-hidden">
                          <Image
                            src={image.thumbnailUrl || image.url}
                            alt={image.description || `Image ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-dark-primary truncate">
                            {image.description || 'Không có mô tả'}
                          </p>
                          <span className="text-xs text-dark-muted">
                            {formatDate(image.createdAt.toString())}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-xs text-dark-secondary">
                          <MapPinIcon className="w-3 h-3 mr-1" />
                          <span>
                            {image.latitude.toFixed(4)}, {image.longitude.toFixed(4)}
                          </span>
                          <button
                            onClick={() => openGoogleMaps(image.latitude, image.longitude)}
                            className="ml-2 text-dark-primary hover:text-dark-secondary text-xs underline"
                          >
                            {t.plan.openGoogleMaps}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <CheckpointMap
              images={plan.images}
              onImageClick={handleImageClick}
              onShowCarousel={handleShowCarousel}
              className="w-full"
            />
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-dark-secondary rounded-lg border border-dark-primary">
          <PhotoIcon className="w-12 h-12 text-dark-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-dark-primary mb-2">
            Chưa có ảnh nào
          </h3>
          <p className="text-dark-secondary">
            Kế hoạch này chưa có ảnh nào được thêm vào
          </p>
        </div>
      )}

      {/* Image Detail Modal */}
      <ImageDetailModal
        image={selectedImage}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Carousel Modal */}
      {showCarousel && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-dark-card rounded-lg max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden border border-dark-primary">
            <div className="flex items-center justify-between p-4 border-b border-dark-primary">
              <h3 className="text-lg font-semibold text-dark-primary">Tất cả ảnh trong kế hoạch</h3>
              <button
                onClick={handleCloseCarousel}
                className="text-dark-secondary hover:text-dark-primary"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              <ImageCarousel
                images={carouselImages}
                onImageClick={handleImageClick}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
