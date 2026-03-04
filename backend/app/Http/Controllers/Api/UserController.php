<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Services\NutritionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends BaseApiController
{
    public function __construct(private NutritionService $nutritionService) {}

    /**
     * GET /api/v1/users/{id}/requirements
     * Calcula el requerimiento calórico diario del usuario.
     */
    public function requirements(int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->error('Usuario no encontrado.', null, 404);
        }

        try {
            $requirements = $this->nutritionService->calculateDailyRequirements($user);

            return $this->success([
                'user'         => [
                    'id'              => $user->id,
                    'name'            => $user->name,
                    'weight_kg'       => $user->weight_kg,
                    'height_cm'       => $user->height_cm,
                    'age'             => $user->age,
                    'sex'             => $user->sex,
                    'activity_factor' => $user->activity_factor,
                ],
                'requirements' => $requirements,
            ]);

        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), null, 422);
        }
    }

    /**
     * PUT /api/v1/users/{id}/profile
     * Actualiza el perfil nutricional del usuario.
     */
    public function updateProfile(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->error('Usuario no encontrado.', null, 404);
        }

        try {
            $validated = $request->validate([
                'weight_kg'       => 'sometimes|numeric|min:1|max:500',
                'height_cm'       => 'sometimes|numeric|min:50|max:300',
                'age'             => 'sometimes|integer|min:1|max:120',
                'sex'             => 'sometimes|in:male,female',
                'activity_factor' => 'sometimes|in:sedentary,light,moderate,active,very_active',
            ]);

            $user->update($validated);

            return $this->success($user, 'Perfil nutricional actualizado.');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->error('Error de validación.', $e->errors(), 422);
        }
    }
}
