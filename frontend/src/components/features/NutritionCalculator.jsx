"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useNutritionCalculator } from "@/hooks/useNutritionCalculator"
import { Calculator, ChefHat, UtensilsCrossed, Apple } from "lucide-react"

export function NutritionCalculator({ onSubmit }) {
  const { formData, updateField, requirements, activityLabels } = useNutritionCalculator()

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Datos Físicos
          </CardTitle>
          <CardDescription>
            Ingresa tus datos para calcular tu requerimiento calórico
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="70"
                value={formData.weight}
                onChange={(e) => updateField('weight', parseFloat(e.target.value) || '')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Altura (cm)</Label>
              <Input
                id="height"
                type="number"
                placeholder="170"
                value={formData.height}
                onChange={(e) => updateField('height', parseFloat(e.target.value) || '')}
              />
            </div>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="age">Edad</Label>
              <Input
                id="age"
                type="number"
                placeholder="30"
                value={formData.age}
                onChange={(e) => updateField('age', parseInt(e.target.value) || '')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sex">Sexo</Label>
              <Select value={formData.sex} onValueChange={(v) => updateField('sex', v)}>
                <SelectTrigger id="sex">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Femenino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity">Nivel de Actividad</Label>
            <Select value={formData.activity} onValueChange={(v) => updateField('activity', v)}>
              <SelectTrigger id="activity">
                <SelectValue placeholder="Selecciona tu nivel" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(activityLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className={requirements ? "border-primary" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Tu Requerimiento
          </CardTitle>
          <CardDescription>
            Calorías diarias estimadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {requirements ? (
            <>
              <div className="text-center">
                <div className="text-5xl font-bold text-primary">
                  {requirements.tdee}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  kcal/día
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
                  <div className="text-2xl font-bold text-blue-600">{requirements.protein}g</div>
                  <div className="text-xs text-muted-foreground">Proteína</div>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950">
                  <div className="text-2xl font-bold text-amber-600">{requirements.carbs}g</div>
                  <div className="text-xs text-muted-foreground">Carbs</div>
                </div>
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950">
                  <div className="text-2xl font-bold text-red-600">{requirements.fat}g</div>
                  <div className="text-xs text-muted-foreground">Grasa</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Distribución por comidas</div>
                <div className="space-y-1">
                  {requirements.meals.map((meal) => (
                    <div key={meal.moment} className="flex justify-between text-sm">
                      <span className="capitalize">{meal.moment.replace('_', ' ')}</span>
                      <span className="text-muted-foreground">{meal.calories} kcal ({meal.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={() => onSubmit?.({ ...formData, ...requirements })}
              >
                <UtensilsCrossed className="h-4 w-4" />
                Generar Plan Nutricional
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Apple className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Completa todos los datos para ver tu requerimiento calórico
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
