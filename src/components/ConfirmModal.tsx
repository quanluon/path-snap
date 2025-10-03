"use client";

import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/solid";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger",
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getIconColor = () => {
    switch (type) {
      case "danger":
        return "text-red-500";
      case "warning":
        return "text-yellow-500";
      case "info":
        return "text-blue-500";
      default:
        return "text-red-500";
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 focus:ring-red-500";
      case "warning":
        return "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500";
      case "info":
        return "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500";
      default:
        return "bg-red-600 hover:bg-red-700 focus:ring-red-500";
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-black/80 backdrop-blur-sm"
          onClick={(e) => {
            e.preventDefault();
            return onClose();
          }}
        />

        {/* Modal */}
        <div className="relative inline-block w-full max-w-md overflow-hidden text-left align-middle transition-all transform bg-black rounded-2xl shadow-2xl border border-white/10">
          {/* Close Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              return onClose();
            }}
            disabled={isLoading}
            className="absolute top-4 right-4 z-10 p-2 bg-black/80 backdrop-blur-sm rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="w-5 h-5 text-white" />
          </button>

          <div className="p-6">
            {/* Icon */}
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-500/10 rounded-full">
              <ExclamationTriangleIcon
                className={`w-6 h-6 ${getIconColor()}`}
              />
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-white mb-2 text-center">
              {title}
            </h3>

            {/* Message */}
            <p className="text-sm text-white/70 mb-6 text-center leading-relaxed">
              {message}
            </p>

            {/* Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  return onClose();
                }}
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-white/10 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  return onConfirm();
                }}
                disabled={isLoading}
                className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${getButtonColor()}`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </div>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
