import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { CheckCircle, Home, Calendar } from 'lucide-react';

export default function SuccessPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-12 pb-8 text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle className="h-20 w-20 text-primary" />
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
