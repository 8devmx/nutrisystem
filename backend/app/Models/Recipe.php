<?php

namespace App\Models;

use App\Enums\MealCategory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Recipe extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'servings',
        'prep_time_minutes',
        'meal_categories',
    ];

    protected $casts = [
        'servings' => 'integer',
        'prep_time_minutes' => 'integer',
        'meal_categories' => 'array',
    ];

    public function ingredients(): HasMany
    {
        return $this->hasMany(RecipeIngredient::class);
    }

    public function ingredientsWithFood(): HasMany
    {
        return $this->hasMany(RecipeIngredient::class)->with('food', 'unit');
    }

    public function calculateMacros(): array
    {
        $totalCalories = 0;
        $totalProtein = 0;
        $totalCarbs = 0;
        $totalFat = 0;

        foreach ($this->ingredients as $ingredient) {
            $grams = $ingredient->unit->toGrams($ingredient->quantity);
            
            $calories = ($ingredient->food->calories_per_100g * $grams) / 100;
            $protein = ($ingredient->food->protein_g * $grams) / 100;
            $carbs = ($ingredient->food->carbs_g * $grams) / 100;
            $fat = ($ingredient->food->fat_g * $grams) / 100;

            $totalCalories += $calories;
            $totalProtein += $protein;
            $totalCarbs += $carbs;
            $totalFat += $fat;
        }

        return [
            'calories' => round($totalCalories, 2),
            'protein_g' => round($totalProtein, 2),
            'carbs_g' => round($totalCarbs, 2),
            'fat_g' => round($totalFat, 2),
        ];
    }

    public function calculateMacrosPerServing(): array
    {
        $macros = $this->calculateMacros();
        
        if ($this->servings <= 0) {
            return $macros;
        }

        return [
            'calories' => round($macros['calories'] / $this->servings, 2),
            'protein_g' => round($macros['protein_g'] / $this->servings, 2),
            'carbs_g' => round($macros['carbs_g'] / $this->servings, 2),
            'fat_g' => round($macros['fat_g'] / $this->servings, 2),
        ];
    }

    public function getMealCategoriesInfo(): array
    {
        $categories = $this->meal_categories ?? [];
        
        return array_map(function ($categoryKey) {
            $category = MealCategory::tryFrom($categoryKey);
            if (!$category) {
                return null;
            }
            return [
                'key' => $category->value,
                'label' => $category->label(),
                'color' => $category->color(),
            ];
        }, array_filter($categories));
    }

    public function hasMealCategory(MealCategory $category): bool
    {
        $categories = $this->meal_categories ?? [];
        return in_array($category->value, $categories);
    }
}
