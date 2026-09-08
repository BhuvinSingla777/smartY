import { NextRequest, NextResponse } from 'next/server';
import { jsonError } from '@/lib/http';
import { bdgService } from '@/lib/services/bdg.service';
import { parseBdgQuery } from '@/lib/query';

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
    const query = parseBdgQuery(request);
    const format = request.nextUrl.searchParams.get('format') ?? 'csv';
    const rows = await bdgService.exportAll(query);

    if (format === 'xlsx') {
      const XLSX = await import('xlsx');
      const sheet = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, sheet, 'BDG');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="bdg-export.xlsx"',
        },
      });
    }

    const headers = [
      'memberName',
      'totalInbound',
      'totalOutbound',
      'totalLeads',
      'apacTotal',
      'menaTotal',
      'internationalTotal',
      'ukeuTotal',
      'naTotal',
      'updatedAt',
    ];
    const csv = toCsv(rows as Array<Record<string, unknown>>, headers);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="bdg-export.csv"',
      },
    });
  } catch (err) {
    return jsonError(err);
  }
}
