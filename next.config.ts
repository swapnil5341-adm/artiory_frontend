import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
  },

  outputFileTracingRoot: path.resolve(__dirname),


  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn-icons-png.flaticon.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "**.ggpht.com" },
      { protocol: "https", hostname: "videos.pexels.com" },
      { protocol: "https", hostname: "pub-bb695c125dd64e8f9aa98e1627add3b2.r2.dev" },
    ],
  },

};

export default nextConfig;
