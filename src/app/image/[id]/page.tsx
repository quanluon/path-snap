import { Metadata } from "next";
import ImageSEO from "@/components/ImageSEO";
import ImageDetailModal from "@/components/ImageDetailModal";
import { CarouselSkeleton } from "@/components/Skeleton";
import type { ImageWithReactions } from "@/types";

interface ImagePageProps {
  params: {
    id: string;
  };
}

async function getImage(id: string): Promise<ImageWithReactions | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/images/${id}`, {
      cache: 'no-store' // Always fetch fresh data for SEO
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.image;
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
}

export async function generateMetadata({ params }: ImagePageProps): Promise<Metadata> {
  const image = await getImage(params.id);
  
  if (!image) {
    return {
      title: "Image Not Found - Checkpoint",
      description: "The requested image could not be found.",
    };
  }

  const title = image.description 
    ? `${image.description} - Checkpoint Photo`
    : `Checkpoint Photo by ${image.author?.name || image.author?.email || "Anonymous"}`;
  
  const description = image.description 
    ? `${image.description} - Discovered at ${image.address || "an amazing location"}`
    : `Amazing photo captured at ${image.address || "a beautiful location"} by ${image.author?.name || image.author?.email || "Anonymous"}`;

  const imageUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${image.url}`;
  const pageUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/image/${params.id}`;

  return {
    title,
    description,
    keywords: [`photo, ${image.address || "location"}, checkpoint, travel, photography, ${image.author?.name || image.author?.email || "Anonymous"}`],
    authors: [{ name: image.author?.name || image.author?.email || "Anonymous" }],
    openGraph: {
      type: "article",
      title,
      description,
      url: pageUrl,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: image.description || "Checkpoint photo",
        },
      ],
      siteName: "Checkpoint",
      publishedTime: new Date(image.createdAt).toISOString(),
      authors: [image.author?.name || image.author?.email || "Anonymous"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
      creator: "@checkpoint",
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: pageUrl,
    },
  };
}

export default async function ImagePage({ params }: ImagePageProps) {
  const image = await getImage(params.id);

  if (!image) {
    return (
      <div className="min-h-screen bg-dark-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h1 className="text-white text-2xl font-semibold mb-2">Image Not Found</h1>
          <p className="text-white/70">The requested image could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-gradient">
      <ImageSEO image={image} />
      <ImageDetailModal
        image={image}
        isOpen={true}
        onClose={() => {
          // Redirect to home page when modal is closed
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
        }}
      />
    </div>
  );
}