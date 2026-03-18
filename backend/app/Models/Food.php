<?php

namespace App\Models;

use App\Enums\MacroCategory;
use App\Services\MacroCategoryService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Food extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'foods';

    protected $fillable = [
        'name',
        'slug',
        'calories_per_100g',
        'protein_g',
        'carbs_g',
        'fat_g',
        'fiber_g',
        'image_path',
        'macro_category',
    ];

    protected $casts = [
        'calories_per_100g' => 'decimal:2',
        'protein_g'         => 'decimal:2',
        'carbs_g'           => 'decimal:2',
        'fat_g'             => 'decimal:2',
        'fiber_g'           => 'decimal:2',
    ];

    // ── Hooks ────────────────────────────────────

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Food $food) {
            if (empty($food->slug)) {
                $food->slug = Str::slug($food->name);
            }
        });
    }

    // ── Relaciones ──────────────────────────────

    public function equivalents(): HasMany
    {
        return $this->hasMany(FoodEquivalent::class);
    }

    public function planMeals(): HasMany
    {
        return $this->hasMany(PlanMeal::class);
    }

    // ── Helpers ─────────────────────────────────

    /**
     * Calcula las calorías para una cantidad en gramos dada.
     */
    public function caloriesForGrams(float $grams): float
    {
        return round(($this->calories_per_100g * $grams) / 100, 2);
    }

    /**
     * Calcula y retorna la categoría de macronutriente dominante.
     */
    public function getMacroCategory(): MacroCategory
    {
        $service = new MacroCategoryService();
        return $service->calculate(
            (float) $this->protein_g,
            (float) $this->carbs_g,
            (float) $this->fat_g
        );
    }

    /**
     * Retorna la categoría almacenada o la calcula si no existe.
     * Devuelve el valor string del enum para ser seguro en serialización JSON.
     */
    public function getMacroCategoryAttribute(): string
    {
        $raw = $this->attributes['macro_category'] ?? null;

        if ($raw && MacroCategory::tryFrom($raw) !== null) {
            return $raw;
        }

        return $this->getMacroCategory()->value;
    }

    /**
     * Retorna información de la categoría para la API.
     */
    public function getMacroCategoryInfo(): array
    {
        $category = MacroCategory::from($this->macro_category);
        return [
            'key' => $category->value,
            'label' => $category->label(),
            'description' => $category->description(),
            'color' => $category->color(),
        ];
    }

    /**
     * Calcula los porcentajes de kcal por macronutriente.
     */
    public function getMacroPercentages(): array
    {
        $protein = (float) ($this->protein_g ?? 0);
        $carbs = (float) ($this->carbs_g ?? 0);
        $fat = (float) ($this->fat_g ?? 0);

        $kcalProtein = $protein * 4;
        $kcalCarbs = $carbs * 4;
        $kcalFat = $fat * 9;
        $total = $kcalProtein + $kcalCarbs + $kcalFat;

        if ($total === 0) {
            return [
                'protein' => 0,
                'carbs' => 0,
                'fat' => 0,
            ];
        }

        return [
            'protein' => round(($kcalProtein / $total) * 100, 1),
            'carbs' => round(($kcalCarbs / $total) * 100, 1),
            'fat' => round(($kcalFat / $total) * 100, 1),
        ];
    }
}
