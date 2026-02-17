import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, RotateCcw, Image as ImageIcon } from 'lucide-react';
import {
  getPageBackgrounds,
  uploadPageBackground,
  deletePageBackground,
} from '@/db/api';
import type { PageBackground } from '@/types/index';

export default function BackgroundsManagement() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [backgrounds, setBackgrounds] = useState<PageBackground[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  useEffect(() => {
    loadBackgrounds();
  }, []);

  const loadBackgrounds = async () => {
    try {
      const data = await getPageBackgrounds();
      setBackgrounds(data);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Failed to load backgrounds',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (pageKey: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: t('common.error'),
        description: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('common.error'),
        description: 'File size exceeds 5MB limit.',
        variant: 'destructive',
      });
      return;
    }

    setUploadingKey(pageKey);

    try {
      await uploadPageBackground(pageKey, file);
      toast({
        title: t('common.success'),
        description: 'Background uploaded successfully',
      });
      await loadBackgrounds();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Upload failed',
        variant: 'destructive',
      });
    } finally {
      setUploadingKey(null);
      // Reset input
      event.target.value = '';
    }
  };

  const handleResetToDefault = async (pageKey: string) => {
    if (!confirm(t('backgrounds.confirmReset'))) return;

    try {
      await deletePageBackground(pageKey);
      toast({
        title: t('common.success'),
        description: 'Background reset to default',
      });
      await loadBackgrounds();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Failed to reset background',
        variant: 'destructive',
      });
    }
  };

  const getPageName = (bg: PageBackground) => {
    switch (language) {
      case 'ar':
        return bg.name_ar;
      case 'he':
        return bg.name_he;
      default:
        return bg.name_en;
    }
  };

  const getBackgroundUrl = (bg: PageBackground) => {
    const url = bg.currentBackgroundUrl || bg.defaultBackgroundUrl;

    // If it's an uploaded image, prepend the API base URL
    if (url && url.startsWith('/uploads/')) {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const baseUrl = API_BASE.replace('/api', '');
      return `${baseUrl}${url}`;
    }

    return url;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">{t('backgrounds.title')}</h2>
        <p className="text-muted-foreground mt-2">{t('backgrounds.description')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {backgrounds.map((bg) => {
          const backgroundUrl = getBackgroundUrl(bg);
          const isUploading = uploadingKey === bg.pageKey;
          const hasCustomBackground = bg.currentBackgroundUrl !== null;

          return (
            <Card key={bg.pageKey} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">{getPageName(bg)}</CardTitle>
                <p className="text-sm text-muted-foreground">{bg.path}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Background Preview */}
                <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-border bg-muted">
                  {backgroundUrl ? (
                    <img
                      src={backgroundUrl}
                      alt={getPageName(bg)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  {hasCustomBackground && (
                    <div className="absolute top-2 right-2">
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                        {t('backgrounds.custom')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    disabled={isUploading}
                    onClick={() => {
                      const input = document.getElementById(`file-${bg.pageKey}`) as HTMLInputElement;
                      input?.click();
                    }}
                  >
                    <Upload className="h-4 w-4 me-2" />
                    {isUploading ? t('backgrounds.uploading') : t('backgrounds.upload')}
                  </Button>

                  {hasCustomBackground && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResetToDefault(bg.pageKey)}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}

                  <input
                    id={`file-${bg.pageKey}`}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handleFileSelect(bg.pageKey, e)}
                  />
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  {t('backgrounds.maxSize')}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
