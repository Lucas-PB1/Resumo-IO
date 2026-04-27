import type { Metadata, Viewport } from "next"
import "./globals.css"
import { AuthProvider } from "@/features/auth/hooks/useAuth"

export const viewport: Viewport = {
  themeColor: "#7a8fa1",
  width: "device-width",
  initialScale: 1,
}

export const metadata: Metadata = {
  title: {
    default: "Resume IO | Gerador de Currículos Profissionais",
    template: "%s | Resume IO",
  },
  description:
    "Crie currículos profissionais e modernos em minutos com o Resume IO. A plataforma definitiva para gestão de modelos e documentos.",
  keywords: [
    "currículo",
    "cv builder",
    "resume",
    "templates",
    "carreira",
    "profissional",
  ],
  authors: [{ name: "Resume IO Team" }],
  creator: "Resume IO",
  publisher: "Resume IO",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Resume IO | Gerador de Currículos Profissionais",
    description: "Crie currículos profissionais e modernos em minutos.",
    url: "https://resume-io-demo.vercel.app", // Placeholder
    siteName: "Resume IO",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Resume IO | Gerador de Currículos Profissionais",
    description: "Crie currículos profissionais e modernos em minutos.",
    creator: "@resumeio",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="bg-background text-foreground flex min-h-full flex-col font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
