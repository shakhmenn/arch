import React, { useState, useRef, useEffect } from 'react';
import { User } from '@shared/types/user';
import { Button } from '@shared/ui/button';
import { Card } from '@shared/ui/card';
import { Input } from '@shared/ui/input';
import { ChevronDown, Search, User as UserIcon, Check } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

interface UserSelectionDropdownProps {
  users: User[];
  selectedUsers?: User[];
  onUserSelect: (user: User) => void;
  onUserDeselect?: (user: User) => void;
  placeholder?: string;
  disabled?: boolean;
  multiSelect?: boolean;
  excludeUserIds?: number[];
  className?: string;
  maxHeight?: string;
}

const UserSelectionDropdown: React.FC<UserSelectionDropdownProps> = ({
  users,
  selectedUsers = [],
  onUserSelect,
  onUserDeselect,
  placeholder = "Выберите пользователя",
  disabled = false,
  multiSelect = false,
  excludeUserIds = [],
  className,
  maxHeight = "max-h-60",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Фильтрация пользователей
  const filteredUsers = users.filter(user => {
    // Исключаем пользователей из excludeUserIds
    if (excludeUserIds.includes(user.id)) {
      return false;
    }

    // Фильтрация по поисковому запросу
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const fullName = getUserDisplayName(user).toLowerCase();
      const phone = user.phone?.toLowerCase() || '';
      
      return fullName.includes(query) || phone.includes(query);
    }
  
    return true;
  });

  // Проверка, выбран ли пользователь
  const isUserSelected = (user: User): boolean => {
    return selectedUsers.some(selected => selected.id === user.id);
  };

  // Обработка выбора пользователя
  const handleUserToggle = (user: User) => {
    if (isUserSelected(user)) {
      if (multiSelect && onUserDeselect) {
        onUserDeselect(user);
      }
    } else {
      onUserSelect(user);
      if (!multiSelect) {
        setIsOpen(false);
        setSearchQuery('');
        setSelectedIndex(-1);
      }
    }
  };

  // Обработка клавиш
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredUsers.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredUsers.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredUsers.length) {
          handleUserToggle(filteredUsers[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        setSelectedIndex(-1);
        buttonRef.current?.focus();
        break;
    }
  };

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery('');
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Фокус на поиске при открытии
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const getUserDisplayName = (user: User): string => {
    const firstName = user.name || '';
    const lastName = user.surname || '';
    const patronymic = user.patronymic || '';
    
    // Формат: "Фамилия Имя Отчество" или "Фамилия Имя" если нет отчества
    const parts = [lastName, firstName, patronymic].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : `Пользователь #${user.id}`;
  };

  const getUserInitials = (user: User): string => {
    const name = user.name || '';
    const surname = user.surname || '';
    return (name.charAt(0) + surname.charAt(0)).toUpperCase() || 'U';
  };

  const getButtonText = (): string => {
    if (selectedUsers.length === 0) {
      return placeholder;
    }
    
    if (multiSelect) {
      if (selectedUsers.length === 1) {
        return getUserDisplayName(selectedUsers[0]);
      }
      return `Выбrano: ${selectedUsers.length}`;
    }
    
    return getUserDisplayName(selectedUsers[0]);
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <Button
        ref={buttonRef}
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          "w-full justify-between text-left font-normal",
          selectedUsers.length === 0 && "text-muted-foreground"
        )}
      >
        <span className="truncate">{getButtonText()}</span>
        <ChevronDown className={cn(
          "h-4 w-4 transition-transform",
          isOpen && "rotate-180"
        )} />
      </Button>

      {isOpen && (
        <Card className={cn(
          "absolute top-full left-0 right-0 mt-1 z-50 shadow-lg",
          maxHeight,
          "overflow-hidden"
        )}>
          {/* Поиск */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Поиск пользователей..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                className="pl-8 h-8"
              />
            </div>
          </div>

          {/* Список пользователей */}
          <div className="overflow-y-auto max-h-48">
            {filteredUsers.length > 0 ? (
              <div className="py-1">
                {filteredUsers.map((user, index) => {
                  const isSelected = isUserSelected(user);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleUserToggle(user)}
                      className={cn(
                        "w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
                        "flex items-center gap-3",
                        selectedIndex === index && "bg-accent text-accent-foreground",
                        isSelected && "bg-primary/10"
                      )}
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                        {getUserInitials(user)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {getUserDisplayName(user)}
                        </div>
                        {user.phone && (
                          <div className="text-xs text-muted-foreground truncate">
                            {user.phone}
                          </div>
                        )}
                      </div>
                      {multiSelect && isSelected && (
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                      {!multiSelect && (
                        <UserIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 text-center text-sm text-muted-foreground">
                {searchQuery.trim() ? 'Пользователи не найдены' : 'Нет доступных пользователей'}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default UserSelectionDropdown;