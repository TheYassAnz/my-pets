-- AlterTable
ALTER TABLE "Animal" ADD COLUMN     "photoUrl" TEXT;

-- CreateIndex
CREATE INDEX "Animal_ownerId_idx" ON "Animal"("ownerId");
