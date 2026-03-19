"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  CalendarDays, ArrowLeft, Loader2, Target, Flame, Beef, Droplets, Wheat, Plus, Trash2,
} from "lucide-react"
import { useToast } from "@/components/providers"

// ── Constantes ────────────────────────────────────────────────────────────────

const DURATION_META = {
  weekly:   { label: "Semanal",   days: 7 },
  biweekly: { label: "Quincenal", days: 14 },
  monthly:  { label: "Mensual",   days: 30 },
}

const ACTIVITY_META = {
  sedentary:   { label: "Sedentario",   desc: "Menos de 3 horas de ejercicio/semana", color: "#6B7280", protein: 0.35, carbs: 0.35, fat: 0.30 },
  light:       { label: "Ligero",       desc: "3-5 horas de ejercicio/semana",        color: "#10B981", protein: 0.30, carbs: 0.40, fat: 0.30 },
  moderate:    { label: "Moderado",     desc: "6-7 horas de ejercicio/semana",        color: "#F59E0B", protein: 0.25, carbs: 0.45, fat: 0.30 },
  active:      { label: "Activo",       desc: "8-10 horas de ejercicio/semana",       color: "#F97316", protein: 0.25, carbs: 0.50, fat: 0.25 },
  very_active: { label: "Muy activo",   desc: "Más de 10 horas de ejercicio/semana",  color: "#EF4444", protein: 0.20, carbs: 0.55, fat: 0.25 },
}

const MEAL_MOMENTS = [
  { key: "breakfast",       label: "Desayuno" },
  { key: "morning_snack",   label: "Colación mañana" },
  { key: "lunch",           label: "Comida" },
  { key: "afternoon_snack", label: "Colación tarde" },
  { key: "dinner",          label: "Cena" },
]

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

const formatDateRangeSpanish = (startDate, days) => {
  const start = new Date(startDate + 'T12:00:00')
  const end   = new Date(start)
  end.setDate(end.getDate() + days)
  const startDay   = start.getDate()
  const endDay     = end.getDate()
  const startMonth = MESES[start.getMonth()]
  const endMonth   = MESES[end.getMonth()]
  const year       = start.getFullYear()
  return start.getMonth() === end.getMonth()
    ? `del ${startDay} al ${endDay} de ${startMonth} de ${year}`
    : `del ${startDay} de ${startMonth} al ${endDay} de ${endMonth} del ${year}`
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function EditPlanPage() {
  const router  = useRouter()
  const { id: planId } = useParams()
  const toast   = useToast()

  const [users, setUsers]             = useState([])
  const [units, setUnits]             = useState([])
  const [recipes, setRecipes]         = useState([])
  const recipesRef = React.useRef([])
  const setRecipesAndRef = (data) => {
    recipesRef.current = data
    setRecipes(data)
  }
  const [loading, setLoading]         = useState(false)
  const [fetchingData, setFetchingData] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)

  const [formData, setFormData] = useState({
    user_id: "", title: "", duration: "weekly",
    start_date: "", target_weight_kg: "", activity_factor: "moderate",
    weight_kg: "", height_cm: "", age: "", sex: "male",
    total_calories: "", protein_goal_g: "", carbs_goal_g: "", fat_goal_g: "",
  })

  // meals: { "1-breakfast": [{food_id, food, quantity, unit_id, _existing, meal_id, ...}] }
  const [meals, setMeals]     = useState({})
  const [foodSearch, setFoodSearch]   = useState({})
  const [foodResults, setFoodResults] = useState({})
  const [foodTimers, setFoodTimers]   = useState({})

  const totalDays = DURATION_META[formData.duration]?.days || 7

  // ── Carga inicial ──────────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      try {
        // Cargar plan, usuarios y unidades primero (crÃ­ticos)
        const [planRes, usersRes, unitsRes] = await Promise.all([
          api.get(`/v1/plans/${planId}`),
          api.get("/v1/admin/users?per_page=100"),
          api.get("/v1/units"),
        ])

        const data     = planRes.data
        const allUsers = usersRes.data.data || usersRes.data
        const allUnits = unitsRes.data.data || unitsRes.data || []

        setUsers(allUsers)
        setUnits(allUnits)

        // Precargar datos del plan en el formulario
        setFormData({
          user_id:          data.plan.user_id ? String(data.plan.user_id) : "",
          title:            data.plan.title || "",
          duration:         data.plan.duration || "weekly",
          start_date:       (data.plan.start_date || "").split("T")[0],
          target_weight_kg: data.plan.target_weight_kg ?? "",
          activity_factor:  data.plan.activity_factor || "moderate",
          weight_kg:        data.user?.weight_kg ?? "",
          height_cm:        data.user?.height_cm ?? "",
          age:              data.user?.age ?? "",
          sex:              data.user?.sex || "male",
          total_calories:   data.plan.total_calories || "",
          protein_goal_g:   data.plan.protein_goal_g || "",
          carbs_goal_g:     data.plan.carbs_goal_g || "",
          fat_goal_g:       data.plan.fat_goal_g || "",
        })

        const match = allUsers.find(u => String(u.id) === String(data.plan.user_id))
        if (match) setSelectedUser(match)

        // Cargar comidas existentes en el formato local
        const localMeals = {}
        Object.entries(data.days || {}).forEach(([dayNum, moments]) => {
          Object.entries(moments).forEach(([moment, items]) => {
            const key = `${dayNum}-${moment}`
            localMeals[key] = items.map(item => ({
              _existing: true,
              meal_id:   item.meal_id,
              food_id:   item.food?.id,
              food:      item.food,
              quantity:  Number(item.quantity),
              unit_id:   item.unit?.id,
              unit:      item.unit,
            }))
          })
        })
        setMeals(localMeals)

      } catch (e) {
        console.error("Error cargando plan:", e)
        toast.error("No se pudo cargar el plan")
      } finally {
        setFetchingData(false)
      }

      // Cargar recetas en background â€" no bloquea la carga principal
      try {
        const recipesRes = await api.get("/v1/recipes?per_page=100")
        const recipesRaw = recipesRes.data?.data?.data || recipesRes.data?.data || recipesRes.data || []
        const withIngredients = await Promise.allSettled(
          recipesRaw.map(r => api.get(`/v1/recipes/${r.id}`))
        )
        const loaded = withIngredients
          .filter(r => r.status === 'fulfilled')
          .map(r => r.value.data)
        setRecipesAndRef(loaded)
      } catch (e) {
        console.warn("No se pudieron cargar las recetas:", e)
      }
    }
    init()
  }, [planId])

  // ── Título automático ──────────────────────────────────────────────────────

  const generateTitle = (user = selectedUser, durationKey = formData.duration, startDate = formData.start_date) => {
    const duration = DURATION_META[durationKey]
    if (!duration || !startDate) return
    const userName = user?.name?.split(" ")[0] || "Usuario"
    setFormData(prev => ({ ...prev, title: `Plan ${duration.label} de ${userName} - ${formatDateRangeSpanish(startDate, duration.days)}` }))
  }

  const handleUserChange = (userId) => {
    const user = users.find(u => u.id === parseInt(userId))
    setSelectedUser(user)
    setFormData(prev => ({
      ...prev, user_id: userId,
      target_weight_kg: user?.target_weight_kg || user?.weight_kg || "",
      activity_factor:  user?.activity_factor || "moderate",
      weight_kg: user?.weight_kg || "", height_cm: user?.height_cm || "",
      age: user?.age || "", sex: user?.sex || "male",
    }))
    setTimeout(() => generateTitle(user, formData.duration, formData.start_date), 0)
  }

  // ── Cálculo de macros ──────────────────────────────────────────────────────

  const calculateMacros = () => {
    const weight = parseFloat(formData.weight_kg)
    const height = parseFloat(formData.height_cm)
    const age    = parseInt(formData.age)
    if (!weight || !height || !age) {
      toast.warning("Necesitas completar peso, estatura y edad para calcular los macros")
      return
    }
    const baseBMR = (10 * weight) + (6.25 * height) - (5 * age)
    const bmr     = formData.sex === 'male' ? baseBMR + 5 : baseBMR - 161
    const factors = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 }
    const tdee    = Math.round(bmr * (factors[formData.activity_factor] || 1.55))
    setFormData(prev => ({
      ...prev,
      total_calories: tdee,
      protein_goal_g: Math.round((tdee * 0.20) / 4),
      carbs_goal_g:   Math.round((tdee * 0.50) / 4),
      fat_goal_g:     Math.round((tdee * 0.30) / 9),
    }))
  }

  // ── Búsqueda de alimentos/recetas ─────────────────────────────────────────

  const searchForKey = (inputKey, query) => {
    setFoodTimers(prev => {
      if (prev[inputKey]) clearTimeout(prev[inputKey])
      const timer = setTimeout(async () => {
        if (query.trim().length < 1) {
          setFoodResults(p => ({ ...p, [inputKey]: [] }))
          return
        }
        try {
          const [foodsRes, recipesSearchRes] = await Promise.allSettled([
            api.get(`/v1/foods?search=${encodeURIComponent(query)}&per_page=8`),
            api.get(`/v1/recipes?search=${encodeURIComponent(query)}&per_page=5`),
          ])
          const foodItems = foodsRes.status === 'fulfilled'
            ? (foodsRes.value.data?.data || foodsRes.value.data || []).map(f => ({ ...f, _type: 'food' }))
            : []
          const apiRecipes = recipesSearchRes.status === 'fulfilled'
            ? (recipesSearchRes.value.data?.data || []).map(r => ({ ...r, _type: 'recipe' }))
            : []
          const memRecipes = recipesRef.current
            .filter(r => r.title?.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 5)
            .map(r => ({ ...r, _type: 'recipe' }))
          const seen = new Set(apiRecipes.map(r => r.id))
          const extraRecipes = memRecipes.filter(r => !seen.has(r.id))
          const recipeItems = [...apiRecipes, ...extraRecipes].slice(0, 5)
          setFoodResults(p => ({ ...p, [inputKey]: [...foodItems, ...recipeItems] }))
        } catch {
          setFoodResults(p => ({ ...p, [inputKey]: [] }))
        }
      }, 300)
      return { ...prev, [inputKey]: timer }
    })
  }

  // ── Mutaciones de meals ────────────────────────────────────────────────────

  // Actualiza uno o varios campos de una fila en una sola operación atómica,
  // evitando el problema de closures stale con múltiples llamadas seguidas.
  const updateRowFields = (key, idx, fields) => {
    const dashIdx = key.indexOf('-')
    const keyDay  = key.slice(0, dashIdx)
    const moment  = key.slice(dashIdx + 1)

    setMeals(prev => {
      const next = { ...prev }
      const rows = [...(prev[key] || [])]
      rows[idx]  = { ...rows[idx], ...fields }
      next[key]  = rows

      // Propagar a los demás días si la edición es en día 1
      if (parseInt(keyDay) === 1) {
        for (let d = 2; d <= totalDays; d++) {
          const k     = `${d}-${moment}`
          const other = [...(prev[k] || [])]
          if (idx < other.length && !other[idx]._existing) {
            other[idx] = { ...other[idx], ...fields }
            next[k]    = other
          }
        }
      }
      return next
    })
  }

  // Mantener updateRow como alias de una sola campo para compatibilidad
  const updateRow = (key, idx, field, value) => updateRowFields(key, idx, { [field]: value })

  const addFoodRow = (day, moment) => {
    const newItem = { food_id: "", food: null, quantity: "", unit_id: "", _existing: false }
    const key = `${day}-${moment}`
    setMeals(prev => {
      const next = { ...prev }
      next[key] = [...(prev[key] || []), { ...newItem }]
      // Replicar fila vacía en todos los días si se agrega en el día 1
      if (parseInt(day) === 1) {
        for (let d = 2; d <= totalDays; d++) {
          const k = `${d}-${moment}`
          next[k] = [...(prev[k] || []), { ...newItem }]
        }
      }
      return next
    })
  }

  const addRecipeToMeal = (day, moment, recipe) => {
    const key  = `${day}-${moment}`
    const item = {
      is_recipe: true, recipe_id: recipe.id,
      recipe_title: recipe.title, expanded: true, _existing: false,
      ingredients: (recipe.ingredients || []).map(ing => ({
        food_id: ing.food_id, food: ing.food,
        quantity: ing.quantity || 100,
        unit: ing.unit, unit_id: ing.unit_id,
      }))
    }
    setMeals(prev => {
      const next = { ...prev }
      next[key] = [...(prev[key] || []), { ...item }]
      // Replicar en todos los días si se agrega en día 1
      if (parseInt(day) === 1) {
        for (let d = 2; d <= totalDays; d++) {
          const k = `${d}-${moment}`
          next[k] = [...(prev[k] || []), { ...item, expanded: false }]
        }
      }
      return next
    })
  }

  // Actualizar cantidad de un ingrediente dentro de una receta
  const updateIngredientQty = (key, itemIdx, ingIdx, value) => {
    setMeals(prev => {
      const rows = [...(prev[key] || [])]
      const ingredients = [...(rows[itemIdx].ingredients || [])]
      ingredients[ingIdx] = { ...ingredients[ingIdx], quantity: value }
      rows[itemIdx] = { ...rows[itemIdx], ingredients }
      return { ...prev, [key]: rows }
    })
  }

  const toggleRecipe = (key, idx) => {
    setMeals(prev => {
      const rows = [...(prev[key] || [])]
      rows[idx] = { ...rows[idx], expanded: !rows[idx].expanded }
      return { ...prev, [key]: rows }
    })
  }

  const removeRow = (key, idx) => {
    const dashIdx   = key.indexOf('-')
    const keyDay    = key.slice(0, dashIdx)
    const moment    = key.slice(dashIdx + 1)
    const isDay1    = parseInt(keyDay) === 1

    setMeals(prev => {
      const next    = { ...prev }
      const current = prev[key] || []
      next[key]     = current.filter((_, i) => i !== idx)

      // Si se elimina en el día 1, contar cuántas filas NEW hay antes del índice
      // para localizar la fila equivalente en los demás días.
      // Los días 2+ pueden tener distinta cantidad de _existing al inicio.
      if (isDay1) {
        const removedIsNew = !current[idx]?._existing
        if (!removedIsNew) return next // Si la eliminada es existente, solo la quitamos del día 1

        // Calcular el índice-nuevo del elemento eliminado en el día 1
        // (cuántas filas NEW hay antes de idx)
        const newIdxInDay1 = current.slice(0, idx).filter(r => !r._existing).length

        for (let d = 2; d <= totalDays; d++) {
          const k     = `${d}-${moment}`
          const other = prev[k] || []
          // Encontrar la fila NEW con el mismo índice relativo entre las nuevas
          let newCount = 0
          let targetIdx = -1
          for (let i = 0; i < other.length; i++) {
            if (!other[i]._existing) {
              if (newCount === newIdxInDay1) { targetIdx = i; break }
              newCount++
            }
          }
          if (targetIdx !== -1) {
            next[k] = other.filter((_, i) => i !== targetIdx)
          }
        }
      }
      return next
    })
  }

  // ── Macros preview ─────────────────────────────────────────────────────────

  const resolveUnit = (unitOrId) => {
    if (!unitOrId) return null
    if (typeof unitOrId === 'object') return unitOrId
    return units.find(u => u.id === parseInt(unitOrId)) || null
  }

  const toGrams = (quantity, unitOrId) => {
    const unit = resolveUnit(unitOrId)
    return parseFloat(quantity || 0) * parseFloat(unit?.conversion_to_grams ?? 1)
  }

  const calcItemMacros = (item) => {
    if (item.is_recipe) {
      return (item.ingredients || []).reduce((acc, ing) => {
        if (!ing.food || !ing.quantity) return acc
        const g = toGrams(ing.quantity, ing.unit)
        acc.calories += (ing.food.calories_per_100g * g) / 100
        acc.protein  += (ing.food.protein_g  * g) / 100
        acc.carbs    += (ing.food.carbs_g    * g) / 100
        acc.fat      += (ing.food.fat_g      * g) / 100
        return acc
      }, { calories: 0, protein: 0, carbs: 0, fat: 0 })
    }
    if (item._existing) {
      if (!item.food || !item.quantity) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
      const g = toGrams(item.quantity, item.unit)
      return {
        calories: (item.food.calories_per_100g * g) / 100,
        protein:  (item.food.protein_g  * g) / 100,
        carbs:    (item.food.carbs_g    * g) / 100,
        fat:      (item.food.fat_g      * g) / 100,
      }
    }
    if (!item.food || !item.quantity) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
    const g = toGrams(item.quantity, item.unit_id)
    return {
      calories: (item.food.calories_per_100g * g) / 100,
      protein:  (item.food.protein_g  * g) / 100,
      carbs:    (item.food.carbs_g    * g) / 100,
      fat:      (item.food.fat_g      * g) / 100,
    }
  }

  const calcMomentMacros = (day, moment) => {
    const key = `${day}-${moment}`
    return (meals[key] || []).reduce((acc, item) => {
      const m = calcItemMacros(item)
      acc.calories += m.calories; acc.protein += m.protein
      acc.carbs    += m.carbs;    acc.fat      += m.fat
      return acc
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 })
  }

  const calcDayMacros = (day) =>
    MEAL_MOMENTS.reduce((acc, { key }) => {
      const m = calcMomentMacros(day, key)
      acc.calories += m.calories; acc.protein += m.protein
      acc.carbs    += m.carbs;    acc.fat     += m.fat
      return acc
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 })

  // ── Guardar ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // 1. Actualizar metadatos del plan
      await api.put(`/v1/plans/${planId}`, {
        title:            formData.title,
        duration:         formData.duration,
        start_date:       formData.start_date,
        target_weight_kg: formData.target_weight_kg ? parseFloat(formData.target_weight_kg) : null,
        activity_factor:  formData.activity_factor,
        total_calories:   parseFloat(formData.total_calories),
        protein_goal_g:   parseFloat(formData.protein_goal_g) || 0,
        carbs_goal_g:     parseFloat(formData.carbs_goal_g)   || 0,
        fat_goal_g:       parseFloat(formData.fat_goal_g)     || 0,
      })

      // 2. Actualizar cantidades de comidas existentes que cambiaron
      const toUpdate = []
      Object.entries(meals).forEach(([key, rows]) => {
        rows.forEach(item => {
          if (!item._existing || item.is_recipe) return
          if (item.meal_id && item.quantity) {
            toUpdate.push({ meal_id: item.meal_id, quantity: parseFloat(item.quantity) })
          }
        })
      })
      if (toUpdate.length > 0) {
        await Promise.all(toUpdate.map(m => api.put(`/v1/plans/${planId}/meals/${m.meal_id}`, { quantity: m.quantity })))
      }

      // 3. Guardar nuevas comidas
      const toSave = []
      Object.entries(meals).forEach(([key, rows]) => {
        const dashIdx = key.indexOf('-')
        const day     = key.slice(0, dashIdx)
        const moment  = key.slice(dashIdx + 1)
        rows.forEach(item => {
          // Omitir los _existing que no cambiaron su alimento (ya se actualizaron arriba)
          if (item._existing && !item.food_id) return
          if (item.is_recipe) {
            ;(item.ingredients || []).forEach(ing => {
              if (!ing.food_id || !ing.quantity) return
              toSave.push({
                day_number:  parseInt(day), meal_moment: moment,
                food_id:  Number(ing.food_id),
                unit_id:  Number(ing.unit_id || ing.unit?.id),
                quantity: parseFloat(ing.quantity),
              })
            })
          } else {
            const resolvedUnitId = item.unit_id || item.unit?.id
            if (!item.food_id || !resolvedUnitId || !item.quantity) return
            toSave.push({
              day_number:  parseInt(day), meal_moment: moment,
              food_id:  Number(item.food_id),
              unit_id:  Number(resolvedUnitId),
              quantity: parseFloat(item.quantity),
            })
          }
        })
      })

      if (toSave.length > 0) {
        await Promise.all(toSave.map(m => api.post(`/v1/plans/${planId}/meals`, m)))
      }

      toast.success("Plan actualizado correctamente")
      router.push("/admin/plans")
    } catch (error) {
      toast.error(error.message || "Error al actualizar plan")
    } finally {
      setLoading(false)
    }
  }

  const activity  = ACTIVITY_META[formData.activity_factor]
  const day1Macros = calcDayMacros(1)

  const S = {
    surface:  { background: "var(--color-surface)", borderColor: "var(--color-border)" },
    textMain: { color: "var(--color-foreground)" },
    textMuted:{ color: "var(--color-foreground-muted)" },
    input:    { background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-foreground)" },
  }

  if (fetchingData) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--color-primary)" }} />
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/plans/${planId}`}>
          <button className="p-2 rounded-lg cursor-pointer transition-colors"
            onMouseEnter={e => e.currentTarget.style.background = "var(--color-surface-raised)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <ArrowLeft className="h-5 w-5" style={S.textMuted} />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-heading font-bold" style={S.textMain}>Editar plan nutricional</h1>
          <p className="text-sm mt-0.5" style={S.textMuted}>Los cambios se guardan al hacer clic en "Guardar cambios"</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Configuración del plan ── */}
        <div className="rounded-xl border p-6" style={S.surface}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={S.textMain}>
            <CalendarDays className="h-5 w-5" /> Configuración del plan
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label style={S.textMuted}>Usuario</Label>
              <select value={formData.user_id} onChange={e => handleUserChange(e.target.value)} required
                className="w-full h-10 px-3 rounded-lg border text-sm" style={S.input}>
                <option value="">Seleccionar usuario...</option>
                {users.map(u => <option key={u.id} value={String(u.id)}>{u.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label style={S.textMuted}>Duración</Label>
              <select value={formData.duration}
                onChange={e => { setFormData(p => ({ ...p, duration: e.target.value })); generateTitle(selectedUser, e.target.value, formData.start_date) }}
                className="w-full h-10 px-3 rounded-lg border text-sm" style={S.input}>
                {Object.entries(DURATION_META).map(([k, { label }]) => (
                  <option key={k} value={k}>{label} ({DURATION_META[k].days} días)</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label style={S.textMuted}>Fecha de inicio</Label>
              <Input type="date" value={formData.start_date} required
                onChange={e => { setFormData(p => ({ ...p, start_date: e.target.value })); generateTitle(selectedUser, formData.duration, e.target.value) }} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label style={S.textMuted}>Título del plan</Label>
              <Input value={formData.title} required
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                placeholder="Se genera automáticamente..." />
            </div>

            <div className="space-y-2">
              <Label style={S.textMuted}>Peso objetivo (kg)</Label>
              <Input type="number" step="0.1" value={formData.target_weight_kg}
                onChange={e => setFormData(p => ({ ...p, target_weight_kg: e.target.value }))} placeholder="70" />
            </div>

            <div className="space-y-2">
              <Label style={S.textMuted}>Nivel de actividad</Label>
              <select value={formData.activity_factor}
                onChange={e => setFormData(p => ({ ...p, activity_factor: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border text-sm" style={S.input}>
                {Object.entries(ACTIVITY_META).map(([k, { label, desc }]) => (
                  <option key={k} value={k}>{label} ({desc})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Datos antropométricos */}
          {formData.user_id && (
            <div className="mt-4 p-4 rounded-lg" style={{ background: "var(--color-surface-raised)" }}>
              <p className="text-sm font-medium mb-3" style={S.textMuted}>Datos antropométricos</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: "Peso actual (kg)", field: "weight_kg", placeholder: "70", step: "0.1" },
                  { label: "Estatura (cm)",    field: "height_cm", placeholder: "170", step: "0.1" },
                  { label: "Edad (años)",      field: "age",       placeholder: "30" },
                ].map(({ label, field, placeholder, step }) => (
                  <div key={field} className="space-y-1">
                    <Label style={S.textMuted}>{label}</Label>
                    <Input type="number" step={step} value={formData[field]} placeholder={placeholder}
                      onChange={e => setFormData(p => ({ ...p, [field]: e.target.value }))} />
                  </div>
                ))}
                <div className="space-y-1">
                  <Label style={S.textMuted}>Sexo</Label>
                  <select value={formData.sex} onChange={e => setFormData(p => ({ ...p, sex: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border text-sm" style={S.input}>
                    <option value="male">Masculino</option>
                    <option value="female">Femenino</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button type="button" onClick={calculateMacros}
                    className="w-full px-4 py-2 rounded-lg text-sm font-medium cursor-pointer text-white"
                    style={{ background: "var(--color-primary)" }}>
                    Calcular macros
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Objetivos calóricos ── */}
        <div className="rounded-xl border p-6" style={S.surface}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={S.textMain}>
            <Target className="h-5 w-5" /> Objetivos calóricos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Calorías (kcal)", field: "total_calories", placeholder: "2000", required: true, icon: null },
              { label: "Proteína (g)",    field: "protein_goal_g", placeholder: "0",    icon: <Beef className="h-4 w-4" style={{ color: "#3B82F6" }} /> },
              { label: "Carbs (g)",       field: "carbs_goal_g",   placeholder: "0",    icon: <Wheat className="h-4 w-4" style={{ color: "#F59E0B" }} /> },
              { label: "Grasa (g)",       field: "fat_goal_g",     placeholder: "0",    icon: <Droplets className="h-4 w-4" style={{ color: "#F97316" }} /> },
            ].map(({ label, field, placeholder, required, icon }) => (
              <div key={field} className="space-y-2">
                <Label style={S.textMuted} className="flex items-center gap-1">{icon}{label}</Label>
                <Input type="number" value={formData[field]} placeholder={placeholder} required={required}
                  onChange={e => setFormData(p => ({ ...p, [field]: e.target.value }))} />
              </div>
            ))}
          </div>
          {formData.total_calories && (
            <div className="mt-4 p-4 rounded-lg" style={{ background: "var(--color-surface-raised)" }}>
              <div className="flex gap-4 text-sm">
                {[
                  { label: `P: ${formData.protein_goal_g || 0}g`, pct: `${(activity?.protein || 0.25) * 100}%`, color: "#3B82F6", icon: <Beef className="h-4 w-4" /> },
                  { label: `C: ${formData.carbs_goal_g || 0}g`,   pct: `${(activity?.carbs   || 0.45) * 100}%`, color: "#F59E0B", icon: <Wheat className="h-4 w-4" /> },
                  { label: `G: ${formData.fat_goal_g || 0}g`,     pct: `${(activity?.fat     || 0.30) * 100}%`, color: "#F97316", icon: <Droplets className="h-4 w-4" /> },
                ].map(({ label, pct, color, icon }) => (
                  <span key={label} className="flex items-center gap-1" style={{ color }}>{icon}{label} ({pct})</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Plan de alimentación ── */}
        <div className="rounded-xl border p-6" style={S.surface}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={S.textMain}>
            <Flame className="h-5 w-5" /> Plan de alimentación
          </h2>

          {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => (
            <div key={day} className="mb-6 p-4 rounded-lg border" style={{ borderColor: "var(--color-border)" }}>
              <h3 className="font-semibold mb-3" style={S.textMain}>Día {day}</h3>

              <div className="space-y-4">
                {MEAL_MOMENTS.map(moment => {
                  const key      = `${day}-${moment.key}`
                  const rows     = meals[key] || []
                  const macros   = calcMomentMacros(day, moment.key)

                  return (
                    <div key={moment.key} className="p-3 rounded-lg" style={{ background: "var(--color-surface-raised)" }}>
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <span className="font-medium text-sm" style={S.textMain}>{moment.label}</span>
                        <div className="flex gap-3 text-xs" style={S.textMuted}>
                          <span>{Math.round(macros.calories)} kcal</span>
                          <span style={{ color: "#3B82F6" }}>P: {Math.round(macros.protein)}g</span>
                          <span style={{ color: "#F59E0B" }}>C: {Math.round(macros.carbs)}g</span>
                          <span style={{ color: "#F97316" }}>G: {Math.round(macros.fat)}g</span>
                        </div>
                      </div>

                    {/* Pills de recetas sugeridas */}
                      {(() => {
                        const categoryMap = {
                          breakfast:       'breakfast',
                          morning_snack:   'snack',
                          lunch:           'lunch',
                          afternoon_snack: 'snack',
                          dinner:          'dinner',
                        }
                        const targetCategory = categoryMap[moment.key]
                        // meal_categories puede llegar como array de strings ['breakfast'] o de objetos [{key:'breakfast',...}]
                        const momentRecipes = recipes.filter(r => {
                          if (!Array.isArray(r.meal_categories)) return false
                          return r.meal_categories.some(c =>
                            typeof c === 'string' ? c === targetCategory : c?.key === targetCategory
                          )
                        }).slice(0, 6)
                        return momentRecipes.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {momentRecipes.map(r => (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => addRecipeToMeal(day, moment.key, r)}
                                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border cursor-pointer"
                                style={{ borderColor: "#8B5CF640", color: "#8B5CF6", background: "#8B5CF608" }}
                                onMouseEnter={e => { e.currentTarget.style.background = "#8B5CF618"; e.currentTarget.style.borderColor = "#8B5CF6" }}
                                onMouseLeave={e => { e.currentTarget.style.background = "#8B5CF608"; e.currentTarget.style.borderColor = "#8B5CF640" }}
                                title={`Agregar receta: ${r.title}`}
                              >
                                <span>🧑‍🍳</span>
                                <span className="truncate max-w-[120px]">{r.title}</span>
                                <Plus className="h-2.5 w-2.5 flex-shrink-0" />
                              </button>
                            ))}
                          </div>
                        ) : null
                      })()}

                      {rows.map((item, idx) => {
                        if (item.is_recipe) {
                          // ── Receta con ingredientes y cantidades editables ──
                          return (
                            <div key={idx} className="mb-2 rounded border overflow-hidden" style={{ borderColor: "#8B5CF640" }}>
                              <div className="flex items-center justify-between px-2 py-1.5" style={{ background: "#8B5CF610" }}>
                                <button type="button"
                                  className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                                  style={{ color: "#8B5CF6" }}
                                  onClick={() => toggleRecipe(key, idx)}
                                >
                                  <span>{item.expanded ? "▾" : "▸"}</span>
                                  🧑‍🍳 {item.recipe_title}
                                  <span className="font-normal opacity-60">({item.ingredients?.length || 0} ingredientes)</span>
                                </button>
                                <button type="button" onClick={() => removeRow(key, idx)}
                                  className="p-0.5 rounded cursor-pointer"
                                  onMouseEnter={e => e.currentTarget.style.background = "#DC262618"}
                                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                  <Trash2 className="h-3.5 w-3.5" style={{ color: "#DC2626" }} />
                                </button>
                              </div>
                              {item.expanded && (
                                <div className="px-2 pt-1 pb-2 space-y-1.5">
                                  {(item.ingredients || []).map((ing, iidx) => (
                                    <div key={iidx} className="flex items-center gap-2 text-xs">
                                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#8B5CF6" }} />
                                      <span className="flex-1 truncate" style={S.textMuted}>{ing.food?.name || "Alimento"}</span>
                                      <input
                                        type="number"
                                        value={ing.quantity}
                                        step="any"
                                        onChange={e => updateIngredientQty(key, idx, iidx, e.target.value)}
                                        className="w-16 h-6 px-1.5 rounded border text-xs text-right"
                                        style={S.input}
                                      />
                                      <span className="text-[10px] w-10 text-right" style={S.textMuted}>
                                        {ing.unit?.abbreviation || ing.unit || "g"}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        }

                        // ── Alimento individual (existente o nuevo, ambos editables) ──
                        const inputKey = `${key}-${idx}`
                        return (
                          <div key={idx} className="flex items-center gap-2 mb-2">
                            <div className="relative flex-1">
                              <input
                                type="text"
                                value={foodSearch[inputKey] ?? (item.food?.name || "")}
                                onChange={e => {
                                  const val = e.target.value
                                  setFoodSearch(p => ({ ...p, [inputKey]: val }))
                                  if (item.food_id) updateRow(key, idx, 'food_id', "")
                                  searchForKey(inputKey, val)
                                }}
                                onFocus={e => {
                                  if (e.target.value.trim().length > 0) searchForKey(inputKey, e.target.value)
                                }}
                                onBlur={() => {
                                  setTimeout(() => {
                                    setFoodResults(p => ({ ...p, [inputKey]: [] }))
                                    if (!item.food_id && !item._existing) setFoodSearch(p => ({ ...p, [inputKey]: "" }))
                                  }, 200)
                                }}
                                className="w-full h-8 px-2 rounded border text-xs"
                                style={{
                                  ...S.input,
                                  borderColor: (item.food_id || item._existing) ? "var(--color-primary)" : "var(--color-border)",
                                }}
                                placeholder="Busca alimento o receta..."
                              />
                              {(foodResults[inputKey] || []).length > 0 && (
                                <div className="absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-48 overflow-auto" style={S.surface}>
                                  {(foodResults[inputKey] || []).map(sug => (
                                    <div
                                      key={sug._type === 'recipe' ? `r-${sug.id}` : sug.id}
                                      className="px-3 py-2 text-xs cursor-pointer flex items-center justify-between"
                                      style={{ color: "var(--color-foreground)" }}
                                      onMouseEnter={e => e.currentTarget.style.background = "var(--color-surface-raised)"}
                                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                      onMouseDown={() => {
                                      if (sug._type === 'recipe') {
                                      const fullRecipe = recipesRef.current.find(r => r.id === sug.id) || sug
                                      addRecipeToMeal(day, moment.key, fullRecipe)
                                          removeRow(key, idx)
                                        } else {
                                          updateRowFields(key, idx, { food_id: sug.id, food: sug, _existing: false })
                                          setFoodSearch(p => ({ ...p, [inputKey]: sug.name }))
                                        }
                                        setFoodResults(p => ({ ...p, [inputKey]: [] }))
                                      }}
                                    >
                                      <span>{sug._type === 'recipe' ? sug.title : sug.name}</span>
                                      <span className="text-[10px] px-1.5 py-0.5 rounded ml-2"
                                        style={sug._type === 'recipe'
                                          ? { background: "#8B5CF618", color: "#8B5CF6" }
                                          : { background: "#16A34A18", color: "#16A34A" }}>
                                        {sug._type === 'recipe' ? 'Receta' : 'Alimento'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Cantidad */}
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={e => updateRow(key, idx, 'quantity', e.target.value)}
                              className="w-16 h-8 px-2 rounded border text-xs"
                              style={S.input}
                              placeholder="cant." step="any"
                            />

                            {/* Unidad */}
                            {item._existing && !item.food_id ? (
                              <span className="text-xs px-2 h-8 flex items-center rounded border min-w-[50px]"
                                style={{ ...S.input, opacity: 0.75 }}>
                                {item.unit?.abbreviation || "—"}
                              </span>
                            ) : (
                              <select
                                value={item.unit_id || item.unit?.id || ""}
                                onChange={e => updateRow(key, idx, 'unit_id', e.target.value)}
                                className="h-8 px-1 rounded border text-xs"
                                style={{ ...S.input, minWidth: "70px" }}>
                                <option value="">Unidad</option>
                                {units.map(u => <option key={u.id} value={u.id}>{u.abbreviation}</option>)}
                              </select>
                            )}

                            <button type="button" onClick={() => removeRow(key, idx)}
                              className="p-1 rounded cursor-pointer"
                              onMouseEnter={e => e.currentTarget.style.background = "#FEE2E218"}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                              <Trash2 className="h-4 w-4" style={{ color: "#DC2626" }} />
                            </button>
                          </div>
                        )
                      })}

                      <button type="button" onClick={() => addFoodRow(day, moment.key)}
                        className="flex items-center gap-1 text-xs mt-2 cursor-pointer"
                        style={{ color: "var(--color-primary)" }}>
                        <Plus className="h-3 w-3" /> Agregar alimento
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── Resumen nutricional Día 1 ── */}
        {Object.keys(meals).some(k => k.startsWith('1-')) && (
          <div className="rounded-xl border p-6" style={S.surface}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={S.textMain}>Resumen nutricional diario</h2>
              <span className="text-xs px-2 py-1 rounded-lg"
                style={{ background: "var(--color-surface-raised)", color: "var(--color-foreground-muted)" }}>
                Basado en el Día 1
              </span>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "kcal",          value: Math.round(day1Macros.calories), icon: Flame,    color: "#F97316", bg: "#F9731618" },
                { label: "Proteína",      value: `${Math.round(day1Macros.protein)}g`, icon: Beef, color: "#3B82F6", bg: "#3B82F618" },
                { label: "Carbohidratos", value: `${Math.round(day1Macros.carbs)}g`,  icon: Wheat, color: "#F59E0B", bg: "#F59E0B18" },
                { label: "Grasa",         value: `${Math.round(day1Macros.fat)}g`,    icon: Droplets, color: "#EF4444", bg: "#EF444418" },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="text-center p-4 rounded-lg" style={{ background: bg }}>
                  <Icon className="h-4 w-4 mx-auto mb-1" style={{ color }} />
                  <p className="text-2xl font-bold" style={{ color }}>{value}</p>
                  <p className="text-xs mt-0.5" style={S.textMuted}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Botones ── */}
        <div className="flex justify-end gap-3">
          <Link href={`/admin/plans/${planId}`}>
            <button type="button"
              className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer border"
              style={{ borderColor: "var(--color-border)", color: "var(--color-foreground-muted)" }}>
              Cancelar
            </button>
          </Link>
          <button type="submit" disabled={loading}
            className="px-6 py-2 rounded-lg text-sm font-medium cursor-pointer text-white flex items-center gap-2"
            style={{ background: "var(--color-primary)" }}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar cambios
          </button>
        </div>

      </form>
    </div>
  )
}
