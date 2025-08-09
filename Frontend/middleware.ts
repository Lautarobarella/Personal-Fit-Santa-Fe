import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  // Add security headers for PWA
  const response = NextResponse.next()

  // Headers de seguridad básicos
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "origin-when-cross-origin")

  // Headers para HTTPS
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

  // Headers CORS para webhooks de Mercado Pago
  if (request.nextUrl.pathname.startsWith('/api/webhook/mercadopago')) {
    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icon-192x192.png|icon-512x512.png).*)"],
}
