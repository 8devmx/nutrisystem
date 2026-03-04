<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FoodEquivalent extends Model
{
    use HasFactory;

    protected $fillable = [
        'group_name',
        'food_id',
        'quantity',
        'unit_id',
        'grams_equivalent',
    ];

    protected $casts = [
        'quantity'         => 'decimal:2',
        'grams_equivalent' => 'decimal:2',
    ];

    // ── Relaciones ──────────────────────────────

    public function food(): BelongsTo
    {
        return $this->belongsTo(Food::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }
}
