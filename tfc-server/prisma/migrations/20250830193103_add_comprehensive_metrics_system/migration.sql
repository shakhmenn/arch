/*
  Warnings:

  - You are about to drop the `metrics` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "MetricCategory" AS ENUM ('FINANCIAL', 'OPERATIONAL', 'STRATEGIC', 'CUSTOMER', 'PRODUCTIVITY');

-- CreateEnum
CREATE TYPE "MetricPeriodType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "MetricUnit" AS ENUM ('CURRENCY', 'PERCENTAGE', 'COUNT', 'RATIO', 'HOURS', 'DAYS');

-- DropForeignKey
ALTER TABLE "metrics" DROP CONSTRAINT "metrics_user_id_fkey";

-- DropTable
DROP TABLE "metrics";

-- CreateTable
CREATE TABLE "metric_definitions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "MetricCategory" NOT NULL,
    "unit" "MetricUnit" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metric_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric_values" (
    "id" SERIAL NOT NULL,
    "value" DECIMAL(15,2),
    "target_value" DECIMAL(15,2),
    "period_type" "MetricPeriodType" NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "metric_definition_id" INTEGER NOT NULL,

    CONSTRAINT "metric_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric_history" (
    "id" SERIAL NOT NULL,
    "old_value" DECIMAL(15,2),
    "new_value" DECIMAL(15,2),
    "old_target" DECIMAL(15,2),
    "new_target" DECIMAL(15,2),
    "change_reason" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "metric_value_id" INTEGER NOT NULL,

    CONSTRAINT "metric_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_contexts" (
    "id" SERIAL NOT NULL,
    "industry" TEXT,
    "business_stage" TEXT,
    "founded_year" INTEGER,
    "location" TEXT,
    "main_products" TEXT,
    "target_audience" TEXT,
    "business_model" TEXT,
    "market_size" DECIMAL(15,2),
    "competitor_count" INTEGER,
    "data_relevance_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "business_contexts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "metric_values_user_id_period_start_idx" ON "metric_values"("user_id", "period_start");

-- CreateIndex
CREATE INDEX "metric_values_metric_definition_id_period_start_idx" ON "metric_values"("metric_definition_id", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "metric_values_user_id_metric_definition_id_period_start_per_key" ON "metric_values"("user_id", "metric_definition_id", "period_start", "period_end");

-- CreateIndex
CREATE INDEX "metric_history_user_id_changed_at_idx" ON "metric_history"("user_id", "changed_at");

-- CreateIndex
CREATE INDEX "metric_history_metric_value_id_changed_at_idx" ON "metric_history"("metric_value_id", "changed_at");

-- CreateIndex
CREATE UNIQUE INDEX "business_contexts_user_id_key" ON "business_contexts"("user_id");

-- AddForeignKey
ALTER TABLE "metric_values" ADD CONSTRAINT "metric_values_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_values" ADD CONSTRAINT "metric_values_metric_definition_id_fkey" FOREIGN KEY ("metric_definition_id") REFERENCES "metric_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_history" ADD CONSTRAINT "metric_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_history" ADD CONSTRAINT "metric_history_metric_value_id_fkey" FOREIGN KEY ("metric_value_id") REFERENCES "metric_values"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_contexts" ADD CONSTRAINT "business_contexts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
