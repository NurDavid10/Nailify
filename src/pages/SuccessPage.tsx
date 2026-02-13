import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { CheckCircle, Home, Calendar } from 'lucide-react';

export default function SuccessPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 bg-background">
      {/* Subtle background image */}
      <img
        src="/salon/IMG_8394.jpg"
        alt=""
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover opacity-10"
      />

      <Card className="relative z-10 max-w-md w-full shadow-lg border-border/50">
        <CardContent className="pt-12 pb-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-24 w-24 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">{t('booking.success')}</h1>
            <p className="text-muted-foreground">{t('booking.successMessage')}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button asChild variant="outline" className="flex-1 gap-2">
              <Link to="/">
                <Home className="h-4 w-4" />
                {t('common.home')}
              </Link>
            </Button>
            <Button asChild className="flex-1 gap-2">
              <Link to="/booking/date-time">
                <Calendar className="h-4 w-4" />
                {t('booking.bookAnother')}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
