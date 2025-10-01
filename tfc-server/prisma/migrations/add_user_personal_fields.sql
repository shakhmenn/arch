-- Добавление полей для личной информации пользователя
ALTER TABLE "user_profiles" 
ADD COLUMN "user_name" TEXT,
ADD COLUMN "user_age" INTEGER;

-- Добавление комментариев для новых полей
COMMENT ON COLUMN "user_profiles"."user_name" IS 'Имя пользователя';
COMMENT ON COLUMN "user_profiles"."user_age" IS 'Возраст пользователя';