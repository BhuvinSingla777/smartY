import { NextResponse } from 'next/server';
import { ApiError } from '@/lib/errors';

export function jsonError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json(
      {
        statusCode: err.status,
        message: err.message,
        timestamp: new Date().toISOString(),
      },
      { status: err.status },
    );
  }

  const message = err instanceof Error ? err.message : 'An unexpected error occurred';
  console.error(err);
  return NextResponse.json(
    {
      statusCode: 500,
      message,
      timestamp: new Date().toISOString(),
    },
    { status: 500 },
  );
}

export async function handleApi<T>(fn: () => Promise<T>) {
  try {
    const data = await fn();
    return NextResponse.json(data);
  } catch (err) {
    return jsonError(err);
  }
}

export async function parseSingleFile(request: Request): Promise<UploadedFile> {
  const form = await request.formData();
  const rawFile = form.get('file');
  if (!(rawFile instanceof File)) {
    throw new ApiError(400, 'file is required');
  }
  return {
    originalname: rawFile.name,
    mimetype: rawFile.type || 'application/octet-stream',
    size: rawFile.size,
    buffer: Buffer.from(await rawFile.arrayBuffer()),
  };
}

export function searchParamsToRecord(url: URL): Record<string, string> {
  const result: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

export function numParam(value: string | null, fallback?: number) {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export type UploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

export async function parseMultipartFile(request: Request): Promise<{
  file: UploadedFile;
  reportModule: 'BDG' | 'PODS';
}> {
  const form = await request.formData();
  const rawFile = form.get('file');
  const moduleValue = String(form.get('module') ?? '');

  if (!(rawFile instanceof File)) {
    throw new ApiError(400, 'file is required');
  }
  if (moduleValue !== 'BDG' && moduleValue !== 'PODS') {
    throw new ApiError(400, 'module is required (BDG or PODS)');
  }

  const buffer = Buffer.from(await rawFile.arrayBuffer());
  return {
    file: {
      originalname: rawFile.name,
      mimetype: rawFile.type || 'application/octet-stream',
      size: rawFile.size,
      buffer,
    },
    reportModule: moduleValue,
  };
}
