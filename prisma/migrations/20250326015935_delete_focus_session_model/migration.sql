/*
  Warnings:

  - You are about to drop the column `points` on the `Study` table. All the data in the column will be lost.
  - You are about to drop the `FocusSession` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FocusSession" DROP CONSTRAINT "FocusSession_studyId_fkey";

-- AlterTable
ALTER TABLE "Study" DROP COLUMN "points",
ADD COLUMN     "focusStartTime" TIMESTAMP(3),
ADD COLUMN     "focusTargetTime" INTEGER,
ADD COLUMN     "totalPoints" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "FocusSession";
