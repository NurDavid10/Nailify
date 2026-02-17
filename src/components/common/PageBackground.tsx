import { useEffect, useState } from 'react';
import { getPageBackground } from '@/db/api';

interface PageBackgroundProps {
  pageKey: string;
  opacity?: number;
  overlay?: boolean;
  overlayOpacity?: number;
  className?: string;
}

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
          setBackgroundUrl(url);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error(`Failed to load background for ${pageKey}:`, error);
        if (mounted) {
          setBackgroundUrl(null);
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
