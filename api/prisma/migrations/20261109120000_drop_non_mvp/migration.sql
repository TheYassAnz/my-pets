-- DropForeignKey
ALTER TABLE "HouseholdMember" DROP CONSTRAINT "HouseholdMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "Routine" DROP CONSTRAINT "Routine_animalId_fkey";

-- DropForeignKey
ALTER TABLE "TaskLog" DROP CONSTRAINT "TaskLog_routineId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_animalId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_ownerId_fkey";

-- DropTable
DROP TABLE "HouseholdMember";

-- DropTable
DROP TABLE "Routine";

-- DropTable
DROP TABLE "TaskLog";

-- DropTable
DROP TABLE "Document";

