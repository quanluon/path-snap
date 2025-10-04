'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { CameraIcon, MapPinIcon, PencilIcon } from '@heroicons/react/24/solid';
import { validateImageFile } from '@/lib/utils/client-image';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePlan } from '@/contexts/PlanContext';
import ImageEditor from './ImageEditor';

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showEditor, setShowEditor] = useState(false);
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

    // Store selected file
    setSelectedFile(file);

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

  const handleEditImage = () => {
    if (selectedFile) {
      setShowEditor(true);
    }
  };

  const handleEditorSave = (editedFile: File) => {
    setSelectedFile(editedFile);
    
    // Update preview with edited image
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(editedFile);
    
    setShowEditor(false);
  };

  const handleEditorCancel = () => {
    setShowEditor(false);
  };

  const handleUpload = async () => {
    setMessage(null);
    
    if (!selectedFile) {
      setMessage({ type: 'error', text: t.camera.selectImageError });
      return;
    }

    // Location is now optional - no validation required

    setIsCapturing(true);
    try {
      await onCapture(selectedFile, location, description);
      // Reset form
      setPreview('');
      setDescription('');
      setLocation(null);
      setSelectedFile(null);
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
    <div className="w-full max-w-2xl mx-auto p-6 bg-dark-card rounded-lg shadow-dark-primary border border-dark-primary">
      <h2 className="text-2xl font-bold mb-6 text-dark-primary">{t.camera.title}</h2>

      {/* File Input */}
      <div className="mb-6">
        <label
          htmlFor="image-upload"
          className="flex items-center justify-center w-full h-48 border-2 border-dashed border-dark-primary rounded-lg cursor-pointer hover:border-dark-secondary transition-colors relative"
        >
          {preview ? (
            <>
              <Image
                src={preview}
                alt={t.profile.preview}
                width={400}
                height={300}
                className="w-full h-full object-cover rounded-lg"
              />
              {/* Edit Button Overlay */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleEditImage();
                }}
                className="absolute top-2 right-2 p-2 bg-dark-primary text-dark-secondary rounded-full hover:bg-dark-hover transition-colors shadow-lg"
                title={t.editor.editImage}
              >
                <PencilIcon className="w-5 h-5" />
              </button>
              
              {/* Change Image Button Overlay */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="absolute top-2 left-2 p-2 bg-dark-secondary text-dark-primary rounded-full hover:bg-dark-hover transition-colors shadow-lg"
                title={t.editor.changeImage}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </>
          ) : (
            <div className="text-center">
              <CameraIcon className="w-12 h-12 mx-auto text-dark-muted mb-2" />
              <p className="text-dark-secondary">{t.camera.selectImage}</p>
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
        <div className="mb-4 p-4 rounded-lg bg-dark-secondary border border-dark-primary">
          <p className="text-sm font-medium text-dark-primary">{message.text}</p>
        </div>
      )}

      {/* Active Plan Indicator */}
      {activePlan && (
        <div className="mb-4 p-4 bg-dark-secondary border border-dark-primary rounded-lg">
          <div className="flex items-center text-dark-primary">
            <div className="w-2 h-2 bg-dark-primary rounded-full mr-2"></div>
            <span className="font-medium text-sm">{t.camera.addedToPlan}</span>
          </div>
          <p className="text-dark-secondary text-sm mt-1">{activePlan.name}</p>
        </div>
      )}

      {/* Location Display */}
      {location ? (
        <div className="mb-4 p-4 bg-dark-secondary border border-dark-primary rounded-lg">
          <div className="flex items-center text-dark-primary">
            <MapPinIcon className="w-5 h-5 mr-2" />
            <span className="font-medium">{t.camera.locationCaptured}</span>
          </div>
        </div>
      ) : (
        <div className="mb-4 p-4 bg-dark-secondary border border-dark-primary rounded-lg">
          <div className="flex items-center text-dark-primary">
            <MapPinIcon className="w-5 h-5 mr-2" />
            <span className="font-medium">Vị trí không có sẵn</span>
          </div>
          <p className="text-dark-muted text-sm mt-1">
            Ảnh sẽ được lưu mà không có thông tin vị trí
          </p>
        </div>
      )}

      {locationError && (
        <div className="mb-4 p-4 bg-dark-secondary border border-dark-primary rounded-lg">
          <p className="text-dark-primary text-sm">{locationError}</p>
        </div>
      )}

      {/* Description Input */}
      <div className="mb-6">
        <label htmlFor="description" className="block text-sm font-medium text-dark-secondary mb-2">
          {t.camera.description}
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.camera.descriptionPlaceholder}
          rows={3}
          className="w-full px-4 py-2 border border-dark-primary rounded-lg focus:ring-2 focus:ring-dark-primary focus:border-transparent bg-dark-secondary text-dark-primary placeholder-dark-muted"
        />
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={isCapturing || !preview}
          className="w-full py-3 px-6 bg-dark-primary text-dark-secondary font-medium rounded-lg hover:bg-dark-hover disabled:bg-dark-muted disabled:cursor-not-allowed transition-colors border border-dark-primary"
        >
          {isCapturing ? t.camera.uploading : t.camera.uploadButton}
        </button>
      </div>

      {planId && (
        <p className="mt-4 text-sm text-dark-muted text-center">
          {t.camera.addedToPlan}
        </p>
      )}

      {/* Image Editor Modal */}
      {showEditor && selectedFile && (
        <ImageEditor
          imageFile={selectedFile}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
        />
      )}
    </div>
  );
}


