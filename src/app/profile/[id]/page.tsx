"use client";

import ImageDetailModal from "@/components/ImageDetailModal";
import ImageList from "@/components/ImageList";
import OptimizedImage from "@/components/OptimizedImage";
import { AvatarSkeleton, CarouselSkeleton } from "@/components/Skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ImageWithReactions, User } from "@/types";
import { MapPinIcon, UserIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

interface UserProfileData {
  user: User;
  images: ImageWithReactions[];
  totalImages: number;
}

function UserProfileContent() {
  const params = useParams();
  const userId = params.id as string;

  const { t } = useLanguage();

  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImageWithReactions | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const itemsPerPage = 50;

  const fetchImages = useCallback(async (isInitial = false) => {
    if (!userId) return;
    
    try {
      if (isInitial) {
        setIsLoading(true);
        setProfileData(prev => prev ? { ...prev, images: [] } : null);
        setHasMore(true);
      } else {
        setIsLoadingMore(true);
      }

      const currentImages = profileData?.images || [];
      const response = await fetch(
        `/api/images?userId=${userId}&limit=${itemsPerPage}&offset=${currentImages.length}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user images");
      }

      const imagesData = await response.json();
      const newImages = imagesData.images || [];

      // Fetch user info if not already loaded
      let user = profileData?.user;
      if (!user) {
        const userResponse = await fetch(`/api/users/${userId}/info`);
        if (!userResponse.ok) {
          if (userResponse.status === 404) {
            throw new Error("User not found");
          }
          throw new Error("Failed to fetch user info");
        }
        const userData = await userResponse.json();
        user = userData.user;
      }

      if (isInitial) {
        setProfileData({
          user: user!,
          images: newImages,
          totalImages: newImages.length,
        });
      } else {
        // Filter out duplicates based on image ID
        const uniqueNewImages = newImages.filter(
          (newImage: ImageWithReactions) =>
            !currentImages.some((existingImage) => existingImage.id === newImage.id)
        );
        setProfileData(prev => prev ? {
          ...prev,
          images: [...prev.images, ...uniqueNewImages],
          totalImages: prev.totalImages + uniqueNewImages.length,
        } : null);
      }

      // If no new images returned, no more to load
      setHasMore(newImages.length > 0);
    } catch (err) {
      console.error("Error fetching user images:", err);
      setError(err instanceof Error ? err.message : "Failed to load images");
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [userId]);

  const loadMoreImages = async () => {
    if (hasMore && !isLoadingMore) {
      await fetchImages(false);
    }
  };

  const handleImageClick = (image: ImageWithReactions) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  useEffect(() => {
    fetchImages(true);
  }, [fetchImages]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-gradient">
        {/* Header Skeleton */}
        <div className="bg-black/50 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center space-x-6">
              <AvatarSkeleton size={120} />
              <div className="flex-1 min-w-0">
                <div className="h-8 bg-white/10 rounded mb-2 w-3/4"></div>
                <div className="h-5 bg-white/10 rounded mb-4 w-1/2"></div>
                <div className="flex items-center space-x-6">
                  <div className="h-4 bg-white/10 rounded w-20"></div>
                  <div className="h-4 bg-white/10 rounded w-24"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Images Carousel Skeleton */}
        <div className="flex-1">
          <CarouselSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h1 className="text-white text-2xl font-semibold mb-2">
            Profile Not Found
          </h1>
          <p className="text-white/70 mb-6">{error}</p>
          <Link
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-dark-gradient flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/70">No profile data available</p>
        </div>
      </div>
    );
  }

  const { user, images, totalImages } = profileData;

  return (
    <div className="min-h-screen bg-dark-gradient flex flex-col">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-white/10 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center space-x-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {user.avatarUrl ? (
                <OptimizedImage
                  src={user.avatarUrl}
                  alt={user.name || user.email}
                  width={120}
                  height={120}
                  className="w-[120px] h-[120px] rounded-full object-cover border-4 border-white/20"
                  objectFit="cover"
                />
              ) : (
                <div className="w-[120px] h-[120px] rounded-full bg-white/10 border-4 border-white/20 flex items-center justify-center">
                  <UserIcon className="w-16 h-16 text-white/70" />
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-white mb-2">
                {user.name || t.profile.noName}
              </h1>
              {user.name && (
                <p className="text-white/70 text-lg mb-4">{t.profile.member}</p>
              )}

              {/* Stats */}
              <div className="flex items-center space-x-6 text-white/70">
                <div className="flex items-center space-x-2">
                  <MapPinIcon className="w-5 h-5" />
                  <span className="text-lg font-semibold">{totalImages}</span>
                  <span className="text-sm">images</span>
                </div>
                <div className="text-sm">
                  {user.createdAt ? (
                    <>
                      Joined{" "}
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </>
                  ) : (
                    <span>Member</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Images Carousel */}
      <div className="flex-1 pt-2">
        {images.length === 0 ? (
          <div className="text-center py-16">
            <MapPinIcon className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h2 className="text-white text-xl font-semibold mb-2">
              No Images Yet
            </h2>
            <p className="text-white/70">
              This user hasn&apos;t shared any images yet.
            </p>
          </div>
        ) : (
          <ImageList
            images={images}
            onImageClick={handleImageClick}
            onLoadMore={loadMoreImages}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
          />
        )}
      </div>

      <ImageDetailModal
        image={selectedImage}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
}

export default function UserProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-dark-gradient">
          {/* Header Skeleton */}
          <div className="bg-black/50 backdrop-blur-sm border-b border-white/10">
            <div className="max-w-4xl mx-auto px-4 py-8">
              <div className="flex items-center space-x-6">
                <AvatarSkeleton size={120} />
                <div className="flex-1 min-w-0">
                  <div className="h-8 bg-white/10 rounded mb-2 w-3/4"></div>
                  <div className="h-5 bg-white/10 rounded mb-4 w-1/2"></div>
                  <div className="flex items-center space-x-6">
                    <div className="h-4 bg-white/10 rounded w-20"></div>
                    <div className="h-4 bg-white/10 rounded w-24"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Images Carousel Skeleton */}
          <div className="flex-1">
            <CarouselSkeleton />
          </div>
        </div>
      }
    >
      <UserProfileContent />
    </Suspense>
  );
}
