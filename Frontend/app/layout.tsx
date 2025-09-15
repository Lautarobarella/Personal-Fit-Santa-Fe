import { ZoomPrevention } from "@/components/providers/zoom-prevention"
import { ServiceWorkerRegistration } from "@/components/service-worker-registration"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { ActivityProvider } from "@/contexts/activity-provider"
import { AttendanceProvider } from "@/contexts/attendance-provider"
import { AuthProvider } from "@/contexts/auth-provider"
import { NotificationsProvider } from "@/contexts/notifications-provider"
import { PaymentProvider } from "@/contexts/payment-provider"
import { SettingsProvider } from "@/contexts/settings-provider"
import "@/styles/globals.css"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import type React from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PERSONAL FIT",
  description: "Professional personal training management platform with role-based access",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PERSONAL FIT Santa Fe",
  },
  generator: 'v0.dev'
}

export const viewport: Viewport = {
  themeColor: "#FF7A30", // Color primario de la nueva paleta
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: "cover", // Para PWA con notch
  interactiveWidget: "resizes-content"
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        
        {/* Meta tags para comportamiento nativo en PWA empaquetada */}
        <meta name="application-name" content="PERSONAL FIT" />
        <meta name="msapplication-TileColor" content="#FF6000" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="theme-color" content="#FF6000" />
        
        {/* Prevenir que el sistema fuerce estilos */}
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        
        {/* Configuraciones específicas para TWA (Trusted Web Activity) */}
        <link rel="manifest" href="/twa-manifest.json" />
        <meta name="mobile-web-app-title" content="PERSONAL FIT" />
        <meta name="application-url" content="https://personalfitsantafe.com" />
        <meta name="msapplication-starturl" content="/" />
        <meta name="full-screen" content="yes" />
        <meta name="browsermode" content="application" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <SettingsProvider>
              <PaymentProvider>
                <ActivityProvider>
                  <AttendanceProvider>
                    <NotificationsProvider>
                      <div className="min-h-screen flex justify-center bg-background">
                        <div className="w-full max-w-md mx-auto relative">
                          {children}
                        </div>
                      </div>
                      <ServiceWorkerRegistration />
                      <ZoomPrevention />
                      <Toaster />
                    </NotificationsProvider>
                  </AttendanceProvider>
                </ActivityProvider>
              </PaymentProvider>
            </SettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
