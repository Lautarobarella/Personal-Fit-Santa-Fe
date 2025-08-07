/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone',
  // Habilitar SWC para mejor rendimiento
  experimental: {
    swcMinify: true,
  },
  // Configuración para evitar warnings
  webpack: (config, { isServer }) => {
    // Suprimir warnings de webpack
    config.infrastructureLogging = {
      level: 'error',
    }
    
    // Configuración para evitar warnings de módulos
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    
    return config
  },
}

export default nextConfig
