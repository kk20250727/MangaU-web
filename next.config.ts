import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "manba-storage-production.s3-ap-northeast-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "uploads.mangadex.org",
      },
    ],
  },
};

export default nextConfig;
