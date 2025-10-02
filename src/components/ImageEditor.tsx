'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ImageEditorProps {
  imageFile: File;
  onSave: (editedFile: File) => void;
  onCancel: () => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function ImageEditor({ imageFile, onSave, onCancel }: ImageEditorProps) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [rotation, setRotation] = useState(0);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cropMode, setCropMode] = useState(false);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setIsLoading(false);
    };
    img.src = URL.createObjectURL(imageFile);
    
    return () => {
      URL.revokeObjectURL(img.src);
    };
  }, [imageFile]);

  // Draw image on canvas
  useEffect(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate canvas size based on rotation
    const isRotated = rotation === 90 || rotation === 270;
    const canvasWidth = isRotated ? image.height : image.width;
    const canvasHeight = isRotated ? image.width : image.height;

    // Set canvas size
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    setCanvasSize({ width: canvasWidth, height: canvasHeight });

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Apply transformations
    ctx.save();
    
    // Move to center
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    
    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);
    
    // Apply flips
    const scaleX = flipHorizontal ? -1 : 1;
    const scaleY = flipVertical ? -1 : 1;
    ctx.scale(scaleX, scaleY);
    
    // Draw image
    ctx.drawImage(
      image,
      -image.width / 2,
      -image.height / 2,
      image.width,
      image.height
    );
    
    ctx.restore();

    // Draw crop overlay if in crop mode
    if (cropMode && cropArea) {
      drawCropOverlay(ctx, canvasWidth, canvasHeight, cropArea);
    }
  }, [image, rotation, flipHorizontal, flipVertical, cropMode, cropArea]);

  // Draw crop overlay
  const drawCropOverlay = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, area: CropArea) => {
    // Draw dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Clear crop area
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(area.x, area.y, area.width, area.height);
    ctx.globalCompositeOperation = 'source-over';
    
    // Draw crop border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(area.x, area.y, area.width, area.height);
    
    // Draw corner handles
    const handleSize = 8;
    ctx.fillStyle = '#ffffff';
    
    // Top-left
    ctx.fillRect(area.x - handleSize/2, area.y - handleSize/2, handleSize, handleSize);
    // Top-right
    ctx.fillRect(area.x + area.width - handleSize/2, area.y - handleSize/2, handleSize, handleSize);
    // Bottom-left
    ctx.fillRect(area.x - handleSize/2, area.y + area.height - handleSize/2, handleSize, handleSize);
    // Bottom-right
    ctx.fillRect(area.x + area.width - handleSize/2, area.y + area.height - handleSize/2, handleSize, handleSize);
  };

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
    setCropMode(false);
    setCropArea(null);
  };

  const handleCropMode = () => {
    setCropMode(true);
    // Initialize crop area to center 80% of image
    if (canvasSize.width > 0 && canvasSize.height > 0) {
      const cropWidth = canvasSize.width * 0.8;
      const cropHeight = canvasSize.height * 0.8;
      setCropArea({
        x: (canvasSize.width - cropWidth) / 2,
        y: (canvasSize.height - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight,
      });
    }
  };

  const handleCropApply = () => {
    if (!cropArea || !image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create new canvas for cropped image
    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');
    if (!croppedCtx) return;

    croppedCanvas.width = cropArea.width;
    croppedCanvas.height = cropArea.height;

    // Draw the cropped portion
    croppedCtx.drawImage(
      canvas,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height,
      0, 0, cropArea.width, cropArea.height
    );

    // Convert to blob and create new image
    croppedCanvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], imageFile.name, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        
        // Update the image source
        const reader = new FileReader();
        reader.onload = (e) => {
          const newImg = new Image();
          newImg.onload = () => {
            setImage(newImg);
            setCropMode(false);
            setCropArea(null);
          };
          newImg.src = e.target?.result as string;
        };
        reader.readAsDataURL(blob);
      }
    }, 'image/jpeg', 0.95);
  };

  const handleCropCancel = () => {
    setCropMode(false);
    setCropArea(null);
  };

  // Mouse event handlers for crop area
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cropMode || !cropArea) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDragging(true);
    setDragStart({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cropMode || !cropArea || !isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;

    setCropArea({
      ...cropArea,
      x: Math.max(0, Math.min(canvasSize.width - cropArea.width, cropArea.x + deltaX)),
      y: Math.max(0, Math.min(canvasSize.height - cropArea.height, cropArea.y + deltaY)),
    });

    setDragStart({ x, y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = () => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
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
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-lg shadow-dark-secondary border border-dark-primary max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="p-4 border-b border-dark-primary">
          <h2 className="text-xl font-bold text-dark-primary">Edit Image</h2>
        </div>

        {/* Canvas Container */}
        <div className="p-4 flex justify-center">
          <div className="border border-dark-primary rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-[60vh] object-contain cursor-crosshair"
              style={{ display: 'block' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-dark-primary">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            {/* Rotate Left */}
            <button
              onClick={() => handleRotate(-90)}
              className="px-4 py-2 bg-dark-secondary text-dark-primary rounded-lg hover:bg-dark-hover transition-colors border border-dark-primary"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">Rotate Left</span>
              </div>
            </button>

            {/* Rotate Right */}
            <button
              onClick={() => handleRotate(90)}
              className="px-4 py-2 bg-dark-secondary text-dark-primary rounded-lg hover:bg-dark-hover transition-colors border border-dark-primary"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 4v5h-.582m-15.356 2A8.001 8.001 0 0019.418 9m0 0H15m-11 11v-5h.581m0 0a8.003 8.003 0 0015.357-2m-15.357 2H9" />
                </svg>
                <span className="hidden sm:inline">Rotate Right</span>
              </div>
            </button>

            {/* Flip Horizontal */}
            <button
              onClick={handleFlipHorizontal}
              className="px-4 py-2 bg-dark-secondary text-dark-primary rounded-lg hover:bg-dark-hover transition-colors border border-dark-primary"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span className="hidden sm:inline">Flip H</span>
              </div>
            </button>

            {/* Flip Vertical */}
            <button
              onClick={handleFlipVertical}
              className="px-4 py-2 bg-dark-secondary text-dark-primary rounded-lg hover:bg-dark-hover transition-colors border border-dark-primary"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                <span className="hidden sm:inline">Flip V</span>
              </div>
            </button>

            {/* Crop */}
            <button
              onClick={handleCropMode}
              className={`px-4 py-2 rounded-lg transition-colors border border-dark-primary ${
                cropMode 
                  ? 'bg-dark-primary text-dark-secondary' 
                  : 'bg-dark-secondary text-dark-primary hover:bg-dark-hover'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <span className="hidden sm:inline">Crop</span>
              </div>
            </button>
          </div>

          {/* Crop Action Buttons */}
          {cropMode && (
            <div className="mb-4 flex space-x-3">
              <button
                onClick={handleCropApply}
                className="px-4 py-2 bg-dark-primary text-dark-secondary rounded-lg hover:bg-dark-hover transition-colors border border-dark-primary"
              >
                Apply Crop
              </button>
              <button
                onClick={handleCropCancel}
                className="px-4 py-2 bg-dark-muted text-dark-secondary rounded-lg hover:bg-dark-hover transition-colors border border-dark-primary"
              >
                Cancel Crop
              </button>
            </div>
          )}

          {/* Reset Button */}
          <div className="mb-4">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-dark-muted text-dark-secondary rounded-lg hover:bg-dark-hover transition-colors border border-dark-primary"
            >
              Reset
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-dark-muted text-dark-secondary rounded-lg hover:bg-dark-hover transition-colors border border-dark-primary"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-dark-primary text-dark-secondary rounded-lg hover:bg-dark-hover transition-colors border border-dark-primary"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
