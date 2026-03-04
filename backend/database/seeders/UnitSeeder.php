<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UnitSeeder extends Seeder
{
    public function run(): void
    {
        $units = [
            ['name' => 'Gramos',      'abbreviation' => 'g',   'conversion_to_grams' => 1.0000],
            ['name' => 'Kilogramos',  'abbreviation' => 'kg',  'conversion_to_grams' => 1000.0000],
            ['name' => 'Pieza',       'abbreviation' => 'pz',  'conversion_to_grams' => 120.0000],
            ['name' => 'Taza',        'abbreviation' => 'tz',  'conversion_to_grams' => 240.0000],
            ['name' => 'Cucharada',   'abbreviation' => 'cda', 'conversion_to_grams' => 15.0000],
            ['name' => 'Cucharadita', 'abbreviation' => 'cdita','conversion_to_grams' => 5.0000],
            ['name' => 'Mililitros',  'abbreviation' => 'ml',  'conversion_to_grams' => 1.0000],
            ['name' => 'Litro',       'abbreviation' => 'l',   'conversion_to_grams' => 1000.0000],
            ['name' => 'Onza',        'abbreviation' => 'oz',  'conversion_to_grams' => 28.3495],
            ['name' => 'Rebanada',    'abbreviation' => 'reb', 'conversion_to_grams' => 30.0000],
            ['name' => 'Porción',     'abbreviation' => 'por', 'conversion_to_grams' => 100.0000],
        ];

        foreach ($units as $unit) {
            DB::table('units')->updateOrInsert(
                ['abbreviation' => $unit['abbreviation']],
                array_merge($unit, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }
}
