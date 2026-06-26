/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    // Allow webpack to bundle the pdfjs worker as a module
    config.module.rules.push({
      test: /pdf\.worker(\.min)?\.mjs$/,
      type: 'asset/resource',
      generator: { filename: 'static/worker/[hash][ext][query]' },
    });
    return config;
  },
};

export default nextConfig;
