import { ActivityProvider } from "@/contexts/activity-provider"
import { AttendanceProvider } from "@/contexts/attendance-provider"
import { AuthProvider } from "@/contexts/auth-provider"
import { NotificationsProvider } from "@/contexts/notifications-provider"
import { PaymentProvider } from "@/contexts/payment-provider"
import { SettingsProvider } from "@/contexts/settings-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
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
  userScalable: false,
  viewportFit: "cover", // Para PWA con notch
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
