import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'self' https://japanopenpoker.com https://*.japanopenpoker.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
