<?php

namespace App\Services;

use App\Models\User;

class NutritionService
{
    /**
     * Factores de actividad según nivel.
     */
    private const ACTIVITY_FACTORS = [
        'sedentary'   => 1.2,
        'light'       => 1.375,
        'moderate'    => 1.55,
        'active'      => 1.725,
        'very_active' => 1.9,
    ];

    /**
     * Distribución calórica por momento del día.
     */
    private const MEAL_DISTRIBUTION = [
        'breakfast'       => 0.25,
        'morning_snack'   => 0.10,
        'lunch'           => 0.35,
        'afternoon_snack' => 0.10,
        'dinner'          => 0.20,
    ];

    /**
     * Calcula el requerimiento calórico diario usando Mifflin-St Jeor.
     * Todos los valores vienen del modelo User — nunca se usan datos hardcodeados.
     */
    public function calculateDailyRequirements(User $user): array
    {
        $this->validateUserProfile($user);

        $bmr = $this->calculateBmr($user);
        $tdee = $bmr * self::ACTIVITY_FACTORS[$user->activity_factor];

        $macros = $this->calculateMacros($tdee);
        $mealDistribution = $this->calculateMealDistribution($tdee);

        return [
            'bmr'               => round($bmr, 2),
            'tdee'              => round($tdee, 2),
            'protein_g'         => $macros['protein_g'],
            'carbs_g'           => $macros['carbs_g'],
            'fat_g'             => $macros['fat_g'],
            'meal_distribution' => $mealDistribution,
        ];
    }

    /**
     * Fórmula de Harris-Benedict revisada (Mifflin-St Jeor).
     *
     * Hombres: (10 × kg) + (6.25 × cm) - (5 × edad) + 5
     * Mujeres: (10 × kg) + (6.25 × cm) - (5 × edad) - 161
     */
    private function calculateBmr(User $user): float
    {
        $base = (10 * $user->weight_kg)
            + (6.25 * $user->height_cm)
            - (5 * $user->age);

        return $user->sex === 'male'
            ? $base + 5
            : $base - 161;
    }

    /**
     * Distribución de macronutrientes estándar:
     * Proteína: 20% | Carbohidratos: 50% | Grasas: 30%
     */
    private function calculateMacros(float $tdee): array
    {
        return [
            'protein_g' => round(($tdee * 0.20) / 4, 2), // 4 kcal/g
            'carbs_g'   => round(($tdee * 0.50) / 4, 2), // 4 kcal/g
            'fat_g'     => round(($tdee * 0.30) / 9, 2), // 9 kcal/g
        ];
    }

    /**
     * Calorías objetivo por momento del día.
     */
    private function calculateMealDistribution(float $tdee): array
    {
        $distribution = [];

        foreach (self::MEAL_DISTRIBUTION as $moment => $percentage) {
            $distribution[$moment] = round($tdee * $percentage, 2);
        }

        return $distribution;
    }

    /**
     * Valida que el usuario tenga el perfil nutricional completo.
     */
    private function validateUserProfile(User $user): void
    {
        $required = ['weight_kg', 'height_cm', 'age', 'sex', 'activity_factor'];

        foreach ($required as $field) {
            if (empty($user->$field)) {
                throw new \InvalidArgumentException(
                    "El campo '{$field}' es requerido para calcular el requerimiento calórico."
                );
            }
        }
    }
}
