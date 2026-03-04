<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->string('name');           // gramos, pieza, taza, cucharada
            $table->string('abbreviation');   // g, pz, tz, cda
            $table->decimal('conversion_to_grams', 8, 4); // 1 pz = 120g => 120.0000
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('units');
    }
};
