'use client';

import { useState } from 'react';
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/LanguageContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'signup';
  onModeChange: (mode: 'login' | 'signup') => void;
}

export default function AuthModal({ isOpen, onClose, mode, onModeChange }: AuthModalProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const body = mode === 'login' 
        ? { email, password }
        : { email, password, name };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Success - close modal and refresh page
      onClose();
      
      // For signup, show success message if auto-login worked
      if (mode === 'signup' && data.message) {
        // Small delay to show success message
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        window.location.reload();
      }
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
              {mode === 'login' ? t.auth.login : t.auth.signup}
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

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  {t.auth.name}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-white bg-gray-800 placeholder-gray-400"
                  placeholder={t.auth.name}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                {t.auth.email}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-white bg-gray-800 placeholder-gray-400"
                placeholder={t.auth.email}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                {t.auth.password}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-white bg-gray-800 placeholder-gray-400"
                  placeholder={t.auth.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {isLoading ? t.common.loading : (mode === 'login' ? t.auth.login : t.auth.signup)}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => onModeChange(mode === 'login' ? 'signup' : 'login')}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                {mode === 'login' 
                  ? t.profile.dontHaveAccount
                  : t.profile.alreadyHaveAccount
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

