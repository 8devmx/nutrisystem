"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { api } from "@/lib/api"
import {
  Users, UtensilsCrossed, CalendarDays,
  TrendingUp, ArrowRight, Activity,
  Flame, Dumbbell, Apple, Clock,
} from "lucide-react"

const STAT_CARDS = [
  { label: "Usuarios registrados",  icon: Users,         accent: "#3B82F6", href: "/admin/users" },
  { label: "Alimentos en catálogo", icon: UtensilsCrossed, accent: "#16A34A", href: "/admin/foods" },
  { label: "Planes activos",        icon: CalendarDays,  accent: "#8B5CF6", href: "/admin/plans" },
]

const QUICK_ACTIONS = [
  { label: "Gestionar usuarios",    description: "Perfiles, medidas y actividad física",  icon: Users,          href: "/admin/users", color: "#3B82F6" },
  { label: "Catálogo de alimentos", description: "Macros, calorías y equivalencias",       icon: UtensilsCrossed, href: "/admin/foods", color: "#16A34A" },
  { label: "Planes nutricionales",  description: "Crear y editar planes por usuario",      icon: CalendarDays,   href: "/admin/plans", color: "#8B5CF6" },
]

const HIGHLIGHTS = [
  { icon: Flame,    label: "Calorías",  desc: "Control calórico diario",     color: "#F97316" },
  { icon: Dumbbell, label: "Proteínas", desc: "Metas de macronutrientes",    color: "#3B82F6" },
  { icon: Apple,    label: "Alimentos", desc: "Base de datos nutricional",   color: "#16A34A" },
  { icon: Clock,    label: "Planes",    desc: "Semanal, quincenal, mensual", color: "#8B5CF6" },
]

export default function AdminDashboard() {
  const [counts, setCounts] = useState({ users: "—", foods: "—", plans: "—" })

  useEffect(() => {
    const load = async () => {
      try {
        const [u, f, p] = await Promise.allSettled([
          api.get("/v1/admin/users?page=1"),
          api.get("/v1/foods?page=1"),
          api.get("/v1/admin/plans?page=1"),
        ])
        setCounts({
          users: u.status === "fulfilled" ? (u.value.data?.total ?? u.value.data?.length ?? "—") : "—",
          foods: f.status === "fulfilled" ? (f.value.data?.total ?? f.value.data?.length ?? "—") : "—",
          plans: p.status === "fulfilled" ? (p.value.data?.total ?? p.value.data?.length ?? "—") : "—",
        })
      } catch {}
    }
    load()
  }, [])

  const statValues = [counts.users, counts.foods, counts.plans]

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* ── Encabezado ── */}
      <div>
        <h1 className="text-2xl font-heading font-bold" style={{ color: "var(--color-foreground)" }}>
          Panel de administración
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-foreground-muted)" }}>
          Gestiona el sistema nutricional desde un solo lugar
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STAT_CARDS.map((card, i) => (
          <Link key={card.href} href={card.href}>
            <div
              className="relative overflow-hidden rounded-xl p-5 cursor-pointer border-l-4 transition-all duration-200 group"
              style={{
                background:   "var(--color-surface)",
                border:       `1px solid var(--color-border)`,
                borderLeft:   `4px solid ${card.accent}`,
                boxShadow:    "var(--shadow-sm)",
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "var(--shadow-md)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "var(--shadow-sm)"}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--color-foreground-muted)" }}>
                    {card.label}
                  </p>
                  <p className="text-3xl font-bold mt-2" style={{ color: "var(--color-foreground)" }}>
                    {statValues[i]}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: card.accent + "18" }}>
                  <card.icon className="h-5 w-5" style={{ color: card.accent }} />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-4 text-xs transition-colors" style={{ color: "var(--color-foreground-subtle)" }}>
                <span>Ver detalles</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Bento grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Quick actions */}
        <div
          className="md:col-span-2 rounded-xl border p-5"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--shadow-sm)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Acceso rápido</h2>
            <Activity className="h-4 w-4" style={{ color: "var(--color-foreground-subtle)" }} />
          </div>
          <div className="space-y-2">
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.href} href={action.href}>
                <div
                  className="flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors duration-150 group"
                  style={{ color: "var(--color-foreground)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--color-surface-raised)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: action.color }}>
                    <action.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{action.label}</p>
                    <p className="text-xs truncate" style={{ color: "var(--color-foreground-muted)" }}>{action.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: action.color + "18", color: action.color }}
                    >
                      {action.label.split(" ")[0]}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" style={{ color: "var(--color-foreground-subtle)" }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Highlights */}
        <div
          className="rounded-xl border p-5"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--shadow-sm)" }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>Funcionalidades</h2>
          <div className="space-y-4">
            {HIGHLIGHTS.map((h) => (
              <div key={h.label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--color-surface-raised)" }}>
                  <h.icon className="h-4 w-4" style={{ color: h.color }} />
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: "var(--color-foreground)" }}>{h.label}</p>
                  <p className="text-[11px]" style={{ color: "var(--color-foreground-muted)" }}>{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center gap-2 text-xs pb-2" style={{ color: "var(--color-foreground-subtle)" }}>
        <TrendingUp className="h-3.5 w-3.5" />
        <span>NutriSystem · Sistema de gestión nutricional</span>
      </div>
    </div>
  )
}
