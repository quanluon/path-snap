"use client";

import { useState, useEffect, Suspense, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import ImageCard from "@/components/ImageCard";
import OptimizedImage from "@/components/OptimizedImage";
import { CardSkeleton, AvatarSkeleton, TextSkeleton } from "@/components/Skeleton";
import { UserIcon, MapPinIcon } from "@heroicons/react/24/outline";
import type { ImageWithReactions, User } from "@/types";
import Link from "next/link";

interface UserProfileData {
  user: User;
  images: ImageWithReactions[];
  totalImages: number;
}

function UserProfileContent() {
  const params = useParams();
  const userId = params.id as string;

  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  // Calculate items per row based on screen size
  const itemsPerRow = useMemo(() => {
    if (typeof window === "undefined") return 3;
    const width = window.innerWidth;
    if (width < 768) return 1; // Mobile
    if (width < 1024) return 2; // Tablet
    return 3; // Desktop
  }, []);

  // Group images into rows for virtual scrolling
  const imageRows = useMemo(() => {
    if (!profileData?.images) return [];
    const rows = [];
    for (let i = 0; i < profileData.images.length; i += itemsPerRow) {
      rows.push(profileData.images.slice(i, i + itemsPerRow));
    }
    return rows;
  }, [profileData?.images, itemsPerRow]);

  // Virtual scrolling setup for rows
  const virtualizer = useVirtualizer({
    count: imageRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 400, // Estimated height of each row
    overscan: 5,
  });

  useEffect(() => {
    async function fetchUserProfile() {
      if (!userId) return;

      try {
        setIsLoading(true);
        setError(null);

        // Fetch user's images using the images API with userId filter
        const imagesResponse = await fetch(
          `/api/images?userId=${userId}&limit=100`
        );

        if (!imagesResponse.ok) {
          throw new Error("Failed to fetch user images");
        }

        const imagesData = await imagesResponse.json();

        // User has no images, fetch user info separately
        const userResponse = await fetch(`/api/users/${userId}/info`);
        if (!userResponse.ok) {
          if (userResponse.status === 404) {
            throw new Error("User not found");
          }
          throw new Error("Failed to fetch user info");
        }
        const { user } = await userResponse.json();

        setProfileData({
          user,
          images: imagesData.images || [],
          totalImages: imagesData.images ? imagesData.images.length : 0,
        });
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserProfile();
  }, [userId]);

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

        {/* Images Grid Skeleton */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="h-8 bg-white/10 rounded mb-6 w-32"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {Array.from({ length: 6 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
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
    <div className="min-h-screen bg-dark-gradient">
        {/* Header */}
        <div className="bg-black/50 backdrop-blur-sm border-b border-white/10">
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
                    className="w-30 h-30 rounded-full object-cover border-4 border-white/20"
                  />
                ) : (
                  <div className="w-30 h-30 rounded-full bg-white/10 border-4 border-white/20 flex items-center justify-center">
                    <UserIcon className="w-16 h-16 text-white/70" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {user.name || user.email}
                </h1>
                {user.name && (
                  <p className="text-white/70 text-lg mb-4">{user.email}</p>
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

        {/* Images Grid */}
        <div className="max-w-6xl mx-auto px-4 py-8">
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
            <>
              <h2 className="text-white text-2xl font-semibold mb-6">
                Images ({images.length})
              </h2>
              {/* Virtual Scrolling Container */}
              <div
                ref={parentRef}
                className="h-[600px] overflow-auto"
                style={{
                  contain: "strict",
                }}
              >
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                  }}
                >
                  {virtualizer.getVirtualItems().map((virtualItem) => {
                    const imageRow = imageRows[virtualItem.index];
                    if (!imageRow) return null;

                    return (
                      <div
                        key={virtualItem.key}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      >
                         <div
                           className={`grid gap-12 ${
                             itemsPerRow === 1
                               ? "grid-cols-1"
                               : itemsPerRow === 2
                                 ? "grid-cols-2"
                                 : "grid-cols-3"
                           }`}
                         >
                          {imageRow.map((image) => (
                            <ImageCard
                              key={image.id}
                              image={image}
                              variant="grid"
                              showAuthor={false}
                              showReactions={false}
                              showViewCount={false}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
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

          {/* Images Grid Skeleton */}
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="h-8 bg-white/10 rounded mb-6 w-32"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {Array.from({ length: 6 }).map((_, index) => (
                <CardSkeleton key={index} />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <UserProfileContent />
    </Suspense>
  );
}
