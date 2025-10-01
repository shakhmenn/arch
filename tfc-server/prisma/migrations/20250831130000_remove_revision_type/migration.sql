/*
  Warnings:

  - The values [REVISION] on the enum `MetricChangeType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MetricChangeType_new" AS ENUM ('CORRECTION', 'UPDATE');
ALTER TABLE "metric_history" ALTER COLUMN "change_type" TYPE "MetricChangeType_new" USING ("change_type"::text::"MetricChangeType_new");
ALTER TYPE "MetricChangeType" RENAME TO "MetricChangeType_old";
ALTER TYPE "MetricChangeType_new" RENAME TO "MetricChangeType";
DROP TYPE "MetricChangeType_old";
COMMIT;