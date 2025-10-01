import React from 'react';
import { Label } from './label';

interface MonthYearPickerProps {
  value?: string; // YYYY-MM format
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
}

export const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  value,
  onChange,
  label,
  error,
  required = false,
}) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Парсим текущее значение
  const [selectedYear, selectedMonth] = value ? value.split('-').map(Number) : [currentYear, currentMonth];

  const handleYearChange = (year: number) => {
    const month = selectedMonth || currentMonth;
    onChange(`${year}-${month.toString().padStart(2, '0')}`);
  };

  const handleMonthChange = (month: number) => {
    const year = selectedYear || currentYear;
    onChange(`${year}-${month.toString().padStart(2, '0')}`);
  };

  // Генерируем годы (текущий год ± 5 лет)
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const months = [
    { value: 1, label: 'Январь' },
    { value: 2, label: 'Февраль' },
    { value: 3, label: 'Март' },
    { value: 4, label: 'Апрель' },
    { value: 5, label: 'Май' },
    { value: 6, label: 'Июнь' },
    { value: 7, label: 'Июль' },
    { value: 8, label: 'Август' },
    { value: 9, label: 'Сентябрь' },
    { value: 10, label: 'Октябрь' },
    { value: 11, label: 'Ноябрь' },
    { value: 12, label: 'Декабрь' },
  ];

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={selectedYear || ''}
            onChange={(e) => { handleYearChange(Number(e.target.value)); }}
          >
            <option value="" disabled>Год</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={selectedMonth || ''}
            onChange={(e) => { handleMonthChange(Number(e.target.value)); }}
          >
            <option value="" disabled>Месяц</option>
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};