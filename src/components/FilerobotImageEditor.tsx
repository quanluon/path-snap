'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';

// Dynamically import FilerobotEditor to avoid SSR issues
const FilerobotEditor = dynamic(
  () => import('react-filerobot-image-editor').then((mod) => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
        <div className="bg-dark-card rounded-lg p-6 text-center">
          <div className="text-dark-muted">Loading editor...</div>
        </div>
      </div>
    )
  }
);

// Import constants separately
const TABS = {
  FINETUNE: 'Finetune',
  FILTERS: 'Filters',
  ADJUST: 'Adjust',
  WATERMARK: 'Watermark',
  ANNOTATE: 'Annotate',
  RESIZE: 'Resize',
} as const;

const TOOLS = {
  CROP: 'Crop',
  ROTATE: 'Rotate',
  FLIP_X: 'Flip_X',
  FLIP_Y: 'Flip_Y',
  BRIGHTNESS: 'Brightness',
  CONTRAST: 'Contrast',
  HSV: 'HueSaturationValue',
  WARMTH: 'Warmth',
  BLUR: 'Blur',
  THRESHOLD: 'Threshold',
  POSTERIZE: 'Posterize',
  PIXELATE: 'Pixelate',
  NOISE: 'Noise',
  FILTERS: 'Filters',
  RECT: 'Rect',
  ELLIPSE: 'Ellipse',
  POLYGON: 'Polygon',
  TEXT: 'Text',
  LINE: 'Line',
  IMAGE: 'Image',
  ARROW: 'Arrow',
  WATERMARK: 'Watermark',
  PEN: 'Pen',
  RESIZE: 'Resize',
} as const;

interface FilerobotImageEditorProps {
  imageFile: File;
  onSave: (editedFile: File) => void;
  onCancel: () => void;
}

export default function FilerobotImageEditor({ imageFile, onSave, onCancel }: FilerobotImageEditorProps) {
  const { t } = useLanguage();
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Force cleanup function
  const forceCleanup = () => {
    document.body.classList.remove('editor-open');
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
  };

  // Create object URL for the image
  useEffect(() => {
    const url = URL.createObjectURL(imageFile);
    setImageUrl(url);
    setIsLoading(false);
    
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  // Handle mobile viewport and prevent body scrolling
  useEffect(() => {
    // Add body class for mobile handling
    document.body.classList.add('editor-open');
    
    // Store original styles
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;
    const originalHeight = document.body.style.height;
    
    // Prevent body scrolling on mobile
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    // Only prevent zoom with multiple touches (pinch zoom)
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Add touch event listeners with passive: true for better performance
    document.addEventListener('touchstart', preventZoom, { passive: false });
    document.addEventListener('touchmove', preventZoom, { passive: false });

    // Cleanup
    return () => {
      // Force cleanup with timeout to ensure it happens
      setTimeout(() => {
        document.body.classList.remove('editor-open');
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.width = originalWidth;
        document.body.style.height = originalHeight;
        document.removeEventListener('touchstart', preventZoom);
        document.removeEventListener('touchmove', preventZoom);
      }, 0);
    };
  }, []);

  const handleSave = (savedImageData: { imageBase64?: string; name: string; extension: string }) => {
    try {
      // Convert base64 to File
      if (!savedImageData.imageBase64) {
        console.error('No image data received');
        return;
      }
      
      const base64Data = savedImageData.imageBase64.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      const editedFile = new File([blob], imageFile.name, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
      
      // Call onSave callback
      onSave(editedFile);
    } catch (error) {
      console.error('Error saving image:', error);
    }
  };

  const handleClose = () => {
    try {
      // Force cleanup immediately
      forceCleanup();
      
      // Add a small delay to ensure proper cleanup
      setTimeout(() => {
        onCancel();
      }, 100);
    } catch (error) {
      console.error('Error closing editor:', error);
      // Ensure cleanup even if there's an error
      forceCleanup();
    }
  };

  if (isLoading) {
    return createPortal(
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
        <div className="bg-dark-card rounded-lg p-6 text-center">
          <div className="text-dark-muted">{t.common.loading}</div>
        </div>
      </div>,
      document.body
    );
  }

  const editorContent = (
    <div 
      className="fixed inset-0 mobile-editor-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 2147483647, // Maximum z-index value
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        overflow: 'hidden',
        touchAction: 'none', // Prevent mobile scrolling
        WebkitOverflowScrolling: 'touch',
        transform: 'translateZ(0)', // Force hardware acceleration
        willChange: 'transform',
        // Mobile-specific styles
        WebkitTransform: 'translateZ(0)',
        WebkitBackfaceVisibility: 'hidden',
        WebkitPerspective: 1000,
      }}
    >
      <FilerobotEditor
        source={imageUrl}
        onSave={handleSave}
        onClose={handleClose}
        annotationsCommon={{
          fill: '#ff0000',
        }}
        Rotate={{ angle: 90, componentType: 'slider' }}
        Crop={{
          presetsItems: [
            {
              titleKey: 'classicTv',
              descriptionKey: '4:3',
              ratio: 4 / 3,
            },
            {
              titleKey: 'cinemascope',
              descriptionKey: '21:9',
              ratio: 21 / 9,
            },
          ],
          presetsFolders: [
            {
              titleKey: 'socialMedia',
              groups: [
                {
                  titleKey: 'facebook',
                  items: [
                    {
                      titleKey: 'profile',
                      width: 180,
                      height: 180,
                      ratio: 1,
                    },
                    {
                      titleKey: 'coverPhoto',
                      width: 820,
                      height: 312,
                      ratio: 820 / 312,
                    },
                  ],
                },
              ],
            },
          ],
        }}
        tabsIds={[TABS.ADJUST, TABS.ANNOTATE, TABS.WATERMARK, TABS.FINETUNE, TABS.FILTERS, TABS.RESIZE]}
        defaultTabId={TABS.ADJUST}
        defaultToolId={TOOLS.CROP}
        savingPixelRatio={4}
        previewPixelRatio={typeof window !== 'undefined' ? window.devicePixelRatio : 1}
        useBackendTranslations={false}
        translations={{
          'common.save': t.common.save,
          'common.cancel': t.common.cancel,
          'common.close': t.common.close,
          'common.loading': t.common.loading,
          'common.reset': t.editor.reset,
          'adjust.brightness': t.editor.brightness,
          'adjust.contrast': t.editor.contrast,
          'adjust.saturation': t.editor.saturation,
          'adjust.exposure': t.editor.exposure,
          'adjust.highlights': t.editor.highlights,
          'adjust.shadows': t.editor.shadows,
          'adjust.whites': t.editor.whites,
          'adjust.blacks': t.editor.blacks,
          'adjust.temperature': t.editor.temperature,
          'adjust.tint': t.editor.tint,
          'adjust.vibrance': t.editor.vibrance,
          'adjust.hue': t.editor.hue,
          'adjust.sharpness': t.editor.sharpness,
          'adjust.clarity': t.editor.clarity,
          'adjust.dehaze': t.editor.dehaze,
          'adjust.gamma': t.editor.gamma,
          'annotate.text': t.editor.text,
          'annotate.rectangle': t.editor.rectangle,
          'annotate.ellipse': t.editor.ellipse,
          'annotate.polygon': t.editor.polygon,
          'annotate.free': t.editor.free,
          'annotate.arrow': t.editor.arrow,
          'annotate.line': t.editor.line,
          'crop.title': t.editor.crop,
          'crop.rotate': t.editor.rotate,
          'crop.flipHorizontal': t.editor.flipHorizontal,
          'crop.flipVertical': t.editor.flipVertical,
          'filters.title': t.editor.filters,
          'resize.title': t.editor.resize,
          'watermark.title': t.editor.watermark,
        }}
        closeAfterSave={true}
        disableZooming={false}
        noCrossOrigin={false}
        disableSaveIfNoChanges={false}
        removeSaveButton={false}
        resetOnImageSourceChange={false}
        // Mobile-specific configurations
        useZoomPresetsMenu={true}
        backgroundColor="transparent"
        // Ensure proper event handling
        onBeforeSave={(savedImageData) => {
          console.log('Before save:', savedImageData);
          return true; // Allow save to proceed
        }}
        theme={{
          palette: {
            'bg-primary-active': '#1f2937',
            'bg-primary': '#374151',
            'accent-primary': '#3b82f6',
            'accent-primary-active': '#2563eb',
            'text-primary': '#ffffff',
            'text-primary-active': '#f3f4f6',
            'text-secondary': '#d1d5db',
            'text-secondary-active': '#9ca3af',
            'border-primary': '#4b5563',
            'border-primary-active': '#6b7280',
          },
        }}
      />
    </div>
  );

  // Use portal to render at document.body level for better z-index handling
  return typeof window !== 'undefined' ? createPortal(editorContent, document.body) : null;
}