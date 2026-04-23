import type { NextConfig } from "next";

// iframe 埋め込み許可ドメイン。env NEXT_PUBLIC_CSP_FRAME_ANCESTORS で上書き可
// 例: "https://japanopenpoker.com https://*.japanopenpoker.com"
const frameAncestors =
  (process.env.NEXT_PUBLIC_CSP_FRAME_ANCESTORS || "").trim() ||
  "https://japanopenpoker.com https://*.japanopenpoker.com";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors 'self' ${frameAncestors}`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
