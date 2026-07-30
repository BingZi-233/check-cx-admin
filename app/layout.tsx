import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

import "./globals.css"

// 正文用 Inter + 系统中文栈（见 globals.css 的 --font-sans）。
// 以前 --font-sans 绑的是 JetBrains Mono，整站正文都是等宽拉丁字体，
// 中文全部 fallback 到系统字体，中英混排的字宽和基线对不齐。
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

// 等宽只留给 API Key、endpoint、JSON、auth_user_id 这类需要对齐的内容
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "check-cx Admin",
  description: "check-cx 后台管理控制台",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable}`}
    >
      <body className="antialiased">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
