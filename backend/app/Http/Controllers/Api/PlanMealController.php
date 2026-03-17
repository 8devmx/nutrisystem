<?php

namespace App\Http\Controllers\Api;

use App\Models\Plan;
use App\Models\PlanMeal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;

class PlanMealController extends BaseApiController
{
    /**
     * POST /api/v1/plans/{planId}/meals
     * Agrega una comida al plan.
     */
    public function store(Request $request, int $planId): JsonResponse
    {
        $plan = Plan::find($planId);

        if (!$plan) {
            return $this->error('Plan no encontrado.', null, 404);
        }

        try {
            $validated = $request->validate([
                'day_number'   => ['required', 'integer', 'min:1', 'max:' . $plan->totalDays()],
                'meal_moment'  => ['required', Rule::in([
                    'breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner',
                ])],
                'food_id'      => 'required|exists:foods,id',
                'quantity'     => 'required|numeric|min:0',
                'unit_id'      => 'required|exists:units,id',
            ]);

            $validated['plan_id'] = $planId;

            $meal = PlanMeal::create($validated);
            $meal->load('food', 'unit');

            return $this->success($meal, 'Comida agregada al plan.', 201);

        } catch (ValidationException $e) {
            return $this->error('Error de validación.', $e->errors(), 422);
        }
    }

    /**
     * PUT /api/v1/plans/{planId}/meals/{mealId}
     * Actualiza cantidad/unidad de una comida.
     */
    public function update(Request $request, int $planId, int $mealId): JsonResponse
    {
        $meal = PlanMeal::where('plan_id', $planId)->find($mealId);

        if (!$meal) {
            return $this->error('Comida no encontrada en este plan.', null, 404);
        }

        try {
            $validated = $request->validate([
                'quantity' => 'sometimes|numeric|min:0',
                'unit_id'  => 'sometimes|exists:units,id',
            ]);

            $meal->update($validated);
            $meal->load('food', 'unit');

            return $this->success($meal, 'Comida actualizada.');

        } catch (ValidationException $e) {
            return $this->error('Error de validación.', $e->errors(), 422);
        }
    }

    /**
     * DELETE /api/v1/plans/{planId}/meals/{mealId}
     * Elimina una comida del plan.
     */
    public function destroy(int $planId, int $mealId): JsonResponse
    {
        $meal = PlanMeal::where('plan_id', $planId)->find($mealId);

        if (!$meal) {
            return $this->error('Comida no encontrada en este plan.', null, 404);
        }

        $meal->delete();

        return $this->success(null, 'Comida eliminada del plan.');
    }
}
