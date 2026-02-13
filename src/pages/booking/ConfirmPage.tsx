import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, User, Phone, FileText, DollarSign } from 'lucide-react';
import { createAppointment } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { Treatment } from '@/types/index';

export default function ConfirmPage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState<{
    selectedDate: string;
    selectedTime: string;
    selectedTreatment: Treatment;
    customerName: string;
    phone: string;
    notes: string;
  } | null>(null);

  useEffect(() => {
    const data = localStorage.getItem('bookingData');
    if (!data) {
      navigate('/booking/date-time');
      return;
    }
    try {
      const parsed = JSON.parse(data);
      if (!parsed.selectedDate || !parsed.selectedTime || !parsed.selectedTreatment || !parsed.customerName) {
        navigate('/booking/date-time');
        return;
      }
      setBookingData(parsed);
    } catch {
      navigate('/booking/date-time');
    }
  }, [navigate]);

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

  const handleConfirm = async () => {
    if (!bookingData) return;

    setLoading(true);
    try {
      const selectedDate = new Date(bookingData.selectedDate);
      const [hours, minutes] = bookingData.selectedTime.split(':').map(Number);
      selectedDate.setHours(hours, minutes, 0, 0);

      const endDateTime = new Date(selectedDate);
      endDateTime.setMinutes(endDateTime.getMinutes() + bookingData.selectedTreatment.duration_minutes);

      await createAppointment({
        customer_name: bookingData.customerName,
        phone: bookingData.phone,
        notes: bookingData.notes || null,
        treatment_id: bookingData.selectedTreatment.id,
        start_datetime: selectedDate.toISOString(),
        end_datetime: endDateTime.toISOString(),
        price_at_booking: bookingData.selectedTreatment.price,
      });

      localStorage.removeItem('bookingData');
      navigate('/success');
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Failed to create booking',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  if (!bookingData) {
    return null;
  }

  const selectedDate = new Date(bookingData.selectedDate);
  const formattedDate = format(selectedDate, 'EEEE, MMMM d, yyyy');

  return (
    <div className="relative min-h-screen py-8">
      {/* Subtle background image */}
      <img
        src="/salon/IMG_8403.jpg"
        alt=""
        className="fixed inset-0 w-full h-full object-cover opacity-[0.25] pointer-events-none"
      />
      <div className="fixed inset-0 bg-background/40 pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 max-w-2xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/booking/details')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </Button>
        </div>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-2xl">{t('booking.step4')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">{t('booking.summary')}</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('booking.date')}</p>
                    <p className="font-medium">{formattedDate}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('booking.time')}</p>
                    <p className="font-medium">{bookingData.selectedTime}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{t('booking.treatment')}</p>
                    <p className="font-medium">{getTreatmentName(bookingData.selectedTreatment)}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('booking.duration')}: {bookingData.selectedTreatment.duration_minutes}{' '}
                      {t('booking.minutes')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('booking.price')}</p>
                    <p className="font-bold text-xl text-primary">
                      ₪{bookingData.selectedTreatment.price.toFixed(2)}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('booking.fullName')}</p>
                    <p className="font-medium">{bookingData.customerName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('booking.phone')}</p>
                    <p className="font-medium">{bookingData.phone}</p>
                  </div>
                </div>

                {bookingData.notes && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t('booking.notes')}</p>
                      <p className="font-medium">{bookingData.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleConfirm} disabled={loading} size="lg">
                {loading ? t('common.loading') : t('booking.confirmBooking')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
