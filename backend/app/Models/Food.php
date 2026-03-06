<?php

namespace App\Models;

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
}
