import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  useMyProfile, 
  useUpdateProfile, 
  useCreateProfile, 
  UpdateProfileDto
} from '@entities/profile';
import { useUpdateUser, UpdateUserDto } from '@entities/user';
import { Button } from '@shared/ui/button.tsx';
import { Input } from '@shared/ui/input.tsx';
import { Textarea } from '@shared/ui/textarea.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card.tsx';
import { Label } from '@shared/ui/label.tsx';
import { Save, ArrowLeft, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const personalSchema = z.object({
  userName: z.string().optional(),
  userAge: z.number().min(1).max(120).optional().or(z.literal('')),
  bio: z.string().optional(),
  surname: z.string().optional(),
  patronymic: z.string().optional(),
  birthDate: z.string().optional(),
  personalTelegram: z.string().optional(),
  personalInstagram: z.string().optional(),
  personalPhone: z.string().optional(),
  yearsInBusiness: z.number().min(0).max(100).optional().or(z.literal('')),
  hobbies: z.string().optional(),
});

type PersonalFormData = z.infer<typeof personalSchema>;

// Функция для преобразования DateTime в формат YYYY-MM-DD
const formatDateForInput = (dateString?: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

export const PersonalEditForm: React.FC = () => {
  const navigate = useNavigate();
  const { data: profile, isLoading: isLoadingProfile } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const createProfile = useCreateProfile();
  const updateUser = useUpdateUser();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PersonalFormData>({
    resolver: zodResolver(personalSchema),
    defaultValues: {
      userName: profile?.userName || '',
      userAge: profile?.userAge || '',
      bio: profile?.bio || '',
      surname: profile?.user?.surname || '',
      patronymic: profile?.user?.patronymic || '',
      birthDate: formatDateForInput(profile?.user?.birthDate),
      personalTelegram: profile?.user?.personalTelegram || '',
      personalInstagram: profile?.user?.personalInstagram || '',
      personalPhone: profile?.user?.personalPhone || '',
      yearsInBusiness: profile?.user?.yearsInBusiness || '',
      hobbies: profile?.user?.hobbies || '',
    },
  });

  React.useEffect(() => {
    if (profile) {
      reset({
        userName: profile.userName || '',
        userAge: profile.userAge || '',
        bio: profile.bio || '',
        surname: profile.user?.surname || '',
        patronymic: profile.user?.patronymic || '',
        birthDate: formatDateForInput(profile.user?.birthDate),
        personalTelegram: profile.user?.personalTelegram || '',
        personalInstagram: profile.user?.personalInstagram || '',
        personalPhone: profile.user?.personalPhone || '',
        yearsInBusiness: profile.user?.yearsInBusiness || '',
        hobbies: profile.user?.hobbies || '',
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: PersonalFormData) => {
    try {
      console.log('Personal form submitted with data:', data);
      
      // Данные профиля
      const profileData: UpdateProfileDto = {
        userName: data.userName,
        userAge: data.userAge === '' ? undefined : Number(data.userAge),
        bio: data.bio,
      };

      // Данные пользователя - фильтруем пустые значения
      const userData: UpdateUserDto = {};
      if (data.surname?.trim()) userData.surname = data.surname.trim();
      if (data.patronymic?.trim()) userData.patronymic = data.patronymic.trim();
      if (data.birthDate?.trim()) userData.birthDate = data.birthDate.trim();
      if (data.personalTelegram?.trim()) userData.personalTelegram = data.personalTelegram.trim();
      if (data.personalInstagram?.trim()) userData.personalInstagram = data.personalInstagram.trim();
      if (data.personalPhone?.trim()) userData.personalPhone = data.personalPhone.trim();
      if (data.yearsInBusiness !== '' && data.yearsInBusiness !== undefined) userData.yearsInBusiness = Number(data.yearsInBusiness);
      if (data.hobbies?.trim()) userData.hobbies = data.hobbies.trim();
      if (data.userName?.trim()) userData.name = data.userName.trim();

      console.log('Profile data:', profileData);
      console.log('User data:', userData);

      // Сохраняем данные пользователя
      await updateUser.mutateAsync(userData);

      // Сохраняем профиль
      if (profile) {
        console.log('Updating existing profile...');
        await updateProfile.mutateAsync(profileData);
      } else {
        console.log('Creating new profile...');
        await createProfile.mutateAsync(profileData);
      }
      
      toast.success('Личная информация успешно сохранена');
      console.log('Navigating to /profile...');
      navigate('/profile');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Ошибка при сохранении личной информации');
    }
  };

  if (isLoadingProfile) {
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
          Редактировать личную информацию
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Личная информация */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Личная информация
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="userName">Имя пользователя</Label>
              <Input
                id="userName"
                {...register('userName')}
                placeholder="Введите ваше имя"
              />
              {errors.userName && (
                <p className="text-sm text-red-600 mt-1">{errors.userName.message}</p>
              )}
            </div>



            <div>
              <Label htmlFor="surname">Фамилия</Label>
              <Input
                id="surname"
                {...register('surname')}
                placeholder="Введите вашу фамилию"
              />
              {errors.surname && (
                <p className="text-sm text-red-600 mt-1">{errors.surname.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="patronymic">Отчество</Label>
              <Input
                id="patronymic"
                {...register('patronymic')}
                placeholder="Введите ваше отчество"
              />
              {errors.patronymic && (
                <p className="text-sm text-red-600 mt-1">{errors.patronymic.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="birthDate">Дата рождения</Label>
              <Input
                id="birthDate"
                type="date"
                {...register('birthDate')}
              />
              {errors.birthDate && (
                <p className="text-sm text-red-600 mt-1">{errors.birthDate.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="personalTelegram">Личный Telegram</Label>
              <Input
                id="personalTelegram"
                {...register('personalTelegram')}
                placeholder="@username или ссылка"
              />
              {errors.personalTelegram && (
                <p className="text-sm text-red-600 mt-1">{errors.personalTelegram.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="personalInstagram">Личный Instagram</Label>
              <Input
                id="personalInstagram"
                {...register('personalInstagram')}
                placeholder="@username или ссылка"
              />
              {errors.personalInstagram && (
                <p className="text-sm text-red-600 mt-1">{errors.personalInstagram.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="personalPhone">Личный номер телефона</Label>
              <Input
                id="personalPhone"
                type="tel"
                {...register('personalPhone')}
                placeholder="+7 (999) 123-45-67"
              />
              {errors.personalPhone && (
                <p className="text-sm text-red-600 mt-1">{errors.personalPhone.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="yearsInBusiness">Сколько лет в бизнесе</Label>
              <Input
                id="yearsInBusiness"
                type="number"
                min="0"
                max="100"
                {...register('yearsInBusiness', { valueAsNumber: true })}
                placeholder="Введите количество лет"
              />
              {errors.yearsInBusiness && (
                <p className="text-sm text-red-600 mt-1">{errors.yearsInBusiness.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="hobbies">Увлечения</Label>
              <Textarea
                id="hobbies"
                {...register('hobbies')}
                placeholder="Расскажите о ваших увлечениях"
                rows={3}
              />
              {errors.hobbies && (
                <p className="text-sm text-red-600 mt-1">{errors.hobbies.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="bio">О себе</Label>
              <Textarea
                id="bio"
                {...register('bio')}
                placeholder="Расскажите о себе"
                rows={4}
              />
              {errors.bio && (
                <p className="text-sm text-red-600 mt-1">{errors.bio.message}</p>
              )}
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