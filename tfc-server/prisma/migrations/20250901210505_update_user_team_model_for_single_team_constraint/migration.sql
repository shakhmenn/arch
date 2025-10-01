/*
  Warnings:

  - The primary key for the `user_teams` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `teamId` on the `user_teams` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `user_teams` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,is_active]` on the table `user_teams` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `team_id` to the `user_teams` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `user_teams` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "user_teams" DROP CONSTRAINT "user_teams_teamId_fkey";

-- DropForeignKey
ALTER TABLE "user_teams" DROP CONSTRAINT "user_teams_userId_fkey";

-- AlterTable
ALTER TABLE "user_teams" DROP CONSTRAINT "user_teams_pkey",
DROP COLUMN "teamId",
DROP COLUMN "userId",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "left_at" TIMESTAMP(3),
ADD COLUMN     "team_id" INTEGER NOT NULL,
ADD COLUMN     "user_id" INTEGER NOT NULL,
ADD CONSTRAINT "user_teams_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "user_teams_team_id_is_active_idx" ON "user_teams"("team_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "one_active_team_per_user" ON "user_teams"("user_id", "is_active");

-- AddForeignKey
ALTER TABLE "user_teams" ADD CONSTRAINT "user_teams_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_teams" ADD CONSTRAINT "user_teams_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
