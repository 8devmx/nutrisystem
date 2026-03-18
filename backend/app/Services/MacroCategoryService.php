<?php

namespace App\Services;

use App\Enums\MacroCategory;

class MacroCategoryService
{
    private const PROTEIN_CALORIES_PER_GRAM = 4;
    private const CARBS_CALORIES_PER_GRAM = 4;
    private const FAT_CALORIES_PER_GRAM = 9;

    public function calculate(float $proteinGrams, float $carbsGrams, float $fatGrams): MacroCategory
    {
        $proteinGrams = (float) ($proteinGrams ?? 0);
        $carbsGrams = (float) ($carbsGrams ?? 0);
        $fatGrams = (float) ($fatGrams ?? 0);

        $kcalFromProtein = $proteinGrams * self::PROTEIN_CALORIES_PER_GRAM;
        $kcalFromCarbs = $carbsGrams * self::CARBS_CALORIES_PER_GRAM;
        $kcalFromFat = $fatGrams * self::FAT_CALORIES_PER_GRAM;

        $totalKcal = $kcalFromProtein + $kcalFromCarbs + $kcalFromFat;

        if ($totalKcal <= 0) {
            return MacroCategory::BALANCED;
        }

        $proteinPercentage = $kcalFromProtein / $totalKcal;
        $carbsPercentage = $kcalFromCarbs / $totalKcal;
        $fatPercentage = $kcalFromFat / $totalKcal;

        $dominant = max($proteinPercentage, $carbsPercentage, $fatPercentage);

        if ($dominant < 0.40) {
            return MacroCategory::BALANCED;
        }

        if ($proteinPercentage >= 0.35 && $proteinPercentage >= $carbsPercentage && $proteinPercentage >= $fatPercentage) {
            return MacroCategory::PROTEIN;
        }

        if ($carbsPercentage >= 0.35 && $carbsPercentage >= $proteinPercentage && $carbsPercentage >= $fatPercentage) {
            return MacroCategory::CARBS;
        }

        if ($fatPercentage >= 0.35 && $fatPercentage >= $proteinPercentage && $fatPercentage >= $carbsPercentage) {
            return MacroCategory::FAT;
        }

        return MacroCategory::BALANCED;
    }

    public function getCategoryInfo(MacroCategory $category): array
    {
        return [
            'key' => $category->value,
            'label' => $category->label(),
            'description' => $category->description(),
            'color' => $category->color(),
        ];
    }

    public function getAllCategories(): array
    {
        return array_map(
            fn($category) => $this->getCategoryInfo($category),
            MacroCategory::cases()
        );
    }
}
