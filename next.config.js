/** @type {import('next').NextConfig} */
const nextConfig = {
  // reactStrictMode: true,
  images: {
    // SoundCloud artwork (tracks are rendered with plain <img>, but this keeps
    // next/image usable for the same host if we switch later).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.sndcdn.com",
      },
    ],
  },
};

module.exports = nextConfig;
