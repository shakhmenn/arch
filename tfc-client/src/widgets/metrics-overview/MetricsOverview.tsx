import React from 'react';
import { useMetricsDashboard } from '@entities/metrics';
import { MetricCategory, MetricUnit } from '@entities/metrics';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card.tsx';
import { Button } from '@shared/ui/button.tsx';
import { Badge } from '@shared/ui/badge.tsx';
import { 
  BarChart3, 
  Plus, 
  Target, 
  Building2, 
  Users, 
  DollarSign, 
  Activity,
  Zap,
  History,
  Edit,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
      return 'text-green-600';
    case MetricCategory.OPERATIONAL:
      return 'text-blue-600';
    case MetricCategory.CUSTOMER:
      return 'text-purple-600';
    case MetricCategory.PRODUCTIVITY:
      return 'text-orange-600';
    case MetricCategory.STRATEGIC:
      return 'text-red-600';
    default:
      return 'text-gray-600';
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

const formatValue = (value: number | undefined, unit: MetricUnit) => {
  if (value === undefined || value === null || typeof value !== 'number' || isNaN(value)) return '—';
  
  switch (unit) {
    case MetricUnit.CURRENCY:
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
      }).format(value);
    case MetricUnit.PERCENTAGE:
      return `${value.toFixed(1)}%`;
    case MetricUnit.COUNT:
      return value.toLocaleString('ru-RU');
    case MetricUnit.RATIO:
      return value.toFixed(2);
    case MetricUnit.HOURS:
      return `${value} ч`;
    case MetricUnit.DAYS:
      return `${value} дн`;
    default:
      return value.toString();
  }
};

export const MetricsOverview: React.FC = () => {
  const { data: dashboard, isLoading, error } = useMetricsDashboard();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Метрики
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !dashboard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Метрики
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">Не удалось загрузить данные метрик</p>
          <div className="space-y-2">
            <Link to="/metrics/create">
              <Button size="sm" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Создать метрику
              </Button>
            </Link>
            <Link to="/business-context">
              <Button size="sm" variant="outline" className="w-full">
                <Building2 className="w-4 h-4 mr-2" />
                Настроить бизнес-контекст
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">


      {/* Последние метрики */}
      {dashboard.recentMetrics && dashboard.recentMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Ключевые метрики
              </div>
              <Link to="/metrics">
                <Button variant="ghost" size="sm" className="text-xs">
                  Все метрики
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard.recentMetrics.slice(0, 4).map((metric) => {
                const variance = metric.variance;
                const Icon = getCategoryIcon(metric.category);
                const isPositive = variance !== null && variance !== undefined && variance >= 0;
                
                return (
                  <div key={metric.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${getCategoryColor(metric.category).split(' ')[0]}`} />
                        <h4 className="font-medium text-sm">{metric.name}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getCategoryName(metric.category)}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0"
                          onClick={() => window.location.href = `/metrics/edit/${metric.id}`}
                          title="Редактировать метрику"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-xs text-gray-600 mb-1">Цель</div>
                        <div className="font-semibold text-sm">
                          {formatValue(metric.targetValue, metric.unit)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-600 mb-1">Факт</div>
                        <div className="font-semibold text-sm">
                          {formatValue(metric.value, metric.unit)}
                        </div>
                      </div>
                    </div>
                    
                    {variance !== null && variance !== undefined && (
                      <div className="flex items-center justify-center gap-2">
                        {isPositive ? (
                          <ArrowUpRight className="w-4 h-4 text-green-600" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${
                          isPositive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isPositive ? '+' : ''}{typeof variance === 'number' && !isNaN(variance) ? variance.toFixed(1) : '0.0'}%
                        </span>
                        <span className="text-xs text-gray-500">от цели</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* История изменений */}
      {dashboard.recentHistory && dashboard.recentHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Последние изменения
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboard.recentHistory.slice(0, 3).map((item) => (
                <div key={item.id} className="text-xs border-b border-gray-100 pb-2 last:border-b-0">
                  <div className="font-medium">{item.metricName}</div>
                  <div className="text-gray-600">
                    {item.oldValue} → {item.newValue}
                    {item.changeReason && (
                      <span className="ml-2 italic">({item.changeReason})</span>
                    )}
                  </div>
                  <div className="text-gray-500">
                    {new Date(item.changedAt).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Быстрые действия */}
      <Card>
        <CardHeader>
          <CardTitle>Быстрые действия</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link to="/metrics/create">
            <Button className="w-full" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Добавить метрику
            </Button>
          </Link>
          <Link to="/metrics">
            <Button className="w-full" variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              Все метрики
            </Button>
          </Link>
          {!dashboard.businessContext && (
            <Link to="/business-context">
              <Button className="w-full" variant="outline" size="sm">
                <Building2 className="w-4 h-4 mr-2" />
                Настроить бизнес-контекст
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
};