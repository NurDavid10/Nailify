import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAppointments, cancelAppointment } from '@/db/api';
import type { Appointment } from '@/types/index';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { getLocalizedField } from '@/lib/utils';

export default function AppointmentsManagement() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      console.log('[AppointmentsManagement] Fetching appointments...');
      const data = await getAppointments('booked');
      console.log('[AppointmentsManagement] Received appointments:', data);
      console.log('[AppointmentsManagement] Number of appointments:', data.length);
      setAppointments(data);
    } catch (error) {
      console.error('[AppointmentsManagement] Failed to load appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      await cancelAppointment(id);
      toast({ title: t('common.success'), description: 'Appointment canceled' });
      loadAppointments();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Failed to cancel appointment',
        variant: 'destructive',
      });
    }
  };

  // Removed: Duplicated localization logic - now using getLocalizedField utility

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">{t('admin.appointments')}</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.appointments')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : appointments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t('admin.noAppointments')}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('booking.date')}</TableHead>
                    <TableHead>{t('booking.time')}</TableHead>
                    <TableHead>{t('admin.customerName')}</TableHead>
                    <TableHead>{t('booking.phone')}</TableHead>
                    <TableHead>{t('booking.treatment')}</TableHead>
                    <TableHead>{t('booking.price')}</TableHead>
                    <TableHead>{t('admin.status')}</TableHead>
                    <TableHead className="text-right">{t('admin.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appointment) => {
                    const startDate = new Date(appointment.start_datetime);
                    return (
                      <TableRow key={appointment.id}>
                        <TableCell>{format(startDate, 'MMM d, yyyy')}</TableCell>
                        <TableCell>{format(startDate, 'HH:mm')}</TableCell>
                        <TableCell className="font-medium">{appointment.customer_name}</TableCell>
                        <TableCell>{appointment.phone}</TableCell>
                        <TableCell>{getLocalizedField(appointment.treatments, 'name', language)}</TableCell>
                        <TableCell>₪{appointment.price_at_booking.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={appointment.status === 'booked' ? 'default' : 'secondary'}>
                            {appointment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {appointment.status === 'booked' && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleCancel(appointment.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
