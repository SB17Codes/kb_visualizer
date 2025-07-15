/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Handle mapbox-gl properly
    config.resolve.alias = {
      ...config.resolve.alias,
      'mapbox-gl': 'mapbox-gl/dist/mapbox-gl.js'
    }
    
    // Ignore mapbox-gl on server-side
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        'mapbox-gl': 'mapbox-gl',
        'react-mapbox-gl': 'react-mapbox-gl'
      })
    }
    
    return config
  },
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
