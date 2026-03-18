<?php

namespace App\Console\Commands;

use App\Models\Food;
use App\Services\MacroCategoryService;
use Illuminate\Console\Command;

class CategorizeFoods extends Command
{
    protected $signature = 'foods:categorize {--dry-run : Simular sin guardar}';

    protected $description = 'Categoriza todos los alimentos según su macronutriente dominante';

    public function handle(): int
    {
        $service = new MacroCategoryService();
        $dryRun = $this->option('dry-run');

        $foods = Food::withTrashed()->get();
        $bar = $this->output->createProgressBar($foods->count());
        $bar->start();

        $stats = [
            'protein' => 0,
            'carbs' => 0,
            'fat' => 0,
            'balanced' => 0,
        ];

        foreach ($foods as $food) {
            $category = $service->calculate(
                (float) ($food->protein_g ?? 0),
                (float) ($food->carbs_g ?? 0),
                (float) ($food->fat_g ?? 0)
            );

            $stats[$category->value]++;

            if (!$dryRun) {
                $food->update(['macro_category' => $category->value]);
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        if ($dryRun) {
            $this->info('⏩ Simulación completada (sin guardar)');
        } else {
            $this->info('✅ Categorización completada');
        }

        $this->line("Categorías encontradas:");
        $this->line("  🔵 Proteicos (protein): {$stats['protein']}");
        $this->line("  🟡 Carbólicos (carbs): {$stats['carbs']}");
        $this->line("  🟠 Grasos (fat): {$stats['fat']}");
        $this->line("  🟢 Balanceados (balanced): {$stats['balanced']}");

        return Command::SUCCESS;
    }
}
