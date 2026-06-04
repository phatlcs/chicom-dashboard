/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  async rewrites() {
    return [
      { source: '/april', destination: '/april.html' },
      { source: '/q1', destination: '/q1.html' },
    ]
  },
}

module.exports = nextConfig
