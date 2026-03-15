import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
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
              "https://app.turitop.com",
              "https://www.turitop.com",
              "https://turitop.com",
              "https://walkandtour.dk",
              "https://www.walkandtour.dk",
              "https://staging.walkandtour.dk",
            ].join(" "),
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {protocol: "https", hostname: "static.wixstatic.com"},
      {protocol: "https", hostname: "static.parastorage.com"},
      {protocol: "https", hostname: "img.wixstatic.com"},
    ],
  },
};

export default withNextIntl(nextConfig);
