"use client";

import Head from "next/head";
import type { ImageWithReactions } from "@/types";

interface ImageSEOProps {
  image: ImageWithReactions;
  baseUrl?: string;
}

export default function ImageSEO({ image, baseUrl = "https://path-snap.vercel.app/" }: ImageSEOProps) {
  if (!image) return null;

  const imageUrl = `${baseUrl}${image.url}`;
  const pageUrl = `${baseUrl}/image/${image.id}`;
  const title = image.description 
    ? `${image.description} - Checkpoint Photo`
    : `Checkpoint Photo by ${image.author?.name || image.author?.email || "Anonymous"}`;
  
  const description = image.description 
    ? `${image.description} - Discovered at ${image.address || "an amazing location"}`
    : `Amazing photo captured at ${image.address || "a beautiful location"} by ${image.author?.name || image.author?.email || "Anonymous"}`;

  const authorName = image.author?.name || image.author?.email || "Anonymous";
  const location = image.address || "Unknown Location";

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={`photo, ${location}, checkpoint, travel, photography, ${authorName}`} />
      <link rel="canonical" href={pageUrl} />

      {/* Open Graph Meta Tags */}
      <meta property="og:type" content="article" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={image.description || "Checkpoint photo"} />
      <meta property="og:site_name" content="Checkpoint" />
      
      {/* Article specific Open Graph */}
      <meta property="article:author" content={authorName} />
      <meta property="article:published_time" content={image.createdAt.toISOString()} />
      <meta property="article:section" content="Photography" />
      <meta property="article:tag" content={location} />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={image.description || "Checkpoint photo"} />
      <meta name="twitter:creator" content="@checkpoint" />

      {/* Additional SEO Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content={authorName} />
      <meta name="geo.region" content="Global" />
      
      {/* Location specific meta tags */}
      {image.latitude && image.longitude && (
        <>
          <meta name="geo.placename" content={location} />
          <meta name="geo.position" content={`${image.latitude};${image.longitude}`} />
          <meta name="ICBM" content={`${image.latitude}, ${image.longitude}`} />
        </>
      )}

      {/* Structured Data - JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Photograph",
            "name": title,
            "description": description,
            "image": {
              "@type": "ImageObject",
              "url": imageUrl,
              "width": 1200,
              "height": 630,
              "caption": image.description || "Checkpoint photo"
            },
            "author": {
              "@type": "Person",
              "name": authorName,
              "url": image.author?.id ? `${baseUrl}/profile/${image.author.id}` : undefined
            },
            "dateCreated": image.createdAt,
            "datePublished": image.createdAt,
            "publisher": {
              "@type": "Organization",
              "name": "Checkpoint",
              "logo": {
                "@type": "ImageObject",
                "url": `${baseUrl}/icon-192.png`
              }
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": pageUrl
            },
            ...(image.latitude && image.longitude && {
              "contentLocation": {
                "@type": "Place",
                "name": location,
                "geo": {
                  "@type": "GeoCoordinates",
                  "latitude": image.latitude,
                  "longitude": image.longitude
                }
              }
            }),
            "interactionStatistic": {
              "@type": "InteractionCounter",
              "interactionType": "https://schema.org/ViewAction",
              "userInteractionCount": image.viewCount || 0
            }
          })
        }}
      />

      {/* Additional meta tags for better sharing */}
      <meta property="og:locale" content="en_US" />
      <meta property="og:updated_time" content={image.createdAt.toISOString()} />
      <meta name="theme-color" content="#0a0a0a" />
      
      {/* Mobile specific */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    </Head>
  );
}
