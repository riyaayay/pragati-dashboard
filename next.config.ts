import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Turbopack persistent cache to prevent disk-full crashes
  turbo: {
    memoryLimit: 512 * 1024 * 1024,
  },
};

export default nextConfig;
