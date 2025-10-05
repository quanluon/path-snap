'use client';

import { useState } from 'react';
import { XMarkIcon, UserIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useUser } from '@/contexts/UserContext';
import { useLanguage } from '@/contexts/LanguageContext';
import OptimizedImage from '@/components/OptimizedImage';
import ImageCropModal from '@/components/ImageCropModal';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ProfileEditModal({ isOpen, onClose, onUpdate }: ProfileEditModalProps) {
  const { user } = useUser();
  const { t } = useLanguage();
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Only update name, avatar is already uploaded via separate endpoint
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatarUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      onUpdate();
      onClose();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError(t.settings.avatarFileTypeError);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t.settings.avatarFileSizeError);
      return;
    }

    // Show crop modal instead of uploading directly
    setSelectedFile(file);
    setShowCropModal(true);
    
    // Clear the input
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsCropping(true);
    setError('');

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('avatar', croppedBlob, 'avatar.jpg');

      // Upload cropped avatar to S3
      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.settings.avatarUploadError);
      }

      // Update local state with the new avatar URL
      setAvatarUrl(data.avatarUrl);
      setShowCropModal(false);
      setSelectedFile(null);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsCropping(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setSelectedFile(null);
  };

  const handleDeleteAvatar = async () => {
    if (!avatarUrl) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t.settings.avatarDeleteError);
      }

      // Update local state to remove avatar
      setAvatarUrl('');
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-black bg-opacity-80"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative inline-block w-full max-w-md overflow-hidden text-left align-middle transition-all transform bg-gray-900 rounded-lg shadow-2xl border border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">
              {t.settings.editProfile}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg">
                <p className="text-sm text-red-300 font-medium">{error}</p>
              </div>
            )}

            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    <OptimizedImage
                      src={avatarUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      objectFit="cover"
                      fallbackSrc="/placeholder-image.svg"
                      width={96}
                      height={96}
                    />
                  ) : (
                    <UserIcon className="w-12 h-12 text-white" />
                  )}
                </div>
                {avatarUrl && (
                  <button
                    onClick={handleDeleteAvatar}
                    disabled={isLoading}
                    className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-500 transition-colors disabled:opacity-50"
                    title={t.settings.avatarDelete}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="w-full">
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  {t.settings.avatarUpload}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-white bg-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                {t.auth.name}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-white bg-gray-800 placeholder-gray-400"
                placeholder={t.auth.name}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {isLoading ? t.common.loading : t.settings.editProfile}
            </button>
          </form>
        </div>
      </div>

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={showCropModal}
        onClose={handleCropCancel}
        onCrop={handleCropComplete}
        imageFile={selectedFile}
        isLoading={isCropping}
      />
    </div>
  );
}
