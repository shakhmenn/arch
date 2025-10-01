import React, { useState } from 'react';
import { useMetricsDashboard } from '@entities/metrics';
import { MetricCategory, MetricUnit } from '@entities/metrics';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card.tsx';
import { Button } from '@shared/ui/button.tsx';
import { Badge } from '@shared/ui/badge.tsx';
import { Input } from '@shared/ui/input.tsx';
import { 
  BarChart3, 
  Plus, 
  Search,
  Filter,
  Edit,
  Target,
  Building2, 
  Users, 
  DollarSign, 
  Activity,
  ArrowLeft,
  Zap,
  Clock
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// Утилиты для отображения
const getCategoryIcon = (category: MetricCategory) => {
  switch (category) {
    case MetricCategory.FINANCIAL:
      return DollarSign;
    case MetricCategory.OPERATIONAL:
      return Activity;
    case MetricCategory.CUSTOMER:
      return Users;
    case MetricCategory.PRODUCTIVITY:
      return Zap;
    case MetricCategory.STRATEGIC:
      return Building2;
    default:
      return BarChart3;
  }
};

const getCategoryColor = (category: MetricCategory) => {
  switch (category) {
    case MetricCategory.FINANCIAL:
      return 'text-green-600 bg-green-50 border-green-200';
    case MetricCategory.OPERATIONAL:
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case MetricCategory.CUSTOMER:
      return 'text-purple-600 bg-purple-50 border-purple-200';
    case MetricCategory.PRODUCTIVITY:
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case MetricCategory.STRATEGIC:
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getCategoryName = (category: MetricCategory) => {
  switch (category) {
    case MetricCategory.FINANCIAL:
      return 'Финансовые';
    case MetricCategory.OPERATIONAL:
      return 'Операционные';
    case MetricCategory.CUSTOMER:
      return 'Клиентские';
    case MetricCategory.PRODUCTIVITY:
      return 'Продуктивность';
    case MetricCategory.STRATEGIC:
      return 'Стратегические';
    default:
      return category;
  }
};

const formatValue = (value: number | string | undefined, unit: MetricUnit) => {
  // Конвертируем значение в число
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (numValue === undefined || numValue === null || isNaN(numValue)) return '—';
  
  switch (unit) {
    case MetricUnit.CURRENCY:
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
      }).format(numValue);
    case MetricUnit.PERCENTAGE:
      return `${numValue.toFixed(1)}%`;
    case MetricUnit.COUNT:
      return numValue.toLocaleString('ru-RU');
    case MetricUnit.RATIO:
      return numValue.toFixed(2);
    case MetricUnit.HOURS:
      return `${numValue} ч`;
    case MetricUnit.DAYS:
      return `${numValue} дн`;
    default:
      return numValue.toString();
  }
};

export const MetricsPage: React.FC = () => {
  const { data: dashboard, isLoading, error } = useMetricsDashboard();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MetricCategory | 'all'>('all');
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ошибка загрузки метрик</h2>
        <p className="text-gray-600 mb-6">Не удалось загрузить данные метрик</p>
        <div className="space-x-4">
          <Link to="/profile">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к профилю
            </Button>
          </Link>
          <Link to="/metrics/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Создать метрику
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Фильтрация метрик
  const filteredMetrics = dashboard.recentMetrics?.filter(metric => {
    const matchesSearch = metric.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || metric.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const categories = Object.values(MetricCategory);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Заголовок */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link to="/profile">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Все метрики</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/metrics/history">
            <Button variant="outline">
              <Clock className="w-4 h-4 mr-2" />
              История
            </Button>
          </Link>
          <Link to="/metrics/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Добавить метрику
            </Button>
          </Link>
        </div>
      </div>

      {/* Фильтры и поиск */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Поиск метрик..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); }}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value as MetricCategory | 'all'); }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="all">Все категории</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {getCategoryName(category)}
              </option>
            ))}
          </select>
        </div>
      </div>



      {/* Список метрик */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Метрики ({filteredMetrics.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMetrics.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Метрики не найдены</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Попробуйте изменить критерии поиска'
                  : 'У вас пока нет метрик'}
              </p>
              <Link to="/metrics/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Создать первую метрику
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMetrics.map((metric) => {
                const Icon = getCategoryIcon(metric.category);
                const colorClass = getCategoryColor(metric.category);
                const variance = metric.variance;
                
                return (
                  <div key={metric.id} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${colorClass}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        <h3 className="font-medium text-sm">{metric.name}</h3>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0"
                        onClick={() => { navigate(`/metrics/edit/${metric.id}`); }}
                        title="Редактировать метрику"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Категория:</span>
                        <Badge variant="outline" className="text-xs">
                          {getCategoryName(metric.category)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Цель:</span>
                        <span className="font-medium">{formatValue(metric.targetValue, metric.unit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Текущее:</span>
                        <span className="font-medium">{formatValue(metric.value, metric.unit)}</span>
                      </div>
                      {variance !== null && variance !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Отклонение:</span>
                          <span className={`font-medium ${
                            variance >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {variance >= 0 ? '+' : ''}{typeof variance === 'number' && !isNaN(variance) ? variance.toFixed(1) : '0.0'}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};