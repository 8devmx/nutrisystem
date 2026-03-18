<?php

namespace App\Enums;

enum MealCategory: string
{
    case BREAKFAST = 'breakfast';
    case SNACK = 'snack';
    case LUNCH = 'lunch';
    case DINNER = 'dinner';

    public function label(): string
    {
        return match ($this) {
            self::BREAKFAST => 'Desayuno',
            self::SNACK => 'Colación',
            self::LUNCH => 'Comida',
            self::DINNER => 'Cena',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::BREAKFAST => '#F59E0B',
            self::SNACK => '#8B5CF6',
            self::LUNCH => '#10B981',
            self::DINNER => '#3B82F6',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::BREAKFAST => 'Sunrise',
            self::SNACK => 'Coffee',
            self::LUNCH => 'Sun',
            self::DINNER => 'Moon',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
