import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export interface S3UploadResult {
  url: string;
  thumbnailUrl: string;
  key: string;
  thumbnailKey: string;
}

export async function uploadToS3(
  file: File,
  userId: string,
  planId?: string
): Promise<S3UploadResult> {
  try {
    // Generate unique keys
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const key = `images/${userId}/${timestamp}.${fileExtension}`;
    const thumbnailKey = `thumbnails/${userId}/${timestamp}_thumb.${fileExtension}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process main image with Sharp (higher quality). No rotation.
    const processedImage = await sharp(buffer)
      .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 92 })
      .toBuffer();

    // Process thumbnail with Sharp. No rotation.
    const thumbnail = await sharp(buffer)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Upload main image
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: processedImage,
      ContentType: 'image/jpeg',
      Metadata: {
        userId,
        planId: planId || '',
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Upload thumbnail
    const thumbnailCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: thumbnailKey,
      Body: thumbnail,
      ContentType: 'image/jpeg',
      Metadata: {
        userId,
        planId: planId || '',
        type: 'thumbnail',
        uploadedAt: new Date().toISOString(),
      },
    });

    // Execute uploads in parallel
    await Promise.all([
      s3Client.send(uploadCommand),
      s3Client.send(thumbnailCommand),
    ]);

    // Generate public URLs
    const baseUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`;
    const url = `${baseUrl}/${key}`;
    const thumbnailUrl = `${baseUrl}/${thumbnailKey}`;

    return {
      url,
      thumbnailUrl,
      key,
      thumbnailKey,
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('Failed to upload image to S3');
  }
}

export async function deleteFromS3(key: string, thumbnailKey: string): Promise<void> {
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

    await Promise.all(deleteCommands.map(cmd => s3Client.send(cmd)));
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error('Failed to delete image from S3');
  }
}

export async function generatePresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error('S3 presigned URL error:', error);
    throw new Error('Failed to generate presigned URL');
  }
}
