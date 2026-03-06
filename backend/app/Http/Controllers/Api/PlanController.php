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
                'title'          => $plan->title,
                'duration'       => $plan->duration,
                'total_days'     => $plan->totalDays(),
                'total_calories' => $plan->total_calories,
                'protein_goal_g' => $plan->protein_goal_g,
                'carbs_goal_g'   => $plan->carbs_goal_g,
                'fat_goal_g'     => $plan->fat_goal_g,
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
            ]);

            $user = User::findOrFail($validated['user_id']);

            // Calcular requerimiento calórico
            $requirements = $this->nutritionService->calculateDailyRequirements($user);

            $plan = Plan::create([
                'user_id'        => $user->id,
                'title'          => $validated['title'],
                'duration'       => $validated['duration'],
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
     * DELETE /api/v1/plans/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $plan = Plan::find($id);

        if (!$plan) {
            return $this->error('Plan no encontrado.', null, 404);
        }

        $plan->delete();

        return $this->success(null, 'Plan eliminado exitosamente.');
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
                    'id'         => $meal->food->id,
                    'name'       => $meal->food->name,
                    'image_path' => $meal->food->image_path,
                ],
                'quantity'     => $meal->quantity,
                'unit'         => $meal->unit->abbreviation,
                'grams'        => $grams,
                'calories'     => $calories,
                'equivalences' => $equivalences,
            ];
        }

        ksort($days);

        return $days;
    }
}
