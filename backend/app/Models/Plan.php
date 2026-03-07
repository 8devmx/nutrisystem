<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Plan extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'title',
        'duration',
        'start_date',
        'target_weight_kg',
        'activity_factor',
        'total_calories',
        'protein_goal_g',
        'carbs_goal_g',
        'fat_goal_g',
    ];

    protected $casts = [
        'start_date'       => 'date',
        'total_calories'    => 'decimal:2',
        'protein_goal_g'    => 'decimal:2',
        'carbs_goal_g'     => 'decimal:2',
        'fat_goal_g'       => 'decimal:2',
        'target_weight_kg' => 'decimal:2',
    ];

    // ── Relaciones ──────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function meals(): HasMany
    {
        return $this->hasMany(PlanMeal::class);
    }

    // ── Helpers ─────────────────────────────────

    /**
     * Retorna los días totales según la duración del plan.
     */
    public function totalDays(): int
    {
        return match ($this->duration) {
            'weekly'    => 7,
            'biweekly'  => 14,
            'monthly'   => 30,
            default     => 7,
        };
    }

    /**
     * Retorna la fecha de fin del plan.
     */
    public function endDate(): ?\Carbon\Carbon
    {
        if (!$this->start_date) return null;
        return \Carbon\Carbon::parse($this->start_date)->addDays($this->totalDays());
    }

    /**
     * Calcula los macronutrientes consumidos basándose en las comidas.
     */
    public function calculateConsumed(): array
    {
        $meals = $this->meals()->with('food')->get();
        
        $protein = 0;
        $carbs = 0;
        $fat = 0;
        $calories = 0;

        foreach ($meals as $meal) {
            if ($meal->food) {
                $grams = $meal->quantity;
                $protein += ($meal->food->protein_g * $grams) / 100;
                $carbs += ($meal->food->carbs_g * $grams) / 100;
                $fat += ($meal->food->fat_g * $grams) / 100;
                $calories += ($meal->food->calories_per_100g * $grams) / 100;
            }
        }

        return [
            'calories' => round($calories, 2),
            'protein_g' => round($protein, 2),
            'carbs_g' => round($carbs, 2),
            'fat_g' => round($fat, 2),
        ];
    }

    /**
     * Obtiene las comidas agrupadas por día y momento.
     */
    public function getMealsByDay(): array
    {
        $meals = $this->meals()->with(['food', 'unit'])->get()->groupBy('day_number');
        
        $result = [];
        foreach ($meals as $day => $dayMeals) {
            $result[$day] = $dayMeals->groupBy('meal_moment');
        }
        
        return $result;
    }
}
