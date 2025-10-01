import React, { useState } from 'react';
import { CreateTeamData } from '@shared/types/team';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Textarea } from '@shared/ui/textarea';
import { Users } from 'lucide-react';

interface CreateTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateTeamData) => Promise<void>;
  isLoading?: boolean;
}

interface FormData {
  name: string;
  description: string;
  maxMembers: number;
}

interface FormErrors {
  name?: string;
  description?: string;
  maxMembers?: string;
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    maxMembers: 5,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Валидация имени
    if (!formData.name.trim()) {
      newErrors.name = 'Название команды обязательно';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Название должно содержать минимум 3 символа';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Название не должно превышать 50 символов';
    }

    // Валидация описания
    if (formData.description.length > 200) {
      newErrors.description = 'Описание не должно превышать 200 символов';
    }

    // Валидация максимального количества участников
    if (formData.maxMembers < 2) {
      newErrors.maxMembers = 'Минимальное количество участников: 2';
    } else if (formData.maxMembers > 20) {
      newErrors.maxMembers = 'Максимальное количество участников: 20';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData: CreateTeamData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        maxMembers: formData.maxMembers,
      };

      await onSubmit(submitData);
      
      // Сброс формы после успешного создания
      setFormData({
        name: '',
        description: '',
        maxMembers: 5,
      });
      setErrors({});
      onOpenChange(false);
    } catch (error) {
      console.error('Ошибка при создании команды:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Очистка ошибки при изменении поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !isLoading) {
      setFormData({
        name: '',
        description: '',
        maxMembers: 5,
      });
      setErrors({});
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Создать новую команду
          </DialogTitle>
          <DialogDescription>
            Заполните информацию о новой команде. Вы автоматически станете лидером команды.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-name">Название команды *</Label>
            <Input
              id="team-name"
              type="text"
              placeholder="Введите название команды"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={isSubmitting || isLoading}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-description">Описание</Label>
            <Textarea
              id="team-description"
              placeholder="Опишите цели и задачи команды (необязательно)"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={isSubmitting || isLoading}
              className={errors.description ? 'border-red-500' : ''}
              rows={3}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formData.description.length}/200 символов</span>
              {errors.description && (
                <span className="text-red-500">{errors.description}</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-members">Максимальное количество участников</Label>
            <Input
              id="max-members"
              type="number"
              min={2}
              max={20}
              value={formData.maxMembers}
              onChange={(e) => handleInputChange('maxMembers', parseInt(e.target.value) || 2)}
              disabled={isSubmitting || isLoading}
              className={errors.maxMembers ? 'border-red-500' : ''}
            />
            {errors.maxMembers && (
              <p className="text-sm text-red-500">{errors.maxMembers}</p>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || isLoading}
              className="mt-2 sm:mt-0"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full sm:w-auto"
            >
              {isSubmitting || isLoading ? 'Создание...' : 'Создать команду'}
            </Button>
          </DialogFooter>
        </form>


      </DialogContent>
    </Dialog>
  );
};

export default CreateTeamModal;