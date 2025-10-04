import { useState } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useUser } from '@/contexts/UserContext';

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  isLoading: boolean;
  placeholder?: string;
}

export default function CommentForm({ onSubmit, isLoading, placeholder = "Write a comment..." }: CommentFormProps) {
  const [content, setContent] = useState('');
  const { user } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || isLoading || !user) {
      return;
    }

    try {
      await onSubmit(content);
      setContent('');
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

  if (!user) {
    return (
      <div className="p-4 text-center text-gray-400 border-t border-gray-700/50">
        <p className="text-sm">Please sign in to comment</p>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-700/50 p-4">
      <form onSubmit={handleSubmit} className="flex gap-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
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
          <span className="hidden sm:inline">Comment</span>
        </button>
      </form>
    </div>
  );
}
