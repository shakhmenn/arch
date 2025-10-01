-- CreateEnum
CREATE TYPE "MetricDirection" AS ENUM ('HIGHER_IS_BETTER', 'LOWER_IS_BETTER');

-- AlterTable
ALTER TABLE "metric_definitions" ADD COLUMN     "direction" "MetricDirection" NOT NULL DEFAULT 'HIGHER_IS_BETTER';
