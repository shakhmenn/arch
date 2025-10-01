/*
  Warnings:

  - You are about to drop the column `period_end` on the `metric_values` table. All the data in the column will be lost.
  - You are about to drop the column `period_start` on the `metric_values` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,metric_definition_id,period_type,period_date]` on the table `metric_values` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `change_type` to the `metric_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `period_date` to the `metric_values` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MetricChangeType" AS ENUM ('CORRECTION', 'UPDATE', 'REVISION');

-- DropIndex
DROP INDEX "metric_values_metric_definition_id_period_start_idx";

-- DropIndex
DROP INDEX "metric_values_user_id_metric_definition_id_period_start_per_key";

-- DropIndex
DROP INDEX "metric_values_user_id_period_start_idx";

-- AlterTable
ALTER TABLE "metric_history" ADD COLUMN     "change_type" "MetricChangeType" NOT NULL;

-- AlterTable
ALTER TABLE "metric_values" DROP COLUMN "period_end",
DROP COLUMN "period_start",
ADD COLUMN     "period_date" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "addresses" TEXT,
ADD COLUMN     "user_age" INTEGER,
ADD COLUMN     "user_name" TEXT,
ADD COLUMN     "website" TEXT,
ADD COLUMN     "work_instagram" TEXT,
ADD COLUMN     "work_phone" TEXT,
ADD COLUMN     "work_schedule" TEXT,
ADD COLUMN     "work_telegram" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "birth_date" TIMESTAMP(3),
ADD COLUMN     "hobbies" TEXT,
ADD COLUMN     "patronymic" TEXT,
ADD COLUMN     "personal_instagram" TEXT,
ADD COLUMN     "personal_phone" TEXT,
ADD COLUMN     "personal_telegram" TEXT,
ADD COLUMN     "surname" TEXT,
ADD COLUMN     "years_in_business" INTEGER;

-- CreateIndex
CREATE INDEX "metric_history_change_type_changed_at_idx" ON "metric_history"("change_type", "changed_at");

-- CreateIndex
CREATE INDEX "metric_values_user_id_period_date_idx" ON "metric_values"("user_id", "period_date");

-- CreateIndex
CREATE INDEX "metric_values_metric_definition_id_period_date_idx" ON "metric_values"("metric_definition_id", "period_date");

-- CreateIndex
CREATE UNIQUE INDEX "metric_values_user_id_metric_definition_id_period_type_peri_key" ON "metric_values"("user_id", "metric_definition_id", "period_type", "period_date");
