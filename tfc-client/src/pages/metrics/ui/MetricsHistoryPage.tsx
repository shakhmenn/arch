import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMetricsDashboard, MetricChangeType } from '@entities/metrics';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card.tsx';
import { Button } from '@shared/ui/button.tsx';
import { Badge } from '@shared/ui/badge.tsx';
import { ArrowLeft, Clock, Filter, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface HistoryFilters {
  changeType?: MetricChangeType | 'all';
  dateRange?: 'week' | 'month' | 'quarter' | 'all';
}

export const MetricsHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: dashboard, isLoading } = useMetricsDashboard();
  const [filters, setFilters] = useState<HistoryFilters>({
    changeType: 'all',
    dateRange: 'month',
  });

  const history = dashboard?.recentHistory || [];

  // Фильтрация истории
  const filteredHistory = React.useMemo(() => {
    let filtered = [...history];

    // Фильтр по типу изменения
    if (filters.changeType && filters.changeType !== 'all') {
      filtered = filtered.filter(item => item.changeType === filters.changeType);
    }

    // Фильтр по дате
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (filters.dateRange) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      filtered = filtered.filter(item => new Date(item.changedAt) >= cutoffDate);
    }

    return filtered.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
  }, [history, filters]);

  const getChangeTypeLabel = (type: MetricChangeType) => {
    const labels = {
      [MetricChangeType.CORRECTION]: 'Исправление',
      [MetricChangeType.UPDATE]: 'Обновление',
    };
    return labels[type];
  };

  const getChangeTypeColor = (type: MetricChangeType) => {
    const colors = {
      [MetricChangeType.CORRECTION]: 'bg-yellow-100 text-yellow-800',
      [MetricChangeType.UPDATE]: 'bg-blue-100 text-blue-800',
    };
    return colors[type];
  };

  const formatValue = (value: number | undefined) => {
    if (value === undefined || value === null) return '—';
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const exportHistory = () => {
    const csvContent = [
      ['Дата', 'Метрика', 'Тип изменения', 'Старое значение', 'Новое значение', 'Причина'].join(','),
      ...filteredHistory.map(item => [
        format(new Date(item.changedAt), 'dd.MM.yyyy HH:mm', { locale: ru }),
        item.metricName,
        getChangeTypeLabel(item.changeType),
        formatValue(item.oldValue),
        formatValue(item.newValue),
        item.changeReason || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `metrics_history_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { navigate('/profile'); }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-8 h-8" />
            История изменений метрик
          </h1>
        </div>
        
        <Button onClick={exportHistory} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Экспорт
        </Button>
      </div>

      {/* Фильтры */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Тип изменения</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={filters.changeType}
                onChange={(e) => { setFilters(prev => ({ ...prev, changeType: e.target.value as MetricChangeType | 'all' })); }}
              >
                <option value="all">Все типы</option>
                <option value={MetricChangeType.CORRECTION}>Исправление ошибки</option>
                <option value={MetricChangeType.UPDATE}>Обновление данных</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Период</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={filters.dateRange}
                onChange={(e) => { setFilters(prev => ({ ...prev, dateRange: e.target.value as 'week' | 'month' | 'quarter' | 'all' })); }}
              >
                <option value="week">Последняя неделя</option>
                <option value="month">Последний месяц</option>
                <option value="quarter">Последние 3 месяца</option>
                <option value="all">Все время</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{filteredHistory.length}</div>
            <div className="text-sm text-gray-600">Всего изменений</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {filteredHistory.filter(h => h.changeType === MetricChangeType.CORRECTION).length}
            </div>
            <div className="text-sm text-gray-600">Исправлений</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {filteredHistory.filter(h => h.changeType === MetricChangeType.UPDATE).length}
            </div>
            <div className="text-sm text-gray-600">Обновлений</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {new Set(filteredHistory.map(h => h.metricName)).size}
            </div>
            <div className="text-sm text-gray-600">Уникальных метрик</div>
          </CardContent>
        </Card>
      </div>

      {/* История изменений */}
      <Card>
        <CardHeader>
          <CardTitle>История изменений</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredHistory.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Нет изменений для выбранных фильтров</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-900">{item.metricName}</h3>
                        <Badge className={getChangeTypeColor(item.changeType)}>
                          {getChangeTypeLabel(item.changeType)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Было:</span>
                          <span className="ml-2 font-medium">{formatValue(item.oldValue)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Стало:</span>
                          <span className="ml-2 font-medium">{formatValue(item.newValue)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Дата:</span>
                          <span className="ml-2">
                            {format(new Date(item.changedAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                          </span>
                        </div>
                      </div>
                      
                      {item.changeReason && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Причина:</span> {item.changeReason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};