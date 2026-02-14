import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getAvailableTimeSlots, getAvailableDates } from '@/db/api';
import type { TimeSlot } from '@/types/index';
import { format } from 'date-fns';

export default function DateTimePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    getAvailableDates()
      .then((dates) => setAvailableDates(new Set(dates)))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedDate) {
      setLoading(true);
      setSelectedTime(null);
      getAvailableTimeSlots(selectedDate)
        .then(setTimeSlots)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [selectedDate]);

  const handleNext = () => {
    if (selectedDate && selectedTime) {
      const bookingData = {
        selectedDate: selectedDate.toISOString(),
        selectedTime,
      };
      localStorage.setItem('bookingData', JSON.stringify(bookingData));
      navigate('/booking/treatment');
    }
  };

  const availableSlots = timeSlots.filter((slot) => slot.available);

  return (
    <div className="relative min-h-screen py-8">
      {/* Subtle background image */}
      <img
        src="/salon/gallery-11.jpg"
        alt=""
        className="fixed inset-0 w-full h-full object-cover opacity-[0.25] pointer-events-none"
      />
      <div className="fixed inset-0 bg-background/40 pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </Button>
        </div>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-2xl">{t('booking.step1')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">{t('booking.selectDate')}</h3>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => {
                    if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;
                    const dateStr = format(date, 'yyyy-MM-dd');
                    return !availableDates.has(dateStr);
                  }}
                  className="rounded-md border"
                />
              </div>
            </div>

            {selectedDate && (
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('booking.selectTime')}</h3>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {t('booking.noSlots')}
                  </p>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {availableSlots.map((slot) => {
                      const timeStr = format(slot.start, 'HH:mm');
                      return (
                        <Button
                          key={timeStr}
                          variant={selectedTime === timeStr ? 'default' : 'outline'}
                          onClick={() => setSelectedTime(timeStr)}
                          className="h-12"
                        >
                          {timeStr}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleNext}
                disabled={!selectedDate || !selectedTime}
                className="gap-2"
              >
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
