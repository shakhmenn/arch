import React from 'react';
import { useMyProfile } from '@entities/profile';
import { ProfileCard } from '@widgets/profile-card/ProfileCard';
import { Button } from '@shared/ui/button.tsx';
import { Plus, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ProfilePage Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Произошла ошибка</h2>
          <p className="text-gray-600 mb-4">{this.state.error?.message}</p>
          <Button onClick={() => { window.location.reload(); }}>
            Перезагрузить страницу
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ProfilePage: React.FC = () => {
  const { data: profile, isLoading, error } = useMyProfile();

  console.log('ProfilePage render:', { profile, isLoading, error });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ошибка загрузки профиля</h2>
        <p className="text-gray-600 mb-6">Не удалось загрузить данные профиля</p>
        <Button onClick={() => { window.location.reload(); }}>
          Попробовать снова
        </Button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Профиль не найден</h2>
        <p className="text-gray-600 mb-6">Создайте свой профиль, чтобы начать работу</p>
        <Link to="/profile/edit-personal">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Создать профиль
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Мой профиль</h1>
          <div className="flex gap-3">
            <Link to="/metrics">
              <Button variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                Метрики
              </Button>
            </Link>

          </div>
        </div>

        {/* Основная информация профиля */}
        <div className="max-w-4xl mx-auto">
          <ErrorBoundary>
            <ProfileCard profile={profile} />
          </ErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  );
};