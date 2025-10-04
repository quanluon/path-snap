import { useState } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useUser } from '@/contexts/UserContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface CommentFormProps {
  onSubmit: (content: string, guestName?: string, guestEmail?: string) => Promise<void>;
  isLoading: boolean;
  placeholder?: string;
}

export default function CommentForm({ onSubmit, isLoading, placeholder }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(false);
  const { user } = useUser();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || isLoading) {
      return;
    }

    // For guest comments, validate guest name
    if (!user && !guestName.trim()) {
      return;
    }

    try {
      if (user) {
        await onSubmit(content);
      } else {
        await onSubmit(content, guestName.trim(), guestEmail.trim() || undefined);
      }
      setContent('');
      setGuestName('');
      setGuestEmail('');
      setShowGuestForm(false);
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!user && !showGuestForm) {
    return (
      <div className="p-4 text-center border-t border-gray-700/50">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-sm">{t.comments.signInPrompt}</p>
          </div>
          <button
            onClick={() => setShowGuestForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            {t.comments.postAsGuest}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-700/50 p-4">
      {!user && showGuestForm && (
        <div className="mb-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {t.comments.guestName} *
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder={t.comments.guestName}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          {/* <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {t.comments.guestEmail}
            </label>
            <input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder={t.comments.guestEmail}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div> */}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || t.comments.placeholder}
            disabled={isLoading}
            maxLength={1000}
            rows={2}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
        <button
          type="submit"
          disabled={!content.trim() || isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <PaperAirplaneIcon className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">{t.comments.comment}</span>
        </button>
        </div>
        {!user && showGuestForm && (
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setShowGuestForm(false)}
              className="text-sm text-gray-400 hover:text-gray-300"
            >
              {t.profile.cancel}
            </button>
            <span className="text-xs text-gray-400">
              {t.comments.anonymous}
            </span>
          </div>
        )}
      </form>
    </div>
  );
}
