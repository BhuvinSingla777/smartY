import * as XLSX from 'xlsx';
import { FileFormat, ParseResult, ParsedSheet, uniquifyHeaders } from '@/lib/shared';
import { FileParser } from './file-parser.interface';
import { matrixToParsedSheet } from './workbook-layout';

export class ExcelParser implements FileParser {
  readonly formats: FileFormat[] = ['XLS', 'XLSX'];

  canParse(format: FileFormat): boolean {
    return format === 'XLS' || format === 'XLSX';
  }

  async parse(buffer: Buffer): Promise<ParseResult> {
    const workbook = XLSX.read(buffer, {
      type: 'buffer',
      cellDates: false,
      raw: true,
    });

    const sheets: ParsedSheet[] = [];
    const warnings: string[] = [];

    for (const name of workbook.SheetNames) {
      const sheet = workbook.Sheets[name];
      if (!sheet) continue;

      const matrix = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
        header: 1,
        defval: null,
        raw: true,
        blankrows: false,
      });

      if (matrix.length === 0) {
        warnings.push(`Sheet "${name}" is empty`);
        continue;
      }

      const parsed = matrixToParsedSheet(name, matrix);
      if (parsed && parsed.headers.length > 0) {
        sheets.push(parsed);
        continue;
      }

      const headerRow = matrix[0] ?? [];
      const headers = uniquifyHeaders(
        headerRow.map((h, idx) => {
          const label = h === null || h === undefined ? '' : String(h).trim();
          return label || `Column_${idx + 1}`;
        }),
      );
      sheets.push({
        name,
        headers,
        rows: matrix.slice(1).map((raw) => {
          const obj: Record<string, unknown> = {};
          headers.forEach((header, c) => {
            obj[header] = raw[c] ?? null;
          });
          return obj;
        }),
      });
    }

    return { format: 'XLSX', sheets, warnings };
  }
}
