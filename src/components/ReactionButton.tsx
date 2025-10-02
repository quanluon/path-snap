'use client';

import { useState } from 'react';
import { 
  HandThumbUpIcon, 
  HeartIcon, 
  FaceSmileIcon 
} from '@heroicons/react/24/outline';
import { 
  HandThumbUpIcon as HandThumbUpIconSolid,
  HeartIcon as HeartIconSolid,
  FaceSmileIcon as FaceSmileIconSolid 
} from '@heroicons/react/24/solid';
import { REACTION_TYPES, type ReactionType } from '@/lib/constants';

interface ReactionButtonProps {
  type: ReactionType;
  count: number;
  isActive: boolean;
  onClick: (type: ReactionType) => void;
  disabled?: boolean;
  isProcessing?: boolean;
  isUnauthenticated?: boolean;
}

const reactionConfig = {
  [REACTION_TYPES.LIKE]: {
    icon: HandThumbUpIcon,
    iconSolid: HandThumbUpIconSolid,
    label: 'Like',
    color: 'text-blue-400',
    activeColor: 'text-blue-500',
    bgColor: 'bg-blue-500/20',
  },
  [REACTION_TYPES.HEART]: {
    icon: HeartIcon,
    iconSolid: HeartIconSolid,
    label: 'Heart',
    color: 'text-red-400',
    activeColor: 'text-red-500',
    bgColor: 'bg-red-500/20',
  },
  [REACTION_TYPES.WOW]: {
    icon: FaceSmileIcon,
    iconSolid: FaceSmileIconSolid,
    label: 'Wow',
    color: 'text-yellow-400',
    activeColor: 'text-yellow-500',
    bgColor: 'bg-yellow-500/20',
  },
};

export default function ReactionButton({ 
  type, 
  count, 
  isActive, 
  onClick, 
  disabled = false,
  isProcessing = false,
  isUnauthenticated = false
}: ReactionButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const config = reactionConfig[type];
  const Icon = isActive ? config.iconSolid : config.icon;
  const colorClass = isActive ? config.activeColor : config.color;

  const handleClick = () => {
    if (disabled || isUnauthenticated) return;
    
    setIsAnimating(true);
    setIsPressed(true);
    onClick(type);
    
    // Reset animation after a short delay
    setTimeout(() => {
      setIsAnimating(false);
      setIsPressed(false);
    }, 300);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        flex items-center space-x-1 px-3 py-2 rounded-full transition-all duration-200
        ${isActive ? config.bgColor : 'bg-white/10 hover:bg-white/20'}
        ${disabled || isUnauthenticated ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
        ${isAnimating ? 'scale-110' : ''}
        ${isPressed ? 'scale-95' : ''}
        ${isProcessing ? 'opacity-75' : ''}
        ${isUnauthenticated ? 'hover:opacity-60' : ''}
      `}
      aria-label={`${config.label} (${count})`}
    >
      <Icon 
        className={`
          w-4 h-4 transition-colors duration-200
          ${colorClass}
          ${isAnimating ? 'animate-pulse' : ''}
          ${isProcessing ? 'animate-pulse' : ''}
        `} 
      />
      {count > 0 && (
        <span className="text-sm text-meta font-smooth">
          {count}
        </span>
      )}
    </button>
  );
}
