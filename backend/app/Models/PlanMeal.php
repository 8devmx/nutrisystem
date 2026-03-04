<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlanMeal extends Model
{
    use HasFactory;

    protected $fillable = [
        'plan_id',
        'day_number',
        'meal_moment',
        'food_id',
        'quantity',
        'unit_id',
    ];

    protected $casts = [
        'day_number' => 'integer',
        'quantity'   => 'decimal:2',
    ];

    // ── Relaciones ──────────────────────────────

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function food(): BelongsTo
    {
        return $this->belongsTo(Food::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    // ── Helpers ─────────────────────────────────

    /**
     * Calcula las calorías de esta comida según cantidad y unidad.
     */
    public function calculatedCalories(): float
    {
        $grams = $this->unit->toGrams($this->quantity);
        return $this->food->caloriesForGrams($grams);
    }
}
