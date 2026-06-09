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
      // Prevención de chunks obsoletos: forzamos que los DOCUMENTOS HTML siempre
      // se revaliden con el servidor. Así, tras un deploy que regenera el buildId
      // y los hashes de los chunks, el navegador (y cualquier proxy que respete
      // estos headers) trae el HTML nuevo con referencias válidas en lugar de
      // servir HTML cacheado que apunta a chunks ya borrados.
      //
      // El patrón excluye /_next/static y /_next/image (assets inmutables con su
      // propio Cache-Control de 1 año) y cualquier ruta con extensión de archivo
      // (.png, .json, .js, .ico, etc.), de modo que SOLO afecta a las rutas de
      // página (/, /dashboard, /clients, ...).
      {
        source: '/((?!_next/static|_next/image|.*\\.).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, must-revalidate',
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
