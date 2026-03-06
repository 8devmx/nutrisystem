"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Users, UtensilsCrossed, CalendarDays,
  ChevronLeft, ChevronRight, LayoutDashboard, Leaf,
} from "lucide-react"

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin",       icon: LayoutDashboard, exact: true },
  { label: "Usuarios",  href: "/admin/users", icon: Users },
  { label: "Alimentos", href: "/admin/foods", icon: UtensilsCrossed },
  { label: "Planes",    href: "/admin/plans", icon: CalendarDays },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const isActive = (item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)

  return (
    <aside
      className={`
        relative flex flex-col h-screen border-r flex-shrink-0
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-16" : "w-56"}
      `}
      style={{
        background:  "var(--color-surface)",
        borderColor: "var(--color-border)",
        boxShadow:   "var(--shadow-sm)",
      }}
    >
      {/* ── Logo ── */}
      <div
        className={`flex items-center gap-3 px-4 py-5 border-b ${collapsed ? "justify-center" : ""}`}
        style={{ borderColor: "var(--color-border)" }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--color-primary)", boxShadow: "var(--shadow-xs)" }}
        >
          <Leaf className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p
              className="font-heading font-semibold text-sm leading-tight"
              style={{ color: "var(--color-foreground)" }}
            >
              NutriSystem
            </p>
            <p className="text-[10px]" style={{ color: "var(--color-foreground-muted)" }}>
              Admin Panel
            </p>
          </div>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item)
          return (
            <Link key={item.href} href={item.href}>
              <div
                title={collapsed ? item.label : undefined}
                className={`
                  flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer
                  transition-all duration-200 group
                  ${collapsed ? "justify-center" : ""}
                `}
                style={{
                  background: active ? "var(--color-primary-light)" : "transparent",
                  color:      active ? "var(--color-primary)"       : "var(--color-foreground-muted)",
                  fontWeight: active ? 600 : 400,
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "var(--color-surface-raised)"
                    e.currentTarget.style.color      = "var(--color-foreground)"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent"
                    e.currentTarget.style.color      = "var(--color-foreground-muted)"
                  }
                }}
              >
                <item.icon
                  className="h-4 w-4 flex-shrink-0 transition-colors duration-200"
                  style={{ color: active ? "var(--color-primary)" : "var(--color-foreground-subtle)" }}
                />
                {!collapsed && (
                  <span className="text-sm truncate">{item.label}</span>
                )}
                {active && !collapsed && (
                  <div
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--color-primary)" }}
                  />
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* ── Collapse toggle ── */}
      <div
        className="px-2 py-3 border-t"
        style={{ borderColor: "var(--color-border)" }}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expandir menú" : "Colapsar menú"}
          className="w-full flex items-center justify-center rounded-xl p-2 cursor-pointer transition-all duration-200"
          style={{ color: "var(--color-foreground-muted)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-surface-raised)"
            e.currentTarget.style.color      = "var(--color-foreground)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent"
            e.currentTarget.style.color      = "var(--color-foreground-muted)"
          }}
        >
          {collapsed
            ? <ChevronRight className="h-4 w-4" />
            : <ChevronLeft  className="h-4 w-4" />
          }
        </button>
      </div>
    </aside>
  )
}
