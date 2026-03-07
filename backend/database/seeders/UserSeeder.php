<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@nutrisystem.com'],
            [
                'name' => 'Administrador',
                'password' => Hash::make('password'),
                'weight_kg' => 70,
                'height_cm' => 170,
                'target_weight_kg' => 65,
                'age' => 30,
                'sex' => 'male',
                'activity_factor' => 'moderate',
            ]
        );

        User::updateOrCreate(
            ['email' => 'abraham.opp@gmail.com'],
            [
                'name' => 'Abraham Pech',
                'password' => Hash::make('password'),
                'weight_kg' => 80,
                'height_cm' => 175,
                'target_weight_kg' => 75,
                'age' => 28,
                'sex' => 'male',
                'activity_factor' => 'light',
            ]
        );

        $this->command->info('✓ Usuarios creados correctamente.');
    }
}
