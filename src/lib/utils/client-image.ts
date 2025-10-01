/**
 * Client-side image utilities (browser-safe)
 */

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file size (10MB limit)
  const maxSizeBytes = 10 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds 10MB limit`,
    };
  }

  // Check file type
  const allowedFormats = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedFormats.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not supported. Allowed types: ${allowedFormats.join(', ')}`,
    };
  }

  return { valid: true };
}

export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
