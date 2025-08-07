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
  // Configuración para evitar prerendering de páginas dinámicas
  experimental: {
    // Evitar prerendering de páginas que usan React Query
    workerThreads: false,
    cpus: 1,
  },
}

export default nextConfig
