import { NextRequest } from 'next/server';
import { handleApi } from '@/lib/http';
import { podsService } from '@/lib/services/pods.service';
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
    };
    if (!body.sheet?.headers || !Array.isArray(body.sheet.rows)) {
      throw new ApiError(400, 'sheet with headers and rows is required');
    }
    return podsService.upsertFromSheet(
      body.sheet,
      body.selectedIndexes,
      body.sheets,
      body.defaultBranch,
    );
  });
}
