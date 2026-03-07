"use client"

import { Grid, List } from "lucide-react"

export function ViewSelector({ view, onViewChange }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
      <button
        onClick={() => onViewChange("table")}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
        style={{
          background: view === "table" ? "var(--color-primary)" : "transparent",
          color: view === "table" ? "white" : "var(--color-foreground-muted)",
        }}
      >
        <List className="h-3.5 w-3.5" />
        Tabla
      </button>
      <button
        onClick={() => onViewChange("cards")}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
        style={{
          background: view === "cards" ? "var(--color-primary)" : "transparent",
          color: view === "cards" ? "white" : "var(--color-foreground-muted)",
        }}
      >
        <Grid className="h-3.5 w-3.5" />
        Cards
      </button>
    </div>
  )
}
