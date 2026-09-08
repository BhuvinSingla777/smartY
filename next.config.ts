import type { NextConfig } from 'next';
import { loadAppEnv } from './src/lib/env';

loadAppEnv();

const nextConfig: NextConfig = {
  serverExternalPackages: [
    '@prisma/client',
    'prisma',
    'pdf-parse',
    'mammoth',
    'xlsx',
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
};

export default nextConfig;
