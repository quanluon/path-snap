import { uploadToSupabase } from './supabase';
import { uploadToS3 } from './s3';

export type StorageProvider = 'supabase' | 's3';

export interface UploadResult {
  url: string;
  thumbnailUrl: string;
  key: string;
  thumbnailKey: string;
}

export async function uploadImage(
  file: File,
  userId: string,
  planId?: string
): Promise<UploadResult> {
  const provider = (process.env.STORAGE_PROVIDER as StorageProvider) || 'supabase';
  
  console.log(`Using storage provider: ${provider}`);
  
  switch (provider) {
    case 's3':
      return await uploadToS3(file, userId, planId);
    case 'supabase':
    default:
      return await uploadToSupabase(file, userId, planId);
  }
}

export function getStorageProvider(): StorageProvider {
  return (process.env.STORAGE_PROVIDER as StorageProvider) || 'supabase';
}
