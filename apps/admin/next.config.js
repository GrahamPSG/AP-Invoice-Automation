/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  transpilePackages: ['@paris/shared'],
  env: {
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3001',
  },
};

module.exports = nextConfig;