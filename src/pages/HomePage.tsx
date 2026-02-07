import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Calendar, Sparkles, Clock, Award } from 'lucide-react';

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <div className="flex justify-center">
              <Sparkles className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground">
              {t('home.title')}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">
              {t('home.subtitle')}
            </p>
          </div>

          <p className="text-lg text-foreground/80 max-w-2xl mx-auto leading-relaxed">
            {t('home.description')}
          </p>

          <div className="pt-6">
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link to="/booking/date-time">
                <Calendar className="h-5 w-5 me-2" />
                {t('common.book')}
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
            <Card className="border-primary/20">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="flex justify-center">
                  <Clock className="h-10 w-10 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{t('booking.step1')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('booking.selectDate')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="flex justify-center">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{t('booking.step2')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('booking.selectTreatment')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="flex justify-center">
                  <Award className="h-10 w-10 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{t('booking.step4')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('booking.confirmBooking')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
