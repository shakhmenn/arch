# План доработки системы управления задачами до уровня современных таск-менеджеров

## 1. Анализ текущего состояния

### 1.1 Существующий функционал

**Модель Task (Prisma схема):**
- ✅ Базовые поля: id, title, description, status, dueDate, type
- ✅ Связи: creator, assignee, team, parentTask, subtasks, comments
- ✅ Временные метки: createdAt, updatedAt
- ✅ Индексы для производительности

**Enum'ы:**
- TaskStatus: PENDING, IN_PROGRESS, DONE (3 статуса)
- TaskType: PERSONAL, TEAM (2 типа)

**API endpoints:**
- POST /tasks - создание задачи
- GET /tasks - получение списка задач
- PATCH /tasks/:id/status - обновление статуса

**Текущие возможности:**
- ✅ Создание личных и командных задач
- ✅ Назначение исполнителя
- ✅ Подзадачи (parentTaskId)
- ✅ Комментарии к задачам
- ✅ Уведомления
- ✅ Контроль доступа по ролям

### 1.2 Ограничения текущей системы

❌ **Отсутствует:**
1. Приоритеты задач
2. Теги/метки
3. Вложение файлов
4. Расширенные статусы
5. Зависимости между задачами
6. Временное планирование (startDate, estimatedHours)
7. Прогресс выполнения (%)
8. Шаблоны задач
9. Повторяющиеся задачи
10. Активность и история изменений
11. Фильтрация и сортировка
12. Канбан доски
13. Календарное представление
14. Отчеты и аналитика

## 2. Анализ современных таск-менеджеров

### 2.1 Ключевые функции Asana

**Управление задачами:**
- Приоритеты (Low, Medium, High, Urgent)
- Теги и пользовательские поля
- Вложения файлов и изображений
- Подзадачи с неограниченной вложенностью
- Зависимости задач (блокирующие/заблокированные)
- Временные рамки (start date, due date, estimated time)
- Прогресс выполнения

**Представления:**
- Список задач
- Канбан доски
- Календарь
- Временная шкала (Gantt)
- Дашборд с аналитикой

**Коллаборация:**
- Комментарии с упоминаниями (@user)
- Проверка задач (approval workflow)
- Уведомления в реальном времени
- История активности

### 2.2 Дополнительные функции других систем

**Jira:**
- Пользовательские типы задач (Bug, Feature, Story)
- Workflow с настраиваемыми статусами
- Связи между задачами (relates to, blocks, duplicates)

**Trello:**
- Простые канбан доски
- Чек-листы внутри задач
- Power-ups (интеграции)

**Monday.com:**
- Пользовательские поля разных типов
- Автоматизация workflow
- Временное отслеживание

## 3. План доработки системы

### 3.1 Фаза 1: Расширение базовой модели (Высокий приоритет)

#### 3.1.1 Обновление схемы Prisma

**Новые enum'ы:**
```prisma
enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TaskStatus {
  BACKLOG
  TODO
  IN_PROGRESS
  IN_REVIEW
  DONE
  CANCELLED
}

enum AttachmentType {
  IMAGE
  DOCUMENT
  VIDEO
  OTHER
}
```

**Расширение модели Task:**
```prisma
model Task {
  // Существующие поля...
  
  // Новые поля
  priority        TaskPriority @default(MEDIUM)
  startDate       DateTime?    @map("start_date")
  estimatedHours  Int?         @map("estimated_hours")
  actualHours     Int?         @map("actual_hours")
  progress        Int          @default(0) // 0-100%
  
  // Новые связи
  attachments     TaskAttachment[]
  tags            TaskTag[]
  dependencies    TaskDependency[] @relation("DependentTask")
  dependents      TaskDependency[] @relation("BlockingTask")
  activities      TaskActivity[]
  
  @@index([priority, dueDate])
  @@index([progress, status])
}
```

**Новые модели:**
```prisma
model TaskAttachment {
  id          Int            @id @default(autoincrement())
  filename    String
  originalName String        @map("original_name")
  mimeType    String         @map("mime_type")
  size        Int
  url         String
  type        AttachmentType
  uploadedAt  DateTime       @default(now()) @map("uploaded_at")
  
  taskId      Int            @map("task_id")
  task        Task           @relation(fields: [taskId], references: [id], onDelete: Cascade)
  uploadedBy  Int            @map("uploaded_by")
  uploader    User           @relation(fields: [uploadedBy], references: [id])
  
  @@map("task_attachments")
}

model Tag {
  id          Int       @id @default(autoincrement())
  name        String    @unique
  color       String?   // HEX color
  createdAt   DateTime  @default(now()) @map("created_at")
  
  tasks       TaskTag[]
  
  @@map("tags")
}

model TaskTag {
  taskId      Int       @map("task_id")
  tagId       Int       @map("tag_id")
  
  task        Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)
  tag         Tag       @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@id([taskId, tagId])
  @@map("task_tags")
}

model TaskDependency {
  id              Int      @id @default(autoincrement())
  dependentTaskId Int      @map("dependent_task_id")
  blockingTaskId  Int      @map("blocking_task_id")
  createdAt       DateTime @default(now()) @map("created_at")
  
  dependentTask   Task     @relation("DependentTask", fields: [dependentTaskId], references: [id], onDelete: Cascade)
  blockingTask    Task     @relation("BlockingTask", fields: [blockingTaskId], references: [id], onDelete: Cascade)
  
  @@unique([dependentTaskId, blockingTaskId])
  @@map("task_dependencies")
}

model TaskActivity {
  id          Int      @id @default(autoincrement())
  action      String   // "created", "updated", "status_changed", "assigned", etc.
  oldValue    String?
  newValue    String?
  description String?
  createdAt   DateTime @default(now()) @map("created_at")
  
  taskId      Int      @map("task_id")
  task        Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  userId      Int      @map("user_id")
  user        User     @relation(fields: [userId], references: [id])
  
  @@index([taskId, createdAt])
  @@map("task_activities")
}
```

#### 3.1.2 Обновление API

**Новые DTO:**
```typescript
// create-task.dto.ts - расширение
export class CreateTaskDto {
  // Существующие поля...
  
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;
  
  @IsOptional()
  @IsDateString()
  startDate?: string;
  
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedHours?: number;
  
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
  
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  dependsOn?: number[]; // ID задач, от которых зависит
}

// update-task.dto.ts - новый
export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;
  
  @IsOptional()
  @IsString()
  description?: string;
  
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;
  
  @IsOptional()
  @IsDateString()
  startDate?: string;
  
  @IsOptional()
  @IsDateString()
  dueDate?: string;
  
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;
  
  @IsOptional()
  @IsInt()
  assigneeId?: number;
  
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

// filter-tasks.dto.ts - новый
export class FilterTasksDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
  
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;
  
  @IsOptional()
  @IsInt()
  assigneeId?: number;
  
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
  
  @IsOptional()
  @IsDateString()
  dueDateFrom?: string;
  
  @IsOptional()
  @IsDateString()
  dueDateTo?: string;
  
  @IsOptional()
  @IsString()
  search?: string;
  
  @IsOptional()
  @IsString()
  sortBy?: 'dueDate' | 'priority' | 'createdAt' | 'title';
  
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
```

**Новые endpoints:**
```typescript
// tasks.controller.ts - расширение
@Controller('tasks')
export class TasksController {
  // Существующие методы...
  
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
    @User() user
  ) {
    return this.tasks.update(id, dto, user);
  }
  
  @Delete(':id')
  delete(
    @Param('id', ParseIntPipe) id: number,
    @User() user
  ) {
    return this.tasks.delete(id, user);
  }
  
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @User() user
  ) {
    return this.tasks.findOne(id, user);
  }
  
  @Post('filter')
  filter(
    @Body() dto: FilterTasksDto,
    @User() user
  ) {
    return this.tasks.filter(dto, user);
  }
  
  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  uploadAttachment(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @User() user
  ) {
    return this.tasks.uploadAttachment(id, file, user);
  }
  
  @Delete(':id/attachments/:attachmentId')
  deleteAttachment(
    @Param('id', ParseIntPipe) id: number,
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
    @User() user
  ) {
    return this.tasks.deleteAttachment(id, attachmentId, user);
  }
  
  @Get(':id/activity')
  getActivity(
    @Param('id', ParseIntPipe) id: number,
    @User() user
  ) {
    return this.tasks.getActivity(id, user);
  }
}
```

### 3.2 Фаза 2: Файловая система и хранилище (Высокий приоритет)

#### 3.2.1 Настройка файлового хранилища

**Варианты реализации:**
1. **Локальное хранилище** (для MVP)
   - Папка `/uploads/tasks/`
   - Multer для загрузки
   - Serve static files через Express

2. **Облачное хранилище** (для продакшена)
   - AWS S3 / Google Cloud Storage
   - Presigned URLs для безопасности
   - CDN для быстрой доставки

**Конфигурация Multer:**
```typescript
// multer.config.ts
export const multerConfig = {
  dest: './uploads/tasks',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Неподдерживаемый тип файла'), false);
    }
  }
};
```

### 3.3 Фаза 3: Расширенные представления (Средний приоритет)

#### 3.3.1 Канбан доски

**Новые endpoints:**
```typescript
@Get('kanban')
getKanban(@User() user, @Query() filters: FilterTasksDto) {
  return this.tasks.getKanbanBoard(user, filters);
}

@Patch(':id/move')
moveTask(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: MoveTaskDto,
  @User() user
) {
  return this.tasks.moveTask(id, dto, user);
}
```

**DTO для перемещения:**
```typescript
export class MoveTaskDto {
  @IsEnum(TaskStatus)
  newStatus: TaskStatus;
  
  @IsOptional()
  @IsInt()
  position?: number; // позиция в колонке
}
```

#### 3.3.2 Календарное представление

```typescript
@Get('calendar')
getCalendar(
  @Query('start') start: string,
  @Query('end') end: string,
  @User() user
) {
  return this.tasks.getCalendarView(start, end, user);
}
```

### 3.4 Фаза 4: Аналитика и отчеты (Низкий приоритет)

#### 3.4.1 Дашборд метрик

```typescript
@Get('analytics')
getAnalytics(
  @Query('period') period: 'week' | 'month' | 'quarter',
  @User() user
) {
  return this.tasks.getAnalytics(period, user);
}
```

**Метрики для отслеживания:**
- Количество задач по статусам
- Среднее время выполнения
- Загрузка по исполнителям
- Тренды по приоритетам
- Процент выполнения в срок

### 3.5 Фаза 5: Автоматизация (Низкий приоритет)

#### 3.5.1 Шаблоны задач

```prisma
model TaskTemplate {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  priority    TaskPriority @default(MEDIUM)
  estimatedHours Int?
  tags        String[] // JSON array
  createdBy   Int
  creator     User     @relation(fields: [createdBy], references: [id])
  createdAt   DateTime @default(now())
  
  @@map("task_templates")
}
```

#### 3.5.2 Повторяющиеся задачи

```prisma
model RecurringTask {
  id          Int      @id @default(autoincrement())
  templateId  Int
  template    TaskTemplate @relation(fields: [templateId], references: [id])
  cronPattern String   // "0 9 * * 1" - каждый понедельник в 9:00
  isActive    Boolean  @default(true)
  lastRun     DateTime?
  nextRun     DateTime
  
  @@map("recurring_tasks")
}
```

## 4. Интеграция с существующими системами

### 4.1 Связь с системой метрик

**Автоматическое создание задач на основе метрик:**
- Если метрика не достигает цели → создать задачу на улучшение
- Связать задачи с конкретными метриками для отслеживания влияния

```prisma
model Task {
  // Существующие поля...
  
  // Связь с метриками
  relatedMetricId Int? @map("related_metric_id")
  relatedMetric   MetricDefinition? @relation(fields: [relatedMetricId], references: [id])
}
```

### 4.2 Связь с системой команд

**Расширение командных задач:**
- Задачи проекта (project-level tasks)
- Спринты и итерации
- Роли в проекте (Project Manager, Developer, etc.)

## 5. План реализации по этапам

### Этап 1 (2-3 недели): Базовые улучшения
1. ✅ Расширение модели Task (приоритеты, временные рамки, прогресс)
2. ✅ Обновление API (CRUD операции, фильтрация)
3. ✅ Система тегов
4. ✅ История активности

### Этап 2 (2-3 недели): Файлы и вложения
1. ✅ Настройка файлового хранилища
2. ✅ API для загрузки/удаления файлов
3. ✅ Модель TaskAttachment
4. ✅ Валидация типов файлов

### Этап 3 (2-3 недели): Зависимости и связи
1. ✅ Модель TaskDependency
2. ✅ API для управления зависимостями
3. ✅ Валидация циклических зависимостей
4. ✅ Автоматическое обновление статусов

### Этап 4 (3-4 недели): Представления
1. ✅ Канбан доска API
2. ✅ Календарное представление
3. ✅ Фильтрация и сортировка
4. ✅ Поиск по задачам

### Этап 5 (2-3 недели): Аналитика
1. ✅ Базовые метрики
2. ✅ Отчеты по производительности
3. ✅ Экспорт данных

### Этап 6 (3-4 недели): Автоматизация
1. ✅ Шаблоны задач
2. ✅ Повторяющиеся задачи
3. ✅ Уведомления и напоминания
4. ✅ Интеграция с метриками

## 6. Технические требования

### 6.1 Backend изменения

**Новые зависимости:**
```json
{
  "@nestjs/platform-express": "^10.0.0",
  "multer": "^1.4.5-lts.1",
  "@types/multer": "^1.4.7",
  "cron": "^3.1.6",
  "@nestjs/schedule": "^4.0.0"
}
```

**Новые модули:**
- TasksModule (расширение)
- AttachmentsModule
- TagsModule
- AnalyticsModule
- TemplatesModule

### 6.2 Frontend изменения (для tfc-client)

**Новые компоненты:**
- TaskCard (расширенная)
- KanbanBoard
- TaskCalendar
- FileUploader
- TagSelector
- TaskFilters
- TaskAnalytics

**Новые страницы:**
- /tasks/kanban
- /tasks/calendar
- /tasks/analytics
- /tasks/templates

### 6.3 База данных

**Миграции:**
1. Добавление новых полей в Task
2. Создание новых таблиц (TaskAttachment, Tag, TaskTag, etc.)
3. Обновление индексов
4. Миграция данных (если нужно)

## 7. Риски и ограничения

### 7.1 Технические риски
- **Производительность**: Большое количество связей может замедлить запросы
- **Хранилище**: Файлы могут занимать много места
- **Сложность**: Увеличение сложности кодовой базы

### 7.2 Пользовательские риски
- **Обучение**: Пользователям нужно будет изучить новый функционал
- **Миграция**: Существующие задачи нужно будет адаптировать

### 7.3 Решения
- **Кэширование**: Redis для часто запрашиваемых данных
- **Пагинация**: Для больших списков задач
- **Постепенное внедрение**: Поэтапный релиз функций
- **Документация**: Подробные инструкции для пользователей

## 8. Заключение

Данный план позволит превратить базовую систему задач в полноценный таск-менеджер уровня Asana. Ключевые преимущества:

1. **Масштабируемость**: Архитектура поддерживает рост функционала
2. **Гибкость**: Модульная структура позволяет добавлять функции по мере необходимости
3. **Производительность**: Правильные индексы и оптимизация запросов
4. **Пользовательский опыт**: Современный интерфейс с множественными представлениями

Рекомендуется начать с Этапа 1 и постепенно внедрять остальные функции на основе обратной связи пользователей.