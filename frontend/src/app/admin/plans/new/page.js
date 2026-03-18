"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  CalendarDays, ArrowLeft, Loader2, User, Target, Flame, Beef, Droplets, Wheat, Plus, Trash2,
} from "lucide-react"
import { useToast } from "@/components/providers"

const DURATION_META = {
  weekly:   { label: "Semanal",   days: 7 },
  biweekly: { label: "Quincenal", days: 14 },
  monthly:  { label: "Mensual",   days: 30 },
}

const ACTIVITY_META = {
  sedentary:   { label: "Sedentario",   desc: "Menos de 3 horas de ejercicio/semana", color: "#6B7280", protein: 0.35, carbs: 0.35, fat: 0.30 },
  light:       { label: "Ligero",       desc: "3-5 horas de ejercicio/semana",       color: "#10B981", protein: 0.30, carbs: 0.40, fat: 0.30 },
  moderate:    { label: "Moderado",      desc: "6-7 horas de ejercicio/semana",       color: "#F59E0B", protein: 0.25, carbs: 0.45, fat: 0.30 },
  active:      { label: "Activo",       desc: "8-10 horas de ejercicio/semana",      color: "#F97316", protein: 0.25, carbs: 0.50, fat: 0.25 },
  very_active: { label: "Muy activo",   desc: "Más de 10 horas de ejercicio/semana",color: "#EF4444", protein: 0.20, carbs: 0.55, fat: 0.25 },
}

const MEAL_MOMENTS = [
  { key: "breakfast",       label: "Desayuno" },
  { key: "morning_snack",   label: "Colación mañana" },
  { key: "lunch",           label: "Comida" },
  { key: "afternoon_snack", label: "Colación tarde" },
  { key: "dinner",          label: "Cena" },
]

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

const formatDateSpanish = (date) => {
  const d = new Date(date)
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`
}

const formatDateRangeSpanish = (startDate, days) => {
  const start = new Date(startDate + 'T12:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + days)
  
  const startDay = start.getDate()
  const endDay = end.getDate()
  const startMonth = MESES[start.getMonth()]
  const endMonth = MESES[end.getMonth()]
  const year = start.getFullYear()
  
  if (start.getMonth() === end.getMonth()) {
    return `del ${startDay} al ${endDay} de ${startMonth} de ${year}`
  } else {
    return `del ${startDay} de ${startMonth} al ${endDay} de ${endMonth} del ${year}`
  }
}

const DRAFT_KEY = 'nutrisystem_plan_draft'

export default function NewPlanPage() {
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [hasDraft, setHasDraft] = useState(false)
  const toast = useToast()

  const getToday = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + now.getTimezoneOffset())
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const FORM_DEFAULTS = {
    user_id: "",
    title: "",
    duration: "weekly",
    start_date: getToday(),
    target_weight_kg: "",
    activity_factor: "moderate",
    weight_kg: "",
    height_cm: "",
    age: "",
    sex: "male",
    total_calories: "",
    protein_goal_g: "",
    carbs_goal_g: "",
    fat_goal_g: "",
  }

  const [formData, setFormData] = useState(FORM_DEFAULTS)
  const [meals, setMeals] = useState({})
  const [units, setUnits] = useState([])                 // unidades con conversion_to_grams

  // totalDays necesita estar disponible antes de las funciones que lo usan
  const totalDays = DURATION_META[formData.duration]?.days || 7
  const [foodSearch, setFoodSearch] = useState({})       // texto visible en cada input
  const [foodResults, setFoodResults] = useState({})     // resultados del API por key
  const [foodSearchTimers, setFoodSearchTimers] = useState({})
  const [recipes, setRecipes] = useState([])

  // ── Persistencia en sessionStorage ──────────────────────────────────────

  // Guardar borrador cada vez que cambia formData o meals
  useEffect(() => {
    // No guardar el estado inicial vacío
    const isEmpty = !formData.user_id && !formData.title && Object.keys(meals).length === 0
    if (isEmpty) return
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ formData, meals }))
    } catch {}
  }, [formData, meals])

  const clearDraft = () => {
    try { sessionStorage.removeItem(DRAFT_KEY) } catch {}
    setHasDraft(false)
  }

  const discardDraft = () => {
    clearDraft()
    setFormData(FORM_DEFAULTS)
    setMeals({})
    setSelectedUser(null)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Cargar cada recurso de forma independiente para que un fallo no bloquee los demás
      const [usersResult, foodsResult, unitsResult] = await Promise.allSettled([
        api.get("/v1/admin/users?per_page=100"),
        api.get("/v1/foods?per_page=200"),
        api.get("/v1/units"),
      ])

      const allUsers = usersResult.status === 'fulfilled'
        ? (usersResult.value.data?.data || usersResult.value.data || [])
        : []
      if (usersResult.status === 'rejected') {
        console.error("Error cargando usuarios:", usersResult.reason)
        toast.error("No se pudieron cargar los usuarios")
      }

      if (foodsResult.status === 'fulfilled') {
        setFoods(foodsResult.value.data?.data || foodsResult.value.data || [])
      }
      if (unitsResult.status === 'fulfilled') {
        setUnits(unitsResult.value.data?.data || unitsResult.value.data || [])
      }

      setUsers(allUsers)

      // Restaurar borrador si existe — solo claves del día 1
      try {
        const raw = sessionStorage.getItem(DRAFT_KEY)
        if (raw) {
          const { formData: savedForm, meals: savedMeals } = JSON.parse(raw)
          // Filtrar el borrador para conservar solo las entradas del día 1
          const filteredMeals = Object.fromEntries(
            Object.entries(savedMeals || {}).filter(([k]) => k.startsWith('1-'))
          )
          setFormData(savedForm)
          setMeals(filteredMeals)
          const match = allUsers.find(u => String(u.id) === String(savedForm.user_id))
          if (match) setSelectedUser(match)
          setHasDraft(true)
        }
      } catch {}

    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setFetchingData(false)
    }

    // Cargar recetas en background — no bloquea si falla
    try {
      const recipesRes = await api.get("/v1/recipes?per_page=100")
      // La respuesta es { data: { data: [...], meta: {...} } } o { data: [...] }
      const recipesRaw = recipesRes.data?.data?.data || recipesRes.data?.data || recipesRes.data || []
      const withIngredients = await Promise.allSettled(
        (Array.isArray(recipesRaw) ? recipesRaw : []).map(r => api.get(`/v1/recipes/${r.id}`))
      )
      const loaded = withIngredients
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value.data)
      setRecipes(loaded)
    } catch (e) {
      console.warn("No se pudieron cargar recetas:", e)
    }
  }

  const handleUserChange = (userId) => {
    const user = users.find(u => u.id === parseInt(userId))
    setSelectedUser(user)
    setFormData(prev => ({
      ...prev,
      user_id: userId,
      target_weight_kg: user?.target_weight_kg || user?.weight_kg || "",
      activity_factor: user?.activity_factor || "moderate",
      weight_kg: user?.weight_kg || "",
      height_cm: user?.height_cm || "",
      age: user?.age || "",
      sex: user?.sex || "male",
    }))
    // Regenerar título
    setTimeout(() => generateTitle(user, formData.duration, formData.start_date), 0)
  }

  const generateTitle = (user = selectedUser, durationKey = formData.duration, startDate = formData.start_date) => {
    const duration = DURATION_META[durationKey]
    if (!duration) return
    
    const userName = user?.name?.split(" ")[0] || "Usuario"
    const dateRange = formatDateRangeSpanish(startDate, duration.days)
    
    const title = `Plan ${duration.label} de ${userName} - ${dateRange}`
    setFormData(prev => ({ ...prev, title }))
  }

  const handleDurationChange = (duration) => {
    setFormData(prev => ({ ...prev, duration }))
    generateTitle(selectedUser, duration, formData.start_date)
  }

  const handleStartDateChange = (date) => {
    setFormData(prev => ({ ...prev, start_date: date }))
    generateTitle(selectedUser, formData.duration, date)
  }

  const calculateMacros = () => {
    const weight = parseFloat(formData.weight_kg)
    const height = parseFloat(formData.height_cm)
    const age = parseInt(formData.age)
    const sex = formData.sex
    const activity = formData.activity_factor

    if (!weight || !height || !age || !activity) {
      toast.warning("Necesitas completar peso, estatura, edad y sexo para calcular los macros")
      return
    }

    // Fórmula de Mifflin-St Jeor (revisada de Harris-Benedict)
    // Hombres: (10 × kg) + (6.25 × cm) - (5 × edad) + 5
    // Mujeres: (10 × kg) + (6.25 × cm) - (5 × edad) - 161
    const baseBMR = (10 * weight) + (6.25 * height) - (5 * age)
    const bmr = sex === 'male' ? baseBMR + 5 : baseBMR - 161

    // Factor de actividad
    const activityFactors = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    }
    const tdee = Math.round(bmr * (activityFactors[activity] || 1.55))

    // Distribución de macros: Proteína 20% | Carbs 50% | Grasa 30%
    const protein = Math.round((tdee * 0.20) / 4)
    const carbs = Math.round((tdee * 0.50) / 4)
    const fat = Math.round((tdee * 0.30) / 9)

    setFormData(prev => ({
      ...prev,
      total_calories: tdee,
      protein_goal_g: protein,
      carbs_goal_g: carbs,
      fat_goal_g: fat,
    }))
  }

  const addMealToDay = (day, moment) => {
    const key = `${day}-${moment}`
    if (!meals[key]) {
      setMeals(prev => ({ ...prev, [key]: [] }))
    }
  }

  // inputKey = `${day}-${moment}-${idx}` — único por fila
  const searchFoodsForKey = (inputKey, query) => {
    setFoodSearchTimers(prev => {
      if (prev[inputKey]) clearTimeout(prev[inputKey])
      const timer = setTimeout(async () => {
        if (query.trim().length < 1) {
          setFoodResults(prev2 => ({ ...prev2, [inputKey]: [] }))
          return
        }
        try {
          const res = await api.get(`/v1/foods?search=${encodeURIComponent(query)}&per_page=8`)
          // El API ya excluye soft-deleted via SoftDeletes del modelo
          const foodItems = (res.data?.data || res.data || []).map(f => ({ ...f, type: 'food' }))
          const recipeItems = recipes
            .filter(r => r.title?.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 3)
            .map(r => ({ ...r, type: 'recipe' }))
          setFoodResults(prev2 => ({ ...prev2, [inputKey]: [...foodItems, ...recipeItems] }))
        } catch {
          setFoodResults(prev2 => ({ ...prev2, [inputKey]: [] }))
        }
      }, 300)
      return { ...prev, [inputKey]: timer }
    })
  }

  const addFoodToMeal = (day, moment) => {
    const newItem = { food_id: "", food: null, quantity: "", unit_id: "" }
    setMeals(prev => {
      const next = { ...prev }
      next[`${day}-${moment}`] = [...(prev[`${day}-${moment}`] || []), newItem]
      // Precargar en los demás días solo cuando se agrega en el día 1
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
    const recipeIngredients = recipe.ingredients || []
    const recipeItem = {
      is_recipe: true,
      recipe_id: recipe.id,
      recipe_title: recipe.title,
      expanded: true,
      ingredients: recipeIngredients.map(ing => ({
        food_id:  ing.food_id,
        food:     ing.food,
        quantity: ing.quantity || 100,
        unit:     ing.unit,
        unit_id:  ing.unit_id,
      }))
    }

    setMeals(prev => {
      const next = { ...prev }
      next[`${day}-${moment}`] = [...(prev[`${day}-${moment}`] || []), recipeItem]
      // Precargar en los demás días solo cuando se agrega en el día 1
      if (parseInt(day) === 1) {
        for (let d = 2; d <= totalDays; d++) {
          const k = `${d}-${moment}`
          next[k] = [...(prev[k] || []), { ...recipeItem, expanded: false }]
        }
      }
      return next
    })
  }

  const toggleRecipeExpanded = (day, moment, idx) => {
    const key = `${day}-${moment}`
    setMeals(prev => {
      const updated = [...(prev[key] || [])]
      updated[idx] = { ...updated[idx], expanded: !updated[idx].expanded }
      return { ...prev, [key]: updated }
    })
  }

  const updateMealFood = (day, moment, index, field, value) => {
    setMeals(prev => {
      const next = { ...prev }
      // Actualizar el día actual
      const updated = [...(prev[`${day}-${moment}`] || [])]
      if (field === 'food_id') {
        const food = foods.find(f => f.id === parseInt(value))
        updated[index] = { ...updated[index], food_id: value, food }
      } else {
        updated[index] = { ...updated[index], [field]: value }
      }
      next[`${day}-${moment}`] = updated

      // Si la edición es en el día 1, replicar solo el campo modificado en los demás días
      // (sin sobreescribir cambios que el usuario haya hecho manualmente en otros días)
      if (parseInt(day) === 1) {
        for (let d = 2; d <= totalDays; d++) {
          const k = `${d}-${moment}`
          const otherDay = [...(prev[k] || [])]
          if (index < otherDay.length) {
            if (field === 'food_id') {
              const food = foods.find(f => f.id === parseInt(value))
              otherDay[index] = { ...otherDay[index], food_id: value, food }
            } else {
              otherDay[index] = { ...otherDay[index], [field]: value }
            }
            next[k] = otherDay
          }
        }
      }
      return next
    })
  }

  const removeMealFood = (day, moment, index) => {
    const key = `${day}-${moment}`
    setMeals(prev => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index)
    }))
  }

  // Resuelve el objeto unit completo a partir de un unit_id o del propio objeto
  const resolveUnit = (unitOrId) => {
    if (!unitOrId) return null
    if (typeof unitOrId === 'object') return unitOrId          // ya es el objeto completo
    return units.find(u => u.id === parseInt(unitOrId)) || null // buscar por id
  }

  // Convierte cantidad + unidad a gramos usando conversion_to_grams
  const toGrams = (quantity, unitOrId) => {
    const unit = resolveUnit(unitOrId)
    const conversion = parseFloat(unit?.conversion_to_grams ?? 1)
    return parseFloat(quantity) * conversion
  }

  const calcItemMacros = (item) => {
    // item puede ser un alimento suelto o una receta agrupada
    if (item.is_recipe) {
      return (item.ingredients || []).reduce((acc, ing) => {
        if (!ing.food || !ing.quantity) return acc
        // ing.unit es el objeto completo (viene del API de recetas)
        const grams = toGrams(ing.quantity, ing.unit)
        acc.calories += (ing.food.calories_per_100g * grams) / 100
        acc.protein  += (ing.food.protein_g  * grams) / 100
        acc.carbs    += (ing.food.carbs_g    * grams) / 100
        acc.fat      += (ing.food.fat_g      * grams) / 100
        return acc
      }, { calories: 0, protein: 0, carbs: 0, fat: 0 })
    }
    // Alimento suelto: usa unit_id para resolver la unidad desde el array units
    if (!item.food || !item.quantity) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
    const grams = toGrams(item.quantity, item.unit_id)
    return {
      calories: (item.food.calories_per_100g * grams) / 100,
      protein:  (item.food.protein_g  * grams) / 100,
      carbs:    (item.food.carbs_g    * grams) / 100,
      fat:      (item.food.fat_g      * grams) / 100,
    }
  }

  const calculateMealMacros = (day, moment) => {
    // day y moment ya vienen separados correctamente, no necesitan split
    const key = `${day}-${moment}`
    const dayMeals = meals[key] || []
    const totals = dayMeals.reduce((acc, item) => {
      const m = calcItemMacros(item)
      acc.calories += m.calories
      acc.protein  += m.protein
      acc.carbs    += m.carbs
      acc.fat      += m.fat
      return acc
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 })
    return {
      calories: Math.round(totals.calories),
      protein:  Math.round(totals.protein),
      carbs:    Math.round(totals.carbs),
      fat:      Math.round(totals.fat),
    }
  }

  // Resumen del día 1 como referencia diaria.
  // Las keys tienen formato `${day}-${moment}` donde moment puede tener guiones
  // (morning_snack, afternoon_snack), por eso separamos solo por el primer '-'.
  const calculateDayMacros = (targetDay) => {
    let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 }
    Object.keys(meals).forEach(key => {
      const dashIdx = key.indexOf('-')
      const day = key.slice(0, dashIdx)
      const moment = key.slice(dashIdx + 1)
      if (parseInt(day) !== targetDay) return
      const macros = calculateMealMacros(day, moment)
      totals.calories += macros.calories
      totals.protein  += macros.protein
      totals.carbs    += macros.carbs
      totals.fat      += macros.fat
    })
    return {
      calories: Math.round(totals.calories),
      protein:  Math.round(totals.protein),
      carbs:    Math.round(totals.carbs),
      fat:      Math.round(totals.fat),
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const planData = {
        ...formData,
        user_id: parseInt(formData.user_id),
        target_weight_kg: formData.target_weight_kg ? parseFloat(formData.target_weight_kg) : null,
        total_calories: parseFloat(formData.total_calories),
        protein_goal_g: parseFloat(formData.protein_goal_g) || 0,
        carbs_goal_g: parseFloat(formData.carbs_goal_g) || 0,
        fat_goal_g: parseFloat(formData.fat_goal_g) || 0,
      }

      const response = await api.post("/v1/plans", planData)
      const planId = response.data.plan_id

      // Guardar comidas — replicar el día 1 para todos los días del plan
      const mealsToSave = []

      // Obtener las comidas del día 1
      const day1Entries = Object.entries(meals).filter(([key]) => key.startsWith('1-'))

      // Generar comidas para todos los días
      for (let targetDay = 1; targetDay <= totalDays; targetDay++) {
        day1Entries.forEach(([key, dayMeals]) => {
          const moment = key.slice(2) // quitar '1-'
          dayMeals.forEach(item => {
            if (item.is_recipe) {
              ;(item.ingredients || []).forEach(ing => {
                if (!ing.food_id || !ing.unit_id || !ing.quantity) return
                mealsToSave.push({
                  day_number: targetDay,
                  meal_moment: moment,
                  food_id:  Number(ing.food_id),
                  unit_id:  Number(ing.unit_id),
                  quantity: parseFloat(ing.quantity),
                })
              })
            } else {
              if (!item.food_id || !item.unit_id || !item.quantity) return
              mealsToSave.push({
                day_number: targetDay,
                meal_moment: moment,
                food_id:  Number(item.food_id),
                unit_id:  Number(item.unit_id),
                quantity: parseFloat(item.quantity),
              })
            }
          })
        })
      }

      if (mealsToSave.length > 0) {
        await Promise.all(mealsToSave.map(meal => api.post(`/v1/plans/${planId}/meals`, meal)))
      }

      clearDraft()
      toast.success("Plan creado correctamente")
      router.push("/admin/plans")
    } catch (error) {
      toast.error(error.message || "Error al crear plan")
    } finally {
      setLoading(false)
    }
  }

  const duration = DURATION_META[formData.duration]
  const day1Macros = calculateDayMacros(1)
  const activity = ACTIVITY_META[formData.activity_factor]

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
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/plans">
          <button className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
            <ArrowLeft className="h-5 w-5" style={S.textMuted} />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-heading font-bold" style={S.textMain}>Nuevo plan nutricional</h1>
          <p className="text-sm mt-0.5" style={S.textMuted}>Crea un plan de alimentación personalizado</p>
        </div>
      </div>

      {/* Banner de borrador guardado */}
      {hasDraft && (
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl border text-sm"
          style={{ background: "#F59E0B18", borderColor: "#F59E0B40", color: "#92400E" }}
        >
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span className="font-medium">Tienes un borrador guardado.</span>
            <span style={{ color: "#B45309" }}>Tu avance fue restaurado automáticamente.</span>
          </div>
          <button
            type="button"
            onClick={discardDraft}
            className="text-xs font-medium px-3 py-1 rounded-lg cursor-pointer transition-colors"
            style={{ background: "#F59E0B30", color: "#92400E" }}
            onMouseEnter={e => e.currentTarget.style.background = "#F59E0B50"}
            onMouseLeave={e => e.currentTarget.style.background = "#F59E0B30"}
          >
            Descartar borrador
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos del plan */}
        <div className="rounded-xl border p-6" style={S.surface}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={S.textMain}>
            <CalendarDays className="h-5 w-5" /> Configuración del plan
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label style={S.textMuted}>Usuario</Label>
              <select
                value={formData.user_id}
                onChange={(e) => handleUserChange(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-lg border text-sm"
                style={S.input}
              >
                <option value="">Seleccionar usuario...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label style={S.textMuted}>Duración</Label>
              <select
                value={formData.duration}
                onChange={(e) => handleDurationChange(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border text-sm"
                style={S.input}
              >
                {Object.entries(DURATION_META).map(([key, { label }]) => (
                  <option key={key} value={key}>{label} ({DURATION_META[key].days} días)</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label style={S.textMuted}>Fecha de inicio</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => handleStartDateChange(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label style={S.textMuted}>Título del plan</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Se genera automáticamente..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label style={S.textMuted}>Peso objetivo (kg)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.target_weight_kg}
                onChange={(e) => setFormData({ ...formData, target_weight_kg: e.target.value })}
                placeholder="70"
              />
            </div>

            <div className="space-y-2">
              <Label style={S.textMuted}>Nivel de actividad</Label>
              <select
                value={formData.activity_factor}
                onChange={(e) => setFormData({ ...formData, activity_factor: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border text-sm"
                style={S.input}
              >
                {Object.entries(ACTIVITY_META).map(([key, { label, desc }]) => (
                  <option key={key} value={key}>{label} ({desc})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Datos antropométricos del usuario */}
          {formData.user_id && (
            <div className="mt-4 p-4 rounded-lg" style={{ background: "var(--color-surface-raised)" }}>
              <p className="text-sm font-medium mb-3" style={S.textMuted}>Datos antropométricos</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <Label style={S.textMuted}>Peso actual (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                    placeholder="70"
                    style={{ background: "white" }}
                  />
                </div>
                <div className="space-y-1">
                  <Label style={S.textMuted}>Estatura (cm)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.height_cm}
                    onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                    placeholder="170"
                    style={{ background: "white" }}
                  />
                </div>
                <div className="space-y-1">
                  <Label style={S.textMuted}>Edad (años)</Label>
                  <Input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="30"
                    style={{ background: "white" }}
                  />
                </div>
                <div className="space-y-1">
                  <Label style={S.textMuted}>Sexo</Label>
                  <select
                    value={formData.sex}
                    onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border text-sm"
                    style={S.input}
                  >
                    <option value="male">Masculino</option>
                    <option value="female">Femenino</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={calculateMacros}
                    className="w-full px-4 py-2 rounded-lg text-sm font-medium cursor-pointer text-white"
                    style={{ background: "var(--color-primary)" }}
                  >
                    Calcular macros
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Objetivos calóricos */}
        <div className="rounded-xl border p-6" style={S.surface}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={S.textMain}>
            <Target className="h-5 w-5" /> Objetivos calóricos
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label style={S.textMuted}>Calorías (kcal)</Label>
              <Input
                type="number"
                value={formData.total_calories}
                onChange={(e) => setFormData({ ...formData, total_calories: e.target.value })}
                placeholder="2000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label style={S.textMuted} className="flex items-center gap-1">
                <Beef className="h-4 w-4" style={{ color: "#3B82F6" }} /> Proteína (g)
              </Label>
              <Input
                type="number"
                value={formData.protein_goal_g}
                onChange={(e) => setFormData({ ...formData, protein_goal_g: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label style={S.textMuted} className="flex items-center gap-1">
                <Wheat className="h-4 w-4" style={{ color: "#F59E0B" }} /> Carbs (g)
              </Label>
              <Input
                type="number"
                value={formData.carbs_goal_g}
                onChange={(e) => setFormData({ ...formData, carbs_goal_g: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label style={S.textMuted} className="flex items-center gap-1">
                <Droplets className="h-4 w-4" style={{ color: "#F97316" }} /> Grasa (g)
              </Label>
              <Input
                type="number"
                value={formData.fat_goal_g}
                onChange={(e) => setFormData({ ...formData, fat_goal_g: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          {/* Resumen de macros objetivo */}
          {formData.total_calories && (
            <div className="mt-4 p-4 rounded-lg" style={{ background: "var(--color-surface-raised)" }}>
              <p className="text-sm font-medium mb-2" style={S.textMuted}>Distribución recomendada para {formData.total_calories} kcal:</p>
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Beef className="h-4 w-4" style={{ color: "#3B82F6" }} />
                  P: {formData.protein_goal_g || 0}g ({activity?.protein * 100 || 30}%)
                </span>
                <span className="flex items-center gap-1">
                  <Wheat className="h-4 w-4" style={{ color: "#F59E0B" }} />
                  C: {formData.carbs_goal_g || 0}g ({activity?.carbs * 100 || 40}%)
                </span>
                <span className="flex items-center gap-1">
                  <Droplets className="h-4 w-4" style={{ color: "#F97316" }} />
                  G: {formData.fat_goal_g || 0}g ({activity?.fat * 100 || 30}%)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Comidas del plan */}
        <div className="rounded-xl border p-6" style={S.surface}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={S.textMain}>
            <Flame className="h-5 w-5" /> Plan de alimentación
          </h2>

            {/* Solo se muestra y edita el Día 1. Los días restantes se generan automáticamente al guardar. */}
          <div className="mb-2 p-3 rounded-lg text-sm flex items-center gap-2" style={{ background: "var(--color-surface-raised)", color: "var(--color-foreground-muted)" }}>
            <CalendarDays className="h-4 w-4 flex-shrink-0" />
            <span>Define las comidas del <strong style={{ color: "var(--color-foreground)" }}>Día 1</strong>. Este día se replicará automáticamente para los {totalDays} días del plan al guardar.</span>
          </div>

          <div className="mb-6 p-4 rounded-lg border" style={{ borderColor: "var(--color-primary)", boxShadow: "0 0 0 1px var(--color-primary)20" }}>
            <h3 className="font-semibold mb-3 flex items-center gap-2" style={S.textMain}>
              Día 1
              <span className="text-xs font-normal px-2 py-0.5 rounded-full" style={{ background: "var(--color-primary)18", color: "var(--color-primary)" }}>Plantilla del plan</span>
            </h3>

            <div className="space-y-4">
              {MEAL_MOMENTS.map(moment => {
                const key = `1-${moment.key}`
                const dayMeals = meals[key] || []
                const macros = calculateMealMacros(1, moment.key)
                // meal_categories es un array con valores: 'breakfast','snack','lunch','dinner'
                // morning_snack y afternoon_snack del plan ambos mapean a 'snack' en recetas
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

                return (
                  <div key={moment.key} className="p-3 rounded-lg" style={{ background: "var(--color-surface-raised)" }}>
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <span className="font-medium text-sm" style={S.textMain}>{moment.label}</span>
                      <div className="flex gap-3 text-xs" style={S.textMuted}>
                        <span>{macros.calories} kcal</span>
                        <span style={{ color: "#3B82F6" }}>P: {macros.protein}g</span>
                        <span style={{ color: "#F59E0B" }}>C: {macros.carbs}g</span>
                        <span style={{ color: "#F97316" }}>G: {macros.fat}g</span>
                      </div>
                    </div>

                    {/* Pills de recetas sugeridas */}
                    {momentRecipes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {momentRecipes.map(r => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => addRecipeToMeal(1, moment.key, r)}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border cursor-pointer transition-colors"
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
                    )}

                    {dayMeals.map((item, idx) => (
                      item.is_recipe ? (
                        // ── Receta agrupada ──
                        <div key={idx} className="mb-2 rounded border overflow-hidden" style={{ borderColor: "#8B5CF640" }}>
                          <div className="flex items-center justify-between px-2 py-1.5" style={{ background: "#8B5CF610" }}>
                            <button
                              type="button"
                              className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                              style={{ color: "#8B5CF6" }}
                              onClick={() => toggleRecipeExpanded(1, moment.key, idx)}
                            >
                              <span>{item.expanded ? "▾" : "▸"}</span>
                              🧑‍🍳 {item.recipe_title}
                              <span className="font-normal" style={{ color: "#8B5CF6AA" }}>({item.ingredients?.length || 0} ingredientes)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => removeMealFood(1, moment.key, idx)}
                              className="p-0.5 rounded cursor-pointer"
                              onMouseEnter={e => e.currentTarget.style.background = "#DC262618"}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                              <Trash2 className="h-3.5 w-3.5" style={{ color: "#DC2626" }} />
                            </button>
                          </div>
                          {item.expanded && (
                            <div className="px-2 pt-1 pb-2 space-y-1">
                              {(item.ingredients || []).map((ing, iidx) => (
                                <div key={iidx} className="flex items-center gap-2 text-xs" style={{ color: "var(--color-foreground-muted)" }}>
                                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#8B5CF6" }} />
                                  <span className="flex-1 truncate">{ing.food?.name || "Alimento"}</span>
                                  <span className="text-[10px]">{ing.quantity} {ing.unit?.abbreviation || ing.unit}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        // ── Alimento suelto ──
                        <div key={idx} className="flex items-center gap-2 mb-2">
                          <div className="relative flex-1">
                            {(() => {
                              const inputKey = `1-${moment.key}-${idx}`
                              return (
                                <>
                                  <input
                                    type="text"
                                    value={foodSearch[inputKey] ?? (item.food?.name || "")}
                                    onChange={(e) => {
                                      const val = e.target.value
                                      setFoodSearch(prev => ({ ...prev, [inputKey]: val }))
                                      if (item.food_id) updateMealFood(1, moment.key, idx, 'food_id', "")
                                      searchFoodsForKey(inputKey, val)
                                    }}
                                    onFocus={(e) => {
                                      const val = e.target.value
                                      if (val.trim().length > 0) searchFoodsForKey(inputKey, val)
                                    }}
                                    onBlur={() => {
                                      setTimeout(() => {
                                        setFoodResults(prev => ({ ...prev, [inputKey]: [] }))
                                        if (!item.food_id) {
                                          setFoodSearch(prev => ({ ...prev, [inputKey]: "" }))
                                        }
                                      }, 200)
                                    }}
                                    className="w-full h-8 px-2 rounded border text-xs"
                                    style={{
                                      ...S.input,
                                      borderColor: item.food_id ? "var(--color-primary)" : "var(--color-border)",
                                    }}
                                    placeholder="Busca los alimentos..."
                                  />
                                  {(foodResults[inputKey] || []).length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-48 overflow-auto" style={S.surface}>
                                      {(foodResults[inputKey] || []).map((sug) => (
                                        <div
                                          key={sug.type === 'recipe' ? `r-${sug.id}` : sug.id}
                                          className="px-3 py-2 text-xs cursor-pointer flex items-center justify-between"
                                          style={{ color: "var(--color-foreground)" }}
                                          onMouseEnter={e => e.currentTarget.style.background = "var(--color-surface-raised)"}
                                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                          onMouseDown={() => {
                                            if (sug.type === 'recipe') {
                                              addRecipeToMeal(1, moment.key, sug)
                                              removeMealFood(1, moment.key, idx)
                                            } else {
                                              updateMealFood(1, moment.key, idx, 'food_id', sug.id)
                                              setFoodSearch(prev => ({ ...prev, [inputKey]: sug.name }))
                                            }
                                            setFoodResults(prev => ({ ...prev, [inputKey]: [] }))
                                          }}
                                        >
                                          <span>{sug.type === 'recipe' ? sug.title : sug.name}</span>
                                          <span className="text-[10px] px-1.5 py-0.5 rounded ml-2" style={sug.type === 'recipe' ? { background: "#8B5CF618", color: "#8B5CF6" } : { background: "#16A34A18", color: "#16A34A" }}>
                                            {sug.type === 'recipe' ? 'Receta' : 'Alimento'}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </>
                              )
                            })()}
                          </div>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateMealFood(1, moment.key, idx, 'quantity', e.target.value)}
                            className="w-16 h-8 px-2 rounded border text-xs"
                            style={S.input}
                            placeholder="g"
                            step="any"
                          />
                          <button
                            type="button"
                            onClick={() => removeMealFood(1, moment.key, idx)}
                            className="p-1 rounded cursor-pointer"
                            onMouseEnter={e => e.currentTarget.style.background = "#FEE2E218"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            <Trash2 className="h-4 w-4" style={{ color: "#DC2626" }} />
                          </button>
                        </div>
                      )
                    ))}

                    <button
                      type="button"
                      onClick={() => addFoodToMeal(1, moment.key)}
                      className="flex items-center gap-1 text-xs mt-2 cursor-pointer"
                      style={{ color: "var(--color-primary)" }}
                    >
                      <Plus className="h-3 w-3" /> Agregar alimento
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Resumen diario — día 1 como referencia */}
        {Object.keys(meals).some(k => k.startsWith('1-')) && (
          <div className="rounded-xl border p-6" style={S.surface}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={S.textMain}>Resumen nutricional diario</h2>
              <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "var(--color-surface-raised)", color: "var(--color-foreground-muted)" }}>
                Basado en el Día 1
              </span>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg" style={{ background: "#F9731618" }}>
                <Flame className="h-4 w-4 mx-auto mb-1" style={{ color: "#F97316" }} />
                <p className="text-2xl font-bold" style={{ color: "#F97316" }}>{day1Macros.calories}</p>
                <p className="text-xs mt-0.5" style={S.textMuted}>kcal</p>
              </div>
              <div className="text-center p-4 rounded-lg" style={{ background: "#3B82F618" }}>
                <Beef className="h-4 w-4 mx-auto mb-1" style={{ color: "#3B82F6" }} />
                <p className="text-2xl font-bold" style={{ color: "#3B82F6" }}>{day1Macros.protein}g</p>
                <p className="text-xs mt-0.5" style={S.textMuted}>Proteína</p>
              </div>
              <div className="text-center p-4 rounded-lg" style={{ background: "#F59E0B18" }}>
                <Wheat className="h-4 w-4 mx-auto mb-1" style={{ color: "#F59E0B" }} />
                <p className="text-2xl font-bold" style={{ color: "#F59E0B" }}>{day1Macros.carbs}g</p>
                <p className="text-xs mt-0.5" style={S.textMuted}>Carbohidratos</p>
              </div>
              <div className="text-center p-4 rounded-lg" style={{ background: "#EF444418" }}>
                <Droplets className="h-4 w-4 mx-auto mb-1" style={{ color: "#EF4444" }} />
                <p className="text-2xl font-bold" style={{ color: "#EF4444" }}>{day1Macros.fat}g</p>
                <p className="text-xs mt-0.5" style={S.textMuted}>Grasa</p>
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => { clearDraft(); router.push("/admin/plans") }}
            className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer border"
            style={{ borderColor: "var(--color-border)", color: "var(--color-foreground-muted)" }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 rounded-lg text-sm font-medium cursor-pointer text-white flex items-center gap-2"
            style={{ background: "var(--color-primary)" }}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Crear plan
          </button>
        </div>
      </form>
    </div>
  )
}
