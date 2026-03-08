import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {protocol: "https", hostname: "static.wixstatic.com"},
      {protocol: "https", hostname: "static.parastorage.com"},
      {protocol: "https", hostname: "img.wixstatic.com"},
    ],
  },
};

export default withNextIntl(nextConfig);
