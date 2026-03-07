<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->date('start_date')->nullable()->after('duration');
            $table->decimal('target_weight_kg', 5, 2)->nullable()->after('start_date');
            $table->string('activity_factor', 20)->nullable()->after('target_weight_kg');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->decimal('target_weight_kg', 5, 2)->nullable()->after('height_cm');
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn(['start_date', 'target_weight_kg', 'activity_factor']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('target_weight_kg');
        });
    }
};
