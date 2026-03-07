"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { api } from "@/lib/api"
import ConfirmDialog from "@/components/admin/confirm-dialog"
import { ViewSelector } from "@/components/admin/view-selector"
import {
  CalendarDays, Trash2, Eye, ChevronLeft, ChevronRight,
  User2, Flame, Beef, Clock, AlertTriangle,
} from "lucide-react"

const DURATION_META = {
  weekly:   { label: "Semanal",   color: "#3B82F6", days: 7  },
  biweekly: { label: "Quincenal", color: "#8B5CF6", days: 14 },
  monthly:  { label: "Mensual",   color: "#16A34A", days: 30 },
}

export default function AdminPlans() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deletingId, setDeletingId]   = useState(null)
  const [deleting, setDeleting]       = useState(false)
  const [view, setView]               = useState("table")

  useEffect(() => { fetchPlans() }, [page])

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/v1/admin/plans?page=${page}`)
      setPlans(response.data.data || response.data)
      setTotalPages(response.data.last_page || 1)
      setTotal(response.data.total || 0)
    } catch (error) {
      console.error("Error fetching plans:", error)
    } finally {
      setLoading(false)
    }
  }

  const askDelete = (id) => {
    setDeletingId(id)
    setConfirmOpen(true)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/v1/plans/${deletingId}`)
      setConfirmOpen(false)
      fetchPlans()
    } catch (error) {
      alert(error.message || "Error al eliminar plan")
    } finally {
      setDeleting(false)
      setDeletingId(null)
    }
  }

  // ── Estilos compartidos ──
  const S = {
    surface:    { background: "var(--color-surface)",       borderColor: "var(--color-border)" },
    raised:     { background: "var(--color-surface-raised)" },
    divider:    { borderColor: "var(--color-border)" },
    textMain:   { color: "var(--color-foreground)" },
    textMuted:  { color: "var(--color-foreground-muted)" },
    textSubtle: { color: "var(--color-foreground-subtle)" },
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold" style={S.textMain}>Planes nutricionales</h1>
          <p className="text-sm mt-0.5" style={S.textMuted}>
            {total > 0 ? `${total} planes en el sistema` : "Gestiona y edita los planes por usuario"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewSelector view={view} onViewChange={setView} />
          <Link href="/admin/plans/new">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors duration-150 text-white"
              style={{ background: "var(--color-primary)" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--color-primary-hover)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--color-primary)"}
            >
              <CalendarDays className="h-4 w-4" /> Nuevo plan
            </button>
          </Link>
        </div>
      </div>

      {/* ── Table / Cards ── */}
      <div className="rounded-xl border overflow-hidden" style={{ ...S.surface, boxShadow: "var(--shadow-sm)" }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
          </div>
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16" style={S.textMuted}>
            <CalendarDays className="h-12 w-12 mb-3" style={S.textSubtle} />
            <p className="text-sm font-medium">No hay planes creados aún</p>
          </div>
        ) : view === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {plans.map((plan) => {
              const duration = DURATION_META[plan.duration]
              return (
                <div
                  key={plan.id}
                  className="rounded-lg border p-4 transition-colors duration-150"
                  style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "#8B5CF618" }}>
                        <CalendarDays className="h-5 w-5" style={{ color: "#8B5CF6" }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={S.textMain}>{plan.title}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {duration && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                              style={{ background: duration.color + "18", color: duration.color }}>
                              <Clock className="h-2.5 w-2.5" />{duration.label}
                            </span>
                          )}
                          {plan.meals_count === 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                              style={{ background: "#F59E0B18", color: "#D97706" }}>
                              <AlertTriangle className="h-2.5 w-2.5" />Incompleto
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--color-border)" }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <User2 className="h-3.5 w-3.5" style={S.textSubtle} />
                      <span className="text-xs truncate" style={S.textMuted}>
                        {plan.user?.name || `ID #${plan.user_id}`}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full"
                        style={{ background: "#F9731618", color: "#F97316" }}>
                        <Flame className="h-3 w-3" />{Number(plan.total_calories).toFixed(0)} kcal
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full"
                        style={{ background: "#3B82F618", color: "#3B82F6" }}>
                        <Beef className="h-3 w-3" />P: {Number(plan.protein_goal_g).toFixed(0)}g
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-1 mt-3">
                    <Link href={`/admin/plans/${plan.id}`}>
                      <button
                        className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors duration-150"
                        style={{ color: "var(--color-foreground-subtle)" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#8B5CF618"; e.currentTarget.style.color = "#8B5CF6" }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-foreground-subtle)" }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </Link>
                    <button
                      className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors duration-150"
                      style={{ color: "var(--color-foreground-subtle)" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#DC262618"; e.currentTarget.style.color = "#DC2626" }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-foreground-subtle)" }}
                      onClick={() => askDelete(plan.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <>
            {/* Header row */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b" style={{ ...S.raised, borderColor: "var(--color-border)" }}>
              {["Plan", "Usuario", "Objetivos", ""].map((h, i) => (
                <p key={i} className={`text-xs font-semibold uppercase tracking-wide ${i === 3 ? "text-right" : ""} ${
                  i === 0 ? "col-span-4" : i === 1 ? "col-span-2" : i === 2 ? "col-span-4" : "col-span-2"
                }`} style={S.textMuted}>{h}</p>
              ))}
            </div>

            <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
              {plans.map((plan) => {
                const duration = DURATION_META[plan.duration]
                return (
                  <div
                    key={plan.id}
                    className="grid grid-cols-12 gap-4 px-5 py-4 items-center transition-colors duration-150"
                    onMouseEnter={e => e.currentTarget.style.background = "var(--color-surface-raised)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {/* Plan info */}
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#8B5CF618" }}>
                        <CalendarDays className="h-4 w-4" style={{ color: "#8B5CF6" }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={S.textMain}>{plan.title}</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {duration && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                              style={{ background: duration.color + "18", color: duration.color }}>
                              <Clock className="h-2.5 w-2.5" />{duration.label}
                            </span>
                          )}
                          {plan.meals_count === 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                              style={{ background: "#F59E0B18", color: "#D97706" }}>
                              <AlertTriangle className="h-2.5 w-2.5" />Incompleto
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Usuario */}
                    <div className="col-span-2 flex items-center gap-1.5">
                      <User2 className="h-3.5 w-3.5 flex-shrink-0" style={S.textSubtle} />
                      <span className="text-xs truncate" style={S.textMuted}>
                        {plan.user?.name || `ID #${plan.user_id}`}
                      </span>
                    </div>

                    {/* Objetivos */}
                    <div className="col-span-4 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full"
                        style={{ background: "#F9731618", color: "#F97316" }}>
                        <Flame className="h-3 w-3" />{Number(plan.total_calories).toFixed(0)} kcal
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full"
                        style={{ background: "#3B82F618", color: "#3B82F6" }}>
                        <Beef className="h-3 w-3" />P: {Number(plan.protein_goal_g).toFixed(0)}g
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex justify-end gap-1">
                      <Link href={`/admin/plans/${plan.id}`}>
                        <button
                          className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors duration-150"
                          style={{ color: "var(--color-foreground-subtle)" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#8B5CF618"; e.currentTarget.style.color = "#8B5CF6" }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-foreground-subtle)" }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </Link>
                      <button
                        className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors duration-150"
                        style={{ color: "var(--color-foreground-subtle)" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#DC262618"; e.currentTarget.style.color = "#DC2626" }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-foreground-subtle)" }}
                        onClick={() => askDelete(plan.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t" style={{ ...S.raised, borderColor: "var(--color-border)" }}>
                <p className="text-xs" style={S.textSubtle}>Página {page} de {totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="cursor-pointer h-8">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="cursor-pointer h-8">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="¿Eliminar plan?"
        description="Se eliminará permanentemente el plan nutricional y todas sus comidas asignadas. Esta acción no se puede deshacer."
        confirmLabel="Eliminar plan"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => { setConfirmOpen(false); setDeletingId(null) }}
      />
    </div>
  )
}
