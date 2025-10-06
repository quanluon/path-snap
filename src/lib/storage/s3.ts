import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { processImage } from './index';
import { ProcessedVideo } from '@/lib/utils/server-video';
import { STORAGE_BUCKETS } from '@/lib/constants';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export interface S3UploadResult {
  url: string;
  key: string;
  thumbnailUrl?: string;
  thumbnailKey?: string;
  duration?: number;
}

export async function uploadToS3(
  file: File,
  userId: string,
  planId?: string
): Promise<S3UploadResult> {
  try {
    // Generate unique key
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop() || "jpg";
    const key = `images/${userId}/${timestamp}.${fileExtension}`;

    // Process image using common function
    const { buffer: processedImage } = await processImage(file);

    // Upload image
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: processedImage,
      ContentType: "image/jpeg",
      Metadata: {
        userId,
        planId: planId || "",
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Execute upload
    await s3Client.send(uploadCommand);

    // Generate public URL
    const baseUrl = `https://${BUCKET_NAME}.s3.${
      process.env.AWS_REGION || "ap-southeast-1"
    }.amazonaws.com`;
    const url = `${baseUrl}/${key}`;

    return {
      url,
      key,
    };
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error("Failed to upload image to S3");
  }
}

export async function deleteFromS3(
  key: string,
  thumbnailKey: string
): Promise<void> {
  try {
    const deleteCommands = [
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      }),
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: thumbnailKey,
      }),
    ];

    await Promise.all(deleteCommands.map((cmd) => s3Client.send(cmd)));
  } catch (error) {
    console.error("S3 delete error:", error);
    throw new Error("Failed to delete image from S3");
  }
}

export async function uploadAvatarToS3(
  file: File,
  userId: string
): Promise<S3UploadResult> {
  try {
    // Generate unique key for avatar
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop() || "jpg";
    const key = `avatars/${userId}/${timestamp}.${fileExtension}`;

    // Process image using common function
    const { buffer: processedImage } = await processImage(file);

    // Upload avatar
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: processedImage,
      ContentType: "image/jpeg",
      Metadata: {
        userId,
        type: "avatar",
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Execute upload
    await s3Client.send(uploadCommand);

    // Generate public URL
    const baseUrl = `https://${BUCKET_NAME}.s3.${
      process.env.AWS_REGION || "ap-southeast-1"
    }.amazonaws.com`;
    const url = `${baseUrl}/${key}`;

    return {
      url,
      key,
    };
  } catch (error) {
    console.error("S3 avatar upload error:", error);
    throw new Error("Failed to upload avatar to S3");
  }
}

export async function deleteAvatarFromS3(key: string): Promise<void> {
  try {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(deleteCommand);
  } catch (error) {
    console.error("S3 avatar delete error:", error);
    throw new Error("Failed to delete avatar from S3");
  }
}

export async function uploadVideoToS3(
  processedVideo: ProcessedVideo,
  userId: string,
  planId?: string
): Promise<S3UploadResult> {
  try {
    const timestamp = Date.now();
    
    // Generate keys for video and thumbnail
    const videoKey = `videos/${userId}/${timestamp}.mp4`;
    const thumbnailKey = `thumbnails/${userId}/${timestamp}.jpg`;

    // Upload video and thumbnail in parallel
    const [videoUpload, thumbnailUpload] = await Promise.all([
      s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: videoKey,
        Body: processedVideo.buffer,
        ContentType: "video/mp4",
        Metadata: {
          userId,
          planId: planId || "",
          type: "video",
          duration: processedVideo.metadata.duration.toString(),
          uploadedAt: new Date().toISOString(),
        },
      })),
      s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: thumbnailKey,
        Body: processedVideo.thumbnailBuffer,
        ContentType: "image/jpeg",
        Metadata: {
          userId,
          planId: planId || "",
          type: "thumbnail",
          uploadedAt: new Date().toISOString(),
        },
      }))
    ]);

    // Generate public URLs
    const baseUrl = `https://${BUCKET_NAME}.s3.${
      process.env.AWS_REGION || "ap-southeast-1"
    }.amazonaws.com`;
    
    const videoUrl = `${baseUrl}/${videoKey}`;
    const thumbnailUrl = `${baseUrl}/${thumbnailKey}`;

    return {
      url: videoUrl,
      key: videoKey,
      thumbnailUrl,
      thumbnailKey,
      duration: processedVideo.metadata.duration,
    };
  } catch (error) {
    console.error("S3 video upload error:", error);
    throw new Error("Failed to upload video to S3");
  }
}

export async function deleteVideoFromS3(
  videoKey: string,
  thumbnailKey: string
): Promise<void> {
  try {
    const deleteCommands = [
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: videoKey,
      }),
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: thumbnailKey,
      }),
    ];

    await Promise.all(deleteCommands.map((cmd) => s3Client.send(cmd)));
  } catch (error) {
    console.error("S3 video delete error:", error);
    throw new Error("Failed to delete video from S3");
  }
}

export async function generatePresignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error("S3 presigned URL error:", error);
    throw new Error("Failed to generate presigned URL");
  }
}
