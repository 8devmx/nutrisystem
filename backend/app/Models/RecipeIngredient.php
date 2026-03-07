<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecipeIngredient extends Model
{
    use HasFactory;

    protected $fillable = [
        'recipe_id',
        'food_id',
        'unit_id',
        'quantity',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
    ];

    public function recipe(): BelongsTo
    {
        return $this->belongsTo(Recipe::class);
    }

    public function food(): BelongsTo
    {
        return $this->belongsTo(Food::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function getGramsAttribute(): float
    {
        return $this->unit->toGrams($this->quantity);
    }

    public function calculateMacros(): array
    {
        $grams = $this->grams;
        
        return [
            'calories' => ($this->food->calories_per_100g * $grams) / 100,
            'protein_g' => ($this->food->protein_g * $grams) / 100,
            'carbs_g' => ($this->food->carbs_g * $grams) / 100,
            'fat_g' => ($this->food->fat_g * $grams) / 100,
        ];
    }
}
