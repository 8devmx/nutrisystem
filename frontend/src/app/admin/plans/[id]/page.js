"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import Link from "next/link"
import {
  ArrowLeft, Pencil, Flame, Beef, Wheat, Droplets,
  Sun, Coffee, Utensils, Apple, Moon, UtensilsCrossed,
  CalendarDays, User2, Target,
} from "lucide-react"

const MEAL_MOMENTS = [
  { key: "breakfast",       label: "Desayuno",        icon: Sun,      color: "#F59E0B", pct: "25%" },
  { key: "morning_snack",   label: "Colación mañana", icon: Coffee,   color: "#F97316", pct: "10%" },
  { key: "lunch",           label: "Comida",           icon: Utensils, color: "#16A34A", pct: "35%" },
  { key: "afternoon_snack", label: "Colación tarde",   icon: Apple,    color: "#EF4444", pct: "10%" },
  { key: "dinner",          label: "Cena",             icon: Moon,     color: "#8B5CF6", pct: "20%" },
]

const DURATION_META = {
  weekly:   { label: "Semanal",   days: 7 },
  biweekly: { label: "Quincenal", days: 14 },
  monthly:  { label: "Mensual",   days: 30 },
}

const ACTIVITY_META = {
  sedentary:   { label: "Sedentario",  color: "#6B7280" },
  light:       { label: "Ligero",      color: "#10B981" },
  moderate:    { label: "Moderado",    color: "#F59E0B" },
  active:      { label: "Activo",      color: "#F97316" },
  very_active: { label: "Muy activo", color: "#EF4444" },
}

const S = {
  surface:  { background: "var(--color-surface)",        borderColor: "var(--color-border)" },
  raised:   { background: "var(--color-surface-raised)", borderColor: "var(--color-border)" },
  textMain: { color: "var(--color-foreground)" },
  textMuted:{ color: "var(--color-foreground-muted)" },
  textSub:  { color: "var(--color-foreground-subtle)" },
}

export default function PlanPreviewPage() {
  const { id: planId } = useParams()
  const [planData, setPlanData] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [activeDay, setActiveDay] = useState(1)

  const fetchPlan = useCallback(async () => {
    try {
      const res = await api.get(`/v1/plans/${planId}`)
      setPlanData(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [planId])

  useEffect(() => { fetchPlan() }, [fetchPlan])

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
    </div>
  )

  if (!planData) return (
    <div className="flex items-center justify-center py-32">
      <p style={S.textMuted}>Plan no encontrado.</p>
    </div>
  )

  const { plan, user, days } = planData
  const totalDays = plan.total_days || DURATION_META[plan.duration]?.days || 7
  const getMeals = (day, moment) => days?.[day]?.[moment] || []

  const totalCaloriesDay = (day) =>
    MEAL_MOMENTS.reduce((acc, { key }) =>
      acc + getMeals(day, key).reduce((s, i) => s + Number(i.calories || 0), 0)
    , 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/admin/plans">
            <button
              className="p-2 rounded-lg cursor-pointer transition-colors"
              onMouseEnter={e => e.currentTarget.style.background = "var(--color-surface-raised)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <ArrowLeft className="h-5 w-5" style={S.textMuted} />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-heading font-bold" style={S.textMain}>{plan.title}</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <User2 className="h-3.5 w-3.5" style={S.textSub} />
              <span className="text-sm" style={S.textMuted}>{user?.name} · {user?.email}</span>
            </div>
          </div>
        </div>
        <Link href={`/admin/plans/${planId}/edit`}>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer text-white transition-colors"
            style={{ background: "var(--color-primary)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--color-primary-hover)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--color-primary)"}
          >
            <Pencil className="h-4 w-4" /> Editar plan
          </button>
        </Link>
      </div>

      {/* ── Macros del plan ── */}
      <div className="rounded-xl border p-5" style={{ ...S.surface, boxShadow: "var(--shadow-sm)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-4 w-4" style={S.textMuted} />
          <span className="text-sm font-semibold" style={S.textMain}>Objetivos nutricionales</span>
          <div className="flex gap-2 ml-auto flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
              style={{ background: "#8B5CF618", color: "#8B5CF6" }}>{plan.duration}</span>
            {ACTIVITY_META[plan.activity_factor] && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: ACTIVITY_META[plan.activity_factor].color + "18", color: ACTIVITY_META[plan.activity_factor].color }}>
                {ACTIVITY_META[plan.activity_factor].label}
              </span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Calorías/día", value: `${Number(plan.total_calories).toFixed(0)} kcal`, icon: Flame,    color: "#F97316", bg: "#F9731618" },
            { label: "Proteína",     value: `${Number(plan.protein_goal_g).toFixed(0)}g`,    icon: Beef,     color: "#3B82F6", bg: "#3B82F618" },
            { label: "Carbohidratos",value: `${Number(plan.carbs_goal_g).toFixed(0)}g`,      icon: Wheat,    color: "#F59E0B", bg: "#F59E0B18" },
            { label: "Grasa",        value: `${Number(plan.fat_goal_g).toFixed(0)}g`,        icon: Droplets, color: "#EF4444", bg: "#EF444418" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="text-center p-3 rounded-lg" style={{ background: bg }}>
              <Icon className="h-4 w-4 mx-auto mb-1" style={{ color }} />
              <p className="text-lg font-bold" style={{ color }}>{value}</p>
              <p className="text-xs mt-0.5" style={S.textMuted}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Selector de días ── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
          const active = activeDay === day
          const dayKcal = totalCaloriesDay(day)
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl border text-sm font-medium transition-all duration-150 cursor-pointer"
              style={{
                background:  active ? "var(--color-primary)"   : "var(--color-surface)",
                borderColor: active ? "var(--color-primary)"   : "var(--color-border)",
                color:       active ? "#FFFFFF"                 : "var(--color-foreground-muted)",
                boxShadow:   active ? "var(--shadow-sm)"        : "none",
              }}
            >
              <span className="text-[10px] opacity-70">Día</span>
              <span className="text-lg font-bold leading-none">{day}</span>
              {dayKcal > 0 && (
                <span className="text-[9px] opacity-60 mt-0.5">{Math.round(dayKcal)}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Momentos del día ── */}
      <div className="space-y-3">
        {MEAL_MOMENTS.map(({ key, label, icon: Icon, color, pct }) => {
          const meals = getMeals(activeDay, key)
          const momentKcal = meals.reduce((s, i) => s + Number(i.calories || 0), 0)

          return (
            <div key={key} className="rounded-xl border overflow-hidden" style={{ ...S.surface, boxShadow: "var(--shadow-xs)" }}>
              <div className="flex items-center justify-between px-5 py-3 border-b" style={S.raised}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color + "18" }}>
                    <Icon className="h-3.5 w-3.5" style={{ color }} />
                  </div>
                  <span className="text-sm font-semibold" style={S.textMain}>{label}</span>
                  <span className="text-xs" style={S.textSub}>({pct})</span>
                </div>
                {momentKcal > 0 && (
                  <span className="text-xs font-medium" style={{ color }}>{Math.round(momentKcal)} kcal</span>
                )}
              </div>

              <div className="p-4">
                {meals.length === 0 ? (
                  <p className="text-sm text-center py-2" style={S.textSub}>Sin alimentos asignados</p>
                ) : (
                  <div className="space-y-2">
                    {meals.map((item, idx) => (
                      <div key={idx}
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
                              {item.quantity} {item.unit?.abbreviation || item.unit} · {item.grams}g · {item.calories} kcal
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Resumen del día ── */}
      <div className="rounded-xl border p-4" style={{ background: "var(--color-primary-light)", borderColor: "var(--color-primary)" + "40" }}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>
            Total día {activeDay}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
              {Math.round(totalCaloriesDay(activeDay))} kcal
            </span>
            <span className="text-sm" style={S.textMuted}>
              / {Number(plan.total_calories).toFixed(0)} objetivo
            </span>
          </div>
        </div>
      </div>

    </div>
  )
}
