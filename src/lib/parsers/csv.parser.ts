import * as Papa from 'papaparse';
import { FileFormat, ParseResult, ParsedSheet, uniquifyHeaders } from '@/lib/shared';
import { FileParser } from './file-parser.interface';

export class CsvParser implements FileParser {
  readonly formats: FileFormat[] = ['CSV'];

  canParse(format: FileFormat): boolean {
    return format === 'CSV';
  }

  async parse(buffer: Buffer, fileName: string): Promise<ParseResult> {
    const text = buffer.toString('utf-8');
    const parsed = Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false,
    });

    const headers = uniquifyHeaders(parsed.meta.fields ?? []);
    const rows = parsed.data
      .map((row) => {
        const originalKeys = parsed.meta.fields ?? [];
        const next: Record<string, unknown> = {};
        originalKeys.forEach((key, idx) => {
          next[headers[idx] ?? key] = row[key];
        });
        return next;
      })
      .filter((row) =>
        Object.values(row).some((v) => String(v ?? '').trim() !== ''),
      );

    const sheet: ParsedSheet = {
      name: fileName.replace(/\.[^.]+$/, '') || 'Sheet1',
      headers,
      rows,
    };

    const warnings = (parsed.errors ?? []).map(
      (e) => `CSV parse warning row ${e.row ?? '?'}: ${e.message}`,
    );

    return {
      format: 'CSV',
      sheets: [sheet],
      warnings,
      rawText: text.slice(0, 5000),
    };
  }
}
