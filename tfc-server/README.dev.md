# TFC Server - Development Guide

## 🚀 Quick Start (Recommended for Development)

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- npm

### Setup
```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL in Docker
npm run db:up

# 3. Generate Prisma client and run migrations
npm run db:generate
npm run db:migrate

# 4. Start the application locally
npm run start:dev
```

### One-command start
```bash
npm run dev
```

## 📊 Database Management

```bash
# Start database
npm run db:up

# Stop database
npm run db:down

# Reset database (removes all data)
npm run db:reset

# Run migrations
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio
```

## 🔧 Development Workflow

1. **Database**: Runs in Docker container
2. **Application**: Runs locally with hot reload
3. **Benefits**:
   - Fast development cycle
   - Easy debugging
   - Isolated database environment

## 📡 API Endpoints

- `GET /users` - Get all users
- `POST /users` - Create user
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Example requests:
```bash
# Create user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}'

# Get all users
curl http://localhost:3000/users
```

## 🐳 Full Docker Setup (Optional)

If you prefer to run everything in Docker:
```bash
docker-compose up --build
```

## 🗄️ Database Connection

- **Host**: localhost
- **Port**: 5432
- **Database**: tfc_db
- **Username**: postgres
- **Password**: postgres123

npm run db:up      # Запустить базу
npm run db:down    # Остановить базу
npm run db:reset   # Сбросить все данные
npm run db:migrate # Применить миграции
npm run db:studio  # Открыть Prisma Studio
npm run dev        # Всё сразу: база + генерация + запуск
