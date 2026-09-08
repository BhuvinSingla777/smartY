-- CreateTable
CREATE TABLE "pod_tasks" (
    "id" TEXT NOT NULL,
    "podId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "section" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "sourceFile" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pod_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pod_tasks_podId_idx" ON "pod_tasks"("podId");

-- CreateIndex
CREATE INDEX "pod_tasks_podId_status_idx" ON "pod_tasks"("podId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "pod_tasks_podId_number_key" ON "pod_tasks"("podId", "number");

-- AddForeignKey
ALTER TABLE "pod_tasks" ADD CONSTRAINT "pod_tasks_podId_fkey" FOREIGN KEY ("podId") REFERENCES "pods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
