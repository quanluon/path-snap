'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { CameraIcon, MapPinIcon } from '@heroicons/react/24/solid';
import { validateImageFile } from '@/lib/utils/client-image';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePlan } from '@/contexts/PlanContext';

interface Location {
  latitude: number;
  longitude: number;
}

interface CameraCaptureProps {
  onCapture: (file: File, location: Location | null, description: string) => Promise<void>;
  planId?: string;
}

export default function CameraCapture({ onCapture, planId }: CameraCaptureProps) {
  const { t } = useLanguage();
  const { activePlan } = usePlan();
  const [isCapturing, setIsCapturing] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [description, setDescription] = useState('');
  const [preview, setPreview] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get user's current location
  const getCurrentLocation = (): Promise<Location> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(new Error(`Unable to retrieve location: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setMessage({ type: 'error', text: validation.error || 'Invalid file' });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Get location
    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
      setLocationError('');
    } catch (error) {
      setLocationError((error as Error).message);
      setLocation(null);
      setMessage({ type: 'error', text: (error as Error).message });
    }
  };

  const handleUpload = async () => {
    setMessage(null);
    
    if (!fileInputRef.current?.files?.[0]) {
      setMessage({ type: 'error', text: t.camera.selectImageError });
      return;
    }

    // Location is now optional - no validation required

    setIsCapturing(true);
    try {
      await onCapture(fileInputRef.current.files[0], location, description);
      // Reset form
      setPreview('');
      setDescription('');
      setLocation(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: t.camera.uploadError });
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">{t.camera.title}</h2>

      {/* File Input */}
      <div className="mb-6">
        <label
          htmlFor="image-upload"
          className="flex items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
        >
          {preview ? (
            <Image
              src={preview}
              alt="Preview"
              width={400}
              height={300}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="text-center">
              <CameraIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">{t.camera.selectImage}</p>
            </div>
          )}
        </label>
        <input
          id="image-upload"
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
          message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
          'bg-blue-50 border border-blue-200 text-blue-800'
        }`}>
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Active Plan Indicator */}
      {activePlan && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center text-blue-800">
            <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
            <span className="font-medium text-sm">{t.camera.addedToPlan}</span>
          </div>
          <p className="text-blue-700 text-sm mt-1">{activePlan.name}</p>
        </div>
      )}

      {/* Location Display */}
      {location ? (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center text-green-800">
            <MapPinIcon className="w-5 h-5 mr-2" />
            <span className="font-medium">{t.camera.locationCaptured}</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
          </p>
        </div>
      ) : (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center text-yellow-800">
            <MapPinIcon className="w-5 h-5 mr-2" />
            <span className="font-medium">Vị trí không có sẵn</span>
          </div>
          <p className="text-yellow-700 text-sm mt-1">
            Ảnh sẽ được lưu mà không có thông tin vị trí
          </p>
        </div>
      )}

      {locationError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{locationError}</p>
        </div>
      )}

      {/* Description Input */}
      <div className="mb-6">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          {t.camera.description}
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.camera.descriptionPlaceholder}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={isCapturing || !preview || !location}
        className="w-full py-3 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isCapturing ? t.camera.uploading : t.camera.uploadButton}
      </button>

      {planId && (
        <p className="mt-4 text-sm text-gray-600 text-center">
          {t.camera.addedToPlan}
        </p>
      )}
    </div>
  );
}


