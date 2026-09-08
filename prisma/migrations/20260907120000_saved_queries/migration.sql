-- CreateTable
CREATE TABLE "saved_queries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "module" "ReportModule" NOT NULL DEFAULT 'PODS',
    "search" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT '',
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_queries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_queries_module_idx" ON "saved_queries"("module");

-- CreateIndex
CREATE INDEX "saved_queries_name_idx" ON "saved_queries"("name");
