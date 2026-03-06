"use client"

import { useTheme } from "@/components/providers"
import { Sun, Moon, Monitor } from "lucide-react"

const OPTIONS = [
  { value: "light",  label: "Claro",   icon: Sun     },
  { value: "dark",   label: "Oscuro",  icon: Moon    },
  { value: "system", label: "Sistema", icon: Monitor },
]

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme()

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg p-0.5 border"
      style={{
        background: "var(--color-surface-raised)",
        borderColor: "var(--color-border)",
      }}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            title={label}
            aria-label={`Tema ${label}`}
            className={`
              flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium
              cursor-pointer transition-all duration-200
              ${active
                ? "bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-[var(--shadow-xs)]"
                : "text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]"
              }
            `}
          >
            <Icon className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
