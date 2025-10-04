import { formatDistanceToNow } from 'date-fns';
import type { CommentWithUser } from '@/types';

interface CommentItemProps {
  comment: CommentWithUser;
}

export default function CommentItem({ comment }: CommentItemProps) {
  const { user, content, createdAt } = comment;
  
  const userName = user?.name || user?.email || 'Anonymous';
  const userInitial = userName.charAt(0).toUpperCase();
  
  return (
    <div className="flex gap-3 p-3 border-b border-gray-700/50 last:border-b-0">
      {/* Avatar */}
      <div className="flex-shrink-0">
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={userName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
            {userInitial}
          </div>
        )}
      </div>
      
      {/* Comment content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-white truncate">
            {userName}
          </span>
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed break-words">
          {content}
        </p>
      </div>
    </div>
  );
}
