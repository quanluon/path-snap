'use client';

import { useState, useRef, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

interface ImageEditorProps {
  imageFile: File;
  onSave: (editedFile: File) => void;
  onCancel: () => void;
}

export default function ImageEditor({ imageFile, onSave, onCancel }: ImageEditorProps) {
  const { t } = useLanguage();
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [rotation, setRotation] = useState(0);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [imageUrl, setImageUrl] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load image
  useEffect(() => {
    const imgElement = new window.Image();
    imgElement.onload = () => {
      setImage(imgElement);
      setIsLoading(false);
      
      // Set up initial crop to full image
      const { naturalWidth: width, naturalHeight: height } = imgElement;
      const crop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 100, // Full image width
            height: 100, // Full image height
          },
          width / height, // Use image's natural aspect ratio
          width,
          height
        ),
        width,
        height
      );
      setCrop(crop);
    };
    
    const url = URL.createObjectURL(imageFile);
    setImageUrl(url);
    imgElement.src = url;
    
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  // Handle mobile viewport and prevent zoom
  useEffect(() => {
    // Prevent zoom on mobile
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Add touch event listeners
    document.addEventListener('touchstart', preventZoom, { passive: false });
    document.addEventListener('touchmove', preventZoom, { passive: false });

    // Cleanup
    return () => {
      document.removeEventListener('touchstart', preventZoom);
      document.removeEventListener('touchmove', preventZoom);
    };
  }, []);

  const handleRotate = (degrees: number) => {
    setRotation((prev) => (prev + degrees) % 360);
  };

  const handleFlipHorizontal = () => {
    setFlipHorizontal((prev) => !prev);
  };

  const handleFlipVertical = () => {
    setFlipVertical((prev) => !prev);
  };

  const handleReset = () => {
    setRotation(0);
    setFlipHorizontal(false);
    setFlipVertical(false);
    if (image) {
      const { naturalWidth: width, naturalHeight: height } = image;
      const crop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 100, // Full image width
            height: 100, // Full image height
          },
          width / height, // Use image's natural aspect ratio
          width,
          height
        ),
        width,
        height
      );
      setCrop(crop);
    }
  };

  const handleSave = () => {
    if (!completedCrop || !imgRef.current || !canvasRef.current || !image) {
      console.log('Missing crop data or image reference');
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get the displayed image dimensions - use getBoundingClientRect for more accurate mobile measurements
    const displayedImg = imgRef.current;
    const rect = displayedImg.getBoundingClientRect();
    const displayWidth = rect.width;
    const displayHeight = rect.height;

    // Get the natural image dimensions
    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;

    // Calculate scale factors
    const scaleX = naturalWidth / displayWidth;
    const scaleY = naturalHeight / displayHeight;

    // Convert crop coordinates from display pixels to natural image pixels
    // Ensure coordinates are within bounds
    const cropX = Math.max(0, Math.min(completedCrop.x * scaleX, naturalWidth));
    const cropY = Math.max(0, Math.min(completedCrop.y * scaleY, naturalHeight));
    const cropWidth = Math.max(1, Math.min(completedCrop.width * scaleX, naturalWidth - cropX));
    const cropHeight = Math.max(1, Math.min(completedCrop.height * scaleY, naturalHeight - cropY));

    // Handle rotation - if rotated 90 or 270 degrees, swap width and height
    let finalWidth = cropWidth;
    let finalHeight = cropHeight;
    if (rotation === 90 || rotation === 270) {
      finalWidth = cropHeight;
      finalHeight = cropWidth;
    }

    // Set canvas size to final size
    canvas.width = finalWidth;
    canvas.height = finalHeight;

    // Apply transformations if any
    if (rotation !== 0 || flipHorizontal || flipVertical) {
      // Center the canvas for transformations
      ctx.translate(finalWidth / 2, finalHeight / 2);
      
      // Apply rotation
      if (rotation !== 0) {
        ctx.rotate((rotation * Math.PI) / 180);
      }
      
      // Apply flips
      ctx.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1);
      
      // Draw the cropped image centered
      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        -cropWidth / 2,
        -cropHeight / 2,
        cropWidth,
        cropHeight
      );
    } else {
      // No transformations, draw directly
      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );
    }

    // Convert to blob and create file
    canvas.toBlob((blob) => {
      if (blob) {
        const editedFile = new File([blob], imageFile.name, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        onSave(editedFile);
      }
    }, 'image/jpeg', 0.95);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
        <div className="bg-dark-card rounded-lg p-6 text-center">
          <div className="text-dark-muted">{t.common.loading}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col animate-in fade-in duration-300 touch-none overflow-hidden">
      {/* iPhone-style Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/90 backdrop-blur-md animate-in slide-in-from-top duration-300">
        <button
          onClick={onCancel}
          className="text-blue-400 font-medium text-lg hover:text-blue-300 transition-colors duration-200 active:scale-95"
        >
          Cancel
        </button>
        <h1 className="text-white font-semibold text-lg">Edit</h1>
        <button
          onClick={handleSave}
          className="text-blue-400 font-medium text-lg hover:text-blue-300 transition-colors duration-200 active:scale-95"
        >
          Done
        </button>
      </div>

      {/* Image Container - Scrollable */}
      <div className="flex-1 overflow-auto p-2 md:p-4 animate-in fade-in duration-500">
        <div className="flex items-center justify-center min-h-full">
          <div className="relative w-full max-w-full">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={undefined} // Allow free-form cropping
              className="max-w-[90vw] max-h-[70vh]"
              // Mobile-specific props
              disabled={false}
              keepSelection={true}
              minWidth={50}
              minHeight={50}
            >
              <Image
                ref={imgRef}
                src={imageUrl}
                alt={t.profile.cropMe}
                width={800}
                height={600}
                style={{
                  maxWidth: '90vw',
                  maxHeight: '70vh',
                  width: 'auto',
                  height: 'auto',
                  transform: `rotate(${rotation}deg) scaleX(${flipHorizontal ? -1 : 1}) scaleY(${flipVertical ? -1 : 1})`,
                  transformOrigin: 'center',
                  touchAction: 'none', // Prevent default touch behaviors
                  userSelect: 'none', // Prevent text selection
                }}
              />
            </ReactCrop>
          </div>
        </div>
      </div>

      {/* iPhone-style Bottom Controls */}
      <div className="bg-black/90 backdrop-blur-md p-4 animate-in slide-in-from-bottom duration-300">
        {/* Main Tool Buttons */}
        <div className="flex justify-center space-x-8 mb-6">
          {/* Rotate */}
          <button
            onClick={() => handleRotate(90)}
            className="flex flex-col items-center space-y-2 text-white hover:text-blue-400 transition-all duration-200 active:scale-95"
          >
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-all duration-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <span className="text-xs font-medium">Rotate</span>
          </button>

          {/* Flip Horizontal */}
          <button
            onClick={handleFlipHorizontal}
            className="flex flex-col items-center space-y-2 text-white hover:text-blue-400 transition-all duration-200 active:scale-95"
          >
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-all duration-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <span className="text-xs font-medium">Flip H</span>
          </button>

          {/* Flip Vertical */}
          <button
            onClick={handleFlipVertical}
            className="flex flex-col items-center space-y-2 text-white hover:text-blue-400 transition-all duration-200 active:scale-95"
          >
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-all duration-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <span className="text-xs font-medium">Flip V</span>
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="flex flex-col items-center space-y-2 text-white hover:text-blue-400 transition-all duration-200 active:scale-95"
          >
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-all duration-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <span className="text-xs font-medium">Reset</span>
          </button>
        </div>
      </div>

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}