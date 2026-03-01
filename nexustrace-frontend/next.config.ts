import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Turbopack is enabled by default in Next.js 16
  // Tree shaking and optimizations are built-in
  turbopack: {},
  
  // Performance optimizations
  compress: true,
  productionBrowserSourceMaps: false,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;
