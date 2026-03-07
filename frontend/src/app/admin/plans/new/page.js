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

export default function NewPlanPage() {
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  
  const getToday = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + now.getTimezoneOffset())
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  const [formData, setFormData] = useState({
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
  })
  const [meals, setMeals] = useState({})
  const [foodSearch, setFoodSearch] = useState({})
  const [recipes, setRecipes] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [usersRes, foodsRes, recipesRes] = await Promise.all([
        api.get("/v1/admin/users?per_page=100"),
        api.get("/v1/foods?per_page=200"),
        api.get("/v1/recipes?per_page=100"),
      ])
      setUsers(usersRes.data.data || usersRes.data)
      setFoods(foodsRes.data.data || foodsRes.data)
      
      const recipesData = recipesRes.data.data || recipesRes.data
      const recipesWithIngredients = await Promise.all(
        recipesData.map(async (r) => {
          try {
            const detailRes = await api.get(`/v1/recipes/${r.id}`)
            return detailRes.data
          } catch {
            return r
          }
        })
      )
      setRecipes(recipesWithIngredients)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setFetchingData(false)
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
      alert("Necesitas completar los datos del usuario: peso, estatura, edad y sexo")
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

  const addFoodToMeal = (day, moment, foodId) => {
    const key = `${day}-${moment}`
    const food = foods.find(f => f.id === parseInt(foodId))
    if (!food) return

    setMeals(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), { food_id: food.id, food, quantity: 100, unit: "g" }]
    }))
  }

  const addRecipeToMeal = (day, moment, recipe) => {
    const key = `${day}-${moment}`
    const recipeIngredients = recipe.ingredients || []

    // Agrega la receta como un único item agrupador con sus ingredientes dentro
    const recipeItem = {
      is_recipe: true,
      recipe_id: recipe.id,
      recipe_title: recipe.title,
      expanded: true,
      ingredients: recipeIngredients.map(ing => ({
        food_id: ing.food_id,
        food: ing.food,
        quantity: ing.quantity || 100,
        unit: ing.unit?.abbreviation || "g",
        unit_id: ing.unit_id,
      }))
    }

    setMeals(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), recipeItem]
    }))
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
    const key = `${day}-${moment}`
    setMeals(prev => {
      const updated = [...(prev[key] || [])]
      if (field === 'food_id') {
        const food = foods.find(f => f.id === parseInt(value))
        updated[index] = { ...updated[index], food_id: value, food }
      } else {
        updated[index] = { ...updated[index], [field]: value }
      }
      return { ...prev, [key]: updated }
    })
  }

  const removeMealFood = (day, moment, index) => {
    const key = `${day}-${moment}`
    setMeals(prev => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index)
    }))
  }

  const calcItemMacros = (item) => {
    // item puede ser un alimento suelto o una receta agrupada
    if (item.is_recipe) {
      return (item.ingredients || []).reduce((acc, ing) => {
        if (!ing.food || !ing.quantity) return acc
        const qty = parseFloat(ing.quantity)
        acc.calories += (ing.food.calories_per_100g * qty) / 100
        acc.protein  += (ing.food.protein_g  * qty) / 100
        acc.carbs    += (ing.food.carbs_g    * qty) / 100
        acc.fat      += (ing.food.fat_g      * qty) / 100
        return acc
      }, { calories: 0, protein: 0, carbs: 0, fat: 0 })
    }
    if (!item.food || !item.quantity) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
    const qty = parseFloat(item.quantity)
    return {
      calories: (item.food.calories_per_100g * qty) / 100,
      protein:  (item.food.protein_g  * qty) / 100,
      carbs:    (item.food.carbs_g    * qty) / 100,
      fat:      (item.food.fat_g      * qty) / 100,
    }
  }

  const calculateMealMacros = (day, moment) => {
    const key = `${day}-${moment}`
    const dayMeals = meals[key] || []
    const totals = dayMeals.reduce((acc, item) => {
      const m = calcItemMacros(item)
      acc.calories += m.calories; acc.protein += m.protein
      acc.carbs += m.carbs; acc.fat += m.fat
      return acc
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 })
    return { calories: Math.round(totals.calories), protein: Math.round(totals.protein), carbs: Math.round(totals.carbs), fat: Math.round(totals.fat) }
  }

  const calculateTotalMacros = () => {
    let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 }
    Object.keys(meals).forEach(key => {
      const [day, moment] = key.split('-')
      const macros = calculateMealMacros(day, moment)
      totals.calories += macros.calories
      totals.protein += macros.protein
      totals.carbs += macros.carbs
      totals.fat += macros.fat
    })
    return totals
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

      // Guardar comidas — expandir recetas en sus ingredientes individuales
      const mealsToSave = []
      Object.entries(meals).forEach(([key, dayMeals]) => {
        const [day, moment] = key.split('-')
        dayMeals.forEach(item => {
          if (item.is_recipe) {
            // Expandir ingredientes de la receta como comidas individuales
            ;(item.ingredients || []).forEach(ing => {
              if (!ing.food_id || !ing.unit_id || !ing.quantity) return
              mealsToSave.push({
                day_number: parseInt(day),
                meal_moment: moment,
                food_id:  Number(ing.food_id),
                unit_id:  Number(ing.unit_id),
                quantity: parseFloat(ing.quantity),
              })
            })
          } else {
            if (!item.food_id || !item.unit_id || !item.quantity) return
            mealsToSave.push({
              day_number: parseInt(day),
              meal_moment: moment,
              food_id:  Number(item.food_id),
              unit_id:  Number(item.unit_id),
              quantity: parseFloat(item.quantity),
            })
          }
        })
      })

      if (mealsToSave.length > 0) {
        await Promise.all(mealsToSave.map(meal => api.post(`/v1/plans/${planId}/meals`, meal)))
      }

      router.push("/admin/plans")
    } catch (error) {
      alert(error.message || "Error al crear plan")
    } finally {
      setLoading(false)
    }
  }

  const duration = DURATION_META[formData.duration]
  const totalDays = duration?.days || 7
  const totalMacros = calculateTotalMacros()
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

          {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => (
            <div key={day} className="mb-6 p-4 rounded-lg border" style={{ borderColor: "var(--color-border)" }}>
              <h3 className="font-semibold mb-3" style={S.textMain}>Día {day}</h3>
              
              <div className="space-y-4">
                {MEAL_MOMENTS.map(moment => {
                  const key = `${day}-${moment.key}`
                  const dayMeals = meals[key] || []
                  const macros = calculateMealMacros(day, moment.key)
                  const searchKey = `${day}-${moment.key}`
                  const suggestions = foodSearch[searchKey] || []
                  
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

                      {dayMeals.map((item, idx) => (
                        item.is_recipe ? (
                          // ── Receta agrupada ──
                          <div key={idx} className="mb-2 rounded border overflow-hidden" style={{ borderColor: "#8B5CF640" }}>
                            <div className="flex items-center justify-between px-2 py-1.5" style={{ background: "#8B5CF610" }}>
                              <button
                                type="button"
                                className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                                style={{ color: "#8B5CF6" }}
                                onClick={() => toggleRecipeExpanded(day, moment.key, idx)}
                              >
                                <span>{item.expanded ? "▾" : "▸"}</span>
                                🧑‍🍳 {item.recipe_title}
                                <span className="font-normal" style={{ color: "#8B5CF6AA" }}>({item.ingredients?.length || 0} ingredientes)</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => removeMealFood(day, moment.key, idx)}
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
                                    <span className="text-[10px]">{ing.quantity} {ing.unit}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          // ── Alimento suelto ──
                          <div key={idx} className="flex items-center gap-2 mb-2">
                            <div className="relative flex-1">
                              <input
                                type="text"
                                value={item.food?.name || ""}
                                onChange={(e) => {
                                  const q = e.target.value.toLowerCase()
                                  const filteredFoods = foods.filter(f => f.name.toLowerCase().includes(q)).slice(0, 3).map(f => ({ ...f, type: 'food' }))
                                  const filteredRecipes = recipes.filter(r => r.title.toLowerCase().includes(q)).slice(0, 2).map(r => ({ ...r, type: 'recipe' }))
                                  setFoodSearch(prev => ({ ...prev, [searchKey]: [...filteredFoods, ...filteredRecipes] }))
                                  updateMealFood(day, moment.key, idx, 'food_id', "")
                                }}
                                onFocus={(e) => {
                                  const q = e.target.value.toLowerCase()
                                  const filteredFoods = foods.filter(f => f.name.toLowerCase().includes(q)).slice(0, 3).map(f => ({ ...f, type: 'food' }))
                                  const filteredRecipes = recipes.filter(r => r.title.toLowerCase().includes(q)).slice(0, 2).map(r => ({ ...r, type: 'recipe' }))
                                  setFoodSearch(prev => ({ ...prev, [searchKey]: [...filteredFoods, ...filteredRecipes] }))
                                }}
                                onBlur={() => setTimeout(() => setFoodSearch(prev => ({ ...prev, [searchKey]: [] })), 200)}
                                className="w-full h-8 px-2 rounded border text-xs"
                                style={S.input}
                                placeholder="Buscar alimento o receta..."
                              />
                              {suggestions.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-48 overflow-auto" style={S.surface}>
                                  {suggestions.map((sug) => (
                                    <div
                                      key={sug.type === 'recipe' ? `r-${sug.id}` : sug.id}
                                      className="px-3 py-2 text-xs cursor-pointer flex items-center justify-between"
                                      style={{ color: "var(--color-foreground)" }}
                                      onMouseEnter={e => e.currentTarget.style.background = "var(--color-surface-raised)"}
                                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                      onMouseDown={() => {
                                        if (sug.type === 'recipe') {
                                          addRecipeToMeal(day, moment.key, sug)
                                          removeMealFood(day, moment.key, idx) // quitar el placeholder vacío
                                        } else {
                                          updateMealFood(day, moment.key, idx, 'food_id', sug.id)
                                        }
                                        setFoodSearch(prev => ({ ...prev, [searchKey]: [] }))
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
                            </div>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateMealFood(day, moment.key, idx, 'quantity', e.target.value)}
                              className="w-16 h-8 px-2 rounded border text-xs"
                              style={S.input}
                              placeholder="g"
                              step="any"
                            />
                            <button
                              type="button"
                              onClick={() => removeMealFood(day, moment.key, idx)}
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
                        onClick={() => addFoodToMeal(day, moment.key, foods[0]?.id)}
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
          ))}
        </div>

        {/* Resumen total */}
        {Object.keys(meals).length > 0 && (
          <div className="rounded-xl border p-6" style={S.surface}>
            <h2 className="text-lg font-semibold mb-4" style={S.textMain}>Resumen nutricional total</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg" style={{ background: "#F9731618" }}>
                <p className="text-2xl font-bold" style={{ color: "#F97316" }}>{totalMacros.calories}</p>
                <p className="text-xs" style={S.textMuted}>Calorías</p>
              </div>
              <div className="text-center p-4 rounded-lg" style={{ background: "#3B82F618" }}>
                <p className="text-2xl font-bold" style={{ color: "#3B82F6" }}>{totalMacros.protein}g</p>
                <p className="text-xs" style={S.textMuted}>Proteína</p>
              </div>
              <div className="text-center p-4 rounded-lg" style={{ background: "#F59E0B18" }}>
                <p className="text-2xl font-bold" style={{ color: "#F59E0B" }}>{totalMacros.carbs}g</p>
                <p className="text-xs" style={S.textMuted}>Carbohidratos</p>
              </div>
              <div className="text-center p-4 rounded-lg" style={{ background: "#F9731618" }}>
                <p className="text-2xl font-bold" style={{ color: "#F97316" }}>{totalMacros.fat}g</p>
                <p className="text-xs" style={S.textMuted}>Grasa</p>
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end gap-3">
          <Link href="/admin/plans">
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
