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
        'total_calories',
        'protein_goal_g',
        'carbs_goal_g',
        'fat_goal_g',
    ];

    protected $casts = [
        'total_calories'  => 'decimal:2',
        'protein_goal_g'  => 'decimal:2',
        'carbs_goal_g'    => 'decimal:2',
        'fat_goal_g'      => 'decimal:2',
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
}
