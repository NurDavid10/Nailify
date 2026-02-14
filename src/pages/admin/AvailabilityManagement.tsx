import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAvailabilityRules, createAvailabilityRule, deleteAvailabilityRule } from '@/db/api';
import type { AvailabilityRule } from '@/types/index';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const formSchema = z.object({
  specific_date: z.date({ required_error: 'Please select a date' }),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  slot_interval_minutes: z.number().min(15).max(120),
});

type FormData = z.infer<typeof formSchema>;

export default function AvailabilityManagement() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start_time: '09:00',
      end_time: '18:00',
      slot_interval_minutes: 30,
    },
  });

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await getAvailabilityRules();
      setRules(data);
    } catch (error) {
      console.error('Failed to load availability rules:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      const dateStr = format(data.specific_date, 'yyyy-MM-dd');
      await createAvailabilityRule({
        specific_date: dateStr,
        start_time: data.start_time,
        end_time: data.end_time,
        slot_interval_minutes: data.slot_interval_minutes,
      });
      toast({ title: t('common.success'), description: 'Availability rule created' });
      setDialogOpen(false);
      form.reset();
      loadRules();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'object' && error !== null && 'message' in error
            ? String((error as { message: string }).message)
            : 'Failed to create rule';
      console.error('Create rule error:', error);
      toast({
        title: t('common.error'),
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this availability rule?')) return;

    try {
      await deleteAvailabilityRule(id);
      toast({ title: t('common.success'), description: 'Availability rule deleted' });
      loadRules();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Failed to delete rule',
        variant: 'destructive',
      });
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">{t('admin.availability')}</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t('admin.addAvailability')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('admin.addAvailability')}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="specific_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t('booking.date')}</FormLabel>
                      <div className="flex justify-center">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < today}
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
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.startTime')}</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.endTime')}</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slot_interval_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.slotInterval')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit">{t('common.save')}</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.availability')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : rules.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t('admin.noAvailability')}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('booking.date')}</TableHead>
                    <TableHead>{t('admin.startTime')}</TableHead>
                    <TableHead>{t('admin.endTime')}</TableHead>
                    <TableHead>{t('admin.slotInterval')}</TableHead>
                    <TableHead className="text-right">{t('admin.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.specific_date}</TableCell>
                      <TableCell>{rule.start_time}</TableCell>
                      <TableCell>{rule.end_time}</TableCell>
                      <TableCell>{rule.slot_interval_minutes} min</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
