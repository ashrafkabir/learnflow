/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    // Root uses flat config; Next's internal ESLint runner still passes legacy flags.
    // Skip during build to avoid failing on invalid options.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
