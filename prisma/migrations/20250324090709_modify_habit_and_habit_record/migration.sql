/*
  Warnings:

  - You are about to drop the column `isActive` on the `Habit` table. All the data in the column will be lost.
  - You are about to drop the column `isChecked` on the `HabitRecord` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Habit" DROP COLUMN "isActive";

-- AlterTable
ALTER TABLE "HabitRecord" DROP COLUMN "isChecked",
ALTER COLUMN "recordDate" SET DEFAULT CURRENT_TIMESTAMP;
