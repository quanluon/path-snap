'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import OptimizedImage from './OptimizedImage';
import type { ToastData } from '@/contexts/ToastContext';

interface ToastProps {
  toast: ToastData;
  onClose: (id: string) => void;
}

const toastStyles = {
  success: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    icon: '✅',
    text: 'text-green-400',
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    icon: '❌',
    text: 'text-red-400',
  },
  warning: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    icon: '⚠️',
    text: 'text-yellow-400',
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: 'ℹ️',
    text: 'text-blue-400',
  },
  reaction: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    icon: '👍',
    text: 'text-purple-400',
  },
  comment: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    icon: '💬',
    text: 'text-cyan-400',
  },
};

export default function Toast({ toast, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Trigger animation
    setIsVisible(true);

    // Progress bar animation
    if (toast.duration && toast.duration > 0) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (toast.duration! / 100));
          if (newProgress <= 0) {
            clearInterval(interval);
            return 0;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [toast.duration]);

  const style = toastStyles[toast.type];

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(toast.id), 300); // Wait for animation
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        bg-dark-card/95 backdrop-blur-sm border ${style.border} ${style.bg}
        rounded-lg shadow-lg p-4 mb-3 min-w-80 max-w-96
      `}
    >
      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute top-0 left-0 w-full h-1 bg-dark-primary/20 rounded-t-lg overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${style.text.replace('text-', 'from-')} to-transparent transition-all duration-100 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 text-2xl">
          {style.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-sm ${style.text}`}>
                {toast.title}
              </h3>
              <p className="text-dark-secondary text-sm mt-1 leading-relaxed">
                {toast.content}
              </p>
            </div>

            {/* Image */}
            {toast.imageUrl && (
              <div className="flex-shrink-0">
                <OptimizedImage
                  src={toast.imageUrl}
                  alt={toast.title}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-lg object-cover border border-dark-primary/20"
                  fallbackSrc="/placeholder-image.svg"
                />
              </div>
            )}
          </div>

          {/* Action button */}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className={`mt-2 px-3 py-1 text-xs font-medium ${style.text} bg-transparent border ${style.border} rounded-md hover:bg-dark-hover transition-colors`}
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-dark-muted hover:text-white transition-colors"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
