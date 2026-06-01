/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}

module.exports = nextConfig
