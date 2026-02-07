import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
import { getSetting, updateSetting } from '@/db/api';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSetting('reminders_enabled')
      .then((setting) => {
        if (setting) {
          setRemindersEnabled(setting.value === 'true');
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleToggleReminders = async (enabled: boolean) => {
    try {
      await updateSetting('reminders_enabled', enabled ? 'true' : 'false');
      setRemindersEnabled(enabled);
      toast({
        title: t('common.success'),
        description: enabled ? 'Reminders enabled' : 'Reminders disabled',
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Failed to update setting',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">{t('admin.settings')}</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.reminders')}</CardTitle>
          <CardDescription>{t('admin.reminderDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <Label htmlFor="reminders" className="text-base">
                {t('admin.enableReminders')}
              </Label>
              <Switch
                id="reminders"
                checked={remindersEnabled}
                onCheckedChange={handleToggleReminders}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
