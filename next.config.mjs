/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Handle mapbox-gl properly
    config.resolve.alias = {
      ...config.resolve.alias,
      'mapbox-gl': 'mapbox-gl/dist/mapbox-gl.js'
    }
    
    return config
  },
  transpilePackages: ['mapbox-gl'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
