import React, { useState, useEffect, useRef } from 'react';
import { User } from '@shared/types/user';
import { Input } from '@shared/ui/input';
import { Button } from '@shared/ui/button';
import { Card } from '@shared/ui/card';
import { Search, X, User as UserIcon } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

interface UserSearchInputProps {
  onUserSelect: (user: User) => void;
  onSearchUsers: (query: string) => Promise<User[]>;
  placeholder?: string;
  disabled?: boolean;
  excludeUserIds?: number[];
  className?: string;
}

const UserSearchInput: React.FC<UserSearchInputProps> = ({
  onUserSelect,
  onSearchUsers,
  placeholder = "Поиск пользователей...",
  disabled = false,
  excludeUserIds = [],
  className,
}) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Поиск пользователей с дебаунсом
  useEffect(() => {
    const searchUsers = async () => {
      if (query.trim().length < 2) {
        setUsers([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const searchResults = await onSearchUsers(query.trim());
        const filteredUsers = searchResults.filter(
          user => !excludeUserIds.includes(user.id)
        );
        setUsers(filteredUsers);
        setIsOpen(filteredUsers.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Ошибка поиска пользователей:', error);
        setUsers([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [query, onSearchUsers, excludeUserIds]);

  // Обработка клавиш
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || users.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < users.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : users.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < users.length) {
          handleUserSelect(users[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleUserSelect = (user: User) => {
    onUserSelect(user);
    setQuery('');
    setUsers([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setQuery('');
    setUsers([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={disabled}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isOpen && (
        <Card 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-y-auto shadow-lg"
        >
          {isLoading ? (
            <div className="p-3 text-center text-sm text-muted-foreground">
              Поиск...
            </div>
          ) : users.length > 0 ? (
            <div className="py-1">
              {users.map((user, index) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleUserSelect(user)}
                  className={cn(
                    "w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
                    "flex items-center gap-3",
                    selectedIndex === index && "bg-accent text-accent-foreground"
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
                  <UserIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 text-center text-sm text-muted-foreground">
              Пользователи не найдены
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default UserSearchInput;