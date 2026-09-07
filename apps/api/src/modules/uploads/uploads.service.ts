import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileFormat, ReportModule, UploadStatus } from '@prisma/client';
import * as path from 'path';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ParserService } from '../../parsers/parser.service';
import {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
} from '../../parsers/file-parser.interface';

/** Vercel serverless request body hard limit is ~4.5MB; stay under with headroom. */
export const VERCEL_SAFE_UPLOAD_MB = 4;

@Injectable()
export class UploadsService {
  private readonly maxBytes: number;
  private readonly maxMb: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly parser: ParserService,
    private readonly config: ConfigService,
  ) {
    const configured = Number(this.config.get('MAX_UPLOAD_SIZE_MB'));
    this.maxMb = Number.isFinite(configured) && configured > 0
      ? Math.min(configured, VERCEL_SAFE_UPLOAD_MB)
      : VERCEL_SAFE_UPLOAD_MB;
    this.maxBytes = this.maxMb * 1024 * 1024;
  }

  /**
   * Validate the in-memory file and record metadata only.
   * Does NOT write the file to disk (Vercel-safe).
   */
  async create(
    file: Express.Multer.File,
    module: ReportModule,
    userId?: string | null,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!file.buffer?.length) {
      throw new BadRequestException(
        'Empty file buffer. Uploads must be processed in memory.',
      );
    }
    if (file.size > this.maxBytes) {
      throw new BadRequestException(
        `File exceeds maximum size of ${this.maxMb} MB (Vercel limit). Compress or split the report.`,
      );
    }

    const sanitized = this.sanitizeFilename(file.originalname);
    const ext = sanitized.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new BadRequestException(
        'Invalid file type. Supported formats: CSV, XLS, XLSX, DOC, DOCX, PDF.',
      );
    }
    if (
      file.mimetype &&
      !ALLOWED_MIME_TYPES.has(file.mimetype) &&
      file.mimetype !== 'application/octet-stream'
    ) {
      throw new BadRequestException(
        `Invalid MIME type: ${file.mimetype}. Supported formats: CSV, XLS, XLSX, DOC, DOCX, PDF.`,
      );
    }

    const format = this.parser.detect(sanitized, file.mimetype || '');
    // Metadata-only token — file bytes are never persisted on the serverless FS.
    const storedName = `memory://${Date.now()}-${sanitized}`;

    return this.prisma.upload.create({
      data: {
        originalName: sanitized,
        storedName,
        mimeType: file.mimetype || 'application/octet-stream',
        format: format as FileFormat,
        sizeBytes: file.size,
        module,
        status: UploadStatus.PENDING,
        uploadedById: userId ?? null,
      },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findAll(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.prisma.upload.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.upload.count(),
    ]);
    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  async findOne(id: string) {
    const upload = await this.prisma.upload.findUnique({
      where: { id },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
        imports: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!upload) throw new NotFoundException('Upload not found');
    return upload;
  }

  getMaxBytes() {
    return this.maxBytes;
  }

  getMaxMb() {
    return this.maxMb;
  }

  private sanitizeFilename(name: string): string {
    const base = path.basename(name).replace(/[^\w.\- ()[\]]+/g, '_');
    return base.slice(0, 180) || 'upload.bin';
  }
}
