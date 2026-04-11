import { ZoomPrevention } from "@/components/providers/zoom-prevention"
import { ThemeProvider } from "@/components/theme-provider"
import { VersionChecker } from "@/components/providers/version-checker"
import { Toaster } from "@/components/ui/toaster"
import { DesktopSidebar } from "@/components/ui/desktop-sidebar"
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
  title: "PERSONAL FIT Santa Fe",
  description: "Aplicación de gestión para el centro deportivo PERSONAL FIT Santa Fe, desarrollada por Lautaro Barella y Fernando Ale",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PERSONAL FIT Santa Fe",
  },
  generator: 'lautaro-barella & fernando-ale',
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
        <meta name="mobile-web-app-title" content="PERSONAL FIT" />
        <meta name="application-url" content="https://personalfitsantafe.com" />
        <meta name="msapplication-starturl" content="/" />
        <meta name="full-screen" content="yes" />
        <meta name="browsermode" content="application" />
      </head>
      <body className={inter.className}>
        <VersionChecker />
        <ThemeProvider>
          <AuthProvider>
            <SettingsProvider>
              <PaymentProvider>
                <ActivityProvider>
                  <AttendanceProvider>
                    <NotificationsProvider>
                      <div className="min-h-screen h-[100dvh] overflow-hidden bg-background">
                        <DesktopSidebar />
                        <main className="relative h-full w-full overflow-y-auto overflow-x-hidden lg:ml-64 lg:w-[calc(100%-16rem)]">
                          {children}
                        </main>
                      </div>
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
