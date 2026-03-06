"use client"

import { useState } from "react"
import { NutritionCalculator } from "@/components/features/NutritionCalculator"
import { PlanViewer } from "@/components/features/PlanViewer"
import { plansApi } from "@/lib/api"
import { useMutation } from "@tanstack/react-query"

export default function Home() {
  const [view, setView] = useState("calculator")
  const [currentPlan, setCurrentPlan] = useState(null)

  const createPlanMutation = useMutation({
    mutationFn: async (data) => {
      const result = await plansApi.createPlan(data)
      const planData = await plansApi.getPlan(result.data.plan_id)
      return planData.data
    },
    onSuccess: (data) => {
      setCurrentPlan(data)
      setView("plan")
    },
    onError: (error) => {
      alert(error.message || "Error al crear el plan")
    },
  })

  const handleGeneratePlan = (data) => {
    createPlanMutation.mutate({
      user_id: 1,
      title: `Plan ${new Date().toLocaleDateString('es-MX')}`,
      duration: "weekly",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-green-950 dark:to-black">
      <header className="border-b bg-white/80 dark:bg-black/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <h1 className="text-xl font-bold">NutriSystem</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold mb-2">
            {view === "calculator" ? "Calcula tu Plan Nutricional" : "Tu Plan Alimenticio"}
          </h2>
          <p className="text-muted-foreground">
            {view === "calculator"
              ? "Ingresa tus datos físicos para obtener un plan personalizado"
              : "Sigue tu plan día a día"}
          </p>
        </div>

        {view === "calculator" ? (
          <NutritionCalculator onSubmit={handleGeneratePlan} />
        ) : (
          <PlanViewer plan={currentPlan} onBack={() => setView("calculator")} />
        )}
      </main>
    </div>
  )
}
