import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { getTreatments, getAvailableTimeSlots, getAvailableDates, createAppointment } from '@/db/api';
import type { Treatment, TimeSlot } from '@/types/index';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  customer_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(9, 'Phone must be at least 9 characters'),
  treatment_id: z.string().min(1, 'Please select a treatment'),
  date: z.date({ required_error: 'Please select a date' }),
  time: z.string().min(1, 'Please select a time'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateAppointment() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_name: '',
      phone: '',
      treatment_id: '',
      time: '',
      notes: '',
    },
  });

  const selectedDate = form.watch('date');
  const selectedTreatmentId = form.watch('treatment_id');

  useEffect(() => {
    getTreatments(true).then(setTreatments).catch(console.error);
    getAvailableDates()
      .then((dates) => setAvailableDates(new Set(dates)))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedDate) {
      setTimeSlots([]);
      setSelectedSlot(null);
      return;
    }
    setLoadingSlots(true);
    form.setValue('time', '');
    setSelectedSlot(null);
    getAvailableTimeSlots(selectedDate)
      .then(setTimeSlots)
      .catch(console.error)
      .finally(() => setLoadingSlots(false));
  }, [selectedDate]);

  const availableSlots = timeSlots.filter((slot) => slot.available);

  const getTreatmentName = (treatment: Treatment) => {
    switch (language) {
      case 'ar': return treatment.name_ar;
      case 'he': return treatment.name_he;
      default: return treatment.name_en;
    }
  };

  const selectedTreatment = treatments.find((t) => t.id === selectedTreatmentId);

  const onSubmit = async (data: FormData) => {
    const treatment = treatments.find((t) => t.id === data.treatment_id);
    if (!treatment || !selectedSlot) return;

    // Use the actual slot timestamps to ensure timezone consistency
    const startDateTime = selectedSlot.start;
    const endDateTime = selectedSlot.end;

    setSubmitting(true);
    try {
      await createAppointment({
        customer_name: data.customer_name,
        phone: data.phone,
        notes: data.notes || undefined,
        treatment_id: data.treatment_id,
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime.toISOString(),
        price_at_booking: treatment.price,
        created_by: 'admin',
      });

      toast({
        title: t('common.success'),
        description: t('admin.appointmentCreated'),
      });
      navigate('/admin/appointments');
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Failed to create appointment',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">{t('admin.createAppointment')}</h2>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{t('admin.appointmentDetails')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="customer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.customerName')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('booking.phone')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="treatment_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('booking.treatment')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('admin.selectTreatment')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {treatments.map((treatment) => (
                          <SelectItem key={treatment.id} value={treatment.id}>
                            {getTreatmentName(treatment)} — {treatment.duration_minutes}{t('booking.minutes')} — ₪{treatment.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('booking.date')}</FormLabel>
                    <div className="flex justify-center">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => {
                          if (date < tomorrow) return true;
                          const dateStr = format(date, 'yyyy-MM-dd');
                          return !availableDates.has(dateStr);
                        }}
                        className="rounded-md border"
                      />
                    </div>
                    {field.value && (
                      <p className="text-sm text-muted-foreground text-center">
                        {format(field.value, 'PPP')}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('booking.time')}</FormLabel>
                    <Select
                      onValueChange={(timeStr) => {
                        field.onChange(timeStr);
                        // Find and store the matching slot
                        const slot = availableSlots.find((s) => format(s.start, 'HH:mm') === timeStr);
                        setSelectedSlot(slot || null);
                      }}
                      value={field.value}
                      disabled={!selectedDate || loadingSlots}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              loadingSlots
                                ? t('common.loading')
                                : !selectedDate
                                  ? t('admin.selectDateFirst')
                                  : availableSlots.length === 0
                                    ? t('booking.noSlots')
                                    : t('booking.selectTime')
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableSlots.map((slot) => {
                          const timeStr = format(slot.start, 'HH:mm');
                          return (
                            <SelectItem key={timeStr} value={timeStr}>
                              {timeStr}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedTreatment && selectedDate && form.watch('time') && (
                <div className="rounded-lg border p-4 space-y-1 text-sm">
                  <p><span className="font-medium">{t('booking.treatment')}:</span> {getTreatmentName(selectedTreatment)}</p>
                  <p><span className="font-medium">{t('booking.duration')}:</span> {selectedTreatment.duration_minutes} {t('booking.minutes')}</p>
                  <p><span className="font-medium">{t('booking.price')}:</span> ₪{selectedTreatment.price}</p>
                </div>
              )}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('booking.notes')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? t('common.loading') : t('admin.createAppointment')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
