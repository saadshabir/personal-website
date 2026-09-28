/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === "production",
  },
  // Next.js 16 uses Turbopack by default
  turbopack: {
    root: process.cwd(),
  },
  // Compression
  compress: true,
  // Power optimizations
  poweredByHeader: false,
};

export default nextConfig;
