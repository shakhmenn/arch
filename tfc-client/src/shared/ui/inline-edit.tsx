import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import { Input } from './input';
import { Button } from './button';
import { Check, X, Edit2 } from 'lucide-react';

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
  onCancel?: () => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const InlineEdit: React.FC<InlineEditProps> = ({
  value,
  onSave,
  onCancel,
  className,
  placeholder,
  disabled = false
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(value);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  React.useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          placeholder={placeholder}
          className="h-8 text-sm"
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          className="h-8 w-8 p-0"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-2 py-1',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      onClick={() => !disabled && setIsEditing(true)}
    >
      <span className="flex-1">{value || placeholder}</span>
      {!disabled && <Edit2 className="h-3 w-3 opacity-50" />}
    </div>
  );
};

interface InlineSelectProps {
  value: string;
  options: { value: string; label: string }[];
  onSave: (value: string) => void;
  onCancel?: () => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const InlineSelect: React.FC<InlineSelectProps> = ({
  value,
  options,
  onSave,
  onCancel,
  className,
  placeholder,
  disabled = false
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(value);
  const selectRef = React.useRef<HTMLSelectElement>(null);

  React.useEffect(() => {
    if (isEditing && selectRef.current) {
      selectRef.current.focus();
    }
  }, [isEditing]);

  React.useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const getCurrentLabel = () => {
    const option = options.find(opt => opt.value === value);
    return option?.label || value || placeholder;
  };

  if (isEditing) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <select
          ref={selectRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="h-8 text-sm border border-gray-300 rounded px-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          className="h-8 w-8 p-0"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-2 py-1',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      onClick={() => !disabled && setIsEditing(true)}
    >
      <span className="flex-1">{getCurrentLabel()}</span>
      {!disabled && <Edit2 className="h-3 w-3 opacity-50" />}
    </div>
  );
};