"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { api } from "@/lib/api"
import { Input } from "@/components/ui/input"
import ConfirmDialog from "@/components/admin/confirm-dialog"
import { Search, Plus, BookOpen, Flame, Beef, Droplets, Wheat, Loader2, Trash2, Edit, Clock } from "lucide-react"

export default function RecipesPage() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState("table")

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({ open: false, id: null, loading: false })

  useEffect(() => {
    fetchRecipes()
  }, [search])

  const fetchRecipes = async () => {
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : ""
      const response = await api.get(`/v1/recipes${params}`)
      setRecipes(response.data.data || response.data)
    } catch (error) {
      console.error("Error fetching recipes:", error)
    } finally {
      setLoading(false)
    }
  }

  const askDelete = (id) => {
    setConfirmDialog({ open: true, id, loading: false })
  }

  const handleDelete = async () => {
    setConfirmDialog(prev => ({ ...prev, loading: true }))
    try {
      await api.delete(`/v1/recipes/${confirmDialog.id}`)
      setRecipes(recipes.filter(r => r.id !== confirmDialog.id))
      setConfirmDialog({ open: false, id: null, loading: false })
    } catch (error) {
      console.error("Error al eliminar receta:", error)
      setConfirmDialog(prev => ({ ...prev, loading: false }))
    }
  }

  const S = {
    surface: { background: "var(--color-surface)", borderColor: "var(--color-border)" },
    textMain: { color: "var(--color-foreground)" },
    textMuted: { color: "var(--color-foreground-muted)" },
    input: { background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-foreground)" },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--color-primary)" }} />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      <ConfirmDialog
        open={confirmDialog.open}
        loading={confirmDialog.loading}
        title="¿Eliminar receta?"
        description="Se eliminará la receta permanentemente. Los planes que la usen no se verán afectados."
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDialog({ open: false, id: null, loading: false })}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold" style={S.textMain}>Recetas</h1>
          <p className="text-sm mt-0.5" style={S.textMuted}>Gestiona tus recetas nutricionales</p>
        </div>
        <Link href="/admin/recipes/new">
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer text-white flex items-center gap-2"
            style={{ background: "var(--color-primary)" }}
          >
            <Plus className="h-4 w-4" /> Nueva receta
          </button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={S.textMuted} />
          <Input
            placeholder="Buscar recetas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            style={S.input}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("table")}
            className="px-3 py-2 rounded-lg text-xs font-medium cursor-pointer"
            style={viewMode === "table"
              ? { background: "var(--color-primary-light)", color: "var(--color-primary)" }
              : S.textMuted}
          >
            Tabla
          </button>
          <button
            onClick={() => setViewMode("card")}
            className="px-3 py-2 rounded-lg text-xs font-medium cursor-pointer"
            style={viewMode === "card"
              ? { background: "var(--color-primary-light)", color: "var(--color-primary)" }
              : S.textMuted}
          >
            Tarjetas
          </button>
        </div>
      </div>

      {viewMode === "table" ? (
        <div className="rounded-xl border overflow-hidden" style={S.surface}>
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--color-surface-raised)" }}>
                <th className="p-3 text-left text-xs font-medium" style={S.textMuted}>Nombre</th>
                <th className="p-3 text-left text-xs font-medium" style={S.textMuted}>Ingredientes</th>
                <th className="p-3 text-left text-xs font-medium" style={S.textMuted}>Porciones</th>
                <th className="p-3 text-left text-xs font-medium" style={S.textMuted}>Macros</th>
                <th className="p-3 text-left text-xs font-medium" style={S.textMuted}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((recipe) => (
                <tr key={recipe.id} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: "var(--color-primary-light)" }}
                      >
                        <BookOpen className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
                      </div>
                      <div>
                        <p className="font-medium text-sm" style={S.textMain}>{recipe.title}</p>
                        {recipe.description && (
                          <p className="text-xs" style={S.textMuted}>{recipe.description.substring(0, 50)}…</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-sm" style={S.textMuted}>
                    {recipe.ingredients_count} ingredientes
                  </td>
                  <td className="p-3 text-sm" style={S.textMuted}>
                    {recipe.servings} porción(es)
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2 text-xs">
                      <span className="flex items-center gap-1">
                        <Flame className="h-3 w-3" style={{ color: "#F97316" }} />
                        {recipe.macros?.calories || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Beef className="h-3 w-3" style={{ color: "#3B82F6" }} />
                        {recipe.macros?.protein_g || 0}g
                      </span>
                      <span className="flex items-center gap-1">
                        <Wheat className="h-3 w-3" style={{ color: "#F59E0B" }} />
                        {recipe.macros?.carbs_g || 0}g
                      </span>
                      <span className="flex items-center gap-1">
                        <Droplets className="h-3 w-3" style={{ color: "#F97316" }} />
                        {recipe.macros?.fat_g || 0}g
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Link href={`/admin/recipes/${recipe.id}`}>
                        <button
                          className="p-2 rounded-lg cursor-pointer transition-colors"
                          onMouseEnter={e => e.currentTarget.style.background = "var(--color-surface-raised)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <Edit className="h-4 w-4" style={S.textMuted} />
                        </button>
                      </Link>
                      <button
                        onClick={() => askDelete(recipe.id)}
                        className="p-2 rounded-lg cursor-pointer transition-colors"
                        onMouseEnter={e => e.currentTarget.style.background = "#FEE2E218"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <Trash2 className="h-4 w-4" style={{ color: "#DC2626" }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="rounded-xl border p-4"
              style={S.surface}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: "var(--color-primary-light)" }}
                  >
                    <BookOpen className="h-6 w-6" style={{ color: "var(--color-primary)" }} />
                  </div>
                  <div>
                    <h3 className="font-semibold" style={S.textMain}>{recipe.title}</h3>
                    <p className="text-xs" style={S.textMuted}>{recipe.ingredients_count} ingredientes</p>
                  </div>
                </div>
              </div>

              {recipe.description && (
                <p className="text-sm mb-3" style={S.textMuted}>{recipe.description}</p>
              )}

              <div className="flex items-center gap-4 mb-3 text-xs" style={S.textMuted}>
                {recipe.servings && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {recipe.servings} porciones
                  </span>
                )}
                {recipe.prep_time_minutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {recipe.prep_time_minutes} min
                  </span>
                )}
              </div>

              <div className="flex gap-3 text-xs mb-4">
                <span className="flex items-center gap-1">
                  <Flame className="h-3 w-3" style={{ color: "#F97316" }} />
                  {recipe.macros?.calories || 0} kcal
                </span>
                <span className="flex items-center gap-1">
                  <Beef className="h-3 w-3" style={{ color: "#3B82F6" }} />
                  {recipe.macros?.protein_g || 0}g P
                </span>
                <span className="flex items-center gap-1">
                  <Wheat className="h-3 w-3" style={{ color: "#F59E0B" }} />
                  {recipe.macros?.carbs_g || 0}g C
                </span>
                <span className="flex items-center gap-1">
                  <Droplets className="h-3 w-3" style={{ color: "#F97316" }} />
                  {recipe.macros?.fat_g || 0}g G
                </span>
              </div>

              <div className="flex gap-2">
                <Link href={`/admin/recipes/${recipe.id}`} className="flex-1">
                  <button
                    className="w-full px-3 py-2 rounded-lg text-xs font-medium cursor-pointer border flex items-center justify-center gap-1"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-foreground-muted)" }}
                  >
                    <Edit className="h-3 w-3" /> Editar
                  </button>
                </Link>
                <button
                  onClick={() => askDelete(recipe.id)}
                  className="px-3 py-2 rounded-lg text-xs font-medium cursor-pointer"
                  style={{ background: "#FEE2E218", color: "#DC2626" }}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {recipes.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto mb-4" style={S.textMuted} />
          <p style={S.textMuted}>No hay recetas todavía</p>
          <Link href="/admin/recipes/new">
            <button
              className="mt-4 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer text-white"
              style={{ background: "var(--color-primary)" }}
            >
              Crear primera receta
            </button>
          </Link>
        </div>
      )}
    </div>
  )
}
