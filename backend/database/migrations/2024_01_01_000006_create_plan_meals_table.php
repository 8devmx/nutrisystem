<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plan_meals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_id')
                ->constrained('plans')
                ->cascadeOnDelete();
            $table->unsignedTinyInteger('day_number');  // 1-7 semanal, 1-14 quincenal, 1-30 mensual
            $table->enum('meal_moment', [
                'breakfast',        // Desayuno      25%
                'morning_snack',    // Colación mañana 10%
                'lunch',            // Comida        35%
                'afternoon_snack',  // Colación tarde 10%
                'dinner',           // Cena          20%
            ]);
            $table->foreignId('food_id')
                ->constrained('foods');
            $table->decimal('quantity', 8, 2);
            $table->foreignId('unit_id')
                ->constrained('units');
            $table->timestamps();

            $table->index(['plan_id', 'day_number']);
            $table->index(['plan_id', 'meal_moment']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_meals');
    }
};
