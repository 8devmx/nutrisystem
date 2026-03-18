<?php

namespace App\Http\Controllers\Api;

use App\Models\Food;
use App\Models\Plan;
use App\Models\PlanMeal;
use App\Models\Unit;
use App\Models\User;
use App\Services\NutritionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PlanController extends BaseApiController
{
    public function __construct(private NutritionService $nutritionService) {}

    /**
     * GET /api/v1/plans/{id}
     * Retorna el plan con datos enriquecidos: calorías totales y equivalencias por alimento.
     */
    public function show(int $id): JsonResponse
    {
        $plan = Plan::with([
            'user',
            'meals.food.equivalents.unit',
            'meals.unit',
        ])->find($id);

        if (!$plan) {
            return $this->error('Plan no encontrado.', null, 404);
        }

        $enrichedMeals = $this->enrichMeals($plan);

        return $this->success([
            'plan'             => [
                'id'             => $plan->id,
                'user_id'        => $plan->user_id,
                'title'          => $plan->title,
                'duration'       => $plan->duration,
                'start_date'     => $plan->start_date,
                'end_date'       => $plan->endDate()?->toDateString(),
                'total_days'     => $plan->totalDays(),
                'target_weight_kg' => $plan->target_weight_kg,
                'activity_factor' => $plan->activity_factor,
                'is_active'      => $plan->is_active,
                'total_calories' => $plan->total_calories,
                'protein_goal_g' => $plan->protein_goal_g,
                'carbs_goal_g'   => $plan->carbs_goal_g,
                'fat_goal_g'     => $plan->fat_goal_g,
                'consumed'       => $plan->calculateConsumed(),
            ],
            'user'             => $plan->user,
            'days'             => $enrichedMeals,
        ]);
    }

    /**
     * POST /api/v1/plans
     * Genera un plan nutricional para un usuario.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'user_id'  => 'required|exists:users,id',
                'title'    => 'required|string|max:255',
                'duration' => 'required|in:weekly,biweekly,monthly',
                'start_date' => 'nullable|date',
                'target_weight_kg' => 'nullable|numeric|min:0',
                'activity_factor' => 'nullable|in:sedentary,light,moderate,active,very_active',
                'total_calories' => 'nullable|numeric|min:0',
                'protein_goal_g' => 'nullable|numeric|min:0',
                'carbs_goal_g' => 'nullable|numeric|min:0',
                'fat_goal_g' => 'nullable|numeric|min:0',
            ]);

            $user = User::findOrFail($validated['user_id']);

            // Si se proporciona target_weight_kg, actualizar el usuario
            if (!empty($validated['target_weight_kg'])) {
                $user->update(['target_weight_kg' => $validated['target_weight_kg']]);
            }

            // Usar valores proporcionados o calcular
            if (!empty($validated['total_calories'])) {
                $requirements = [
                    'tdee' => $validated['total_calories'],
                    'protein_g' => $validated['protein_goal_g'] ?? 0,
                    'carbs_g' => $validated['carbs_goal_g'] ?? 0,
                    'fat_g' => $validated['fat_goal_g'] ?? 0,
                ];
            } else {
                // Calcular requerimiento calórico
                $requirements = $this->nutritionService->calculateDailyRequirements($user);
            }

            $plan = Plan::create([
                'user_id'        => $user->id,
                'title'          => $validated['title'],
                'duration'       => $validated['duration'],
                'start_date'     => $validated['start_date'] ?? now()->toDateString(),
                'target_weight_kg' => $validated['target_weight_kg'] ?? null,
                'activity_factor' => $validated['activity_factor'] ?? $user->activity_factor,
                'total_calories' => $requirements['tdee'],
                'protein_goal_g' => $requirements['protein_g'],
                'carbs_goal_g'   => $requirements['carbs_g'],
                'fat_goal_g'     => $requirements['fat_g'],
            ]);

            return $this->success(
                ['plan_id' => $plan->id, 'requirements' => $requirements],
                'Plan creado exitosamente.',
                201
            );

        } catch (ValidationException $e) {
            return $this->error('Error de validación.', $e->errors(), 422);
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), null, 422);
        }
    }

    /**
     * PUT /api/v1/plans/{id}
     * Actualiza los metadatos del plan (título, macros, etc.).
     */
    public function update(int $id, Request $request): JsonResponse
    {
        $plan = Plan::find($id);

        if (!$plan) {
            return $this->error('Plan no encontrado.', null, 404);
        }

        try {
            $validated = $request->validate([
                'title'            => 'sometimes|string|max:255',
                'duration'         => 'sometimes|in:weekly,biweekly,monthly',
                'start_date'       => 'sometimes|date',
                'target_weight_kg' => 'nullable|numeric|min:0',
                'activity_factor'  => 'nullable|in:sedentary,light,moderate,active,very_active',
                'total_calories'   => 'sometimes|numeric|min:0',
                'protein_goal_g'   => 'nullable|numeric|min:0',
                'carbs_goal_g'     => 'nullable|numeric|min:0',
                'fat_goal_g'       => 'nullable|numeric|min:0',
            ]);

            $plan->update($validated);

            return $this->success(['plan_id' => $plan->id], 'Plan actualizado exitosamente.');

        } catch (ValidationException $e) {
            return $this->error('Error de validación.', $e->errors(), 422);
        }
    }

    /**
     * POST /api/v1/plans/{id}/duplicate
     * Crea una copia completa del plan con todas sus comidas.
     */
    public function duplicate(int $id): JsonResponse
    {
        $original = Plan::withTrashed()->find($id);

        if (!$original) {
            return $this->error('Plan no encontrado.', null, 404);
        }

        $timestamp = now()->format('d/m/Y H:i');

        $copy = Plan::create([
            'user_id'          => $original->user_id,
            'title'            => $original->title . ' (copia ' . $timestamp . ')',
            'duration'         => $original->duration,
            'start_date'       => $original->start_date,
            'target_weight_kg' => $original->target_weight_kg,
            'activity_factor'  => $original->activity_factor,
            'is_active'        => true,
            'total_calories'   => $original->total_calories,
            'protein_goal_g'   => $original->protein_goal_g,
            'carbs_goal_g'     => $original->carbs_goal_g,
            'fat_goal_g'       => $original->fat_goal_g,
        ]);

        // Copiar todas las comidas
        $meals = PlanMeal::where('plan_id', $id)->get();
        foreach ($meals as $meal) {
            PlanMeal::create([
                'plan_id'     => $copy->id,
                'day_number'  => $meal->day_number,
                'meal_moment' => $meal->meal_moment,
                'food_id'     => $meal->food_id,
                'quantity'    => $meal->quantity,
                'unit_id'     => $meal->unit_id,
            ]);
        }

        return $this->success(
            ['plan_id' => $copy->id],
            'Plan duplicado exitosamente.',
            201
        );
    }

    /**
     * PATCH /api/v1/plans/{id}/toggle-active
     * Activa o desactiva un plan sin eliminarlo.
     */
    public function toggleActive(int $id): JsonResponse
    {
        $plan = Plan::find($id);

        if (!$plan) {
            return $this->error('Plan no encontrado.', null, 404);
        }

        $plan->update(['is_active' => !$plan->is_active]);

        $estado = $plan->is_active ? 'activado' : 'desactivado';
        return $this->success(
            ['id' => $plan->id, 'is_active' => $plan->is_active],
            "Plan {$estado} exitosamente."
        );
    }

    /**
     * DELETE /api/v1/plans/{id}
     * Eliminación permanente (hard delete) incluyendo sus comidas.
     */
    public function destroy(int $id): JsonResponse
    {
        // withTrashed para poder eliminar también los que están soft-deleted
        $plan = Plan::withTrashed()->find($id);

        if (!$plan) {
            return $this->error('Plan no encontrado.', null, 404);
        }

        // Eliminar comidas asociadas primero
        PlanMeal::where('plan_id', $id)->delete();

        // Hard delete del plan
        $plan->forceDelete();

        return $this->success(null, 'Plan eliminado permanentemente.');
    }

    /**
     * Enriquece las comidas del plan con calorías calculadas y equivalencias.
     */
    private function enrichMeals(Plan $plan): array
    {
        $days = [];

        foreach ($plan->meals as $meal) {
            $grams           = $meal->unit->toGrams($meal->quantity);
            $calories        = $meal->food->caloriesForGrams($grams);
            $equivalences    = $meal->food->equivalents->groupBy('group_name');

            $days[$meal->day_number][$meal->meal_moment][] = [
                'meal_id'      => $meal->id,
                'food'         => [
                    'id'                => $meal->food->id,
                    'name'              => $meal->food->name,
                    'image_path'        => $meal->food->image_path,
                    'calories_per_100g' => $meal->food->calories_per_100g,
                    'protein_g'         => $meal->food->protein_g,
                    'carbs_g'           => $meal->food->carbs_g,
                    'fat_g'             => $meal->food->fat_g,
                ],
                'quantity'     => $meal->quantity,
                'unit'         => [
                    'id'           => $meal->unit->id,
                    'name'         => $meal->unit->name,
                    'abbreviation' => $meal->unit->abbreviation,
                    'conversion_to_grams' => $meal->unit->conversion_to_grams ?? 1,
                ],
                'grams'        => $grams,
                'calories'     => $calories,
                'equivalences' => $equivalences,
            ];
        }

        ksort($days);

        return $days;
    }
}
