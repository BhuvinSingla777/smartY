import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReportModule } from '@prisma/client';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { UploadsService, VERCEL_SAFE_UPLOAD_MB } from '../src/modules/uploads/uploads.service';
import { ParserService } from '../src/parsers/parser.service';

describe('UploadsService (Vercel in-memory)', () => {
  const created: unknown[] = [];
  const prisma = {
    upload: {
      create: jest.fn(async ({ data }: { data: unknown }) => {
        created.push(data);
        return { id: 'u1', ...(data as object) };
      }),
    },
  };
  const parser = {
    detect: jest.fn(() => 'XLSX'),
  };
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'MAX_UPLOAD_SIZE_MB') return String(VERCEL_SAFE_UPLOAD_MB);
      return undefined;
    }),
  };

  const service = new UploadsService(
    prisma as never,
    parser as unknown as ParserService,
    config as unknown as ConfigService,
  );

  const makeFile = (size: number, name = 'report.xlsx'): Express.Multer.File =>
    ({
      fieldname: 'file',
      originalname: name,
      encoding: '7bit',
      mimetype:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size,
      buffer: Buffer.alloc(size, 1),
      destination: '',
      filename: name,
      path: '',
      stream: undefined as never,
    }) as Express.Multer.File;

  beforeEach(() => {
    created.length = 0;
    jest.clearAllMocks();
  });

  it(`caps max size at ${VERCEL_SAFE_UPLOAD_MB} MB`, () => {
    expect(service.getMaxMb()).toBe(VERCEL_SAFE_UPLOAD_MB);
    expect(service.getMaxBytes()).toBe(VERCEL_SAFE_UPLOAD_MB * 1024 * 1024);
  });

  it('stores metadata only with memory:// marker (no disk write)', async () => {
    const before = fs.readdirSync(os.tmpdir());
    const upload = await service.create(
      makeFile(2048, 'pods.xlsx'),
      ReportModule.PODS,
    );
    const after = fs.readdirSync(os.tmpdir());

    expect(upload.storedName).toMatch(/^memory:\/\//);
    expect(String(upload.storedName)).toContain('pods.xlsx');
    expect(prisma.upload.create).toHaveBeenCalledTimes(1);
    // No new temp files from this call
    expect(after.length).toBe(before.length);
    // Ensure we never wrote under process cwd uploads/
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const names = fs.readdirSync(uploadsDir);
      expect(names.some((n) => n.includes('pods.xlsx'))).toBe(false);
    }
  });

  it('rejects files over the Vercel-safe limit', async () => {
    const oversized = makeFile(VERCEL_SAFE_UPLOAD_MB * 1024 * 1024 + 1);
    await expect(
      service.create(oversized, ReportModule.BDG),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.upload.create).not.toHaveBeenCalled();
  });

  it('rejects empty buffers', async () => {
    const empty = makeFile(0);
    empty.buffer = Buffer.alloc(0);
    await expect(
      service.create(empty, ReportModule.BDG),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
