import { NextRequest, NextResponse } from 'next/server';
import { jsonError } from '@/lib/http';
import { parsePodsQuery } from '@/lib/query';
import { podsService } from '@/lib/services/pods.service';
import { domainOverall } from '@/lib/shared';

export const runtime = 'nodejs';

function toCsv(rows: Array<Record<string, unknown>>, headers: string[]) {
  return [
    headers.join(','),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const v = r[h];
          const s = v === null || v === undefined ? '' : String(v);
          return `"${s.replace(/"/g, '""')}"`;
        })
        .join(','),
    ),
  ].join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const query = parsePodsQuery(request);
    const format = request.nextUrl.searchParams.get('format') ?? 'csv';
    const rows = await podsService.exportAll(query);
    const flatRows = (rows as Array<Record<string, unknown>>).map((row) => ({
      ...row,
      fastApiCompletion: domainOverall(row.domainCompletions, 'fastApi'),
      nodeCompletion: domainOverall(row.domainCompletions, 'node'),
      dotnetCompletion: domainOverall(row.domainCompletions, 'dotnet'),
    }));

    if (format === 'xlsx') {
      const XLSX = await import('xlsx');
      const sheet = XLSX.utils.json_to_sheet(flatRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, sheet, 'PODS');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="pods-export.xlsx"',
        },
      });
    }

    const headers = [
      'name',
      'status',
      'startDate',
      'developers',
      'machineOwner',
      'machineAlignedToProject',
      'branch',
      'fastApiCompletion',
      'nodeCompletion',
      'dotnetCompletion',
      'feCompletion',
      'beCompletion',
      'integrationCompletion',
      'overallCompletion',
      'updatedAt',
    ];
    const csv = toCsv(flatRows, headers);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="pods-export.csv"',
      },
    });
  } catch (err) {
    return jsonError(err);
  }
}
