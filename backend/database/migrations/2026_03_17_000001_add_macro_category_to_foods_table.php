<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('foods', function (Blueprint $table) {
            $table->enum('macro_category', ['protein', 'carbs', 'fat', 'balanced'])
                ->nullable()
                ->after('fat_g')
                ->index();
        });
    }

    public function down(): void
    {
        Schema::table('foods', function (Blueprint $table) {
            $table->dropColumn('macro_category');
        });
    }
};
