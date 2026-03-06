"use client"

import { TriangleAlert } from "lucide-react"

/**
 * ConfirmDialog — modal de confirmación reutilizable
 *
 * Props:
 *   open        boolean   — si el modal está visible
 *   title       string    — título del modal
 *   description string    — descripción / advertencia
 *   confirmLabel string   — texto del botón de confirmación (default: "Eliminar")
 *   onConfirm   fn        — callback al confirmar
 *   onCancel    fn        — callback al cancelar / cerrar
 *   loading     boolean   — deshabilita botones mientras se procesa
 */
export default function ConfirmDialog({
  open,
  title       = "¿Estás seguro?",
  description = "Esta acción no se puede deshacer.",
  confirmLabel = "Eliminar",
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!open) return null

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel?.() }}
    >
      {/* Panel */}
      <div
        className="w-full max-w-sm rounded-2xl border p-6 space-y-4"
        style={{
          background:  "var(--color-surface)",
          borderColor: "var(--color-border)",
          boxShadow:   "var(--shadow-lg)",
        }}
      >
        {/* Ícono + título */}
        <div className="flex items-start gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--color-destructive)" + "15" }}
          >
            <TriangleAlert className="h-5 w-5" style={{ color: "var(--color-destructive)" }} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
              {title}
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-foreground-muted)" }}>
              {description}
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-2 pt-1">
          {/* Cancelar */}
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium border cursor-pointer transition-colors duration-150 disabled:opacity-50"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-foreground-muted)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--color-surface-raised)"; e.currentTarget.style.color = "var(--color-foreground)" }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--color-surface)";        e.currentTarget.style.color = "var(--color-foreground-muted)" }}
          >
            Cancelar
          </button>

          {/* Confirmar */}
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed text-white"
            style={{ background: "var(--color-destructive)" }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.88" }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1" }}
          >
            {loading ? "Eliminando…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
