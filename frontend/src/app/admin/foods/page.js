"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { api } from "@/lib/api"
import ConfirmDialog from "@/components/admin/confirm-dialog"
import {
  UtensilsCrossed, Plus, Search, Pencil, Trash2,
  ChevronLeft, ChevronRight, Flame, Beef, Wheat, Droplets, Leaf,
} from "lucide-react"

export default function AdminFoods() {
  const [foods, setFoods]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState("")
  const [page, setPage]               = useState(1)
  const [totalPages, setTotalPages]   = useState(1)
  const [total, setTotal]             = useState(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingFood, setEditingFood] = useState(null)
  const [confirmOpen, setConfirmOpen]   = useState(false)
  const [deletingId, setDeletingId]     = useState(null)
  const [deleting, setDeleting]         = useState(false)
  const [formData, setFormData]       = useState({
    name: "", calories_per_100g: "",
    protein_g: "", carbs_g: "", fat_g: "", fiber_g: "", image_path: "",
  })

  useEffect(() => { fetchFoods() }, [page, search])

  const fetchFoods = async () => {
    setLoading(true)
    try {
      const query    = search ? `?search=${search}&page=${page}` : `?page=${page}`
      const response = await api.get(`/v1/foods${query}`)
      setFoods(response.data.data || response.data)
      setTotalPages(response.data.last_page || 1)
      setTotal(response.data.total || 0)
    } catch (error) {
      console.error("Error fetching foods:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        calories_per_100g: parseFloat(formData.calories_per_100g),
        protein_g: parseFloat(formData.protein_g) || 0,
        carbs_g:   parseFloat(formData.carbs_g)   || 0,
        fat_g:     parseFloat(formData.fat_g)     || 0,
        fiber_g:   parseFloat(formData.fiber_g)   || 0,
      }
      if (editingFood) { await api.put(`/v1/foods/${editingFood.id}`, data) }
      else             { await api.post("/v1/foods", data) }
      setIsDialogOpen(false)
      resetForm()
      fetchFoods()
    } catch (error) {
      alert(error.message || "Error al guardar alimento")
    }
  }

  const handleEdit = (food) => {
    setEditingFood(food)
    setFormData({
      name: food.name || "", calories_per_100g: food.calories_per_100g || "",
      protein_g: food.protein_g || "", carbs_g: food.carbs_g || "",
      fat_g: food.fat_g || "", fiber_g: food.fiber_g || "", image_path: food.image_path || "",
    })
    setIsDialogOpen(true)
  }

  const askDelete = (id) => {
    setDeletingId(id)
    setConfirmOpen(true)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/v1/foods/${deletingId}`)
      setConfirmOpen(false)
      fetchFoods()
    } catch (error) {
      alert(error.message || "Error al eliminar alimento")
    } finally {
      setDeleting(false)
      setDeletingId(null)
    }
  }

  const resetForm = () => {
    setEditingFood(null)
    setFormData({ name: "", calories_per_100g: "", protein_g: "", carbs_g: "", fat_g: "", fiber_g: "", image_path: "" })
  }

  const calBar = (kcal) => Math.min(100, Math.round((parseFloat(kcal) / 900) * 100))

  // ── Estilos compartidos ──
  const S = {
    surface:  { background: "var(--color-surface)",       borderColor: "var(--color-border)" },
    raised:   { background: "var(--color-surface-raised)" },
    textMain: { color: "var(--color-foreground)" },
    textMuted:{ color: "var(--color-foreground-muted)" },
    textSub:  { color: "var(--color-foreground-subtle)" },
    border:   { borderColor: "var(--color-border)" },
    input:    { background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-foreground)" },
  }

  const iconBtn = (hoverColor) => ({
    base:  { color: "var(--color-foreground-subtle)", background: "transparent" },
    hover: { background: hoverColor + "18", color: hoverColor },
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold" style={S.textMain}>Alimentos</h1>
          <p className="text-sm mt-0.5" style={S.textMuted}>
            {total > 0 ? `${total} alimentos en catálogo` : "Catálogo de alimentos y macronutrientes"}
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setIsDialogOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors duration-150 text-white"
          style={{ background: "var(--color-primary)" }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--color-primary-hover)"}
          onMouseLeave={e => e.currentTarget.style.background = "var(--color-primary)"}
        >
          <Plus className="h-4 w-4" /> Nuevo alimento
        </button>
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={S.textSub} />
        <input
          placeholder="Buscar alimentos..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="w-full h-10 pl-9 pr-3 rounded-lg border text-sm outline-none transition-colors"
          style={S.input}
        />
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border overflow-hidden" style={{ ...S.surface, boxShadow: "var(--shadow-sm)" }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
          </div>
        ) : foods.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16" style={S.textMuted}>
            <UtensilsCrossed className="h-12 w-12 mb-3" style={S.textSub} />
            <p className="text-sm font-medium">No hay alimentos en el catálogo</p>
            <button className="text-sm mt-1 cursor-pointer" style={{ color: "var(--color-primary)" }}
              onClick={() => { resetForm(); setIsDialogOpen(true) }}>
              Agregar el primero
            </button>
          </div>
        ) : (
          <>
            {/* Header row */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b" style={{ ...S.raised, ...S.border }}>
              <p className="col-span-4 text-xs font-semibold uppercase tracking-wide" style={S.textMuted}>Alimento</p>
              <p className="col-span-5 text-xs font-semibold uppercase tracking-wide" style={S.textMuted}>Macronutrientes / 100g</p>
              <p className="col-span-3 text-xs font-semibold uppercase tracking-wide text-right" style={S.textMuted}>Acciones</p>
            </div>

            <div className="divide-y" style={S.border}>
              {foods.map((food) => (
                <div
                  key={food.id}
                  className="grid grid-cols-12 gap-4 px-5 py-4 items-center transition-colors duration-150"
                  onMouseEnter={e => e.currentTarget.style.background = "var(--color-surface-raised)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {/* Nombre + calorías */}
                  <div className="col-span-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "#16A34A18" }}>
                        <UtensilsCrossed className="h-4 w-4" style={{ color: "#16A34A" }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={S.textMain}>{food.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Flame className="h-3 w-3" style={{ color: "#F97316" }} />
                          <span className="text-xs" style={S.textMuted}>{food.calories_per_100g} kcal</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 ml-12 h-1 rounded-full overflow-hidden" style={{ background: "var(--color-surface-raised)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${calBar(food.calories_per_100g)}%`, background: "#F97316" }} />
                    </div>
                  </div>

                  {/* Macros */}
                  <div className="col-span-5 flex flex-wrap gap-1.5">
                    {[
                      { icon: Beef,     val: `P: ${food.protein_g}g`,  color: "#3B82F6" },
                      { icon: Wheat,    val: `C: ${food.carbs_g}g`,    color: "#F59E0B" },
                      { icon: Droplets, val: `G: ${food.fat_g}g`,      color: "#F97316" },
                      ...(parseFloat(food.fiber_g) > 0 ? [{ icon: Leaf, val: `F: ${food.fiber_g}g`, color: "#16A34A" }] : []),
                    ].map(({ icon: Icon, val, color }) => (
                      <span key={val} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full"
                        style={{ background: color + "18", color }}>
                        <Icon className="h-3 w-3" />{val}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="col-span-3 flex justify-end gap-1">
                    {[
                      { Icon: Pencil, color: "#64748B", onClick: () => handleEdit(food) },
                      { Icon: Trash2, color: "#DC2626", onClick: () => askDelete(food.id) },
                    ].map(({ Icon, color, onClick }, i) => (
                      <button key={i} onClick={onClick}
                        className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors duration-150"
                        style={{ color: "var(--color-foreground-subtle)", background: "transparent" }}
                        onMouseEnter={e => { e.currentTarget.style.background = color + "18"; e.currentTarget.style.color = color }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-foreground-subtle)" }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t" style={{ ...S.raised, ...S.border }}>
                <p className="text-xs" style={S.textSub}>Página {page} de {totalPages}</p>
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

      {/* ── Dialog ── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingFood ? "Editar alimento" : "Nuevo alimento"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium" style={S.textMuted}>Nombre</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium" style={S.textMuted}>Calorías por 100g</Label>
                <Input type="number" step="0.01" value={formData.calories_per_100g}
                  onChange={(e) => setFormData({ ...formData, calories_per_100g: e.target.value })} required />
              </div>
              <div className="border-t pt-4" style={S.border}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={S.textMuted}>Macronutrientes por 100g</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "protein_g", label: "Proteína (g)",      Icon: Beef,     color: "#3B82F6" },
                    { key: "carbs_g",   label: "Carbohidratos (g)", Icon: Wheat,    color: "#F59E0B" },
                    { key: "fat_g",     label: "Grasa (g)",         Icon: Droplets, color: "#F97316" },
                    { key: "fiber_g",   label: "Fibra (g)",         Icon: Leaf,     color: "#16A34A" },
                  ].map(({ key, label, Icon, color }) => (
                    <div key={key} className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1" style={S.textMuted}>
                        <Icon className="h-3 w-3" style={{ color }} />{label}
                      </Label>
                      <Input type="number" step="0.01" value={formData[key]}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs" style={S.textMuted}>URL de imagen (opcional)</Label>
                <Input value={formData.image_path} onChange={(e) => setFormData({ ...formData, image_path: e.target.value })}
                  placeholder="/images/foods/..." />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="cursor-pointer">Cancelar</Button>
              <button type="submit"
                className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer text-white transition-colors duration-150"
                style={{ background: "var(--color-primary)" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--color-primary-hover)"}
                onMouseLeave={e => e.currentTarget.style.background = "var(--color-primary)"}
              >
                {editingFood ? "Actualizar" : "Crear alimento"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={confirmOpen}
        title="¿Eliminar alimento?"
        description="Esta acción eliminará permanentemente el alimento del catálogo y no se puede deshacer."
        confirmLabel="Eliminar alimento"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => { setConfirmOpen(false); setDeletingId(null) }}
      />
    </div>
  )
}
