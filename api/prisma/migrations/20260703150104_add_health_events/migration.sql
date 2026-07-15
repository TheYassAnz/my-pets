-- CreateEnum
CREATE TYPE "HealthEventType" AS ENUM ('VACCINE', 'TREATMENT', 'VISIT');

-- CreateTable
CREATE TABLE "HealthEvent" (
    "id" TEXT NOT NULL,
    "type" "HealthEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dosage" TEXT,
    "vet" TEXT,
    "notes" TEXT,
    "nextDueDate" TIMESTAMP(3),
    "animalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HealthEvent_animalId_idx" ON "HealthEvent"("animalId");

-- CreateIndex
CREATE INDEX "HealthEvent_nextDueDate_idx" ON "HealthEvent"("nextDueDate");

-- AddForeignKey
ALTER TABLE "HealthEvent" ADD CONSTRAINT "HealthEvent_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
