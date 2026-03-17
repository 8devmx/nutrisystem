"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "@/hooks/useAuth"

// ── Theme Context ────────────────────────────────────────────────────────────

const ThemeContext = createContext({
  theme: "system",
  setTheme: () => {},
  resolvedTheme: "light",
})

export function useTheme() {
  return useContext(ThemeContext)
}

function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("system")
  const [resolvedTheme, setResolvedTheme] = useState("light")

  useEffect(() => {
    const stored = localStorage.getItem("nutri-theme") ?? "system"
    setThemeState(stored)
  }, [])

  useEffect(() => {
    const root = document.documentElement

    const applyTheme = (t) => {
      const isDark =
        t === "dark" ||
        (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
      root.classList.toggle("dark", isDark)
      setResolvedTheme(isDark ? "dark" : "light")
    }

    applyTheme(theme)

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)")
      const handler = () => applyTheme("system")
      mq.addEventListener("change", handler)
      return () => mq.removeEventListener("change", handler)
    }
  }, [theme])

  const setTheme = (t) => {
    localStorage.setItem("nutri-theme", t)
    setThemeState(t)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// ── Toast Context ──────────────────────────────────────────────────────────

const ToastContext = createContext(null)

export function useToast() {
  return useContext(ToastContext)
}

const ICONS = {
  success: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="#16A34A" fillOpacity="0.15" stroke="#16A34A" strokeWidth="1.5"/>
      <path d="M5 8l2 2 4-4" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="#DC2626" fillOpacity="0.15" stroke="#DC2626" strokeWidth="1.5"/>
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2L14.5 13H1.5L8 2z" fill="#F59E0B" fillOpacity="0.15" stroke="#F59E0B" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M8 6v3M8 11v.5" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="#3B82F6" fillOpacity="0.15" stroke="#3B82F6" strokeWidth="1.5"/>
      <path d="M8 7v4M8 5v.5" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
}

const COLORS = {
  success: { border: "#16A34A40", text: "#15803D" },
  error:   { border: "#DC262640", text: "#B91C1C" },
  warning: { border: "#F59E0B40", text: "#B45309" },
  info:    { border: "#3B82F640", text: "#1D4ED8" },
}

function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null
  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        maxWidth: "380px",
        width: "100%",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            padding: "12px 14px",
            borderRadius: "10px",
            border: `1px solid ${COLORS[t.type].border}`,
            background: "var(--color-surface)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            pointerEvents: "all",
            animation: "toast-in 0.2s ease",
          }}
        >
          <span style={{ flexShrink: 0, marginTop: "1px" }}>{ICONS[t.type]}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            {t.title && (
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: COLORS[t.type].text, lineHeight: 1.4 }}>
                {t.title}
              </p>
            )}
            {t.message && (
              <p style={{ margin: t.title ? "2px 0 0" : 0, fontSize: "12px", color: "var(--color-foreground-muted)", lineHeight: 1.5 }}>
                {t.message}
              </p>
            )}
          </div>
          <button
            onClick={() => onRemove(t.id)}
            style={{
              flexShrink: 0,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px",
              color: "var(--color-foreground-muted)",
              lineHeight: 1,
              fontSize: "16px",
              opacity: 0.6,
            }}
          >
            ×
          </button>
        </div>
      ))}
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback(({ type = "info", title, message, duration = 4000 }) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, type, title, message }])
    if (duration > 0) setTimeout(() => remove(id), duration)
  }, [remove])

  // Atajos
  toast.success = (message, title)        => toast({ type: "success", title, message })
  toast.error   = (message, title)        => toast({ type: "error",   title, message, duration: 6000 })
  toast.warning = (message, title)        => toast({ type: "warning", title, message })
  toast.info    = (message, title)        => toast({ type: "info",    title, message })

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  )
}

// ── React Query ──────────────────────────────────────────────────────────────

export function Providers({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60 * 1000 } },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
