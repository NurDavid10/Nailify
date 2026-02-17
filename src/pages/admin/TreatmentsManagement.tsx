import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getTreatments, createTreatment, updateTreatment, deleteTreatment } from '@/db/api';
import type { Treatment } from '@/types/index';
import { useToast } from '@/hooks/use-toast';
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
  name_ar: z.string().min(1, 'Arabic name is required'),
  name_he: z.string().min(1, 'Hebrew name is required'),
  name_en: z.string().min(1, 'English name is required'),
  duration_minutes: z.number().min(1, 'Duration must be at least 1 minute'),
  price: z.number().min(0, 'Price must be positive'),
  is_active: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

export default function TreatmentsManagement() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name_ar: '',
      name_he: '',
      name_en: '',
      duration_minutes: 30,
      price: 0,
      is_active: true,
    },
  });

  const loadTreatments = async () => {
    setLoading(true);
    try {
      const data = await getTreatments(false);
      setTreatments(data);
    } catch (error) {
      console.error('Failed to load treatments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTreatments();
  }, []);

  const handleOpenDialog = (treatment?: Treatment) => {
    if (treatment) {
      setEditingTreatment(treatment);
      form.reset({
        name_ar: treatment.name_ar,
        name_he: treatment.name_he,
        name_en: treatment.name_en,
        duration_minutes: treatment.duration_minutes,
        price: treatment.price,
        is_active: treatment.is_active,
      });
    } else {
      setEditingTreatment(null);
      form.reset({
        name_ar: '',
        name_he: '',
        name_en: '',
        duration_minutes: 30,
        price: 0,
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editingTreatment) {
        await updateTreatment(editingTreatment.id, data);
        toast({ title: t('common.success'), description: 'Treatment updated' });
      } else {
        await createTreatment(data);
        toast({ title: t('common.success'), description: 'Treatment created' });
      }
      setDialogOpen(false);
      loadTreatments();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Failed to save treatment',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this treatment?')) return;

    try {
      await deleteTreatment(id);
      toast({ title: t('common.success'), description: 'Treatment deleted' });
      loadTreatments();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Failed to delete treatment',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">{t('admin.treatments')}</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('admin.addTreatment')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTreatment ? t('admin.editTreatment') : t('admin.addTreatment')}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.treatmentNameAr')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name_he"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.treatmentNameHe')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.treatmentNameEn')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.durationMinutes')}</FormLabel>
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

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('booking.price')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">{t('admin.active')}</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
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
          <CardTitle>{t('admin.treatments')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : treatments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t('admin.noTreatments')}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.treatmentNameEn')}</TableHead>
                    <TableHead>{t('admin.durationMinutes')}</TableHead>
                    <TableHead>{t('booking.price')}</TableHead>
                    <TableHead>{t('admin.status')}</TableHead>
                    <TableHead className="text-right">{t('admin.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {treatments.map((treatment) => (
                    <TableRow key={treatment.id}>
                      <TableCell className="font-medium">{treatment.name_en}</TableCell>
                      <TableCell>{treatment.duration_minutes}</TableCell>
                      <TableCell>₪{treatment.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={treatment.is_active ? 'default' : 'secondary'}>
                          {treatment.is_active ? t('admin.active') : t('admin.inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleOpenDialog(treatment)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(treatment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
