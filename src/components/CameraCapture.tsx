'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { CameraIcon, MapPinIcon, PencilIcon } from '@heroicons/react/24/solid';
import { validateImageFile, formatFileSize, getMaxFileSize } from '@/lib/utils/client-image';
import { validateVideoFile, validateVideoDuration, formatVideoDuration, getMaxVideoSize } from '@/lib/utils/video';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePlan } from '@/contexts/PlanContext';
import FilerobotImageEditor from './FilerobotImageEditor';

interface Location {
  latitude: number;
  longitude: number;
}

interface CameraCaptureProps {
  onCapture: (file: File, location: Location | null, description: string) => Promise<void>;
  planId?: string;
}

const acceptedImageFormats = ['image/jpeg', 'image/png', 'image/webp'];
const acceptedVideoFormats = ['video/mp4', 'video/webm', 'video/quicktime'];

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
  const [isDragOver, setIsDragOver] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
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

    // Determine if it's an image or video
    const isImageFile = file.type.startsWith('image/');
    const isVideoFile = file.type.startsWith('video/');

    if (!isImageFile && !isVideoFile) {
      setMessage({ type: 'error', text: t.validation.invalidFileType });
      return;
    }

    setIsVideo(isVideoFile);

    // Validate file based on type
    if (isImageFile) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        let errorMessage: string = t.validation.invalidFileType;
        if (validation.error?.includes('File size exceeds')) {
          const fileSize = formatFileSize(file.size);
          const maxSize = getMaxFileSize();
          errorMessage = `${t.validation.fileSizeExceeded} (${fileSize} > ${maxSize})`;
        } else if (validation.error?.includes('File type')) {
          errorMessage = t.validation.invalidFileType;
        }
        setMessage({ type: 'error', text: errorMessage });
        return;
      }
    } else if (isVideoFile) {
      const validation = validateVideoFile(file);
      if (!validation.valid) {
        let errorMessage: string = t.validation.invalidFileType;
        if (validation.error?.includes('File size exceeds')) {
          const fileSize = formatFileSize(file.size);
          const maxSize = getMaxVideoSize();
          errorMessage = `${t.validation.fileSizeExceeded} (${fileSize} > ${maxSize})`;
        } else if (validation.error?.includes('File type')) {
          errorMessage = t.validation.invalidFileType;
        }
        setMessage({ type: 'error', text: errorMessage });
        return;
      }

      // Validate video duration
      try {
        const durationValidation = await validateVideoDuration(file);
        if (!durationValidation.valid) {
          setMessage({ type: 'error', text: durationValidation.error || 'Invalid video duration' });
          return;
        }
        setVideoDuration(durationValidation.duration || null);
      } catch {
        setMessage({ type: 'error', text: 'Failed to validate video duration' });
        return;
      }
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      
      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        // Use internationalized error messages with file size details
        let errorMessage: string = t.validation.invalidFileType;
        if (validation.error?.includes('File size exceeds')) {
          const fileSize = formatFileSize(file.size);
          const maxSize = getMaxFileSize();
          errorMessage = `${t.validation.fileSizeExceeded} (${fileSize} > ${maxSize})`;
        } else if (validation.error?.includes('File type')) {
          errorMessage = t.validation.invalidFileType;
        }
        setMessage({ type: 'error', text: errorMessage });
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
      }
    }
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
          className={`flex items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors relative ${
            isDragOver 
              ? 'border-blue-400 bg-blue-500/10' 
              : 'border-dark-primary hover:border-dark-secondary'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {preview ? (
            <>
              {isVideo ? (
                <video
                  src={preview}
                  className="w-full h-full object-cover rounded-lg"
                  controls
                  muted
                />
              ) : (
                <Image
                  src={preview}
                  alt={t.profile.preview}
                  width={400}
                  height={300}
                  className="w-full h-full object-cover rounded-lg"
                />
              )}
              
              {/* Edit Button Overlay - Only show for images */}
              {!isVideo && (
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
              )}
              
              {/* Change File Button Overlay */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="absolute top-2 left-2 p-2 bg-dark-secondary text-dark-primary rounded-full hover:bg-dark-hover transition-colors shadow-lg"
                title={isVideo ? 'Change Video' : t.editor.changeImage}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </>
          ) : (
            <div className="text-center">
              <CameraIcon className="w-12 h-12 mx-auto text-dark-muted mb-2" />
              <p className="text-dark-secondary">
                {isDragOver ? t.upload.dragDrop : t.camera.selectImage}
              </p>
              <p className="text-dark-muted text-xs mt-2">{t.upload.maxSizeInfo}</p>
              <p className="text-dark-muted text-xs">{t.upload.supportedFormats}</p>
            </div>
          )}
        </label>
        <input
          id="image-upload"
          ref={fileInputRef}
          type="file"
          accept={acceptedImageFormats.join(',')}
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

      {/* File Size Info */}
      {selectedFile && (
        <div className="mb-4 p-3 bg-dark-secondary border border-dark-primary rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-dark-primary">{t.upload.fileSize}:</span>
            <span className="text-dark-secondary">{formatFileSize(selectedFile.size)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-dark-primary">{t.upload.maxSize}:</span>
            <span className="text-dark-secondary">
              {isVideo ? getMaxVideoSize() : getMaxFileSize()}
            </span>
          </div>
          {isVideo && videoDuration && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-dark-primary">Duration:</span>
              <span className="text-dark-secondary">{formatVideoDuration(videoDuration)}</span>
            </div>
          )}
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
            <span className="font-medium">{t.camera.locationNotAvailable}</span>
          </div>
          <p className="text-dark-muted text-sm mt-1">
            {t.camera.locationNotAvailableDesc}
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
      {showEditor && selectedFile && !isVideo && (
        <FilerobotImageEditor
          imageFile={selectedFile}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
        />
      )}
    </div>
  );
}


