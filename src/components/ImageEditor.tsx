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
    // Draw semi-transparent overlay only on the areas that will be cropped out
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    
    // Top area
    ctx.fillRect(0, 0, canvasWidth, area.y);
    // Bottom area
    ctx.fillRect(0, area.y + area.height, canvasWidth, canvasHeight - (area.y + area.height));
    // Left area
    ctx.fillRect(0, area.y, area.x, area.height);
    // Right area
    ctx.fillRect(area.x + area.width, area.y, canvasWidth - (area.x + area.width), area.height);
    
    // Draw crop border with shadow for better visibility
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.strokeRect(area.x, area.y, area.width, area.height);
    ctx.shadowBlur = 0;
    
    // Draw corner handles with better visibility
    const handleSize = 10;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#007AFF';
    ctx.lineWidth = 2;
    
    // Top-left
    ctx.fillRect(area.x - handleSize/2, area.y - handleSize/2, handleSize, handleSize);
    ctx.strokeRect(area.x - handleSize/2, area.y - handleSize/2, handleSize, handleSize);
    // Top-right
    ctx.fillRect(area.x + area.width - handleSize/2, area.y - handleSize/2, handleSize, handleSize);
    ctx.strokeRect(area.x + area.width - handleSize/2, area.y - handleSize/2, handleSize, handleSize);
    // Bottom-left
    ctx.fillRect(area.x - handleSize/2, area.y + area.height - handleSize/2, handleSize, handleSize);
    ctx.strokeRect(area.x - handleSize/2, area.y + area.height - handleSize/2, handleSize, handleSize);
    // Bottom-right
    ctx.fillRect(area.x + area.width - handleSize/2, area.y + area.height - handleSize/2, handleSize, handleSize);
    ctx.strokeRect(area.x + area.width - handleSize/2, area.y + area.height - handleSize/2, handleSize, handleSize);
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
    <div className="fixed inset-0 bg-black z-50 flex flex-col animate-in fade-in duration-300">
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

      {/* Canvas Container - Full Screen */}
      <div className="flex-1 flex items-center justify-center p-4 animate-in fade-in duration-500">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full object-contain cursor-crosshair transition-all duration-300"
            style={{ display: 'block' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
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

          {/* Flip */}
          <button
            onClick={handleFlipHorizontal}
            className="flex flex-col items-center space-y-2 text-white hover:text-blue-400 transition-all duration-200 active:scale-95"
          >
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-all duration-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <span className="text-xs font-medium">Flip</span>
          </button>

          {/* Crop */}
          <button
            onClick={handleCropMode}
            className={`flex flex-col items-center space-y-2 transition-all duration-200 active:scale-95 ${
              cropMode ? 'text-blue-400' : 'text-white hover:text-blue-400'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
              cropMode ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
            }`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            <span className="text-xs font-medium">Crop</span>
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

        {/* Crop Action Buttons - iPhone Style */}
        {cropMode && (
          <div className="flex justify-center space-x-4 animate-in fade-in duration-300">
            <button
              onClick={handleCropCancel}
              className="px-6 py-2 bg-gray-800 text-white rounded-full font-medium hover:bg-gray-700 transition-all duration-200 active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleCropApply}
              className="px-6 py-2 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-all duration-200 active:scale-95"
            >
              Apply
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
