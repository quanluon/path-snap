import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";

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

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get image metadata to determine if it needs processing
    const metadata = await sharp(buffer).metadata();
    const isLargeImage = (metadata.width || 0) > 1920 || (metadata.height || 0) > 1920;
    
    let processedImage: Buffer;

    if (isLargeImage) {
      // For large images, resize but maintain high quality
      processedImage = await sharp(buffer)
        .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
        .jpeg({ 
          quality: 95, // Higher quality for large images
          progressive: true,
          mozjpeg: true // Better compression
        })
        .toBuffer();
    } else {
      // For smaller images, keep original quality but optimize
      processedImage = await sharp(buffer)
        .jpeg({ 
          quality: 98, // Very high quality for smaller images
          progressive: true,
          mozjpeg: true
        })
        .toBuffer();
    }

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
      process.env.AWS_REGION || "us-east-1"
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
