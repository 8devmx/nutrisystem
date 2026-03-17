"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { api } from "@/lib/api"
import ConfirmDialog from "@/components/admin/confirm-dialog"
import { ViewSelector } from "@/components/admin/view-selector"
import {
  UtensilsCrossed, Plus, Search, Pencil, Trash2,
  ChevronLeft, ChevronRight, Flame, Beef, Wheat, Droplets, Leaf, Check, Square,
  Barcode, X, AlertCircle, Loader2, ExternalLink, ArrowLeft,
} from "lucide-react"

// ─────────────────────────────────────────────────────────────────────────────
// Helpers Open Food Facts
// ─────────────────────────────────────────────────────────────────────────────

const OFF_BASE = "https://world.openfoodfacts.org"

// Extrae macros normalizados a 100g desde un producto de OFF
function extractMacros(product) {
  const n = product.nutriments || {}
  return {
    name:              product.product_name || product.product_name_es || "",
    brand:             product.brands || "",
    calories_per_100g: parseFloat(n["energy-kcal_100g"] ?? n["energy-kcal"] ?? 0).toFixed(2),
    protein_g:         parseFloat(n["proteins_100g"]    ?? n["proteins"]    ?? 0).toFixed(2),
    carbs_g:           parseFloat(n["carbohydrates_100g"]?? n["carbohydrates"]?? 0).toFixed(2),
    fat_g:             parseFloat(n["fat_100g"]          ?? n["fat"]          ?? 0).toFixed(2),
    fiber_g:           parseFloat(n["fiber_100g"]        ?? n["fiber"]        ?? 0).toFixed(2),
    image_url:         product.image_front_small_url || product.image_url || "",
    barcode:           product.code || "",
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal Open Food Facts
// ─────────────────────────────────────────────────────────────────────────────

function OpenFoodFactsModal({ open, onClose, onSelect }) {
  const [mode, setMode]         = useState("search")   // "search" | "barcode"
  const [query, setQuery]       = useState("")
  const [barcode, setBarcode]   = useState("")
  const [results, setResults]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")
  const [preview, setPreview]   = useState(null)        // producto seleccionado para confirmar
  const searchTimer             = useRef(null)

  // Reset al abrir/cerrar
  useEffect(() => {
    if (!open) {
      setQuery(""); setBarcode(""); setResults([])
      setError(""); setPreview(null); setLoading(false)
      setMode("search")
    }
  }, [open])

  // Búsqueda por texto con debounce
  useEffect(() => {
    if (mode !== "search") return
    clearTimeout(searchTimer.current)
    if (query.trim().length < 3) { setResults([]); return }

    searchTimer.current = setTimeout(async () => {
      setLoading(true); setError("")
      try {
        const url = `${OFF_BASE}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10&fields=code,product_name,product_name_es,brands,nutriments,image_front_small_url,countries_tags`
        const res  = await fetch(url)
        const data = await res.json()
        const products = (data.products || []).filter(p => p.product_name || p.product_name_es)
        setResults(products)
        if (products.length === 0) setError("Sin resultados. Intenta con otro término.")
      } catch {
        setError("No se pudo conectar con Open Food Facts.")
      } finally {
        setLoading(false)
      }
    }, 500)
  }, [query, mode])

  // Búsqueda por código de barras
  const searchByBarcode = async () => {
    if (!barcode.trim()) return
    setLoading(true); setError(""); setResults([])
    try {
      const res  = await fetch(`${OFF_BASE}/api/v2/product/${barcode.trim()}.json?fields=code,product_name,product_name_es,brands,nutriments,image_front_small_url`)
      const data = await res.json()
      if (data.status === 1 && data.product) {
        setPreview(extractMacros(data.product))
      } else {
        setError("Código de barras no encontrado en Open Food Facts.")
      }
    } catch {
      setError("No se pudo conectar con Open Food Facts.")
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (product) => {
    setPreview(extractMacros(product))
  }

  const handleConfirm = () => {
    if (!preview) return
    onSelect({
      name:             `${preview.name}${preview.brand ? ` – ${preview.brand}` : ""}`,
      calories_per_100g: preview.calories_per_100g,
      protein_g:        preview.protein_g,
      carbs_g:          preview.carbs_g,
      fat_g:            preview.fat_g,
      fiber_g:          preview.fiber_g,
      image_path:       preview.image_url,
    })
    onClose()
  }

  if (!open) return null

  const S = {
    surface:   { background: "var(--color-surface)",        borderColor: "var(--color-border)" },
    raised:    { background: "var(--color-surface-raised)", borderColor: "var(--color-border)" },
    textMain:  { color: "var(--color-foreground)" },
    textMuted: { color: "var(--color-foreground-muted)" },
    input:     { background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-foreground)" },
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border flex flex-col overflow-hidden"
        style={{ ...S.surface, boxShadow: "var(--shadow-lg)", maxHeight: "90vh" }}
      >
        {/* ── Header del modal ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-2.5">
            {preview ? (
              <button
                onClick={() => setPreview(null)}
                className="p-1.5 rounded-lg cursor-pointer transition-colors"
                onMouseEnter={e => e.currentTarget.style.background = "var(--color-surface-raised)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <ArrowLeft className="h-4 w-4" style={S.textMuted} />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#16A34A18" }}>
                <Barcode className="h-4 w-4" style={{ color: "#16A34A" }} />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold" style={S.textMain}>
                {preview ? "Confirmar alimento" : "Buscar en Open Food Facts"}
              </p>
              <p className="text-xs" style={S.textMuted}>
                {preview ? "Revisa y ajusta los valores antes de importar" : "Base de datos mundial de productos alimenticios"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg cursor-pointer transition-colors"
            onMouseEnter={e => e.currentTarget.style.background = "var(--color-surface-raised)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <X className="h-4 w-4" style={S.textMuted} />
          </button>
        </div>

        {/* ── Contenido scrollable ── */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Vista de preview/confirmación ── */}
          {preview ? (
            <div className="p-5 space-y-4">
              {/* Imagen + nombre */}
              <div className="flex items-start gap-4">
                {preview.image_url ? (
                  <img
                    src={preview.image_url}
                    alt={preview.name}
                    className="w-20 h-20 object-contain rounded-xl border flex-shrink-0"
                    style={{ borderColor: "var(--color-border)" }}
                    onError={e => e.target.style.display = "none"}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl border flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-surface-raised)" }}>
                    <UtensilsCrossed className="h-8 w-8" style={S.textMuted} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight" style={S.textMain}>{preview.name}</p>
                  {preview.brand && <p className="text-xs mt-0.5" style={S.textMuted}>{preview.brand}</p>}
                  {preview.barcode && (
                    <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] px-2 py-0.5 rounded-full"
                      style={{ background: "var(--color-surface-raised)", color: "var(--color-foreground-muted)" }}>
                      <Barcode className="h-3 w-3" /> {preview.barcode}
                    </span>
                  )}
                </div>
              </div>

              {/* Macros en cards */}
              <div className="grid grid-cols-5 gap-2">
                {[
                  { label: "Calorías", value: preview.calories_per_100g, unit: "kcal", color: "#F97316", Icon: Flame },
                  { label: "Proteína", value: preview.protein_g,         unit: "g",    color: "#3B82F6", Icon: Beef },
                  { label: "Carbs",    value: preview.carbs_g,           unit: "g",    color: "#F59E0B", Icon: Wheat },
                  { label: "Grasa",    value: preview.fat_g,             unit: "g",    color: "#F97316", Icon: Droplets },
                  { label: "Fibra",    value: preview.fiber_g,           unit: "g",    color: "#16A34A", Icon: Leaf },
                ].map(({ label, value, unit, color, Icon }) => (
                  <div key={label} className="rounded-xl p-2.5 text-center border" style={{ background: color + "10", borderColor: color + "30" }}>
                    <Icon className="h-3.5 w-3.5 mx-auto mb-1" style={{ color }} />
                    <p className="text-sm font-bold leading-none" style={{ color }}>{value}</p>
                    <p className="text-[10px] mt-0.5" style={S.textMuted}>{unit}</p>
                    <p className="text-[10px]" style={S.textMuted}>{label}</p>
                  </div>
                ))}
              </div>

              <p className="text-xs text-center" style={S.textMuted}>
                Valores por 100g · Fuente: Open Food Facts
              </p>

              {/* Advertencia si algún macro es 0 */}
              {(parseFloat(preview.calories_per_100g) === 0) && (
                <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: "#F59E0B15", border: "1px solid #F59E0B30" }}>
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "#F59E0B" }} />
                  <p className="text-xs" style={{ color: "#92400E" }}>
                    Las calorías aparecen en 0. Este producto puede tener información incompleta en Open Food Facts. Revisa los valores antes de guardar.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 space-y-4">
              {/* ── Tabs búsqueda / código ── */}
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--color-surface-raised)" }}>
                {[
                  { id: "search",  label: "Buscar por nombre", Icon: Search },
                  { id: "barcode", label: "Código de barras",  Icon: Barcode },
                ].map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => { setMode(id); setError(""); setResults([]) }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium cursor-pointer transition-all duration-150"
                    style={mode === id
                      ? { background: "var(--color-surface)", color: "var(--color-primary)", boxShadow: "var(--shadow-sm)" }
                      : { color: "var(--color-foreground-muted)", background: "transparent" }
                    }
                  >
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </button>
                ))}
              </div>

              {/* ── Input según modo ── */}
              {mode === "search" ? (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={S.textMuted} />
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Ej: jamón pechuga pavo, avena quaker, leche lala..."
                    autoFocus
                    className="w-full h-10 pl-9 pr-3 rounded-lg border text-sm"
                    style={S.input}
                  />
                  {loading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" style={S.textMuted} />
                  )}
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={S.textMuted} />
                    <input
                      type="text"
                      value={barcode}
                      onChange={e => setBarcode(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && searchByBarcode()}
                      placeholder="Ej: 7501040000300"
                      autoFocus
                      className="w-full h-10 pl-9 pr-3 rounded-lg border text-sm"
                      style={S.input}
                    />
                  </div>
                  <button
                    onClick={searchByBarcode}
                    disabled={loading || !barcode.trim()}
                    className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer text-white flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                    style={{ background: "var(--color-primary)" }}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    Buscar
                  </button>
                </div>
              )}

              {/* ── Error ── */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "#DC262615", border: "1px solid #DC262630" }}>
                  <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: "#DC2626" }} />
                  <p className="text-xs" style={{ color: "#DC2626" }}>{error}</p>
                </div>
              )}

              {/* ── Resultados ── */}
              {results.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium" style={S.textMuted}>{results.length} resultados</p>
                  <div className="space-y-1 max-h-64 overflow-y-auto rounded-xl border" style={{ borderColor: "var(--color-border)" }}>
                    {results.map((product, i) => {
                      const n    = product.nutriments || {}
                      const kcal = parseFloat(n["energy-kcal_100g"] ?? n["energy-kcal"] ?? 0)
                      const isMx = (product.countries_tags || []).some(c => c.includes("mexico"))
                      return (
                        <div
                          key={product.code || i}
                          onClick={() => handleSelect(product)}
                          className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors first:rounded-t-xl last:rounded-b-xl border-b last:border-b-0"
                          style={{ borderColor: "var(--color-border)" }}
                          onMouseEnter={e => e.currentTarget.style.background = "var(--color-surface-raised)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          {/* Imagen miniatura */}
                          <div className="w-10 h-10 rounded-lg border overflow-hidden flex-shrink-0 flex items-center justify-center"
                            style={{ borderColor: "var(--color-border)", background: "var(--color-surface-raised)" }}>
                            {product.image_front_small_url
                              ? <img src={product.image_front_small_url} alt="" className="w-full h-full object-contain" onError={e => e.target.style.display = "none"} />
                              : <UtensilsCrossed className="h-4 w-4" style={S.textMuted} />
                            }
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium truncate" style={S.textMain}>
                                {product.product_name || product.product_name_es}
                              </p>
                              {isMx && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium"
                                  style={{ background: "#16A34A18", color: "#16A34A" }}>🇲🇽 MX</span>
                              )}
                            </div>
                            <p className="text-xs truncate" style={S.textMuted}>{product.brands || "Sin marca"}</p>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Flame className="h-3 w-3" style={{ color: "#F97316" }} />
                            <span className="text-xs font-medium" style={{ color: "#F97316" }}>{kcal} kcal</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── Estado vacío inicial ── */}
              {!loading && results.length === 0 && !error && (
                <div className="text-center py-8" style={S.textMuted}>
                  {mode === "search" ? (
                    <>
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Escribe al menos 3 caracteres para buscar</p>
                      <p className="text-xs mt-1 opacity-60">Puedes buscar en español o inglés</p>
                    </>
                  ) : (
                    <>
                      <Barcode className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Ingresa el código de barras del producto</p>
                      <p className="text-xs mt-1 opacity-60">Búscalo en el empaque del producto</p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-5 py-3 border-t flex-shrink-0" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-raised)" }}>
          <a
            href="https://world.openfoodfacts.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs cursor-pointer"
            style={{ color: "var(--color-foreground-muted)" }}
          >
            <ExternalLink className="h-3 w-3" />
            Open Food Facts
          </a>

          {preview ? (
            <div className="flex gap-2">
              <button
                onClick={() => setPreview(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border"
                style={{ borderColor: "var(--color-border)", color: "var(--color-foreground-muted)" }}
              >
                Volver
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer text-white"
                style={{ background: "var(--color-primary)" }}
              >
                Importar alimento
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border"
              style={{ borderColor: "var(--color-border)", color: "var(--color-foreground-muted)" }}
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────

import { useToast } from "@/components/providers"

export default function AdminFoods() {
  const toast = useToast()
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
  const [view, setView]                 = useState("table")
  const [selectedIds, setSelectedIds]   = useState(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [offModalOpen, setOffModalOpen] = useState(false)   // ← modal Open Food Facts
  const [formData, setFormData]       = useState({
    name: "", calories_per_100g: "",
    protein_g: "", carbs_g: "", fat_g: "", fiber_g: "", image_path: "",
  })

  useEffect(() => { fetchFoods() }, [page, search])
  useEffect(() => { setSelectedIds(new Set()) }, [page, search])

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
      toast.error(error.message || "Error al guardar alimento")
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

  const askDelete = (id) => { setDeletingId(id); setConfirmOpen(true) }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/v1/foods/${deletingId}`)
      setConfirmOpen(false)
      fetchFoods()
    } catch (error) {
      toast.error(error.message || "Error al eliminar alimento")
    } finally {
      setDeleting(false); setDeletingId(null)
    }
  }

  const resetForm = () => {
    setEditingFood(null)
    setFormData({ name: "", calories_per_100g: "", protein_g: "", carbs_g: "", fat_g: "", fiber_g: "", image_path: "" })
  }

  // Callback cuando el usuario confirma un producto de OFF
  const handleOFFImport = (data) => {
    setFormData(data)
    setIsDialogOpen(true)
  }

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedIds)
    newSelected.has(id) ? newSelected.delete(id) : newSelected.add(id)
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.size === foods.length ? new Set() : new Set(foods.map(f => f.id)))
  }

  const askBulkDelete = () => { setDeletingId(Array.from(selectedIds)); setConfirmOpen(true) }

  const handleBulkDelete = async () => {
    setBulkDeleting(true)
    try {
      const ids = Array.from(deletingId)
      await Promise.all(ids.map(id => api.delete(`/v1/foods/${id}`)))
      setConfirmOpen(false); setSelectedIds(new Set()); fetchFoods()
    } catch (error) {
      toast.error(error.message || "Error al eliminar alimentos")
    } finally {
      setBulkDeleting(false); setDeletingId(null)
    }
  }

  const calBar = (kcal) => Math.min(100, Math.round((parseFloat(kcal) / 900) * 100))

  const S = {
    surface:   { background: "var(--color-surface)",        borderColor: "var(--color-border)" },
    raised:    { background: "var(--color-surface-raised)" },
    textMain:  { color: "var(--color-foreground)" },
    textMuted: { color: "var(--color-foreground-muted)" },
    textSub:   { color: "var(--color-foreground-subtle)" },
    border:    { borderColor: "var(--color-border)" },
    input:     { background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-foreground)" },
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* ── Modal Open Food Facts ── */}
      <OpenFoodFactsModal
        open={offModalOpen}
        onClose={() => setOffModalOpen(false)}
        onSelect={handleOFFImport}
      />

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold" style={S.textMain}>Alimentos</h1>
          <p className="text-sm mt-0.5" style={S.textMuted}>
            {total > 0 ? `${total} alimentos en catálogo` : "Catálogo de alimentos y macronutrientes"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <button
              onClick={askBulkDelete}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors duration-150 text-white"
              style={{ background: "#DC2626" }}
              onMouseEnter={e => e.currentTarget.style.background = "#B91C1C"}
              onMouseLeave={e => e.currentTarget.style.background = "#DC2626"}
            >
              <Trash2 className="h-4 w-4" /> Eliminar ({selectedIds.size})
            </button>
          )}
          <ViewSelector view={view} onViewChange={setView} />
          {/* Botón Open Food Facts */}
          <button
            onClick={() => setOffModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors duration-150 border"
            style={{ borderColor: "var(--color-border)", color: "var(--color-foreground-muted)", background: "var(--color-surface)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--color-surface-raised)"; e.currentTarget.style.color = "var(--color-foreground)" }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--color-surface)"; e.currentTarget.style.color = "var(--color-foreground-muted)" }}
            title="Importar desde Open Food Facts"
          >
            <Barcode className="h-4 w-4" /> Importar
          </button>
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

      {/* ── Table / Cards ── */}
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
        ) : view === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {foods.map((food) => (
              <div key={food.id}
                className="rounded-lg border p-4 transition-colors duration-150 relative"
                style={{ background: "var(--color-surface)", borderColor: selectedIds.has(food.id) ? "var(--color-primary)" : "var(--color-border)" }}
              >
                <button onClick={() => toggleSelect(food.id)}
                  className="absolute top-3 right-3 w-5 h-5 flex items-center justify-center cursor-pointer"
                  style={{ color: selectedIds.has(food.id) ? "var(--color-primary)" : "var(--color-foreground-muted)" }}>
                  {selectedIds.has(food.id) ? <Check className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "#16A34A18" }}>
                    <UtensilsCrossed className="h-5 w-5" style={{ color: "#16A34A" }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate" style={S.textMain}>{food.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Flame className="h-3 w-3" style={{ color: "#F97316" }} />
                      <span className="text-xs" style={S.textMuted}>{food.calories_per_100g} kcal</span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-surface-raised)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${calBar(food.calories_per_100g)}%`, background: "#F97316" }} />
                </div>
                <div className="mt-3 pt-3 border-t flex flex-wrap gap-1.5" style={{ borderColor: "var(--color-border)" }}>
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
                <div className="flex justify-end gap-1 mt-3">
                  {[
                    { Icon: Pencil, color: "#64748B", onClick: () => handleEdit(food) },
                    { Icon: Trash2, color: "#DC2626", onClick: () => askDelete(food.id) },
                  ].map(({ Icon, color, onClick }, i) => (
                    <button key={i} onClick={onClick}
                      className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors duration-150"
                      style={{ color: "var(--color-foreground-subtle)", background: "transparent" }}
                      onMouseEnter={e => { e.currentTarget.style.background = color + "18"; e.currentTarget.style.color = color }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-foreground-subtle)" }}>
                      <Icon className="h-3.5 w-3.5" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b items-center" style={{ ...S.raised, ...S.border }}>
              <button onClick={toggleSelectAll}
                className="w-5 h-5 flex items-center justify-center cursor-pointer"
                style={{ color: selectedIds.size === foods.length && foods.length > 0 ? "var(--color-primary)" : "var(--color-foreground-muted)" }}>
                {selectedIds.size === foods.length && foods.length > 0 ? <Check className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              </button>
              <p className="col-span-3 text-xs font-semibold uppercase tracking-wide" style={S.textMuted}>Alimento</p>
              <p className="col-span-5 text-xs font-semibold uppercase tracking-wide" style={S.textMuted}>Macronutrientes / 100g</p>
              <p className="col-span-3 text-xs font-semibold uppercase tracking-wide text-right" style={S.textMuted}>Acciones</p>
            </div>
            <div className="divide-y" style={S.border}>
              {foods.map((food) => (
                <div key={food.id}
                  className="grid grid-cols-12 gap-4 px-5 py-4 items-center transition-colors duration-150"
                  onMouseEnter={e => e.currentTarget.style.background = "var(--color-surface-raised)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <button onClick={() => toggleSelect(food.id)}
                    className="w-5 h-5 flex items-center justify-center cursor-pointer"
                    style={{ color: selectedIds.has(food.id) ? "var(--color-primary)" : "var(--color-foreground-muted)" }}>
                    {selectedIds.has(food.id) ? <Check className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  </button>
                  <div className="col-span-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#16A34A18" }}>
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
                  <div className="col-span-3 flex justify-end gap-1">
                    {[
                      { Icon: Pencil, color: "#64748B", onClick: () => handleEdit(food) },
                      { Icon: Trash2, color: "#DC2626", onClick: () => askDelete(food.id) },
                    ].map(({ Icon, color, onClick }, i) => (
                      <button key={i} onClick={onClick}
                        className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors duration-150"
                        style={{ color: "var(--color-foreground-subtle)", background: "transparent" }}
                        onMouseEnter={e => { e.currentTarget.style.background = color + "18"; e.currentTarget.style.color = color }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-foreground-subtle)" }}>
                        <Icon className="h-3.5 w-3.5" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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

      {/* ── Dialog crear/editar ── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingFood ? "Editar alimento" : "Nuevo alimento"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-3">
              {/* Botón importar desde OFF dentro del form (solo en modo crear) */}
              {!editingFood && (
                <button
                  type="button"
                  onClick={() => { setIsDialogOpen(false); setOffModalOpen(true) }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium cursor-pointer transition-colors"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-foreground-muted)", borderStyle: "dashed" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.color = "var(--color-primary)" }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-foreground-muted)" }}
                >
                  <Barcode className="h-4 w-4" />
                  Autocompletar desde Open Food Facts
                </button>
              )}
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
        title={Array.isArray(deletingId) ? `¿Eliminar ${deletingId.length} alimentos?` : "¿Eliminar alimento?"}
        description={Array.isArray(deletingId)
          ? `Esta acción eliminará permanentemente los ${deletingId.length} alimentos seleccionados del catálogo y no se puede deshacer.`
          : "Esta acción eliminará permanentemente el alimento del catálogo y no se puede deshacer."
        }
        confirmLabel={Array.isArray(deletingId) ? `Eliminar ${deletingId.length} alimentos` : "Eliminar alimento"}
        loading={deleting || bulkDeleting}
        onConfirm={Array.isArray(deletingId) ? handleBulkDelete : handleDelete}
        onCancel={() => { setConfirmOpen(false); setDeletingId(null) }}
      />
    </div>
  )
}
