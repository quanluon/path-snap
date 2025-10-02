'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface ReactionContextType {
  batchManagedImages: Set<string>;
  addBatchManagedImage: (imageId: string) => void;
  removeBatchManagedImage: (imageId: string) => void;
  isBatchManaged: (imageId: string) => boolean;
}

const ReactionContext = createContext<ReactionContextType | undefined>(undefined);

export function ReactionProvider({ children }: { children: ReactNode }) {
  const [batchManagedImages, setBatchManagedImages] = useState<Set<string>>(new Set());

  const addBatchManagedImage = (imageId: string) => {
    setBatchManagedImages(prev => new Set([...prev, imageId]));
  };

  const removeBatchManagedImage = (imageId: string) => {
    setBatchManagedImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(imageId);
      return newSet;
    });
  };

  const isBatchManaged = (imageId: string) => {
    return batchManagedImages.has(imageId);
  };

  return (
    <ReactionContext.Provider value={{
      batchManagedImages,
      addBatchManagedImage,
      removeBatchManagedImage,
      isBatchManaged,
    }}>
      {children}
    </ReactionContext.Provider>
  );
}

export function useReactionContext() {
  const context = useContext(ReactionContext);
  if (context === undefined) {
    throw new Error('useReactionContext must be used within a ReactionProvider');
  }
  return context;
}
