/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jcimining.co.za',
      },
    ],
  },
};

module.exports = nextConfig;
