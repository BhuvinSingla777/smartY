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
    });
    return { ...result, importJobId: importJob.id };
  });
}
