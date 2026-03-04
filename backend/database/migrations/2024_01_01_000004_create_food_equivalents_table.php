<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('food_equivalents', function (Blueprint $table) {
            $table->id();
            $table->string('group_name');           // Cereales, Proteínas, Frutas, Verduras, Lácteos, Grasas
            $table->foreignId('food_id')
                ->constrained('foods')
                ->cascadeOnDelete();
            $table->decimal('quantity', 8, 2);      // 1.5 (tazas), 30 (gramos), etc.
            $table->foreignId('unit_id')
                ->constrained('units');
            $table->decimal('grams_equivalent', 8, 2); // gramos exactos = 1 equivalente del grupo
            $table->timestamps();

            $table->index('group_name');
            $table->index('food_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('food_equivalents');
    }
};
