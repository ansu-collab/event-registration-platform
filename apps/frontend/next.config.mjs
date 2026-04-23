/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
    NEXT_PUBLIC_EVENT_START_DATE: process.env.NEXT_PUBLIC_EVENT_START_DATE ?? '2026-07-01',
    NEXT_PUBLIC_EVENT_DAYS: process.env.NEXT_PUBLIC_EVENT_DAYS ?? '7',
  },
};

export default nextConfig;
