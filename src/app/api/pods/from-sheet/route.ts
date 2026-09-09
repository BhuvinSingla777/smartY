import { NextRequest } from 'next/server';
import { handleApi } from '@/lib/http';
import { podsService } from '@/lib/services/pods.service';
import { importsService } from '@/lib/services/imports.service';
import { ApiError } from '@/lib/errors';
import type { ParsedSheet } from '@/lib/shared';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return handleApi(async () => {
    const body = (await request.json()) as {
      sheet?: ParsedSheet;
      sheets?: ParsedSheet[];
      selectedIndexes?: number[];
      defaultBranch?: string | null;
      fileName?: string | null;
    };
    if (!body.sheet?.headers || !Array.isArray(body.sheet.rows)) {
      throw new ApiError(400, 'sheet with headers and rows is required');
    }
    const result = await podsService.upsertFromSheet(
      body.sheet,
      body.selectedIndexes,
      body.sheets,
      body.defaultBranch,
    );
    const importJob = await importsService.recordSheetImport({
      module: 'PODS',
      fileName: body.fileName,
      created: result.createdCount,
      updated: result.updatedCount,
      skipped: result.skippedCount,
      recordsFound: result.createdCount + result.updatedCount + result.skippedCount,
      summary: result.summary,
      sheets: body.sheets?.length ? body.sheets : body.sheet ? [body.sheet] : [],
      createdNames: result.created.map((p) => p.name),
      updatedNames: result.updated.map((p) => p.name),
      skippedRows: result.skipped.map((s) => ({
        name: s.name,
        reason: s.reason,
      })),
      dailyUpserts: result.dailyUpserts,
      podIds: [...result.created, ...result.updated].map((p) => p.id),
    });
    return { ...result, importJobId: importJob.id };
  });
}
