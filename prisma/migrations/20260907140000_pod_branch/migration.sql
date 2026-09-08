-- AlterTable
ALTER TABLE "pods" ADD COLUMN "branch" TEXT;

-- CreateIndex
CREATE INDEX "pods_branch_idx" ON "pods"("branch");
