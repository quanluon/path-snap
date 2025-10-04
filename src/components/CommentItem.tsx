import { formatDistanceToNow } from 'date-fns';
import type { CommentWithUser } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface CommentItemProps {
  comment: CommentWithUser;
}

export default function CommentItem({ comment }: CommentItemProps) {
  const { user, content, createdAt, guestName, guestEmail } = comment;
  const { t } = useLanguage();
  
  // Determine display name based on user type
  const isGuest = !user && guestName;
  const userName = isGuest 
    ? guestName 
    : (user?.name || user?.email || t.comments.anonymous);
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
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
            isGuest 
              ? 'bg-gradient-to-br from-green-500 to-teal-600' 
              : 'bg-gradient-to-br from-blue-500 to-purple-600'
          }`}>
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
          {isGuest && (
            <span className="text-xs text-green-400 bg-green-400/20 px-2 py-0.5 rounded-full">
              {t.comments.anonymous}
            </span>
          )}
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
