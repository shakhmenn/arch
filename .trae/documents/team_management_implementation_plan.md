# Пошаговый план реализации системы управления десятками

## Обзор проекта

**Цель**: Реализация системы управления десятками для 70+ участников бизнес-клуба без региональной системы

**Общее время реализации**: 5-8 недель

**Архитектура**: 
- Backend: NestJS + Prisma + PostgreSQL
- Frontend: React + TypeScript + Tailwind CSS

---

## Этап 1: Расширение системы ролей и базы данных (1 неделя)

### 1.1 Backend - Обновление Prisma схемы (1-2 дня)

**Задачи:**

1. **Добавить новые роли в enum**
   ```prisma
   enum Role {
     SUPER_ORGANIZER
     ORGANIZER
     TEAM_LEADER
     ENTREPRENEUR
   }
   ```
   - Время: 30 минут
   - Файл: `prisma/schema.prisma`

2. **Обновить модель Team (без Region)**
   ```prisma
   model Team {
     id          Int      @id @default(autoincrement())
     name        String
     description String?
     maxMembers  Int      @default(10)
     leaderId    Int?     @map("leader_id")
     leader      User?    @relation("TeamLeader", fields: [leaderId], references: [id])
     isActive    Boolean  @default(true)
     createdAt   DateTime @default(now()) @map("created_at")
     updatedAt   DateTime @updatedAt @map("updated_at")
     
     // Relations
     members     UserTeam[]
     tasks       Task[]
     
     @@map("teams")
   }
   ```
   - Время: 1 час
   - Файл: `prisma/schema.prisma`

3. **Обновить модель User**
   ```prisma
   model User {
     // ... существующие поля
     role            Role      @default(ENTREPRENEUR)
     
     // Relations
     teams           UserTeam[]
     ledTeams        Team[]    @relation("TeamLeader")
     // ... остальные связи
   }
   ```
   - Время: 30 минут
   - Файл: `prisma/schema.prisma`

4. **Создать и применить миграцию**
   ```bash
   npx prisma migrate dev --name "add_team_leader_roles"
   ```
   - Время: 30 минут

**Тестирование:**
- Проверить успешное применение миграции
- Убедиться, что существующие данные не повреждены
- Время: 30 минут

### 1.2 Backend - Обновление системы авторизации (1 день)

**Задачи:**

1. **Обновить guards для новых ролей**
   - Файл: `src/common/guards/roles.guard.ts`
   - Добавить проверки для SUPER_ORGANIZER, TEAM_LEADER
   - Время: 1 час

2. **Создать декораторы для ролей**
   ```typescript
   @Roles('SUPER_ORGANIZER', 'ORGANIZER')
   @Roles('TEAM_LEADER')
   ```
   - Файл: `src/common/decorators/roles.decorator.ts`
   - Время: 30 минут

3. **Обновить middleware аутентификации**
   - Добавить проверку прав доступа к командам
   - Время: 2 часа

**Тестирование:**
- Unit тесты для guards
- Проверка авторизации для каждой роли
- Время: 1 час

---

## Этап 2: API для управления десятками (1-2 недели)

### 2.1 Backend - Сервисы для команд (2-3 дня)

**Задачи:**

1. **Расширить TeamsService**
   - Файл: `src/teams/teams.service.ts`
   
   **Методы для добавления:**
   ```typescript
   // Создание десятка
   async createTeam(createTeamDto: CreateTeamDto, creatorId: number)
   
   // Назначение лидера
   async assignLeader(teamId: number, leaderId: number, assignerId: number)
   
   // Получение команд с фильтрацией по роли
   async getTeamsForUser(userId: number, userRole: Role)
   
   // Перемещение участника между командами
   async moveUserToTeam(userId: number, fromTeamId: number, toTeamId: number)
   
   // Получение участников команды
   async getTeamMembers(teamId: number)
   
   // Проверка прав доступа к команде
   async checkTeamAccess(userId: number, teamId: number, userRole: Role)
   ```
   - Время: 6 часов

2. **Создать DTO для команд**
   - Файл: `src/teams/dto/create-team.dto.ts`
   - Файл: `src/teams/dto/update-team.dto.ts`
   - Файл: `src/teams/dto/assign-leader.dto.ts`
   - Время: 2 часа

3. **Добавить валидацию**
   - Проверка максимального количества участников (10)
   - Проверка уникальности лидера
   - Проверка прав доступа
   - Время: 2 часа

**Тестирование:**
- Unit тесты для всех методов сервиса
- Integration тесты с базой данных
- Время: 4 часа

### 2.2 Backend - Контроллеры API (1-2 дня)

**Задачи:**

1. **Обновить TeamsController**
   - Файл: `src/teams/teams.controller.ts`
   
   **Endpoints для добавления:**
   ```typescript
   @Post()
   @Roles('SUPER_ORGANIZER', 'ORGANIZER')
   createTeam(@Body() createTeamDto: CreateTeamDto, @Request() req)
   
   @Get()
   getTeams(@Request() req, @Query() filters: GetTeamsFilterDto)
   
   @Get(':id')
   getTeam(@Param('id') id: string, @Request() req)
   
   @Patch(':id/leader')
   @Roles('SUPER_ORGANIZER', 'ORGANIZER')
   assignLeader(@Param('id') id: string, @Body() dto: AssignLeaderDto)
   
   @Post(':id/members')
   @Roles('SUPER_ORGANIZER', 'ORGANIZER', 'TEAM_LEADER')
   addMember(@Param('id') id: string, @Body() dto: AddMemberDto)
   
   @Delete(':id/members/:userId')
   @Roles('SUPER_ORGANIZER', 'ORGANIZER', 'TEAM_LEADER')
   removeMember(@Param('id') id: string, @Param('userId') userId: string)
   ```
   - Время: 4 часа

2. **Добавить Swagger документацию**
   - Описание всех endpoints
   - Примеры запросов и ответов
   - Время: 2 часа

**Тестирование:**
- E2E тесты для всех endpoints
- Проверка авторизации
- Время: 3 часа

---

## Этап 3: Интерфейс управления (2-3 недели)

### 3.1 Frontend - Обновление типов и API (1 день)

**Задачи:**

1. **Обновить типы**
   - Файл: `src/shared/types/user.ts`
   ```typescript
   export enum Role {
     SUPER_ORGANIZER = 'SUPER_ORGANIZER',
     ORGANIZER = 'ORGANIZER',
     TEAM_LEADER = 'TEAM_LEADER',
     ENTREPRENEUR = 'ENTREPRENEUR'
   }
   ```
   - Время: 30 минут

2. **Создать типы для команд**
   - Файл: `src/shared/types/team.ts`
   ```typescript
   export interface Team {
     id: number;
     name: string;
     description?: string;
     maxMembers: number;
     leaderId?: number;
     leader?: User;
     isActive: boolean;
     createdAt: string;
     members: TeamMember[];
   }
   
   export interface TeamMember {
     id: number;
     userId: number;
     teamId: number;
     user: User;
     joinedAt: string;
   }
   ```
   - Время: 1 час

3. **Создать API клиент для команд**
   - Файл: `src/shared/api/teams.ts`
   ```typescript
   export const teamsApi = {
     getTeams: (filters?: GetTeamsFilters) => api.get('/teams', { params: filters }),
     getTeam: (id: number) => api.get(`/teams/${id}`),
     createTeam: (data: CreateTeamData) => api.post('/teams', data),
     assignLeader: (teamId: number, leaderId: number) => 
       api.patch(`/teams/${teamId}/leader`, { leaderId }),
     addMember: (teamId: number, userId: number) => 
       api.post(`/teams/${teamId}/members`, { userId }),
     removeMember: (teamId: number, userId: number) => 
       api.delete(`/teams/${teamId}/members/${userId}`)
   };
   ```
   - Время: 2 часа

**Тестирование:**
- Проверка типизации
- Тестирование API вызовов
- Время: 1 час

### 3.2 Frontend - Компоненты для управления командами (3-4 дня)

**Задачи:**

1. **Создать компонент списка команд**
   - Файл: `src/entities/team/ui/teams-list.tsx`
   - Отображение карточек команд
   - Фильтрация по статусу
   - Поиск по названию
   - Время: 4 часа

2. **Создать компонент карточки команды**
   - Файл: `src/entities/team/ui/team-card.tsx`
   - Информация о команде
   - Количество участников
   - Лидер команды
   - Действия (редактировать, удалить)
   - Время: 3 часа

3. **Создать форму создания команды**
   - Файл: `src/features/team/ui/create-team-form.tsx`
   - Валидация полей
   - Обработка ошибок
   - Время: 3 часа

4. **Создать компонент управления участниками**
   - Файл: `src/features/team/ui/team-members-manager.tsx`
   - Список участников
   - Добавление/удаление участников
   - Назначение лидера
   - Время: 5 часов

**Тестирование:**
- Unit тесты для компонентов
- Тестирование пользовательских сценариев
- Время: 3 часа

### 3.3 Frontend - Страницы (2-3 дня)

**Задачи:**

1. **Обновить страницу команд для ORGANIZER**
   - Файл: `src/pages/teams/ui/organizer-teams-page.tsx`
   - Список всех команд
   - Кнопка создания команды
   - Статистика по командам
   - Время: 4 часа

2. **Создать страницу команды для TEAM_LEADER**
   - Файл: `src/pages/teams/ui/team-leader-page.tsx`
   - Информация о своей команде
   - Управление участниками
   - Планировщик встреч
   - Доска объявлений
   - Время: 6 часов

3. **Обновить страницу для ENTREPRENEUR**
   - Файл: `src/pages/teams/ui/entrepreneur-team-page.tsx`
   - Информация о своей команде
   - Контакты участников
   - Календарь мероприятий
   - Время: 3 часа

4. **Обновить роутинг**
   - Файл: `src/app/providers/router/route-config.tsx`
   - Добавить проверки ролей для страниц
   - Время: 1 час

**Тестирование:**
- E2E тесты для каждой страницы
- Проверка доступа по ролям
- Время: 4 часа

---

## Этап 4: Коммуникационные инструменты (1 неделя)

### 4.1 Backend - API для коммуникации (2-3 дня)

**Задачи:**

1. **Создать модель Announcement**
   ```prisma
   model Announcement {
     id        Int      @id @default(autoincrement())
     title     String
     content   String
     authorId  Int      @map("author_id")
     author    User     @relation(fields: [authorId], references: [id])
     teamId    Int?     @map("team_id")
     team      Team?    @relation(fields: [teamId], references: [id])
     isActive  Boolean  @default(true)
     createdAt DateTime @default(now()) @map("created_at")
     
     @@map("announcements")
   }
   ```
   - Время: 1 час

2. **Создать модель Meeting**
   ```prisma
   model Meeting {
     id          Int      @id @default(autoincrement())
     title       String
     description String?
     startTime   DateTime @map("start_time")
     endTime     DateTime @map("end_time")
     location    String?
     organizerId Int      @map("organizer_id")
     organizer   User     @relation(fields: [organizerId], references: [id])
     teamId      Int      @map("team_id")
     team        Team     @relation(fields: [teamId], references: [id])
     createdAt   DateTime @default(now()) @map("created_at")
     
     @@map("meetings")
   }
   ```
   - Время: 1 час

3. **Создать сервисы**
   - `src/announcements/announcements.service.ts`
   - `src/meetings/meetings.service.ts`
   - Время: 4 часа

4. **Создать контроллеры**
   - `src/announcements/announcements.controller.ts`
   - `src/meetings/meetings.controller.ts`
   - Время: 3 часа

**Тестирование:**
- Unit и integration тесты
- Время: 3 часа

### 4.2 Frontend - Компоненты коммуникации (2-3 дня)

**Задачи:**

1. **Создать компонент доски объявлений**
   - Файл: `src/features/announcements/ui/announcements-board.tsx`
   - Список объявлений
   - Форма создания объявления (для лидеров)
   - Время: 4 часа

2. **Создать планировщик встреч**
   - Файл: `src/features/meetings/ui/meeting-scheduler.tsx`
   - Календарь встреч
   - Форма создания встречи
   - Время: 5 часа

3. **Создать компонент обратной связи**
   - Файл: `src/features/feedback/ui/feedback-form.tsx`
   - Форма отправки обратной связи
   - История обратной связи
   - Время: 3 часа

**Тестирование:**
- Тестирование компонентов
- Время: 2 часа

---

## Этап 5: Аналитика и финализация (1-2 недели)

### 5.1 Backend - Аналитика (2-3 дня)

**Задачи:**

1. **Создать сервис аналитики**
   - Файл: `src/analytics/analytics.service.ts`
   ```typescript
   async getTeamsStatistics()
   async getTeamMetrics(teamId: number)
   async getUserActivityReport(userId: number)
   ```
   - Время: 4 часа

2. **Создать контроллер аналитики**
   - Файл: `src/analytics/analytics.controller.ts`
   - Endpoints для статистики
   - Время: 2 часа

**Тестирование:**
- Тесты аналитических запросов
- Время: 2 часа

### 5.2 Frontend - Дашборды (3-4 дня)

**Задачи:**

1. **Создать дашборд для ORGANIZER**
   - Файл: `src/pages/dashboard/ui/organizer-dashboard.tsx`
   - Статистика по всем командам
   - Графики активности
   - Время: 5 часов

2. **Создать дашборд для TEAM_LEADER**
   - Файл: `src/pages/dashboard/ui/team-leader-dashboard.tsx`
   - Метрики команды
   - Активность участников
   - Время: 4 часа

3. **Обновить дашборд для ENTREPRENEUR**
   - Добавить информацию о команде
   - Время: 2 часа

**Тестирование:**
- E2E тесты дашбордов
- Время: 3 часа

### 5.3 Финальное тестирование и оптимизация (2-3 дня)

**Задачи:**

1. **Комплексное тестирование**
   - Тестирование всех пользовательских сценариев
   - Проверка производительности
   - Время: 6 часов

2. **Оптимизация производительности**
   - Оптимизация запросов к БД
   - Кэширование
   - Время: 4 часа

3. **Исправление багов**
   - Время: 4 часа

4. **Документация**
   - Обновление README
   - API документация
   - Время: 2 часа

---

## Критерии готовности

### Backend
- ✅ Все миграции применены успешно
- ✅ Все API endpoints работают корректно
- ✅ Покрытие тестами > 80%
- ✅ Swagger документация актуальна
- ✅ Авторизация работает для всех ролей

### Frontend
- ✅ Все страницы отображаются корректно
- ✅ Роутинг работает с проверкой ролей
- ✅ Формы валидируются
- ✅ Обработка ошибок реализована
- ✅ Адаптивная верстка

### Интеграция
- ✅ Frontend корректно взаимодействует с Backend
- ✅ Все пользовательские сценарии работают
- ✅ Производительность соответствует требованиям

---

## Риски и митигация

### Технические риски
1. **Конфликты миграций БД**
   - Митигация: Тестирование на копии продакшн БД

2. **Проблемы производительности**
   - Митигация: Мониторинг запросов, индексы БД

3. **Ошибки авторизации**
   - Митигация: Комплексное тестирование ролей

### Временные риски
1. **Превышение временных рамок**
   - Митигация: Еженедельные ретроспективы, корректировка планов

2. **Блокирующие зависимости**
   - Митигация: Параллельная разработка, моки для тестирования

---

## Заключение

Данный план обеспечивает поэтапную реализацию системы управления десятками без региональной системы. Каждый этап включает конкретные задачи, временные рамки и критерии готовности, что позволяет контролировать прогресс и качество разработки.

**Ключевые особенности плана:**
- Упрощенная архитектура без модели Region
- Четкое разделение ответственности между ролями
- Поэтапное тестирование на каждом уровне
- Возможность параллельной разработки фронтенда и бэкенда
- Гибкость для будущих расширений