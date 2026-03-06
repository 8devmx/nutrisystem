<?php

namespace Database\Seeders;

use App\Models\Food;
use Illuminate\Database\Seeder;

class FoodSeeder extends Seeder
{
    public function run(): void
    {
        $foods = [
            // Cereales y tubérculos
            ['name' => 'Arroz blanco cocido', 'calories_per_100g' => 130, 'protein_g' => 2.7, 'carbs_g' => 28, 'fat_g' => 0.3, 'fiber_g' => 0.4],
            ['name' => 'Arroz integral cocido', 'calories_per_100g' => 112, 'protein_g' => 2.6, 'carbs_g' => 24, 'fat_g' => 0.9, 'fiber_g' => 1.8],
            ['name' => 'Pasta cocida', 'calories_per_100g' => 131, 'protein_g' => 5, 'carbs_g' => 25, 'fat_g' => 1.1, 'fiber_g' => 1.8],
            ['name' => 'Pan blanco', 'calories_per_100g' => 265, 'protein_g' => 9, 'carbs_g' => 49, 'fat_g' => 3.2, 'fiber_g' => 2.7],
            ['name' => 'Pan integral', 'calories_per_100g' => 247, 'protein_g' => 13, 'carbs_g' => 41, 'fat_g' => 3.4, 'fiber_g' => 7],
            ['name' => 'Papa cocida', 'calories_per_100g' => 87, 'protein_g' => 1.9, 'carbs_g' => 20, 'fat_g' => 0.1, 'fiber_g' => 1.8],
            ['name' => 'Papa sweet cocida', 'calories_per_100g' => 90, 'protein_g' => 2, 'carbs_g' => 21, 'fat_g' => 0.1, 'fiber_g' => 3.3],
            ['name' => 'Avena cocida', 'calories_per_100g' => 71, 'protein_g' => 2.5, 'carbs_g' => 12, 'fat_g' => 1.5, 'fiber_g' => 1.7],

            // Leguminosas
            ['name' => 'Frijoles negros cocidos', 'calories_per_100g' => 132, 'protein_g' => 8.9, 'carbs_g' => 24, 'fat_g' => 0.5, 'fiber_g' => 8.7],
            ['name' => 'Frijoles pintos cocidos', 'calories_per_100g' => 143, 'protein_g' => 9, 'carbs_g' => 26, 'fat_g' => 0.6, 'fiber_g' => 9],
            ['name' => 'Lentejas cocidas', 'calories_per_100g' => 116, 'protein_g' => 9, 'carbs_g' => 20, 'fat_g' => 0.4, 'fiber_g' => 7.9],
            ['name' => 'Garbanzos cocidos', 'calories_per_100g' => 164, 'protein_g' => 8.9, 'carbs_g' => 27, 'fat_g' => 2.6, 'fiber_g' => 7.6],

            // Carnes y pollo
            ['name' => 'Pechuga de pollo sin piel', 'calories_per_100g' => 165, 'protein_g' => 31, 'carbs_g' => 0, 'fat_g' => 3.6, 'fiber_g' => 0],
            ['name' => 'Muslo de pollo sin piel', 'calories_per_100g' => 177, 'protein_g' => 26, 'carbs_g' => 0, 'fat_g' => 8.2, 'fiber_g' => 0],
            ['name' => 'Carne molida de res magra', 'calories_per_100g' => 250, 'protein_g' => 26, 'carbs_g' => 0, 'fat_g' => 15, 'fiber_g' => 0],
            ['name' => 'Bistec de res', 'calories_per_100g' => 271, 'protein_g' => 25, 'carbs_g' => 0, 'fat_g' => 19, 'fiber_g' => 0],
            ['name' => 'Cerdo magro', 'calories_per_100g' => 143, 'protein_g' => 26, 'carbs_g' => 0, 'fat_g' => 3.5, 'fiber_g' => 0],
            ['name' => 'Filete de pescado', 'calories_per_100g' => 136, 'protein_g' => 23, 'carbs_g' => 0, 'fat_g' => 4.5, 'fiber_g' => 0],
            ['name' => 'Salmón', 'calories_per_100g' => 208, 'protein_g' => 20, 'carbs_g' => 0, 'fat_g' => 13, 'fiber_g' => 0],
            ['name' => 'Atún en agua', 'calories_per_100g' => 116, 'protein_g' => 26, 'carbs_g' => 0, 'fat_g' => 0.8, 'fiber_g' => 0],

            // Huevos
            ['name' => 'Huevo entero', 'calories_per_100g' => 155, 'protein_g' => 13, 'carbs_g' => 1.1, 'fat_g' => 11, 'fiber_g' => 0],
            ['name' => 'Clara de huevo', 'calories_per_100g' => 52, 'protein_g' => 11, 'carbs_g' => 0.7, 'fat_g' => 0.2, 'fiber_g' => 0],
            ['name' => 'Huevo poche', 'calories_per_100g' => 143, 'protein_g' => 13, 'carbs_g' => 0.8, 'fat_g' => 9.5, 'fiber_g' => 0],

            // Lácteos
            ['name' => 'Leche entera', 'calories_per_100g' => 61, 'protein_g' => 3.2, 'carbs_g' => 4.8, 'fat_g' => 3.3, 'fiber_g' => 0],
            ['name' => 'Leche descremada', 'calories_per_100g' => 34, 'protein_g' => 3.4, 'carbs_g' => 5, 'fat_g' => 0.1, 'fiber_g' => 0],
            ['name' => 'Yogur natural', 'calories_per_100g' => 61, 'protein_g' => 3.5, 'carbs_g' => 4.7, 'fat_g' => 3.3, 'fiber_g' => 0],
            ['name' => 'Yogur descremado', 'calories_per_100g' => 36, 'protein_g' => 3.8, 'carbs_g' => 5, 'fat_g' => 0.4, 'fiber_g' => 0],
            ['name' => 'Queso cottage', 'calories_per_100g' => 98, 'protein_g' => 11, 'carbs_g' => 3.4, 'fat_g' => 4.3, 'fiber_g' => 0],
            ['name' => 'Queso cheddar', 'calories_per_100g' => 403, 'protein_g' => 25, 'carbs_g' => 1.3, 'fat_g' => 33, 'fiber_g' => 0],
            ['name' => 'Requesón', 'calories_per_100g' => 98, 'protein_g' => 11, 'carbs_g' => 3.4, 'fat_g' => 4.5, 'fiber_g' => 0],

            // Frutas
            ['name' => 'Manzana', 'calories_per_100g' => 52, 'protein_g' => 0.3, 'carbs_g' => 14, 'fat_g' => 0.2, 'fiber_g' => 2.4],
            ['name' => 'Plátano', 'calories_per_100g' => 89, 'protein_g' => 1.1, 'carbs_g' => 23, 'fat_g' => 0.3, 'fiber_g' => 2.6],
            ['name' => 'Uvas', 'calories_per_100g' => 69, 'protein_g' => 0.7, 'carbs_g' => 18, 'fat_g' => 0.2, 'fiber_g' => 0.9],
            ['name' => 'Naranja', 'calories_per_100g' => 47, 'protein_g' => 0.9, 'carbs_g' => 12, 'fat_g' => 0.1, 'fiber_g' => 2.4],
            ['name' => 'Fresas', 'calories_per_100g' => 32, 'protein_g' => 0.7, 'carbs_g' => 7.7, 'fat_g' => 0.3, 'fiber_g' => 2],
            ['name' => 'Mango', 'calories_per_100g' => 60, 'protein_g' => 0.8, 'carbs_g' => 15, 'fat_g' => 0.4, 'fiber_g' => 1.6],
            ['name' => 'Papaya', 'calories_per_100g' => 43, 'protein_g' => 0.5, 'carbs_g' => 11, 'fat_g' => 0.3, 'fiber_g' => 1.7],
            ['name' => 'Sandía', 'calories_per_100g' => 30, 'protein_g' => 0.6, 'carbs_g' => 7.6, 'fat_g' => 0.2, 'fiber_g' => 0.4],
            ['name' => 'Piña', 'calories_per_100g' => 50, 'protein_g' => 0.5, 'carbs_g' => 13, 'fat_g' => 0.1, 'fiber_g' => 1.4],
            ['name' => 'Aguacate', 'calories_per_100g' => 160, 'protein_g' => 2, 'carbs_g' => 9, 'fat_g' => 15, 'fiber_g' => 7],

            // Verduras
            ['name' => 'Brócoli', 'calories_per_100g' => 34, 'protein_g' => 2.8, 'carbs_g' => 7, 'fat_g' => 0.4, 'fiber_g' => 2.6],
            ['name' => 'Espinacas', 'calories_per_100g' => 23, 'protein_g' => 2.9, 'carbs_g' => 3.6, 'fat_g' => 0.4, 'fiber_g' => 2.2],
            ['name' => 'Zanahoria', 'calories_per_100g' => 41, 'protein_g' => 0.9, 'carbs_g' => 10, 'fat_g' => 0.2, 'fiber_g' => 2.8],
            ['name' => 'Tomate', 'calories_per_100g' => 18, 'protein_g' => 0.9, 'carbs_g' => 3.9, 'fat_g' => 0.2, 'fiber_g' => 1.2],
            ['name' => 'Lechuga', 'calories_per_100g' => 15, 'protein_g' => 1.4, 'carbs_g' => 2.9, 'fat_g' => 0.2, 'fiber_g' => 1.3],
            ['name' => 'Pepino', 'calories_per_100g' => 16, 'protein_g' => 0.7, 'carbs_g' => 3.6, 'fat_g' => 0.1, 'fiber_g' => 0.5],
            ['name' => 'Pimiento', 'calories_per_100g' => 31, 'protein_g' => 1, 'carbs_g' => 6, 'fat_g' => 0.3, 'fiber_g' => 2.1],
            ['name' => 'Coliflor', 'calories_per_100g' => 25, 'protein_g' => 1.9, 'carbs_g' => 5, 'fat_g' => 0.3, 'fiber_g' => 2],
            ['name' => 'Calabacín', 'calories_per_100g' => 17, 'protein_g' => 1.2, 'carbs_g' => 3.1, 'fat_g' => 0.3, 'fiber_g' => 1],
            ['name' => 'Cebolla', 'calories_per_100g' => 40, 'protein_g' => 1.1, 'carbs_g' => 9, 'fat_g' => 0.1, 'fiber_g' => 1.7],
            ['name' => 'Ajo', 'calories_per_100g' => 149, 'protein_g' => 6.4, 'carbs_g' => 33, 'fat_g' => 0.5, 'fiber_g' => 2.1],
            ['name' => 'Ejotes', 'calories_per_100g' => 31, 'protein_g' => 1.8, 'carbs_g' => 7, 'fat_g' => 0.1, 'fiber_g' => 3.4],
            ['name' => 'Champiñones', 'calories_per_100g' => 22, 'protein_g' => 3.1, 'carbs_g' => 3.3, 'fat_g' => 0.3, 'fiber_g' => 1],

            // Grasas y aceites
            ['name' => 'Aceite de oliva', 'calories_per_100g' => 884, 'protein_g' => 0, 'carbs_g' => 0, 'fat_g' => 100, 'fiber_g' => 0],
            ['name' => 'Mantequilla', 'calories_per_100g' => 717, 'protein_g' => 0.9, 'carbs_g' => 0.1, 'fat_g' => 81, 'fiber_g' => 0],
            ['name' => 'Aguacate', 'calories_per_100g' => 160, 'protein_g' => 2, 'carbs_g' => 9, 'fat_g' => 15, 'fiber_g' => 7],
            ['name' => 'Almendras', 'calories_per_100g' => 579, 'protein_g' => 21, 'carbs_g' => 22, 'fat_g' => 50, 'fiber_g' => 12],
            ['name' => 'Nueces', 'calories_per_100g' => 654, 'protein_g' => 15, 'carbs_g' => 14, 'fat_g' => 65, 'fiber_g' => 7],
            ['name' => 'Maní', 'calories_per_100g' => 567, 'protein_g' => 26, 'carbs_g' => 16, 'fat_g' => 49, 'fiber_g' => 9],

            // Bebidas
            ['name' => 'Jugo de naranja', 'calories_per_100g' => 45, 'protein_g' => 0.7, 'carbs_g' => 10, 'fat_g' => 0.2, 'fiber_g' => 0.2],
            ['name' => 'Jugo de manzana', 'calories_per_100g' => 46, 'protein_g' => 0.1, 'carbs_g' => 11, 'fat_g' => 0.1, 'fiber_g' => 0.1],
        ];

        foreach ($foods as $food) {
            Food::create([
                'name' => $food['name'],
                'slug' => \Illuminate\Support\Str::slug($food['name']),
                'calories_per_100g' => $food['calories_per_100g'],
                'protein_g' => $food['protein_g'],
                'carbs_g' => $food['carbs_g'],
                'fat_g' => $food['fat_g'],
                'fiber_g' => $food['fiber_g'],
            ]);
        }
    }
}
