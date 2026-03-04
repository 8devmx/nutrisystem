<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('weight_kg', 5, 2)->nullable()->after('email');
            $table->decimal('height_cm', 5, 2)->nullable()->after('weight_kg');
            $table->unsignedTinyInteger('age')->nullable()->after('height_cm');
            $table->enum('sex', ['male', 'female'])->nullable()->after('age');
            $table->enum('activity_factor', [
                'sedentary',
                'light',
                'moderate',
                'active',
                'very_active',
            ])->default('sedentary')->after('sex');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'weight_kg',
                'height_cm',
                'age',
                'sex',
                'activity_factor',
            ]);
        });
    }
};
