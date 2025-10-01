import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMetricValue, useUpdateMetricValue, MetricChangeType } from '@entities/metrics';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card.tsx';
import { Button } from '@shared/ui/button.tsx';
import { Input } from '@shared/ui/input.tsx';
import { Label } from '@shared/ui/label.tsx';
import { MonthYearPicker } from '@shared/ui/month-year-picker.tsx';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

const editMetricSchema = z.object({
  value: z.number().min(0, 'Значение должно быть положительным'),
  targetValue: z.number().min(0, 'Целевое значение должно быть положительным'),
  notes: z.string().optional(),
  changeType: z.nativeEnum(MetricChangeType).refine((val) => val !== undefined, {
    message: 'Выберите тип изменения',
  }),
  changeReason: z.string().optional(),
  effectiveMonth: z.string().optional(),
});

type EditMetricFormData = z.infer<typeof editMetricSchema>;

export const EditMetricPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const metricId = id ? parseInt(id, 10) : null;

  const { data: metric, isLoading, error } = useMetricValue(metricId!);
  const updateMetricMutation = useUpdateMetricValue();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditMetricFormData>({
    resolver: zodResolver(editMetricSchema),
  });

  useEffect(() => {
    if (metric) {
      setValue('value', metric.value || 0);
      setValue('targetValue', metric.targetValue || 0);
      setValue('notes', metric.notes || '');
    }
  }, [metric, setValue]);

  const onSubmit = async (data: EditMetricFormData) => {
    if (!metricId) return;

    try {
      const updateData: any = {
        value: data.value,
        targetValue: data.targetValue,
        notes: data.notes,
        changeType: data.changeType,
        changeReason: data.changeReason,
      };

      // Для UPDATE добавляем effectiveDate если указан месяц
      if (data.changeType === MetricChangeType.UPDATE && data.effectiveMonth) {
        const [year, month] = data.effectiveMonth.split('-');
        updateData.effectiveDate = `${year}-${month}-01`;
      }

      await updateMetricMutation.mutateAsync({
        id: metricId,
        data: updateData,
      });
      toast.success('Метрика успешно обновлена');
      navigate('/profile');
    } catch (error) {
      toast.error('Ошибка при обновлении метрики');
      console.error('Error updating metric:', error);
    }
  };

  if (!metricId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Ошибка</h1>
          <p className="mt-2">Неверный ID метрики</p>
          <Button onClick={() => { navigate('/profile'); }} className="mt-4">
            Вернуться к профилю
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !metric) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Ошибка</h1>
          <p className="mt-2">Метрика не найдена</p>
          <Button onClick={() => { navigate('/profile'); }} className="mt-4">
            Вернуться к профилю
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => { navigate('/profile'); }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>
        <h1 className="text-2xl font-bold">Редактировать метрику</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{metric.metricDefinition?.name}</CardTitle>
          <p className="text-sm text-gray-600">
            {metric.metricDefinition?.description}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetValue">Целевое значение</Label>
                <Input
                  id="targetValue"
                  type="number"
                  step="0.01"
                  {...register('targetValue', { valueAsNumber: true })}
                />
                {errors.targetValue && (
                  <p className="text-sm text-red-600">{errors.targetValue.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Фактическое значение</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  {...register('value', { valueAsNumber: true })}
                />
                {errors.value && (
                  <p className="text-sm text-red-600">{errors.value.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="changeType">Тип изменения *</Label>
              <select
                id="changeType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register('changeType')}
              >
                <option value="" disabled>Выберите тип изменения</option>
                <option value={MetricChangeType.CORRECTION}>Исправление ошибки</option>
                <option value={MetricChangeType.UPDATE}>Обновление данных</option>
              </select>
              {errors.changeType && (
                <p className="text-sm text-red-600">{errors.changeType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="changeReason">Причина изменения</Label>
              <Input
                id="changeReason"
                placeholder="Дополнительные детали изменения (необязательно)"
                {...register('changeReason')}
              />
              {errors.changeReason && (
                <p className="text-sm text-red-600">{errors.changeReason.message}</p>
              )}
            </div>

            {/* Поле для выбора месяца при UPDATE */}
            {watch('changeType') === MetricChangeType.UPDATE && (
              <MonthYearPicker
                label="Месяц и год для новых данных"
                value={watch('effectiveMonth') || ''}
                onChange={(value) => { setValue('effectiveMonth', value); }}
                error={errors.effectiveMonth?.message}
              />
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Заметки</Label>
              <Input
                id="notes"
                placeholder="Дополнительные заметки (необязательно)"
                {...register('notes')}
              />
              {errors.notes && (
                <p className="text-sm text-red-600">{errors.notes.message}</p>
              )}
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Сохранить изменения
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => { navigate('/profile'); }}
                className="flex-1"
              >
                Отмена
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};