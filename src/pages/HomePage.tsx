import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Calendar, Sparkles, Clock, Award } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getPageBackground, getGalleryImages } from '@/db/api';
import type { GalleryImage } from '@/types/index';

export default function HomePage() {
  const { t } = useLanguage();
  const [heroBackground, setHeroBackground] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  useEffect(() => {
    // Load hero background
    getPageBackground('home')
      .then((url) => {
        if (url) {
          setHeroBackground(url);
        }
      })
      .catch(console.error);

    // Load gallery images
    getGalleryImages()
      .then((images: GalleryImage[]) => {
        const imageUrls = images.map((img) => img.url);
        setGalleryImages(imageUrls);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {heroBackground && (
          <>
            <img
              src={heroBackground}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-white/65 backdrop-blur-[1px]" />
          </>
        )}

        <div className="relative z-10 container mx-auto px-4 py-16 md:py-24 text-center space-y-8 max-w-3xl">
          <div className="space-y-4">
            <div className="flex justify-center">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight">
              {t('home.title')}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">
              {t('home.subtitle')}
            </p>
          </div>

          <p className="text-lg text-foreground/80 max-w-2xl mx-auto leading-relaxed">
            {t('home.description')}
          </p>

          <div className="pt-4">
            <Button asChild size="lg" className="text-lg px-10 py-7 rounded-full shadow-lg hover:shadow-xl transition-shadow">
              <Link to="/booking/date-time">
                <Calendar className="h-5 w-5 me-2" />
                {t('common.book')}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-12 bg-secondary/30">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-foreground">
            {t('home.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {galleryImages.map((imageUrl, index) => (
              <div key={index} className="aspect-square rounded-2xl overflow-hidden shadow-md">
                <img
                  src={imageUrl}
                  alt="Nail art design"
                  loading="lazy"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="flex justify-center">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="h-7 w-7 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold text-lg">{t('booking.step1')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('booking.selectDate')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="flex justify-center">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-7 w-7 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold text-lg">{t('booking.step2')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('booking.selectTreatment')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="flex justify-center">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <Award className="h-7 w-7 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold text-lg">{t('booking.step4')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('booking.confirmBooking')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
