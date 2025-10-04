import { useState } from 'react';
import { useComments } from '@/hooks/useComments';
import CommentList from './CommentList';
import CommentForm from './CommentForm';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface CommentsSectionProps {
  imageId: string;
  className?: string;
}

export default function CommentsSection({ imageId, className = '' }: CommentsSectionProps) {
  const {
    comments,
    isLoading,
    isCreating,
    error,
    hasMore,
    totalCount,
    loadComments,
    createComment,
    refreshComments,
  } = useComments({ imageId });

  const [showComments, setShowComments] = useState(false);

  const handleCreateComment = async (content: string) => {
    await createComment(content);
  };

  const handleLoadMore = async () => {
    const nextPage = Math.floor(comments.length / 20) + 1;
    await loadComments(nextPage);
  };

  return (
    <div className={`bg-gray-900/50 backdrop-blur-sm rounded-lg ${className}`}>
      {/* Comments Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/50 transition-colors rounded-t-lg"
        onClick={() => setShowComments(!showComments)}
      >
        <div className="flex items-center gap-2">
          <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-400" />
          <span className="text-white font-medium">Comments</span>
          {totalCount > 0 && (
            <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs">
              {totalCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <span className="text-red-400 text-sm">Error loading comments</span>
          )}
          <div className={`w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full transition-transform duration-200 ${showComments ? 'rotate-180' : ''}`}></div>
        </div>
      </div>

      {/* Comments Content */}
      {showComments && (
        <div className="border-t border-gray-700/50">
          {/* Comment Form */}
          <CommentForm
            onSubmit={handleCreateComment}
            isLoading={isCreating}
          />

          {/* Comments List */}
          <div className="max-h-96 overflow-hidden">
            <CommentList
              comments={comments}
              isLoading={isLoading}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
            />
          </div>
        </div>
      )}
    </div>
  );
}
