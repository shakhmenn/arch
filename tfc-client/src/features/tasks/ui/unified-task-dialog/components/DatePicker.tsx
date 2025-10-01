import React from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Calendar } from '@/shared/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { DatePickerProps } from '../types';

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onValueChange,
  placeholder = 'Выберите дату',
  disabled = false,
}) => {
  const [open, setOpen] = React.useState(false);

  const selectedDate = value ? new Date(value) : undefined;

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Convert to ISO string format (YYYY-MM-DD)
      const isoString = date.toISOString().split('T')[0];
      onValueChange(isoString);
    } else {
      onValueChange(undefined);
    }
    setOpen(false);
  };

  const handleClearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange(undefined);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !selectedDate && 'text-muted-foreground'
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (
            <div className="flex items-center justify-between w-full">
              <span>
                {format(selectedDate, 'dd MMMM yyyy', { locale: ru })}
              </span>
              {!disabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-muted-foreground hover:text-foreground"
                  onClick={handleClearDate}
                >
                  ×
                </Button>
              )}
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          initialFocus
          locale={ru}
          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
        />
      </PopoverContent>
    </Popover>
  );
};