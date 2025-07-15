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
  // These ESM packages contain `window`, `document`, and worker code that
  // must be transpiled for both webpack & the edge runtime.
  transpilePackages: ['mapbox-gl', 'react-mapbox-gl'],
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
