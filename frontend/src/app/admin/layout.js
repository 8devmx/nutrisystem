"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminSidebar from "@/components/admin/sidebar"
import ThemeSelector from "@/components/admin/theme-selector"
import UserMenu from "@/components/admin/user-menu"
import { isAuthenticated } from "@/lib/api"

function AdminContent({ children }) {
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--color-background)" }}
    >
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        <header
          className="flex items-center justify-between px-6 py-3 flex-shrink-0 border-b"
          style={{
            background:  "var(--color-surface)",
            borderColor: "var(--color-border)",
            boxShadow:   "var(--shadow-xs)",
          }}
        >
          <p
            className="text-xs font-medium"
            style={{ color: "var(--color-foreground-muted)" }}
          >
            Sistema de gestión nutricional
          </p>

          <div className="flex items-center gap-3">
            <ThemeSelector />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
    } else {
      setLoading(false)
    }
  }, [router])

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-surface)",
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: "3px solid var(--color-border)",
          borderTopColor: "var(--color-primary)",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }} />
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return <AdminContent>{children}</AdminContent>
}
