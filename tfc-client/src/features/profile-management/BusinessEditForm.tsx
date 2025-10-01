import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  useMyProfile, 
  useUpdateProfile, 
  useCreateProfile, 
  UpdateProfileDto,
  useBusinessContext,
  useCreateBusinessContext,
  useUpdateBusinessContext,
  CreateBusinessContextDto,
  UpdateBusinessContextDto
} from '@entities/profile';
import { Button } from '@shared/ui/button.tsx';
import { Input } from '@shared/ui/input.tsx';
import { Textarea } from '@shared/ui/textarea.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card.tsx';
import { Label } from '@shared/ui/label.tsx';
import { Save, ArrowLeft, Building2, TrendingUp, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const businessSchema = z.object({
  businessName: z.string().optional(),
  businessDescription: z.string().optional(),
  currentRevenue: z.number().min(0).optional().or(z.literal('')),
  targetRevenue: z.number().min(0).optional().or(z.literal('')),
  currentEmployees: z.number().min(0).optional().or(z.literal('')),
  targetEmployees: z.number().min(0).optional().or(z.literal('')),
  // Новые поля для бизнес-информации
  workPhone: z.string().optional(),
  website: z.string().optional(),
  workInstagram: z.string().optional(),
  workTelegram: z.string().optional(),
  workSchedule: z.string().optional(),
  addresses: z.string().optional(),
  // Поля бизнес-контекста
  industry: z.string().optional(),
  businessStage: z.string().optional(),
  foundedYear: z.number().min(1800).max(new Date().getFullYear()).optional().or(z.literal('')),
  location: z.string().optional(),
  mainProducts: z.string().optional(),
  targetAudience: z.string().optional(),
  businessModel: z.string().optional(),
  marketSize: z.number().min(0).optional().or(z.literal('')),
  competitorCount: z.number().min(0).optional().or(z.literal('')),
});

type BusinessFormData = z.infer<typeof businessSchema>;

export const BusinessEditForm: React.FC = () => {
  const navigate = useNavigate();
  const { data: profile, isLoading: isLoadingProfile } = useMyProfile();
  const { data: businessContext, isLoading: isLoadingBusinessContext } = useBusinessContext();
  const updateProfile = useUpdateProfile();
  const createProfile = useCreateProfile();
  const createBusinessContext = useCreateBusinessContext();
  const updateBusinessContext = useUpdateBusinessContext();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      businessName: profile?.businessName || '',
      businessDescription: profile?.businessDescription || '',
      currentRevenue: profile?.currentRevenue || '',
      targetRevenue: profile?.targetRevenue || '',
      currentEmployees: profile?.currentEmployees || '',
      targetEmployees: profile?.targetEmployees || '',
      // Новые поля для бизнес-информации
      workPhone: profile?.workPhone || '',
      website: profile?.website || '',
      workInstagram: profile?.workInstagram || '',
      workTelegram: profile?.workTelegram || '',
      workSchedule: profile?.workSchedule || '',
      addresses: profile?.addresses || '',
      // Поля бизнес-контекста
      industry: businessContext?.industry || '',
      businessStage: businessContext?.businessStage || '',
      foundedYear: businessContext?.foundedYear || '',
      location: businessContext?.location || '',
      mainProducts: businessContext?.mainProducts || '',
      targetAudience: businessContext?.targetAudience || '',
      businessModel: businessContext?.businessModel || '',
      marketSize: businessContext?.marketSize || '',
      competitorCount: businessContext?.competitorCount || '',
    },
  });

  React.useEffect(() => {
    if (profile || businessContext) {
      reset({
        businessName: profile?.businessName || '',
        businessDescription: profile?.businessDescription || '',
        currentRevenue: profile?.currentRevenue || '',
        targetRevenue: profile?.targetRevenue || '',
        currentEmployees: profile?.currentEmployees || '',
        targetEmployees: profile?.targetEmployees || '',
        // Новые поля для бизнес-информации
        workPhone: profile?.workPhone || '',
        website: profile?.website || '',
        workInstagram: profile?.workInstagram || '',
        workTelegram: profile?.workTelegram || '',
        workSchedule: profile?.workSchedule || '',
        addresses: profile?.addresses || '',
        // Поля бизнес-контекста
        industry: businessContext?.industry || '',
        businessStage: businessContext?.businessStage || '',
        foundedYear: businessContext?.foundedYear || '',
        location: businessContext?.location || '',
        mainProducts: businessContext?.mainProducts || '',
        targetAudience: businessContext?.targetAudience || '',
        businessModel: businessContext?.businessModel || '',
        marketSize: businessContext?.marketSize || '',
        competitorCount: businessContext?.competitorCount || '',
      });
    }
  }, [profile, businessContext, reset]);

  const onSubmit = async (data: BusinessFormData) => {
    try {
      console.log('Business form submitted with data:', data);
      
      // Разделяем данные профиля и бизнес-контекста
      const profileData: UpdateProfileDto = {
        businessName: data.businessName,
        businessDescription: data.businessDescription,
        currentRevenue: data.currentRevenue === '' ? undefined : Number(data.currentRevenue),
        targetRevenue: data.targetRevenue === '' ? undefined : Number(data.targetRevenue),
        currentEmployees: data.currentEmployees === '' ? undefined : Number(data.currentEmployees),
        targetEmployees: data.targetEmployees === '' ? undefined : Number(data.targetEmployees),
        // Новые поля для бизнес-информации
        workPhone: data.workPhone,
        website: data.website,
        workInstagram: data.workInstagram,
        workTelegram: data.workTelegram,
        workSchedule: data.workSchedule,
        addresses: data.addresses,
      };

      const businessContextData: CreateBusinessContextDto | UpdateBusinessContextDto = {
        industry: data.industry,
        businessStage: data.businessStage,
        foundedYear: data.foundedYear === '' ? undefined : Number(data.foundedYear),
        location: data.location,
        mainProducts: data.mainProducts,
        targetAudience: data.targetAudience,
        businessModel: data.businessModel,
        marketSize: data.marketSize === '' ? undefined : Number(data.marketSize),
        competitorCount: data.competitorCount === '' ? undefined : Number(data.competitorCount),
        dataRelevanceDate: new Date().toISOString(),
      };

      console.log('Business profile data:', profileData);
      console.log('Business context data:', businessContextData);

      // Сохраняем профиль
      if (profile) {
        console.log('Updating existing profile...');
        await updateProfile.mutateAsync(profileData);
      } else {
        console.log('Creating new profile...');
        await createProfile.mutateAsync(profileData);
      }

      // Сохраняем бизнес-контекст
      if (businessContext) {
        console.log('Updating existing business context...');
        await updateBusinessContext.mutateAsync(businessContextData);
      } else {
        console.log('Creating new business context...');
        await createBusinessContext.mutateAsync(businessContextData as CreateBusinessContextDto);
      }
      
      toast.success('Информация о бизнесе успешно сохранена');
      console.log('Navigating to /profile...');
      navigate('/profile');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Ошибка при сохранении информации о бизнесе');
    }
  };

  if (isLoadingProfile || isLoadingBusinessContext) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
        <h1 className="text-3xl font-bold text-gray-900">
          Редактировать информацию о бизнесе
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Основная информация о бизнесе */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Основная информация
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="businessName">Название бизнеса</Label>
              <Input
                id="businessName"
                {...register('businessName')}
                placeholder="Введите название вашего бизнеса"
              />
              {errors.businessName && (
                <p className="text-sm text-red-600 mt-1">{errors.businessName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="businessDescription">Описание бизнеса</Label>
              <Textarea
                id="businessDescription"
                {...register('businessDescription')}
                placeholder="Расскажите о вашем бизнесе"
                rows={3}
              />
              {errors.businessDescription && (
                <p className="text-sm text-red-600 mt-1">{errors.businessDescription.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Контактная информация */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Контактная информация
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="workPhone">Рабочий номер телефона</Label>
                <Input
                  id="workPhone"
                  type="tel"
                  {...register('workPhone')}
                  placeholder="+7 (999) 123-45-67"
                />
                {errors.workPhone && (
                  <p className="text-sm text-red-600 mt-1">{errors.workPhone.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="website">Официальный сайт</Label>
                <Input
                  id="website"
                  type="url"
                  {...register('website')}
                  placeholder="https://example.com"
                />
                {errors.website && (
                  <p className="text-sm text-red-600 mt-1">{errors.website.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="workInstagram">Рабочий аккаунт Instagram</Label>
                <Input
                  id="workInstagram"
                  {...register('workInstagram')}
                  placeholder="@business_account"
                />
                {errors.workInstagram && (
                  <p className="text-sm text-red-600 mt-1">{errors.workInstagram.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="workTelegram">Рабочий канал Telegram</Label>
                <Input
                  id="workTelegram"
                  {...register('workTelegram')}
                  placeholder="@business_channel"
                />
                {errors.workTelegram && (
                  <p className="text-sm text-red-600 mt-1">{errors.workTelegram.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="workSchedule">График работы</Label>
              <Textarea
                id="workSchedule"
                {...register('workSchedule')}
                placeholder="Пн-Пт: 9:00-18:00, Сб-Вс: выходной"
                rows={2}
              />
              {errors.workSchedule && (
                <p className="text-sm text-red-600 mt-1">{errors.workSchedule.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="addresses">Адреса точек присутствия</Label>
              <Textarea
                id="addresses"
                {...register('addresses')}
                placeholder="Укажите адреса офисов, магазинов или других точек присутствия"
                rows={3}
              />
              {errors.addresses && (
                <p className="text-sm text-red-600 mt-1">{errors.addresses.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Финансовые показатели */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Финансовые показатели
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentRevenue">Текущая выручка (₽)</Label>
                <Input
                  id="currentRevenue"
                  type="number"
                  min="0"
                  {...register('currentRevenue', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.currentRevenue && (
                  <p className="text-sm text-red-600 mt-1">{errors.currentRevenue.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="targetRevenue">Целевая выручка (₽)</Label>
                <Input
                  id="targetRevenue"
                  type="number"
                  min="0"
                  {...register('targetRevenue', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.targetRevenue && (
                  <p className="text-sm text-red-600 mt-1">{errors.targetRevenue.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Команда */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Команда
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentEmployees">Текущее количество сотрудников</Label>
                <Input
                  id="currentEmployees"
                  type="number"
                  min="0"
                  {...register('currentEmployees', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.currentEmployees && (
                  <p className="text-sm text-red-600 mt-1">{errors.currentEmployees.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="targetEmployees">Целевое количество сотрудников</Label>
                <Input
                  id="targetEmployees"
                  type="number"
                  min="0"
                  {...register('targetEmployees', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.targetEmployees && (
                  <p className="text-sm text-red-600 mt-1">{errors.targetEmployees.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Бизнес-контекст */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Бизнес-контекст
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="industry">Отрасль</Label>
                <Input
                  id="industry"
                  {...register('industry')}
                  placeholder="Например: IT, Розничная торговля"
                />
                {errors.industry && (
                  <p className="text-sm text-red-600 mt-1">{errors.industry.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="businessStage">Стадия бизнеса</Label>
                <Input
                  id="businessStage"
                  {...register('businessStage')}
                  placeholder="Например: Стартап, Рост, Зрелость"
                />
                {errors.businessStage && (
                  <p className="text-sm text-red-600 mt-1">{errors.businessStage.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="foundedYear">Год основания</Label>
                <Input
                  id="foundedYear"
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                  {...register('foundedYear', { valueAsNumber: true })}
                  placeholder="2020"
                />
                {errors.foundedYear && (
                  <p className="text-sm text-red-600 mt-1">{errors.foundedYear.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="location">Местоположение</Label>
                <Input
                  id="location"
                  {...register('location')}
                  placeholder="Город, страна"
                />
                {errors.location && (
                  <p className="text-sm text-red-600 mt-1">{errors.location.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="mainProducts">Основные продукты/услуги</Label>
              <Textarea
                id="mainProducts"
                {...register('mainProducts')}
                placeholder="Опишите ваши основные продукты или услуги"
                rows={2}
              />
              {errors.mainProducts && (
                <p className="text-sm text-red-600 mt-1">{errors.mainProducts.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="targetAudience">Целевая аудитория</Label>
              <Textarea
                id="targetAudience"
                {...register('targetAudience')}
                placeholder="Опишите вашу целевую аудиторию"
                rows={2}
              />
              {errors.targetAudience && (
                <p className="text-sm text-red-600 mt-1">{errors.targetAudience.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="businessModel">Бизнес-модель</Label>
              <Input
                id="businessModel"
                {...register('businessModel')}
                placeholder="Например: B2B, B2C, Подписка, Маркетплейс"
              />
              {errors.businessModel && (
                <p className="text-sm text-red-600 mt-1">{errors.businessModel.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="marketSize">Размер рынка (₽)</Label>
                <Input
                  id="marketSize"
                  type="number"
                  min="0"
                  {...register('marketSize', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.marketSize && (
                  <p className="text-sm text-red-600 mt-1">{errors.marketSize.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="competitorCount">Количество конкурентов</Label>
                <Input
                  id="competitorCount"
                  type="number"
                  min="0"
                  {...register('competitorCount', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.competitorCount && (
                  <p className="text-sm text-red-600 mt-1">{errors.competitorCount.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Кнопки действий */}
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
          >
            Отмена
          </Button>
        </div>
      </form>
    </div>
  );
};