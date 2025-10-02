'use client';

let lastRequestTime = 0;

export async function getAddressFromCoordinates(latitude: number, longitude: number): Promise<string | null> {
  // Rate limiting: wait 1.1 seconds between requests
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < 1100) {
    await new Promise(resolve => setTimeout(resolve, 1100 - timeSinceLastRequest));
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PathSnap/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    lastRequestTime = Date.now();
    
    return data.display_name || null;
  } catch (error) {
    console.error('Failed to get address:', error);
    return null;
  }
}
