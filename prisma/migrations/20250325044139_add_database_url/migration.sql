/*
  Warnings:

  - You are about to drop the column `points` on the `FocusSession` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[studyId]` on the table `FocusSession` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `focusTime` to the `FocusSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FocusSession" DROP COLUMN "points",
ADD COLUMN     "focusTime" INTEGER NOT NULL,
ADD COLUMN     "pausedTime" TIMESTAMP(3),
ADD COLUMN     "totalPoints" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "FocusSession_studyId_key" ON "FocusSession"("studyId");
