'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';
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

  // Create object URL for the image
  useEffect(() => {
    const url = URL.createObjectURL(imageFile);
    setImageUrl(url);
    setIsLoading(false);
    
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  const handleSave = (savedImageData: { imageBase64?: string; name: string; extension: string }) => {
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
    
    onSave(editedFile);
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
    <div className="fixed inset-0 z-[9999]" style={{
      zIndex: 9999,
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
    }}>
      <FilerobotEditor
        source={imageUrl}
        onSave={handleSave}
        onClose={onCancel}
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
        previewPixelRatio={window.devicePixelRatio}
        useBackendTranslations={false}
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
}