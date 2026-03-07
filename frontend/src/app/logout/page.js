"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { authApi } from "@/lib/api"

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    const logout = async () => {
      try {
        await authApi.logout()
      } catch (error) {
        console.error("Logout error:", error)
      } finally {
        router.push("/login")
      }
    }

    logout()
  }, [router])

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--color-surface)",
    }}>
      <div style={{
        textAlign: "center",
        color: "var(--color-foreground-muted)",
      }}>
        <div style={{
          width: "48px",
          height: "48px",
          border: "3px solid var(--color-border)",
          borderTopColor: "var(--color-primary)",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto 1rem",
        }} />
        <p>Cerrando sesión...</p>
      </div>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
