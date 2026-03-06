import { Poppins, Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
  display: "swap",
})

export const metadata = {
  title: "NutriSystem - Plan Nutricional Personalizado",
  description: "Sistema de planificación nutricional con cálculo de requerimientos calóricos",
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${poppins.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="antialiased font-body">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
