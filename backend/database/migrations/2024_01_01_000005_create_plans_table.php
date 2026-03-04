<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->string('title');
            $table->enum('duration', ['weekly', 'biweekly', 'monthly']);
            $table->decimal('total_calories', 8, 2);    // Requerimiento calórico diario calculado
            $table->decimal('protein_goal_g', 8, 2)->nullable();
            $table->decimal('carbs_goal_g', 8, 2)->nullable();
            $table->decimal('fat_goal_g', 8, 2)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
