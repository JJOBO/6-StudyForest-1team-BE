/*
  Warnings:

  - You are about to drop the column `points` on the `Study` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Study" DROP COLUMN "points",
ADD COLUMN     "totalPoints" INTEGER NOT NULL DEFAULT 0;
