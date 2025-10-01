import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '@entities/profile';
import { useBusinessContext } from '@entities/profile';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card.tsx';
import { Building2, User, MapPin, Calendar, Target, Edit } from 'lucide-react';
import { getUserFullName } from '@/shared/types/user';

interface ProfileCardProps {
  profile: UserProfile;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => {
  const navigate = useNavigate();
  const { data: businessContext } = useBusinessContext();


  return (
    <div className="space-y-6">
      {/* Личная информация */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Личная информация
            </div>
            <button
              onClick={() => { navigate('/profile/edit-personal'); }}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Редактировать личную информацию"
            >
              <Edit className="w-4 h-4 text-gray-500 hover:text-gray-700" />
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-4 mb-6">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt="Аватар"
                className="w-16 h-16 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8 text-gray-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              {(profile.user?.name || profile.userName) && (
                <h3 className="text-lg font-semibold mb-2">
                  {profile.user ? getUserFullName(profile.user) : profile.userName}
                </h3>
              )}
              
              {/* Компактная сетка с основной информацией */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {profile.user?.birthDate && (
                  <div className="text-gray-600">
                    <span className="font-medium">Дата рождения:</span> {new Date(profile.user.birthDate).toLocaleDateString('ru-RU')} 
                    ({Math.floor((new Date().getTime() - new Date(profile.user.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} лет)
                  </div>
                )}
                {profile.user?.yearsInBusiness && (
                  <div className="text-gray-600">
                    <span className="font-medium">Опыт в бизнесе:</span> {profile.user.yearsInBusiness} лет
                  </div>
                )}
                {(profile.user?.personalTelegram || profile.user?.personalInstagram || profile.user?.personalPhone) && (
                  <div className="text-gray-600 sm:col-span-2">
                    <span className="font-medium">Контакты:</span>
                    <div className="flex flex-wrap gap-3 mt-1">
                      {profile.user?.personalPhone && (
                        <span className="text-green-600">Тел: {profile.user.personalPhone}</span>
                      )}
                      {profile.user?.personalTelegram && (
                        <span className="text-blue-600">TG: {profile.user.personalTelegram}</span>
                      )}
                      {profile.user?.personalInstagram && (
                        <span className="text-pink-600">IG: {profile.user.personalInstagram}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Дополнительная информация */}
          <div className="space-y-4">

            {profile.user?.hobbies && (
              <div>
                <h4 className="font-medium mb-2 text-gray-900">Увлечения</h4>
                <p className="text-gray-700 text-sm leading-relaxed">{profile.user.hobbies}</p>
              </div>
            )}

            {profile.bio && (
              <div>
                <h4 className="font-medium mb-2 text-gray-900">О себе</h4>
                <p className="text-gray-700 text-sm leading-relaxed">{profile.bio}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Информация о бизнесе */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Информация о бизнесе
            </div>
            <button
              onClick={() => { navigate('/profile/edit-business'); }}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Редактировать информацию о бизнесе"
            >
              <Edit className="w-4 h-4 text-gray-500 hover:text-gray-700" />
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Основная информация о бизнесе */}
          <div className="space-y-4">
            {profile.businessName && (
              <div>
                <h4 className="font-medium mb-2">Название бизнеса</h4>
                <p className="text-gray-700 text-sm">{profile.businessName}</p>
              </div>
            )}
            {profile.businessDescription && (
              <div>
                <h4 className="font-medium mb-2">Описание</h4>
                <p className="text-gray-700 text-sm">{profile.businessDescription}</p>
              </div>
            )}
            
            {/* Контекстная информация */}
            {businessContext && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {businessContext.industry && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Отрасль:</span>
                    <span className="font-medium">{businessContext.industry}</span>
                  </div>
                )}
                {businessContext.businessStage && (
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Стадия:</span>
                    <span className="font-medium">{businessContext.businessStage}</span>
                  </div>
                )}
                {businessContext.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Локация:</span>
                    <span className="font-medium">{businessContext.location}</span>
                  </div>
                )}
                {businessContext.foundedYear && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Основан:</span>
                    <span className="font-medium">{businessContext.foundedYear}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Контактная информация бизнеса */}
          {(profile.workPhone || profile.website || profile.workInstagram || profile.workTelegram || profile.workSchedule || profile.addresses) && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Контактная информация</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {profile.workPhone && (
                  <div className="text-gray-600">
                    <span className="font-medium">Рабочий телефон:</span> {profile.workPhone}
                  </div>
                )}
                {profile.website && (
                  <div className="text-gray-600">
                    <span className="font-medium">Сайт:</span> 
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                      {profile.website}
                    </a>
                  </div>
                )}
                {profile.workInstagram && (
                  <div className="text-gray-600">
                    <span className="font-medium">Instagram:</span> 
                    <span className="text-pink-600 ml-1">{profile.workInstagram}</span>
                  </div>
                )}
                {profile.workTelegram && (
                  <div className="text-gray-600">
                    <span className="font-medium">Telegram:</span> 
                    <span className="text-blue-600 ml-1">{profile.workTelegram}</span>
                  </div>
                )}
              </div>
              
              {profile.workSchedule && (
                <div className="text-gray-600">
                  <span className="font-medium">График работы:</span>
                  <p className="text-sm mt-1">{profile.workSchedule}</p>
                </div>
              )}
              
              {profile.addresses && (
                <div className="text-gray-600">
                  <span className="font-medium">Адреса:</span>
                  <p className="text-sm mt-1 whitespace-pre-line">{profile.addresses}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};