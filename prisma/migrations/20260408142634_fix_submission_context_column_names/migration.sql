/*
  Warnings:

  - You are about to drop the column `division_at_submission` on the `submissions` table. All the data in the column will be lost.
  - You are about to drop the column `housing_society_name_at_submission` on the `submissions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "submissions" DROP COLUMN "division_at_submission",
DROP COLUMN "housing_society_name_at_submission",
ADD COLUMN     "divisionAtSubmission" TEXT,
ADD COLUMN     "housingSocietyNameAtSubmission" TEXT;
