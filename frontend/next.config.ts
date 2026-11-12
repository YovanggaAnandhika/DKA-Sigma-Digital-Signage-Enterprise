import type { NextConfig } from 'next';

const allowedDevOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  output: 'standalone',
  compress: false,
  allowedDevOrigins,
};

export default nextConfig;
