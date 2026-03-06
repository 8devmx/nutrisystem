"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { api, planMealsApi, unitsApi } from "@/lib/api"
import ConfirmDialog from "@/components/admin/confirm-dialog"
import {
  ChevronLeft, Plus, Trash2, Search, UtensilsCrossed,
  Sun, Coffee, Apple, Moon, Utensils, Flame, Beef, Wheat, Droplets,
} from "lucide-react"
import Link from "next/link"

// ── Constantes ────────────────────────────────────────────────────────────────

const MEAL_MOMENTS = [
  { key: "breakfast",       label: "Desayuno",        icon: Sun,      color: "#F59E0B", pct: "25%" },
  { key: "morning_snack",   label: "Colación mañana", icon: Coffee,   color: "#F97316", pct: "10%" },
  { key: "lunch",           label: "Comida",           icon: Utensils, color: "#16A34A", pct: "35%" },
  { key: "afternoon_snack", label: "Colación tarde",   icon: Apple,    color: "#EF4444", pct: "10%" },
  { key: "dinner",          label: "Cena",             icon: Moon,     color: "#8B5CF6", pct: "20%" },
]

const EMPTY_FORM = {
  food_id: "", food_name: "", quantity: "", unit_id: "",
  day_number: 1, meal_moment: "breakfast",
}

// ── Estilos compartidos ──────────────────────────────────────────────────────
const S = {
  surface:  { background: "var(--color-surface)",        borderColor: "var(--color-border)" },
  raised:   { background: "var(--color-surface-raised)", borderColor: "var(--color-border)" },
  textMain: { color: "var(--color-foreground)" },
  textMuted:{ color: "var(--color-foreground-muted)" },
  textSub:  { color: "var(--color-foreground-subtle)" },
  border:   { borderColor: "var(--color-border)" },
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function PlanDetail() {
  const { id: planId } = useParams()

  const [planData, setPlanData]   = useState(null)
  const [units, setUnits]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [activeDay, setActiveDay] = useState(1)

  const [dialogOpen, setDialogOpen]   = useState(false)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [foodSearch, setFoodSearch]   = useState("")
  const [foodResults, setFoodResults] = useState([])
  const [searching, setSearching]     = useState(false)
  const [saving, setSaving]           = useState(false)

  // confirm de eliminación de comida
  const [confirmOpen, setConfirmOpen]     = useState(false)
  const [pendingMealId, setPendingMealId] = useState(null)
  const [deleting, setDeleting]           = useState(false)

  // ── Carga inicial ──────────────────────────────────────────────────────────

  const fetchPlan = useCallback(async () => {
    try {
      const res = await api.get(`/v1/plans/${planId}`)
      setPlanData(res.data)
      setActiveDay(1)
    } catch (e) { console.error("Error cargando plan:", e) }
    finally     { setLoading(false) }
  }, [planId])

  useEffect(() => {
    fetchPlan()
    unitsApi.list().then(res => setUnits(res.data || [])).catch(() => {})
  }, [fetchPlan])

  // ── Buscador ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (foodSearch.length < 2) { setFoodResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await api.get(`/v1/foods?search=${encodeURIComponent(foodSearch)}&page=1`)
        setFoodResults(res.data?.data || res.data || [])
      } catch { setFoodResults([]) }
      finally  { setSearching(false) }
    }, 350)
    return () => clearTimeout(timer)
  }, [foodSearch])

  // ── Acciones ───────────────────────────────────────────────────────────────

  const openDialog = (day, moment) => {
    setForm({ ...EMPTY_FORM, day_number: day, meal_moment: moment })
    setFoodSearch("")
    setFoodResults([])
    setDialogOpen(true)
  }

  const selectFood = (food) => {
    setForm(f => ({ ...f, food_id: food.id, food_name: food.name }))
    setFoodSearch(food.name)
    setFoodResults([])
  }

  const handleSave = async () => {
    if (!form.food_id || !form.quantity || !form.unit_id) return
    setSaving(true)
    try {
      await planMealsApi.add(planId, {
        day_number:  form.day_number,
        meal_moment: form.meal_moment,
        food_id:     Number(form.food_id),
        quantity:    parseFloat(form.quantity),
        unit_id:     Number(form.unit_id),
      })
      setDialogOpen(false)
      await fetchPlan()
    } catch (e) { alert(e.message || "Error al agregar comida") }
    finally     { setSaving(false) }
  }

  const askRemove = (mealId) => {
    setPendingMealId(mealId)
    setConfirmOpen(true)
  }

  const handleRemove = async () => {
    setDeleting(true)
    try {
      await planMealsApi.remove(planId, pendingMealId)
      setConfirmOpen(false)
      await fetchPlan()
    } catch (e) {
      alert(e.message || "Error al eliminar")
    } finally {
      setDeleting(false)
      setPendingMealId(null)
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  const totalDays = planData?.plan?.total_days || 7

  const getMeals = (day, moment) => planData?.days?.[day]?.[moment] || []

  const totalCaloriesDay = (day) =>
    MEAL_MOMENTS.reduce((acc, m) =>
      acc + getMeals(day, m.key).reduce((s, i) => s + Number(i.calories || 0), 0)
    , 0).toFixed(0)

  // ── Loading / not found ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
      </div>
    )
  }

  if (!planData) {
    return (
      <div className="flex items-center justify-center py-32">
        <p style={S.textMuted}>Plan no encontrado.</p>
      </div>
    )
  }

  const { plan, user } = planData

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="rounded-xl border p-5" style={{ ...S.surface, boxShadow: "var(--shadow-sm)" }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/admin/plans">
              <button
                className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors duration-150"
                style={{ color: "var(--color-foreground-subtle)", background: "transparent" }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--color-surface-raised)"; e.currentTarget.style.color = "var(--color-foreground)" }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-foreground-subtle)" }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </Link>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--color-primary-light)" }}>
              <span className="font-bold text-sm" style={{ color: "var(--color-primary)" }}>N</span>
            </div>
            <div>
              <h1 className="text-lg font-heading font-bold" style={S.textMain}>{plan.title}</h1>
              <p className="text-xs" style={S.textMuted}>{user?.name} · {user?.email}</p>
            </div>
          </div>

          {/* Badges de macros */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: plan.duration,                              color: "#8B5CF6" },
              { label: `${Number(plan.total_calories).toFixed(0)} kcal/día`, color: "#F97316" },
              { label: `P ${Number(plan.protein_goal_g).toFixed(0)}g`,       color: "#3B82F6" },
              { label: `C ${Number(plan.carbs_goal_g).toFixed(0)}g`,         color: "#F59E0B" },
              { label: `G ${Number(plan.fat_goal_g).toFixed(0)}g`,           color: "#EF4444" },
            ].map(({ label, color }) => (
              <span key={label} className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
                style={{ background: color + "18", color }}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Selector de días ── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
          const active = activeDay === day
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl border text-sm font-medium transition-all duration-150 cursor-pointer"
              style={{
                background:   active ? "var(--color-primary)"       : "var(--color-surface)",
                borderColor:  active ? "var(--color-primary)"       : "var(--color-border)",
                color:        active ? "#FFFFFF"                     : "var(--color-foreground-muted)",
                boxShadow:    active ? "var(--shadow-sm)"            : "none",
              }}
            >
              <span className="text-xs opacity-70">Día</span>
              <span className="text-lg font-bold leading-none">{day}</span>
            </button>
          )
        })}
      </div>

      {/* ── Momentos del día ── */}
      <div className="space-y-3">
        {MEAL_MOMENTS.map(({ key, label, icon: Icon, color, pct }) => {
          const meals = getMeals(activeDay, key)
          return (
            <div key={key} className="rounded-xl border overflow-hidden" style={{ ...S.surface, boxShadow: "var(--shadow-xs)" }}>

              {/* Card header */}
              <div className="flex items-center justify-between px-5 py-3 border-b" style={S.raised}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color + "18" }}>
                    <Icon className="h-3.5 w-3.5" style={{ color }} />
                  </div>
                  <span className="text-sm font-semibold" style={S.textMain}>{label}</span>
                  <span className="text-xs" style={S.textSub}>({pct})</span>
                </div>
                <button
                  onClick={() => openDialog(activeDay, key)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors duration-150"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-foreground-muted)", background: "var(--color-surface)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = color + "18"; e.currentTarget.style.borderColor = color; e.currentTarget.style.color = color }}
                  onMouseLeave={e => { e.currentTarget.style.background = "var(--color-surface)"; e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-foreground-muted)" }}
                >
                  <Plus className="h-3 w-3" /> Agregar
                </button>
              </div>

              {/* Card body */}
              <div className="p-4">
                {meals.length === 0 ? (
                  <p className="text-sm text-center py-2" style={S.textSub}>
                    Sin alimentos — usa el botón para agregar
                  </p>
                ) : (
                  <div className="space-y-2">
                    {meals.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{ background: "var(--color-surface-raised)" }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: "#16A34A18" }}>
                            <UtensilsCrossed className="h-4 w-4" style={{ color: "#16A34A" }} />
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={S.textMain}>{item.food?.name}</p>
                            <p className="text-xs" style={S.textMuted}>
                              {item.quantity} {item.unit} · {item.grams}g · {item.calories} kcal
                            </p>
                          </div>
                        </div>
                        <button
                          className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors duration-150"
                          style={{ color: "var(--color-foreground-subtle)", background: "transparent" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#DC262618"; e.currentTarget.style.color = "#DC2626" }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-foreground-subtle)" }}
                          onClick={() => askRemove(item.meal_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Resumen calorías ── */}
      <div className="rounded-xl border p-4" style={{ background: "var(--color-primary-light)", borderColor: "var(--color-primary)" + "40" }}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>
            Total día {activeDay}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
              {totalCaloriesDay(activeDay)} kcal
            </span>
            <span className="text-sm" style={S.textMuted}>
              / {Number(plan.total_calories).toFixed(0)} objetivo
            </span>
          </div>
        </div>
      </div>

      {/* ── Confirm eliminar comida ── */}
      <ConfirmDialog
        open={confirmOpen}
        title="¿Eliminar comida?"
        description="Se eliminará este alimento del plan para este día y momento. Esta acción no se puede deshacer."
        confirmLabel="Eliminar comida"
        loading={deleting}
        onConfirm={handleRemove}
        onCancel={() => { setConfirmOpen(false); setPendingMealId(null) }}
      />

      {/* ── Dialog agregar comida ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Agregar alimento — Día {form.day_number} · {MEAL_MOMENTS.find(m => m.key === form.meal_moment)?.label}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Buscador */}
            <div className="space-y-2">
              <Label style={S.textMuted}>Alimento</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={S.textSub} />
                <Input
                  placeholder="Buscar alimento..."
                  value={foodSearch}
                  onChange={e => {
                    setFoodSearch(e.target.value)
                    if (e.target.value !== form.food_name) setForm(f => ({ ...f, food_id: "", food_name: "" }))
                  }}
                  className="pl-10"
                />
              </div>

              {(searching || foodResults.length > 0) && (
                <div className="rounded-lg border overflow-hidden max-h-48 overflow-y-auto"
                  style={{ ...S.surface, boxShadow: "var(--shadow-sm)" }}>
                  {searching ? (
                    <p className="text-sm text-center py-3" style={S.textMuted}>Buscando...</p>
                  ) : foodResults.map(food => (
                    <button
                      key={food.id}
                      onClick={() => selectFood(food)}
                      className="w-full text-left px-4 py-2 flex justify-between items-center transition-colors duration-150 cursor-pointer"
                      style={{ color: "var(--color-foreground)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--color-surface-raised)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <span className="text-sm font-medium">{food.name}</span>
                      <span className="text-xs" style={S.textMuted}>{food.calories_per_100g} kcal/100g</span>
                    </button>
                  ))}
                </div>
              )}

              {form.food_id && (
                <p className="text-xs font-medium" style={{ color: "#16A34A" }}>✓ {form.food_name} seleccionado</p>
              )}
            </div>

            {/* Cantidad y Unidad */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label style={S.textMuted}>Cantidad</Label>
                <Input type="number" min="0.01" step="0.01" placeholder="ej. 1.5"
                  value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label style={S.textMuted}>Unidad</Label>
                <select
                  value={form.unit_id}
                  onChange={e => setForm(f => ({ ...f, unit_id: e.target.value }))}
                  className="w-full h-10 rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }}
                >
                  <option value="">Seleccionar...</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <button
              onClick={handleSave}
              disabled={!form.food_id || !form.quantity || !form.unit_id || saving}
              className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer text-white transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "var(--color-primary)" }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.background = "var(--color-primary-hover)" }}
              onMouseLeave={e => e.currentTarget.style.background = "var(--color-primary)"}
            >
              {saving ? "Guardando..." : "Agregar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
