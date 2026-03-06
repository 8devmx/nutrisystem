"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UtensilsCrossed, ChevronLeft, ChevronRight, X } from "lucide-react"

const MEAL_MOMENTS = [
  { key: 'breakfast',       label: 'Desayuno',         icon: '🌅' },
  { key: 'morning_snack',   label: 'Colación Mañana',  icon: '☕' },
  { key: 'lunch',           label: 'Comida',            icon: '🍽️' },
  { key: 'afternoon_snack', label: 'Colación Tarde',   icon: '🍎' },
  { key: 'dinner',          label: 'Cena',              icon: '🌙' },
]

export function PlanViewer({ plan, onBack }) {
  const [currentDay, setCurrentDay] = useState(1)
  const [selectedFood, setSelectedFood] = useState(null)

  // El backend devuelve { plan: {...}, days: { "1": { breakfast: [...], ... }, "2": {...} } }
  const days = plan?.days || {}
  const totalDays = plan?.plan?.total_days || Object.keys(days).length || 1

  if (!plan || Object.keys(days).length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No hay plan disponible</p>
          {onBack && (
            <Button variant="outline" className="mt-4" onClick={onBack}>
              <ChevronLeft className="h-4 w-4" />
              Volver
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  const currentDayData = days[String(currentDay)] || {}

  const totalCalories = Object.values(currentDayData)
    .flat()
    .reduce((sum, item) => sum + (item.calories || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header con navegación */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
          Nuevo Cálculo
        </Button>
        <div className="text-center">
          <h2 className="text-2xl font-bold">{plan.plan?.title}</h2>
          <p className="text-muted-foreground">
            Día {currentDay} de {totalDays} • {Math.round(totalCalories)} kcal
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDay(d => Math.max(1, d - 1))}
            disabled={currentDay === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDay(d => Math.min(totalDays, d + 1))}
            disabled={currentDay === totalDays}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Comidas del día */}
      <div className="grid gap-4">
        {MEAL_MOMENTS.map((moment) => {
          const meals = currentDayData[moment.key] || []
          const momentCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0)

          return (
            <Card key={moment.key}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <span>{moment.icon}</span>
                    {moment.label}
                  </span>
                  <Badge variant="secondary">{Math.round(momentCalories)} kcal</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {meals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin alimentos asignados</p>
                ) : (
                  <div className="space-y-3">
                    {meals.map((meal, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {meal.food?.image_path ? (
                            <img
                              src={meal.food.image_path}
                              alt={meal.food.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                              <UtensilsCrossed className="h-6 w-6 text-primary" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{meal.food?.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {meal.quantity} {meal.unit} • {meal.grams}g
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right mr-2">
                            <div className="font-medium">{Math.round(meal.calories)} kcal</div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedFood(meal)}
                          >
                            Intercambiar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Modal de equivalencias */}
      {selectedFood && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full max-h-[80vh] overflow-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Intercambios para {selectedFood.food?.name}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setSelectedFood(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {selectedFood.equivalences && Object.keys(selectedFood.equivalences).length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Puedes reemplazar este alimento por cualquiera del mismo grupo:
                  </p>
                  {Object.entries(selectedFood.equivalences).map(([group, items]) => (
                    <div key={group}>
                      <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                        {group}
                      </div>
                      <div className="space-y-2">
                        {items.map((eq, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              {eq.food?.image_path ? (
                                <img
                                  src={eq.food.image_path}
                                  alt={eq.food?.name}
                                  className="w-10 h-10 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-primary/10" />
                              )}
                              <div>
                                <div className="font-medium">{eq.food?.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {eq.grams_equivalent}g equivalente
                                </div>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {eq.food?.calories_per_100g} kcal/100g
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No hay intercambios disponibles para este alimento
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
