<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Unit extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'abbreviation',
        'conversion_to_grams',
    ];

    protected $casts = [
        'conversion_to_grams' => 'decimal:4',
    ];

    // ── Relaciones ──────────────────────────────

    public function foodEquivalents(): HasMany
    {
        return $this->hasMany(FoodEquivalent::class);
    }

    public function planMeals(): HasMany
    {
        return $this->hasMany(PlanMeal::class);
    }

    // ── Helpers ─────────────────────────────────

    /**
     * Convierte una cantidad en esta unidad a gramos.
     */
    public function toGrams(float $quantity): float
    {
        return round($quantity * $this->conversion_to_grams, 2);
    }
}
