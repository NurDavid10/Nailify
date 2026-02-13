import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Sparkles, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getUpcomingAppointments, getTreatments, getAvailabilityRules } from '@/db/api';

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    activeTreatments: 0,
    availabilityRules: 0,
  });

  useEffect(() => {
    Promise.all([
      getUpcomingAppointments(),
      getTreatments(true),
      getAvailabilityRules(),
    ]).then(([appointments, treatments, rules]) => {
      setStats({
        upcomingAppointments: appointments.length,
        activeTreatments: treatments.length,
        availabilityRules: rules.length,
      });
    }).catch((error) => {
      console.error('Failed to load dashboard stats:', error);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">{t('admin.dashboard')}</h2>
        <p className="text-muted-foreground mt-2">{t('app.name')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin.upcomingAppointments')}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingAppointments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin.treatments')}
            </CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTreatments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin.availability')}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availabilityRules}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
