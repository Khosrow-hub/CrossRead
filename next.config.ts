import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: "crossread",
  project: "javascript-nextjs",
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
});