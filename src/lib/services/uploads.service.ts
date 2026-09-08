import { FileFormat, ReportModule, UploadStatus } from '@prisma/client';
import * as path from 'path';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/errors';
import { parserService } from '@/lib/parsers/parser.service';
import {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
} from '@/lib/parsers/file-parser.interface';
import type { UploadedFile } from '@/lib/http';

function getUploadDir() {
  if (process.env.VERCEL) {
    return '/tmp/uploads';
  }
  return path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? './uploads');
}

<<<<<<< HEAD:src/lib/services/uploads.service.ts
export class UploadsService {
  private readonly maxBytes =
    Number(process.env.MAX_UPLOAD_SIZE_MB ?? 20) * 1024 * 1024;

  private get uploadDir() {
    const dir = getUploadDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  async create(file: UploadedFile, module: ReportModule, userId?: string | null) {
=======
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
>>>>>>> 97be95e123299086db26dee4524914b5379ba179:apps/api/src/modules/uploads/uploads.service.ts
    if (!file) {
      throw new ApiError(400, 'No file uploaded');
    }
    if (!file.buffer?.length) {
      throw new BadRequestException(
        'Empty file buffer. Uploads must be processed in memory.',
      );
    }
    if (file.size > this.maxBytes) {
<<<<<<< HEAD:src/lib/services/uploads.service.ts
      throw new ApiError(
        400,
        `File exceeds maximum size of ${this.maxBytes / (1024 * 1024)} MB`,
=======
      throw new BadRequestException(
        `File exceeds maximum size of ${this.maxMb} MB (Vercel limit). Compress or split the report.`,
>>>>>>> 97be95e123299086db26dee4524914b5379ba179:apps/api/src/modules/uploads/uploads.service.ts
      );
    }

    const sanitized = this.sanitizeFilename(file.originalname);
    const ext = sanitized.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new ApiError(
        400,
        'Invalid file type. Supported formats: CSV, XLS, XLSX, DOC, DOCX, PDF.',
      );
    }
    if (
      file.mimetype &&
      !ALLOWED_MIME_TYPES.has(file.mimetype) &&
      file.mimetype !== 'application/octet-stream'
    ) {
      throw new ApiError(
        400,
        `Invalid MIME type: ${file.mimetype}. Supported formats: CSV, XLS, XLSX, DOC, DOCX, PDF.`,
      );
    }

<<<<<<< HEAD:src/lib/services/uploads.service.ts
    const format = parserService.detect(sanitized, file.mimetype || '');
    const storedName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${sanitized}`;
    const fullPath = path.join(this.uploadDir, storedName);
    fs.writeFileSync(fullPath, file.buffer);

    return prisma.upload.create({
=======
    const format = this.parser.detect(sanitized, file.mimetype || '');
    // Metadata-only token — file bytes are never persisted on the serverless FS.
    const storedName = `memory://${Date.now()}-${sanitized}`;

    return this.prisma.upload.create({
>>>>>>> 97be95e123299086db26dee4524914b5379ba179:apps/api/src/modules/uploads/uploads.service.ts
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
      prisma.upload.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.upload.count(),
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
    const upload = await prisma.upload.findUnique({
      where: { id },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
        imports: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!upload) throw new ApiError(404, 'Upload not found');
    return upload;
  }

  getMaxBytes() {
    return this.maxBytes;
  }

<<<<<<< HEAD:src/lib/services/uploads.service.ts
  readFile(storedName: string): Buffer {
    const fullPath = this.getFilePath(storedName);
    if (!fs.existsSync(fullPath)) {
      throw new ApiError(404, 'Uploaded file missing on disk');
    }
    return fs.readFileSync(fullPath);
=======
  getMaxMb() {
    return this.maxMb;
>>>>>>> 97be95e123299086db26dee4524914b5379ba179:apps/api/src/modules/uploads/uploads.service.ts
  }

  private sanitizeFilename(name: string): string {
    const base = path.basename(name).replace(/[^\w.\- ()[\]]+/g, '_');
    return base.slice(0, 180) || 'upload.bin';
  }
}

export const uploadsService = new UploadsService();
