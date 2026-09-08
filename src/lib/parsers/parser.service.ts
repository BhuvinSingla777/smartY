import { FileFormat, ParseResult } from '@/lib/shared';
import { ApiError } from '@/lib/errors';
import { FileParser, detectFormat } from './file-parser.interface';
import { CsvParser } from './csv.parser';
import { ExcelParser } from './excel.parser';
import { WordParser } from './word.parser';
import { PdfParser } from './pdf.parser';

export class ParserService {
  private readonly parsers: FileParser[] = [
    new CsvParser(),
    new ExcelParser(),
    new WordParser(),
    new PdfParser(),
  ];

  detect(fileName: string, mimeType: string): FileFormat {
    const format = detectFormat(fileName, mimeType);
    if (!format) {
      throw new ApiError(
        400,
        'Invalid file type. Supported formats: CSV, XLS, XLSX, DOC, DOCX, PDF.',
      );
    }
    return format;
  }

  async parse(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<ParseResult> {
    const format = this.detect(fileName, mimeType);
    const parser = this.parsers.find((p) => p.canParse(format, mimeType));
    if (!parser) {
      throw new ApiError(400, `No parser available for ${format}`);
    }
    try {
      const result = await parser.parse(buffer, fileName);
      return { ...result, format };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to parse uploaded file';
      throw new ApiError(400, message);
    }
  }
}

export const parserService = new ParserService();
