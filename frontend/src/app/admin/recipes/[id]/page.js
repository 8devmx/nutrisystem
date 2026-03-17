"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, Plus, Trash2, BookOpen, Flame, Beef, Wheat, Droplets } from "lucide-react"
import { useToast } from "@/components/providers"

// ─────────────────────────────────────────────────────────────────────────────
// IngredientRow — componente aislado para que el estado del buscador
// NO cause re-renders en las demás filas ni en el padre.
// Busca contra el API en tiempo real para incluir TODOS los alimentos.
// ─────────────────────────────────────────────────────────────────────────────
function IngredientRow({ ing, units, onUpdate, onRemove, S, apiGet }) {
  const [text, setText] = useState(ing.food?.name || "")
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const blurTimer = useRef(null)
  const searchTimer = useRef(null)

  // Sincroniza el texto si el padre cambia el alimento desde afuera (ej: carga inicial)
  useEffect(() => {
    setText(ing.food?.name || "")
  }, [ing.food?.name])

  const searchFoods = async (q) => {
    if (q.trim().length === 0) {
      setResults([])
      setOpen(false)
      return
    }
    setSearching(true)
    try {
      const res = await apiGet(`/v1/foods?search=${encodeURIComponent(q)}&per_page=10`)
      const items = res.data.data || res.data
      setResults(Array.isArray(items) ? items : [])
      setOpen(true)
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleChange = (value) => {
    setText(value)
    if (value.trim().length === 0) {
      onUpdate("food_id", "")
      onUpdate("food", null)
      setResults([])
      setOpen(false)
      return
    }
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => searchFoods(value), 300)
  }

  const handleFocus = () => {
    clearTimeout(blurTimer.current)
    // Si hay texto pero sin selección, re-busca
    if (text.trim().length > 0 && !ing.food_id) {
      searchFoods(text)
    } else if (text.trim().length === 0) {
      // Al enfocar vacío, muestra los primeros resultados
      searchFoods(" ")
    }
  }

  const handleBlur = () => {
    blurTimer.current = setTimeout(() => {
      setOpen(false)
      // Si no hay alimento seleccionado, limpia el texto
      if (!ing.food_id) setText("")
    }, 150)
  }

  const handleSelect = (food) => {
    clearTimeout(blurTimer.current)
    setText(food.name)
    setOpen(false)
    setResults([])
    onUpdate("food_id", food.id)
    onUpdate("food", food)
  }

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg"
      style={{ background: "var(--color-surface-raised)" }}
    >
      {/* ── Buscador de alimento ── */}
      <div className="flex-1 relative">
        <input
          type="text"
          value={text}
          onChange={e => handleChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Buscar alimento..."
          autoComplete="off"
          className="w-full h-10 px-3 rounded-lg border text-sm"
          style={{
            ...S.input,
            borderColor: ing.food_id ? "var(--color-primary)" : "var(--color-border)",
            outline: "none",
          }}
        />

        {/* Spinner de búsqueda o punto indicador */}
        {searching ? (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "var(--color-foreground-muted)" }} />
          </span>
        ) : ing.food_id ? (
          <span
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none"
            style={{ background: "var(--color-primary)" }}
          />
        ) : null}

        {/* Dropdown */}
        {open && results.length > 0 && (
          <div
            className="absolute z-30 w-full mt-1 rounded-lg border shadow-lg overflow-auto"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
              maxHeight: "200px",
            }}
          >
            {results.map(f => (
              <div
                key={f.id}
                onMouseDown={() => handleSelect(f)}
                className="px-3 py-2 text-sm cursor-pointer"
                style={{ color: "var(--color-foreground)" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--color-surface-raised)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {f.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Unidad ── */}
      <select
        value={ing.unit_id}
        onChange={e => onUpdate("unit_id", e.target.value)}
        className="w-24 h-10 px-2 rounded-lg border text-sm"
        style={S.input}
      >
        <option value="">Unidad</option>
        {units.map(u => (
          <option key={u.id} value={u.id}>{u.abbreviation}</option>
        ))}
      </select>

      {/* ── Cantidad ── */}
      <input
        type="number"
        value={ing.quantity}
        onChange={e => onUpdate("quantity", e.target.value)}
        placeholder="Cant"
        min="0"
        step="any"
        className="w-20 h-10 px-2 rounded-lg border text-sm"
        style={S.input}
      />

      {/* ── Eliminar ── */}
      <button
        type="button"
        onClick={onRemove}
        className="p-2 rounded-lg cursor-pointer flex-shrink-0 transition-colors"
        onMouseEnter={e => e.currentTarget.style.background = "#FEE2E218"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <Trash2 className="h-4 w-4" style={{ color: "#DC2626" }} />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────
export default function RecipeFormPage() {
  const router = useRouter()
  const params = useParams()
  const recipeId = params.id && params.id !== "new" ? parseInt(params.id) : null

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(true)
  const [units, setUnits] = useState([])
  const toast = useToast()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    servings: 1,
    prep_time_minutes: "",
  })

  // Cada ingrediente tiene un `_key` estable para que React no destruya las filas
  const [ingredients, setIngredients] = useState([])
  const nextKey = useRef(0)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const unitsRes = await api.get("/v1/units")
      setUnits(unitsRes.data.data || unitsRes.data)

      if (recipeId) {
        const recipeRes = await api.get(`/v1/recipes/${recipeId}`)
        const recipe = recipeRes.data.data || recipeRes.data
        setFormData({
          title: recipe.title || "",
          description: recipe.description || "",
          servings: recipe.servings || 1,
          prep_time_minutes: recipe.prep_time_minutes || "",
        })
        const ings = (recipe.ingredients || []).map(ing => ({
          ...ing,
          _key: nextKey.current++,
        }))
        setIngredients(ings)
      }
    } catch (err) {
      console.error("Error fetching data:", err)
    } finally {
      setFetchingData(false)
    }
  }

  const addIngredient = () => {
    setIngredients(prev => [
      ...prev,
      { _key: nextKey.current++, food_id: "", food: null, unit_id: "", quantity: "" },
    ])
  }

  // useCallback para que la referencia sea estable y no cause re-renders en IngredientRow
  const updateIngredient = useCallback((key, field, value) => {
    setIngredients(prev =>
      prev.map(ing =>
        ing._key === key ? { ...ing, [field]: value } : ing
      )
    )
  }, [])

  const removeIngredient = useCallback((key) => {
    setIngredients(prev => prev.filter(ing => ing._key !== key))
  }, [])

  const calculateMacros = () => {
    const total = { calories: 0, protein: 0, carbs: 0, fat: 0 }
    ingredients.forEach(ing => {
      if (!ing.food_id || !ing.unit_id || !ing.quantity) return
      const unit = units.find(u => u.id === parseInt(ing.unit_id))
      // El objeto food viene embebido en el ingrediente desde que el usuario lo selecciona
      const food = ing.food
      if (!unit || !food) return
      const grams = (parseFloat(unit.conversion_to_grams) || 1) * parseFloat(ing.quantity)
      total.calories += (food.calories_per_100g * grams) / 100
      total.protein  += (food.protein_g  * grams) / 100
      total.carbs    += (food.carbs_g    * grams) / 100
      total.fat      += (food.fat_g      * grams) / 100
    })
    return total
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const invalid = ingredients.some(ing => !ing.food_id || !ing.unit_id || ing.quantity === "" || ing.quantity === null || ing.quantity === undefined)
    if (invalid) {
      toast.warning("Todos los ingredientes deben tener alimento, unidad y cantidad.")
      return
    }
    setLoading(true)
    try {
      const payload = {
        title:            formData.title,
        description:      formData.description || null,
        servings:         parseInt(formData.servings, 10) || 1,
        prep_time_minutes: formData.prep_time_minutes ? parseInt(formData.prep_time_minutes, 10) : null,
        ingredients: ingredients.map(ing => ({
          food_id:  Number(ing.food_id),
          unit_id:  Number(ing.unit_id),
          quantity: parseFloat(parseFloat(ing.quantity ?? 0).toFixed(2)),
        })),
      }

      if (recipeId) {
        await api.put(`/v1/recipes/${recipeId}`, payload)
      } else {
        await api.post("/v1/recipes", payload)
      }
      toast.success(recipeId ? "Receta actualizada" : "Receta creada")
      router.push("/admin/recipes")
    } catch (err) {
      if (err.errors) {
        const primer = Object.values(err.errors)[0]?.[0]
        toast.error(primer || "Error de validación", "Error al guardar")
      } else {
        toast.error(err.message || "Error al guardar receta")
      }
    } finally {
      setLoading(false)
    }
  }

  const macros = calculateMacros()
  const hasValidIngredient = ingredients.some(i => i.food_id && i.unit_id && i.quantity)

  const S = {
    surface: { background: "var(--color-surface)", borderColor: "var(--color-border)" },
    textMain: { color: "var(--color-foreground)" },
    textMuted: { color: "var(--color-foreground-muted)" },
    input: { background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-foreground)" },
  }

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--color-primary)" }} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <Link href="/admin/recipes">
          <button
            className="p-2 rounded-lg cursor-pointer transition-colors"
            onMouseEnter={e => e.currentTarget.style.background = "var(--color-surface-raised)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <ArrowLeft className="h-5 w-5" style={S.textMuted} />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-heading font-bold" style={S.textMain}>
            {recipeId ? "Editar receta" : "Nueva receta"}
          </h1>
          <p className="text-sm mt-0.5" style={S.textMuted}>
            {recipeId ? "Modifica los datos de la receta" : "Crea una nueva receta nutricional"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Datos generales ── */}
        <div className="rounded-xl border p-6" style={S.surface}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={S.textMain}>
            <BookOpen className="h-5 w-5" /> Datos de la receta
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label style={S.textMuted}>Título de la receta</Label>
              <Input
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Sandwich de Jamón y Queso"
                required
                style={S.input}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label style={S.textMuted}>Descripción (opcional)</Label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe tu receta..."
                className="w-full px-3 py-2 rounded-lg border text-sm min-h-[80px]"
                style={S.input}
              />
            </div>
            <div className="space-y-2">
              <Label style={S.textMuted}>Porciones</Label>
              <Input
                type="number" min="1"
                value={formData.servings}
                onChange={e => setFormData({ ...formData, servings: e.target.value })}
                placeholder="1"
                style={S.input}
              />
            </div>
            <div className="space-y-2">
              <Label style={S.textMuted}>Tiempo de preparación (min)</Label>
              <Input
                type="number" min="1"
                value={formData.prep_time_minutes}
                onChange={e => setFormData({ ...formData, prep_time_minutes: e.target.value })}
                placeholder="15"
                style={S.input}
              />
            </div>
          </div>
        </div>

        {/* ── Ingredientes ── */}
        <div className="rounded-xl border p-6" style={S.surface}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={S.textMain}>Ingredientes</h2>
            <button
              type="button"
              onClick={addIngredient}
              className="px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer text-white flex items-center gap-1"
              style={{ background: "var(--color-primary)" }}
            >
              <Plus className="h-4 w-4" /> Agregar
            </button>
          </div>

          <div className="space-y-3">
            {ingredients.map(ing => (
              <IngredientRow
                key={ing._key}
                ing={ing}
                units={units}
                S={S}
                apiGet={api.get.bind(api)}
                onUpdate={(field, value) => updateIngredient(ing._key, field, value)}
                onRemove={() => removeIngredient(ing._key)}
              />
            ))}
            {ingredients.length === 0 && (
              <p className="text-center py-8 text-sm" style={S.textMuted}>
                Agrega ingredientes a tu receta con el botón de arriba
              </p>
            )}
          </div>
        </div>

        {/* ── Resumen nutricional ── */}
        {hasValidIngredient && (
          <div className="rounded-xl border p-6" style={S.surface}>
            <h2 className="text-lg font-semibold mb-4" style={S.textMain}>Resumen nutricional total</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg" style={{ background: "#F9731618" }}>
                <Flame className="h-4 w-4 mx-auto mb-1" style={{ color: "#F97316" }} />
                <p className="text-2xl font-bold" style={{ color: "#F97316" }}>{Math.round(macros.calories)}</p>
                <p className="text-xs mt-0.5" style={S.textMuted}>kcal</p>
              </div>
              <div className="text-center p-4 rounded-lg" style={{ background: "#3B82F618" }}>
                <Beef className="h-4 w-4 mx-auto mb-1" style={{ color: "#3B82F6" }} />
                <p className="text-2xl font-bold" style={{ color: "#3B82F6" }}>{Math.round(macros.protein)}g</p>
                <p className="text-xs mt-0.5" style={S.textMuted}>Proteína</p>
              </div>
              <div className="text-center p-4 rounded-lg" style={{ background: "#F59E0B18" }}>
                <Wheat className="h-4 w-4 mx-auto mb-1" style={{ color: "#F59E0B" }} />
                <p className="text-2xl font-bold" style={{ color: "#F59E0B" }}>{Math.round(macros.carbs)}g</p>
                <p className="text-xs mt-0.5" style={S.textMuted}>Carbohidratos</p>
              </div>
              <div className="text-center p-4 rounded-lg" style={{ background: "#F9731618" }}>
                <Droplets className="h-4 w-4 mx-auto mb-1" style={{ color: "#F97316" }} />
                <p className="text-2xl font-bold" style={{ color: "#F97316" }}>{Math.round(macros.fat)}g</p>
                <p className="text-xs mt-0.5" style={S.textMuted}>Grasa</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Acciones ── */}
        <div className="flex justify-end gap-3">
          <Link href="/admin/recipes">
            <button
              type="button"
              className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer border"
              style={{ borderColor: "var(--color-border)", color: "var(--color-foreground-muted)" }}
            >
              Cancelar
            </button>
          </Link>
          <button
            type="submit"
            disabled={loading || ingredients.length === 0}
            className="px-6 py-2 rounded-lg text-sm font-medium cursor-pointer text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "var(--color-primary)" }}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {recipeId ? "Actualizar receta" : "Crear receta"}
          </button>
        </div>
      </form>
    </div>
  )
}
