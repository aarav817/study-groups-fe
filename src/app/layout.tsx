import type { ReactNode } from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Source_Serif_4 } from "next/font/google"
import "./globals.css"

import { AuthProvider } from "@/lib/AuthContext"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { AppShell } from "@/components/app-shell"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "locked in.",
    template: "%s · locked in.",
  },
  description: "A simple study platform to boost your focus.",
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable} bg-background`}>
      <body className="antialiased">
        <AuthProvider>
          <TooltipProvider>
            <AppShell>{children}</AppShell>
            <Toaster position="top-right" />
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
