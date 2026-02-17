import { useEffect, useState } from 'react';
import { getPageBackground } from '@/db/api';

interface PageBackgroundProps {
  pageKey: string;
  opacity?: number;
  overlay?: boolean;
  overlayOpacity?: number;
  className?: string;
}

const defaultBackgrounds: Record<string, string> = {
  'home': '/salon/IMG_8395.jpg',
  'login': '/salon/gallery-14.jpg',
  'booking-datetime': '/salon/gallery-11.jpg',
  'booking-treatment': '/salon/IMG_8393.jpg',
  'booking-details': '/salon/gallery-20.jpg',
  'booking-confirm': '/salon/gallery-17.jpg',
  'success': '/salon/IMG_8394.jpg',
  'not-found': '',
  'admin-layout': '/salon/gallery-5.jpg',
};

// Helper to get the full URL for uploaded images
const getFullImageUrl = (url: string): string => {
  // If it's an uploaded image (starts with /uploads/), prepend the API base URL
  if (url.startsWith('/uploads/')) {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    // Remove '/api' from the end and add the uploads path
    const baseUrl = API_BASE.replace('/api', '');
    return `${baseUrl}${url}`;
  }
  // Otherwise, it's a default image in the public folder
  return url;
};

export function PageBackground({
  pageKey,
  opacity = 0.25,
  overlay = true,
  overlayOpacity = 0.4,
  className = '',
}: PageBackgroundProps) {
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getPageBackground(pageKey)
      .then((url) => {
        if (mounted) {
          const finalUrl = url ? getFullImageUrl(url) : (defaultBackgrounds[pageKey] || '');
          setBackgroundUrl(finalUrl);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error(`Failed to load background for ${pageKey}:`, error);
        if (mounted) {
          setBackgroundUrl(defaultBackgrounds[pageKey] || '');
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [pageKey]);

  if (loading || !backgroundUrl) {
    return null;
  }

  return (
    <>
      <img
        src={backgroundUrl}
        alt=""
        className={`fixed inset-0 w-full h-full object-cover pointer-events-none ${className}`}
        style={{ opacity }}
      />
      {overlay && (
        <div
          className="fixed inset-0 bg-background pointer-events-none"
          style={{ opacity: overlayOpacity }}
        />
      )}
    </>
  );
}
