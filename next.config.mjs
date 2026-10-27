/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/writing/ztap-restart-continuity",
        destination: "/writing/ztap-native-policy-persistent-enforcement",
        permanent: true,
      },
      {
        source: "/writing/ztap-with-a-smaller-surface",
        destination: "/writing/ztap-native-policy-persistent-enforcement",
        permanent: true,
      },
    ];
  },
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
