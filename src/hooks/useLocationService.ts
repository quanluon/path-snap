'use client';

import { useState, useCallback } from 'react';
import { getAddressFromCoordinates } from '@/lib/locationService';

export function useLocationService() {
  const [isLoading, setIsLoading] = useState(false);

  const getAddress = useCallback(async (latitude: number, longitude: number) => {
    setIsLoading(true);
    try {
      const address = await getAddressFromCoordinates(latitude, longitude);
      return address;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { getAddress, isLoading };
}
