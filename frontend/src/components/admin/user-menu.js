"use client"

import { useState, useRef, useEffect } from "react"
import { User, LogOut } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { getUser as getStoredUser } from "@/lib/api"

const MENU_ITEMS = [
  { label: "Mi perfil",     icon: User,   href: "/admin/profile", danger: false },
  { label: "Cerrar sesión", icon: LogOut, href: "/logout",        danger: true  },
]

export default function UserMenu() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const ref = useRef(null)

  const storedUser = typeof window !== 'undefined' ? getStoredUser() : null
  const displayUser = user || storedUser

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const getInitials = (name) => name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?"

  return (
    <div ref={ref} className="relative">

      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 cursor-pointer transition-all duration-150"
        style={{ color: "var(--color-foreground)" }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--color-surface-raised)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
          style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}
        >
          {displayUser ? getInitials(displayUser.name) : "A"}
        </div>
        <span className="text-sm font-medium hidden sm:block" style={{ color: "var(--color-foreground)" }}>
          {displayUser?.name || "Admin"}
        </span>
        <svg
          className="h-3.5 w-3.5 transition-transform duration-200 hidden sm:block"
          style={{
            color:     "var(--color-foreground-muted)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-48 rounded-xl border overflow-hidden z-50"
          style={{
            background:  "var(--color-surface)",
            borderColor: "var(--color-border)",
            boxShadow:   "var(--shadow-lg)",
          }}
        >
          <div
            className="px-4 py-3 border-b"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface-raised)" }}
          >
            <p className="text-xs font-semibold" style={{ color: "var(--color-foreground)" }}>{displayUser?.name || "Admin"}</p>
            <p className="text-[11px]" style={{ color: "var(--color-foreground-muted)" }}>{displayUser?.email || "admin@nutrisystem.com"}</p>
          </div>

          <div className="py-1">
            {MENU_ITEMS.map(({ label, icon: Icon, href, danger }) => (
              <a
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors duration-150"
                style={{ color: danger ? "var(--color-destructive)" : "var(--color-foreground-muted)", textDecoration: "none" }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = danger ? "var(--color-destructive)" + "10" : "var(--color-surface-raised)"
                  e.currentTarget.style.color      = danger ? "var(--color-destructive)" : "var(--color-foreground)"
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "transparent"
                  e.currentTarget.style.color      = danger ? "var(--color-destructive)" : "var(--color-foreground-muted)"
                }}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium">{label}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
