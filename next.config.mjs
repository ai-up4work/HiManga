/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  skipTrailingSlashRedirect: true, // ✅ fixes dot in dynamic routes on Vercel
  
  // ✅ PWA Headers (makes install prompt visible)
  async headers() {
    return [
      {
        // Serve manifest.json properly
        source: '/manifest.json',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json' },
          { key: 'Cache-Control', value: 'public, max-age=0' }
        ]
      },
      {
        // Service worker - no cache, always fresh
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache' },
          { key: 'Service-Worker-Allowed', value: '/' }
        ]
      }
    ];
  },
};

export default nextConfig;