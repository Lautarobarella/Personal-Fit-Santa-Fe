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
  // Strip debug-level console calls (log/info/debug) from production bundles.
  // Errors and warnings are preserved: they are the only frontend logs that
  // should reach Docker stdout (server-side) or browser devtools (client-side).
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },
  // Configuración para archivos estáticos en Docker
  trailingSlash: false,
  
  // Configuración para servir archivos .well-known correctamente
  async headers() {
    return [
      {
        source: '/.well-known/assetlinks.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
      },
    ]
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
