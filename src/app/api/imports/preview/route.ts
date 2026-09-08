import { handleApi, parseMultipartFile } from '@/lib/http';
import { importsService } from '@/lib/services/imports.service';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  return handleApi(async () => {
    const { file, reportModule } = await parseMultipartFile(request);
    return importsService.previewFromFile(file, reportModule);
  });
}
