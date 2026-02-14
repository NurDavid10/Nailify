import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const formSchema = z.object({
  customerName: z.string().min(2, 'Name is required'),
  phone: z.string().min(9, 'Valid phone number is required'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function DetailsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    // Validate that previous booking steps (date/time + treatment) were completed
    try {
      const raw = localStorage.getItem('bookingData');
      if (!raw) {
        navigate('/booking/date-time');
        return;
      }
      const data = JSON.parse(raw);
      if (!data.selectedDate || !data.selectedTime || !data.selectedTreatment) {
        navigate('/booking/date-time');
        return;
      }
    } catch {
      navigate('/booking/date-time');
    }
  }, [navigate]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: '',
      phone: '',
      notes: '',
    },
  });

  const onSubmit = (data: FormData) => {
    try {
      const existingData = JSON.parse(localStorage.getItem('bookingData') || '{}');
      const bookingData = {
        ...existingData,
        customerName: data.customerName,
        phone: data.phone,
        notes: data.notes || '',
      };
      localStorage.setItem('bookingData', JSON.stringify(bookingData));
    } catch {
      navigate('/booking/date-time');
      return;
    }
    navigate('/booking/confirm');
  };

  return (
    <div className="relative min-h-screen py-8">
      {/* Subtle background image */}
      <img
        src="/salon/gallery-20.jpg"
        alt=""
        className="fixed inset-0 w-full h-full object-cover opacity-[0.25] pointer-events-none"
      />
      <div className="fixed inset-0 bg-background/40 pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 max-w-2xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/booking/treatment')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </Button>
        </div>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-2xl">{t('booking.step3')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('booking.fullName')}</FormLabel>
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
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('booking.notes')}</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={4} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4">
                  <Button type="submit" className="gap-2">
                    {t('common.next')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
