import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, DollarSign } from 'lucide-react';
import { getTreatments } from '@/db/api';
import type { Treatment } from '@/types/index';

export default function TreatmentPage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Validate that the previous booking step (date/time) was completed
    try {
      const raw = localStorage.getItem('bookingData');
      if (!raw) {
        navigate('/booking/date-time');
        return;
      }
      const data = JSON.parse(raw);
      if (!data.selectedDate || !data.selectedTime) {
        navigate('/booking/date-time');
        return;
      }
    } catch {
      navigate('/booking/date-time');
      return;
    }

    getTreatments(true)
      .then(setTreatments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleNext = () => {
    if (selectedTreatment) {
      try {
        const existingData = JSON.parse(localStorage.getItem('bookingData') || '{}');
        const bookingData = {
          ...existingData,
          selectedTreatment,
        };
        localStorage.setItem('bookingData', JSON.stringify(bookingData));
      } catch {
        navigate('/booking/date-time');
        return;
      }
      navigate('/booking/details');
    }
  };

  const getTreatmentName = (treatment: Treatment) => {
    switch (language) {
      case 'ar':
        return treatment.name_ar;
      case 'he':
        return treatment.name_he;
      default:
        return treatment.name_en;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/booking/date-time')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </Button>
        </div>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-2xl">{t('booking.step2')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <>
                <div className="grid gap-4">
                  {treatments.map((treatment) => (
                    <Card
                      key={treatment.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTreatment?.id === treatment.id
                          ? 'border-primary border-2 bg-primary/5'
                          : 'border-border'
                      }`}
                      onClick={() => setSelectedTreatment(treatment)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <h3 className="font-semibold text-lg">
                              {getTreatmentName(treatment)}
                            </h3>
                            <div className="flex flex-wrap gap-3 text-sm">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {treatment.duration_minutes} {t('booking.minutes')}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 font-semibold text-primary">
                                <DollarSign className="h-4 w-4" />
                                <span>₪{treatment.price.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                          {selectedTreatment?.id === treatment.id && (
                            <Badge variant="default">✓</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {selectedTreatment && (
                  <Card className="bg-primary/5 border-primary/30">
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-3">{t('booking.selectedTreatment')}</h3>
                      <div className="space-y-2">
                        <p className="text-lg font-semibold">
                          {getTreatmentName(selectedTreatment)}
                        </p>
                        <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                          <DollarSign className="h-6 w-6" />
                          <span>₪{selectedTreatment.price.toFixed(2)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {t('booking.duration')}: {selectedTreatment.duration_minutes}{' '}
                          {t('booking.minutes')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            <div className="flex justify-end pt-4">
              <Button onClick={handleNext} disabled={!selectedTreatment} className="gap-2">
                {t('common.next')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
