/*
  Warnings:

  - Made the column `name` on table `Study` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Study" ALTER COLUMN "name" SET NOT NULL;
