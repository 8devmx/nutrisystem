<?php

namespace App\Enums;

enum MacroCategory: string
{
    case PROTEIN = 'protein';
    case CARBS = 'carbs';
    case FAT = 'fat';
    case BALANCED = 'balanced';

    public function label(): string
    {
        return match ($this) {
            self::PROTEIN => 'Alimento Proteico',
            self::CARBS => 'Alimento Carbólico',
            self::FAT => 'Alimento Graso',
            self::BALANCED => 'Alimento Balanceado',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::PROTEIN => 'Predominio de proteína (>50% kcal)',
            self::CARBS => 'Predominio de carbohidratos (>50% kcal)',
            self::FAT => 'Predominio de grasa (>50% kcal)',
            self::BALANCED => 'Sin macronutriente dominante claro',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::PROTEIN => '#3B82F6',
            self::CARBS => '#F59E0B',
            self::FAT => '#F97316',
            self::BALANCED => '#16A34A',
        };
    }
}
