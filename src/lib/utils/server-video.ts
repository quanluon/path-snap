/**
 * Server-side video processing utilities
 * Uses FFmpeg for video thumbnail generation
 */

import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';
import { VIDEO_CONFIG } from '@/lib/constants';

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface ProcessedVideo {
  buffer: Buffer;
  thumbnailBuffer: Buffer;
  metadata: VideoMetadata;
}

/**
 * Get video metadata using FFmpeg
 */
export function getVideoMetadata(filePath: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(new Error(`Failed to get video metadata: ${err.message}`));
        return;
      }

      const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
      if (!videoStream) {
        reject(new Error('No video stream found'));
        return;
      }

      resolve({
        duration: metadata.format.duration || 0,
        width: videoStream.width || 0,
        height: videoStream.height || 0,
        format: metadata.format.format_name || 'unknown',
        size: metadata.format.size || 0,
      });
    });
  });
}

/**
 * Generate video thumbnail at specified time (default: 1 second)
 */
export function generateVideoThumbnail(
  filePath: string, 
  timeInSeconds: number = 1,
  width: number = 400,
  height: number = 300
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .seekInput(timeInSeconds)
      .frames(1)
      .size(`${width}x${height}`)
      .format('image2pipe')
      .outputOptions(['-vcodec', 'png', '-f', 'image2pipe'])
      .on('end', () => {
        // This will be handled by the data event
      })
      .on('error', (err) => {
        reject(new Error(`Failed to generate thumbnail: ${err.message}`));
      })
      .pipe()
      .on('data', (chunk: Buffer) => {
        // Process the PNG data with Sharp to convert to JPEG
        sharp(chunk)
          .jpeg({ quality: VIDEO_CONFIG.THUMBNAIL_QUALITY })
          .toBuffer()
          .then(resolve)
          .catch(reject);
      });
  });
}

/**
 * Process video file and generate thumbnail
 */
export async function processVideo(file: File): Promise<ProcessedVideo> {
  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Write buffer to temporary file for FFmpeg processing
  const fs = await import('fs');
  const path = await import('path');
  const os = await import('os');
  
  const tempDir = os.tmpdir();
  const tempVideoPath = path.join(tempDir, `temp-video-${Date.now()}.mp4`);
  const tempThumbnailPath = path.join(tempDir, `temp-thumbnail-${Date.now()}.jpg`);

  try {
    // Write video buffer to temp file
    fs.writeFileSync(tempVideoPath, buffer);

    // Get video metadata
    const metadata = await getVideoMetadata(tempVideoPath);

    // Validate duration
    if (metadata.duration > VIDEO_CONFIG.MAX_DURATION_SECONDS) {
      throw new Error(`Video duration (${Math.round(metadata.duration)}s) exceeds ${VIDEO_CONFIG.MAX_DURATION_SECONDS}s limit`);
    }

    // Generate thumbnail
    const thumbnailBuffer = await generateVideoThumbnail(tempVideoPath);

    return {
      buffer,
      thumbnailBuffer,
      metadata,
    };
  } finally {
    // Clean up temporary files
    try {
      if (fs.existsSync(tempVideoPath)) {
        fs.unlinkSync(tempVideoPath);
      }
      if (fs.existsSync(tempThumbnailPath)) {
        fs.unlinkSync(tempThumbnailPath);
      }
    } catch (cleanupError) {
      console.warn('Failed to cleanup temporary files:', cleanupError);
    }
  }
}

/**
 * Validate video file on server side
 */
export function validateVideoFileServer(file: File): { valid: boolean; error?: string } {
  // Check file size
  const maxSizeBytes = VIDEO_CONFIG.MAX_SIZE_MB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${VIDEO_CONFIG.MAX_SIZE_MB}MB limit`,
    };
  }

  // Check file type
  if (!VIDEO_CONFIG.ALLOWED_FORMATS.includes(file.type as any)) {
    return {
      valid: false,
      error: `File type ${file.type} is not supported. Allowed types: ${VIDEO_CONFIG.ALLOWED_FORMATS.join(', ')}`,
    };
  }

  return { valid: true };
}
