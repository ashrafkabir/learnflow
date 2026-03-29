/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOTE: We run as a normal Next server in dev/prod. Static export is incompatible
  // with middleware (and we rely on middleware for stable dev HEAD / health probes).
  eslint: {
    // Root uses flat config; Next's internal ESLint runner still passes legacy flags.
    // Skip during build to avoid failing on invalid options.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
