import type { Metadata } from 'next'
import { Inter, Barlow, JetBrains_Mono } from "next/font/google";
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const barlow = Barlow({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-barlow",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: 'npx create-db | Prisma Schema Editor',
  description: 'A modern schema editor for Prisma with VSCode-like features',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${barlow.variable} ${jetbrainsMono.variable} font-inter antialiased`}>
        <ThemeProvider
          defaultTheme="dark"
          storageKey="ui-theme"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
