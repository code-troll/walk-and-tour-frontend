import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "frame-src",
              "'self'",
              "https://www.youtube.com",
              "https://www.youtube-nocookie.com",
              "https://player.vimeo.com",
              "https://www.instagram.com",
              "https://instagram.com",
              "https://www.tiktok.com",
              "https://tiktok.com",
              "https://www.google.com",
              "https://maps.google.com",
              "https://challenges.cloudflare.com",
              "https://app.turitop.com",
              "https://www.turitop.com",
              "https://turitop.com",
              "https://walkandtour.dk",
              "https://www.walkandtour.dk",
            ].join(" "),
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
