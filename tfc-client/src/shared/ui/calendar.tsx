import React, { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';

export interface CalendarProps extends React.HTMLAttributes<HTMLDivElement> {
  mode?: 'single' | 'multiple' | 'range';
  selected?: Date | Date[] | { from: Date; to?: Date };
  onSelect?: (date: Date | Date[] | { from: Date; to?: Date } | undefined) => void;
  disabled?: (date: Date) => boolean;
  showOutsideDays?: boolean;
}

export const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  ({ className, mode = 'single', selected, onSelect, disabled, showOutsideDays = true, ...props }, ref) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const monthNames = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];

    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0

      const days: (Date | null)[] = [];

      // Add empty cells for days before the first day of the month
      for (let i = 0; i < startingDayOfWeek; i++) {
        if (showOutsideDays) {
          const prevMonthDay = new Date(year, month, -startingDayOfWeek + i + 1);
          days.push(prevMonthDay);
        } else {
          days.push(null);
        }
      }

      // Add days of the current month
      for (let day = 1; day <= daysInMonth; day++) {
        days.push(new Date(year, month, day));
      }

      // Add empty cells for days after the last day of the month
      const remainingCells = 42 - days.length; // 6 rows * 7 days
      for (let i = 1; i <= remainingCells; i++) {
        if (showOutsideDays) {
          const nextMonthDay = new Date(year, month + 1, i);
          days.push(nextMonthDay);
        } else {
          days.push(null);
        }
      }

      return days;
    };

    const isSelected = (date: Date) => {
      if (!selected) return false;
      
      if (mode === 'single') {
        return selected instanceof Date && 
               date.getDate() === selected.getDate() &&
               date.getMonth() === selected.getMonth() &&
               date.getFullYear() === selected.getFullYear();
      }
      
      if (mode === 'multiple' && Array.isArray(selected)) {
        return selected.some(selectedDate => 
          date.getDate() === selectedDate.getDate() &&
          date.getMonth() === selectedDate.getMonth() &&
          date.getFullYear() === selectedDate.getFullYear()
        );
      }
      
      return false;
    };

    const handleDateClick = (date: Date) => {
      if (disabled?.(date)) return;
      
      if (mode === 'single') {
        onSelect?.(date);
      } else if (mode === 'multiple') {
        const currentSelected = Array.isArray(selected) ? selected : [];
        const isAlreadySelected = currentSelected.some(selectedDate => 
          date.getDate() === selectedDate.getDate() &&
          date.getMonth() === selectedDate.getMonth() &&
          date.getFullYear() === selectedDate.getFullYear()
        );
        
        if (isAlreadySelected) {
          onSelect?.(currentSelected.filter(selectedDate => 
            !(date.getDate() === selectedDate.getDate() &&
              date.getMonth() === selectedDate.getMonth() &&
              date.getFullYear() === selectedDate.getFullYear())
          ));
        } else {
          onSelect?.([...currentSelected, date]);
        }
      }
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
      setCurrentMonth(prev => {
        const newMonth = new Date(prev);
        if (direction === 'prev') {
          newMonth.setMonth(prev.getMonth() - 1);
        } else {
          newMonth.setMonth(prev.getMonth() + 1);
        }
        return newMonth;
      });
    };

    const days = getDaysInMonth(currentMonth);
    const isCurrentMonth = (date: Date | null) => {
      if (!date) return false;
      return date.getMonth() === currentMonth.getMonth();
    };

    return (
      <div
        ref={ref}
        className={cn('p-3 bg-white dark:bg-gray-800 border rounded-md', className)}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="h-7 w-7 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-sm font-medium">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="h-7 w-7 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className="h-8 w-8 flex items-center justify-center text-xs font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            if (!date) {
              return <div key={index} className="h-8 w-8" />;
            }

            const isCurrentMonthDay = isCurrentMonth(date);
            const isSelectedDay = isSelected(date);
            const isDisabled = disabled?.(date);
            const isToday = 
              date.getDate() === new Date().getDate() &&
              date.getMonth() === new Date().getMonth() &&
              date.getFullYear() === new Date().getFullYear();

            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                disabled={isDisabled}
                className={cn(
                  'h-8 w-8 text-sm rounded-md transition-colors',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  !isCurrentMonthDay && 'text-gray-400 dark:text-gray-600',
                  isCurrentMonthDay && 'text-gray-900 dark:text-gray-100',
                  isSelectedDay && 'bg-blue-600 text-white hover:bg-blue-700',
                  isToday && !isSelectedDay && 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
                  isDisabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
                )}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);
Calendar.displayName = 'Calendar';