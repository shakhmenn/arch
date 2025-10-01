# План доработки модуля "Управление командами"

## 1. Обзор проекта

**Цель**: Комплексная доработка модуля управления командами с улучшением UX/UI и бизнес-логики

**Время реализации**: 3-4 недели

**Основные изменения**:
- Упрощение интерфейса (2 вкладки вместо 4)
- Улучшение функционала управления участниками
- Реализация ограничения "один участник - одна команда"
- Добавление поиска и удобного выбора участников

---

## 2. Структура интерфейса

### 2.1 Текущее состояние

**Существующие вкладки в organizer-teams-page.tsx:**
- "Обзор" - статистика команд
- "Команды" - список всех команд
- "Создать" - форма создания команды
- "Управление" - управление выбранной командой

### 2.2 Требуемые изменения

**Новая структура (2 вкладки):**

1. **Вкладка "Обзор"**
   - Статистика команд (без изменений)
   - Последние команды (без изменений)

2. **Вкладка "Команды"**
   - Список всех команд
   - Кнопка "Создать команду" открывает модальное окно
   - Иконка редактирования рядом с каждой командой

**Удаляемые элементы:**
- Вкладка "Создать"
- Вкладка "Управление"

### 2.3 Новые компоненты

**CreateTeamModal.tsx**
```typescript
interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTeamData) => Promise<void>;
  isLoading?: boolean;
}
```

**TeamEditModal.tsx**
```typescript
interface TeamEditModalProps {
  team: Team;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}
```

---

## 3. Функционал управления командой

### 3.1 Текущие проблемы

- Поиск участников не работает
- Кнопка "Добавить участников" неактивна
- Нет удобного способа выбора участников
- Отсутствует проверка на дублирование участников в командах

### 3.2 Требуемые улучшения

**Поиск участников:**
- Реализовать live-поиск по имени и email
- Добавить фильтрацию по ролям
- Показывать только доступных для добавления пользователей

**Добавление участников (2 способа):**

1. **Поиск по базе данных**
   ```typescript
   // Новый API endpoint
   GET /users/available-for-team/:teamId?search=query&role=ENTREPRENEUR
   ```

2. **Выбор из списка**
   - Dropdown с пагинацией
   - Группировка по ролям
   - Исключение уже добавленных участников

**Новые компоненты:**

**UserSearchInput.tsx**
```typescript
interface UserSearchInputProps {
  onUserSelect: (user: User) => void;
  excludeUserIds?: number[];
  teamId?: number;
  placeholder?: string;
}
```

**UserSelectionDropdown.tsx**
```typescript
interface UserSelectionDropdownProps {
  availableUsers: User[];
  onUserSelect: (user: User) => void;
  isLoading?: boolean;
}
```

---

## 4. Бизнес-логика

### 4.1 Ограничение "один участник - одна команда"

**Backend изменения:**

1. **Обновление базы данных**
   ```sql
   -- Добавить уникальный индекс
   CREATE UNIQUE INDEX idx_user_active_team 
   ON user_teams (user_id) 
   WHERE is_active = true;
   ```

2. **Обновление Prisma схемы**
   ```prisma
   model UserTeam {
     id       Int     @id @default(autoincrement())
     userId   Int     @map("user_id")
     teamId   Int     @map("team_id")
     isActive Boolean @default(true) @map("is_active")
     joinedAt DateTime @default(now()) @map("joined_at")
     leftAt   DateTime? @map("left_at")
     
     user User @relation(fields: [userId], references: [id])
     team Team @relation(fields: [teamId], references: [id])
     
     @@unique([userId, isActive], name: "one_active_team_per_user")
     @@map("user_teams")
   }
   ```

3. **Обновление TeamsService**
   ```typescript
   async addMemberToTeam(teamId: number, userId: number): Promise<void> {
     // Проверить, состоит ли пользователь в другой команде
     const existingMembership = await this.prisma.userTeam.findFirst({
       where: {
         userId,
         isActive: true
       }
     });
     
     if (existingMembership) {
       throw new ConflictException(
         'Пользователь уже состоит в команде. Сначала удалите его из текущей команды.'
       );
     }
     
     // Добавить в новую команду
     await this.prisma.userTeam.create({
       data: {
         userId,
         teamId,
         isActive: true
       }
     });
   }
   ```

### 4.2 Логика переходов между командами

**Новые методы в TeamsService:**

```typescript
// Удаление из текущей команды
async removeMemberFromTeam(teamId: number, userId: number): Promise<void> {
  await this.prisma.userTeam.updateMany({
    where: {
      userId,
      teamId,
      isActive: true
    },
    data: {
      isActive: false,
      leftAt: new Date()
    }
  });
}

// Перевод участника в другую команду
async transferMember(userId: number, fromTeamId: number, toTeamId: number): Promise<void> {
  await this.prisma.$transaction(async (tx) => {
    // Деактивировать в старой команде
    await tx.userTeam.updateMany({
      where: {
        userId,
        teamId: fromTeamId,
        isActive: true
      },
      data: {
        isActive: false,
        leftAt: new Date()
      }
    });
    
    // Добавить в новую команду
    await tx.userTeam.create({
      data: {
        userId,
        teamId: toTeamId,
        isActive: true
      }
    });
  });
}

// Получить доступных для добавления пользователей
async getAvailableUsers(teamId?: number): Promise<User[]> {
  return this.prisma.user.findMany({
    where: {
      role: 'ENTREPRENEUR',
      teams: {
        none: {
          isActive: true
        }
      }
    },
    include: {
      profile: true
    }
  });
}
```

### 4.3 Новые API endpoints

```typescript
// Получить доступных пользователей
GET /users/available-for-team/:teamId

// Поиск пользователей
GET /users/search?q=query&excludeTeam=teamId

// Перевод участника между командами
POST /teams/transfer-member
{
  "userId": 123,
  "fromTeamId": 1,
  "toTeamId": 2
}

// Удаление участника из команды
DELETE /teams/:teamId/members/:userId
```

---

## 5. План реализации

### Этап 1: Backend изменения (1 неделя)

**День 1-2: База данных**
- Обновление Prisma схемы
- Создание миграции для уникального индекса
- Тестирование ограничений

**День 3-4: API**
- Обновление TeamsService
- Добавление новых endpoints
- Обновление существующих методов

**День 5: Тестирование**
- Unit тесты для новых методов
- Integration тесты
- Проверка бизнес-логики

### Этап 2: Frontend компоненты (1 неделя)

**День 1-2: Модальные окна**
- CreateTeamModal
- TeamEditModal
- Интеграция с существующими формами

**День 3-4: Поиск и выбор пользователей**
- UserSearchInput
- UserSelectionDropdown
- Интеграция с API

**День 5: Тестирование**
- Компонентные тесты
- E2E тесты

### Этап 3: Рефакторинг интерфейса (1 неделя)

**День 1-2: Упрощение структуры**
- Удаление вкладок "Создать" и "Управление"
- Обновление organizer-teams-page.tsx
- Добавление иконок редактирования

**День 3-4: Обновление TeamMembersManager**
- Интеграция нового функционала поиска
- Обновление логики добавления участников
- Улучшение UX

**День 5: Финальное тестирование**
- Полное тестирование workflow
- Проверка всех сценариев использования

### Этап 4: Полировка и оптимизация (0.5-1 неделя)

- Исправление багов
- Оптимизация производительности
- Улучшение UX/UI
- Документация

---

## 6. Технические детали

### 6.1 Изменения в файлах

**Backend:**
- `prisma/schema.prisma` - обновление модели UserTeam
- `src/teams/teams.service.ts` - новые методы
- `src/teams/teams.controller.ts` - новые endpoints
- `src/users/users.service.ts` - методы поиска
- `src/users/users.controller.ts` - endpoints поиска

**Frontend:**
- `src/pages/teams/ui/organizer-teams-page.tsx` - упрощение структуры
- `src/features/teams/ui/create-team-modal.tsx` - новый компонент
- `src/features/teams/ui/team-edit-modal.tsx` - новый компонент
- `src/features/teams/ui/user-search-input.tsx` - новый компонент
- `src/features/teams/ui/user-selection-dropdown.tsx` - новый компонент
- `src/features/teams/ui/team-members-manager.tsx` - обновление функционала

### 6.2 Новые типы данных

```typescript
// Поиск пользователей
interface UserSearchParams {
  query?: string;
  excludeTeamId?: number;
  role?: Role;
  limit?: number;
}

// Перевод участника
interface TransferMemberData {
  userId: number;
  fromTeamId: number;
  toTeamId: number;
}

// Доступные пользователи
interface AvailableUsersResponse {
  users: User[];
  total: number;
  hasMore: boolean;
}
```

---

## 7. Ожидаемые результаты

### 7.1 Улучшения UX/UI
- Упрощенный интерфейс с 2 вкладками вместо 4
- Быстрое создание команд через модальное окно
- Удобное редактирование команд через иконки
- Интуитивный поиск и выбор участников

### 7.2 Улучшения функционала
- Работающий поиск участников
- Два способа добавления участников
- Защита от дублирования участников в командах
- Возможность перевода участников между командами

### 7.3 Улучшения бизнес-логики
- Строгое ограничение "один участник - одна команда"
- Корректное распределение по командам в БД
- Логичные переходы между командами
- Целостность данных

---

## 8. Риски и митигация

### 8.1 Технические риски

**Риск**: Конфликты при одновременном добавлении участника в разные команды
**Митигация**: Использование транзакций БД и блокировок

**Риск**: Производительность поиска при большом количестве пользователей
**Митигация**: Индексы БД, пагинация, дебаунсинг

### 8.2 UX риски

**Риск**: Пользователи могут не найти функцию создания команды
**Митигация**: Яркая кнопка "Создать команду", подсказки

**Риск**: Сложность понимания ограничения "одна команда"
**Митигация**: Четкие сообщения об ошибках, подсказки в интерфейсе

---

## 9. Критерии успеха

- ✅ Интерфейс содержит только 2 вкладки
- ✅ Создание команды происходит через модальное окно
- ✅ Редактирование команды доступно через иконку
- ✅ Поиск участников работает корректно
- ✅ Кнопка "Добавить участников" функциональна
- ✅ Реализованы 2 способа добавления участников
- ✅ Участник не может состоять в нескольких командах
- ✅ Возможен перевод участника между командами
- ✅ Все изменения покрыты тестами
- ✅ Производительность не ухудшилась