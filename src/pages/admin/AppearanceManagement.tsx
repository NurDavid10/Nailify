import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  getPageBackgrounds,
  uploadPageBackground,
  deletePageBackground,
  getGalleryImages,
  uploadGalleryImage,
  deleteGalleryImage,
} from '@/db/api';
import type { PageBackground, GalleryImage } from '@/types/index';

export default function AppearanceManagement() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [backgrounds, setBackgrounds] = useState<PageBackground[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [uploadingGalleryId, setUploadingGalleryId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [backgroundsData, galleryData] = await Promise.all([
        getPageBackgrounds(),
        getGalleryImages(),
      ]);
      setBackgrounds(backgroundsData);
      setGalleryImages(galleryData);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const validateFile = (file: File): boolean => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: t('common.error'),
        description: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
        variant: 'destructive',
      });
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('common.error'),
        description: 'File size exceeds 5MB limit.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleBackgroundFileSelect = async (pageKey: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !validateFile(file)) return;

    setUploadingKey(pageKey);

    try {
      await uploadPageBackground(pageKey, file);
      toast({
        title: t('common.success'),
        description: 'Background uploaded successfully',
      });
      await loadData();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Upload failed',
        variant: 'destructive',
      });
    } finally {
      setUploadingKey(null);
      event.target.value = '';
    }
  };

  const handleGalleryFileSelect = async (imageId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !validateFile(file)) return;

    setUploadingGalleryId(imageId);

    try {
      await uploadGalleryImage(imageId, file);
      toast({
        title: t('common.success'),
        description: 'Gallery image uploaded successfully',
      });
      await loadData();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Upload failed',
        variant: 'destructive',
      });
    } finally {
      setUploadingGalleryId(null);
      event.target.value = '';
    }
  };

  const handleResetBackground = async (pageKey: string) => {
    if (!confirm(t('backgrounds.confirmReset'))) return;

    try {
      await deletePageBackground(pageKey);
      toast({
        title: t('common.success'),
        description: 'Background reset to default',
      });
      await loadData();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Failed to reset background',
        variant: 'destructive',
      });
    }
  };

  const handleResetGalleryImage = async (imageId: number) => {
    if (!confirm(t('backgrounds.confirmReset'))) return;

    try {
      await deleteGalleryImage(imageId);
      toast({
        title: t('common.success'),
        description: 'Gallery image reset to default',
      });
      await loadData();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Failed to reset image',
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

  const getImageUrl = (url: string) => {
    if (url && url.startsWith('/uploads/')) {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const baseUrl = API_BASE.replace('/api', '');
      return `${baseUrl}${url}`;
    }
    return url;
  };

  const getBackgroundUrl = (bg: PageBackground) => {
    return getImageUrl(bg.currentBackgroundUrl || bg.defaultBackgroundUrl);
  };

  const getGalleryImageUrl = (img: GalleryImage) => {
    return getImageUrl(img.currentUrl || img.defaultUrl);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">{t('appearance.title')}</h2>
        <p className="text-muted-foreground mt-2">{t('appearance.description')}</p>
      </div>

      {/* Page Backgrounds Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-2xl font-semibold">{t('appearance.pageBackgrounds')}</h3>
          <p className="text-sm text-muted-foreground">{t('appearance.pageBackgroundsDesc')}</p>
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

                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      disabled={isUploading}
                      onClick={() => {
                        const input = document.getElementById(`file-bg-${bg.pageKey}`) as HTMLInputElement;
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
                        onClick={() => handleResetBackground(bg.pageKey)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}

                    <input
                      id={`file-bg-${bg.pageKey}`}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handleBackgroundFileSelect(bg.pageKey, e)}
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

      <Separator />

      {/* Home Page Gallery Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-2xl font-semibold">{t('appearance.homeGallery')}</h3>
          <p className="text-sm text-muted-foreground">{t('appearance.homeGalleryDesc')}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {galleryImages.map((img) => {
            const imageUrl = getGalleryImageUrl(img);
            const isUploading = uploadingGalleryId === img.id;
            const hasCustomImage = img.currentUrl !== null;

            return (
              <Card key={img.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-border bg-muted">
                    <img
                      src={imageUrl}
                      alt={`${t('gallery.image')} ${img.id}`}
                      className="w-full h-full object-cover"
                    />
                    {hasCustomImage && (
                      <div className="absolute top-1 right-1">
                        <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                          {t('backgrounds.custom')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      disabled={isUploading}
                      onClick={() => {
                        const input = document.getElementById(`file-gallery-${img.id}`) as HTMLInputElement;
                        input?.click();
                      }}
                    >
                      <Upload className="h-3 w-3 me-1" />
                      {isUploading ? t('backgrounds.uploading') : t('backgrounds.upload')}
                    </Button>

                    {hasCustomImage && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleResetGalleryImage(img.id)}
                      >
                        <RotateCcw className="h-3 w-3 me-1" />
                        {t('backgrounds.reset')}
                      </Button>
                    )}

                    <input
                      id={`file-gallery-${img.id}`}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handleGalleryFileSelect(img.id, e)}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
