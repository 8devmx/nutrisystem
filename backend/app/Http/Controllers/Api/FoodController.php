<?php

namespace App\Http\Controllers\Api;

use App\Enums\MacroCategory;
use App\Models\Food;
use App\Services\MacroCategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class FoodController extends BaseApiController
{
    /**
     * GET /api/v1/foods/categories
     * Retorna todas las categorías de macronutrientes disponibles.
     */
    public function categories(): JsonResponse
    {
        $service = new MacroCategoryService();
        return $this->success([
            'categories' => $service->getAllCategories(),
        ]);
    }

    /**
     * GET /api/v1/foods
     * Lista alimentos con paginación, búsqueda y filtro por categoría.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Food::query();

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->has('group')) {
            $query->whereHas('equivalents', function ($q) use ($request) {
                $q->where('group_name', $request->group);
            });
        }

        if ($request->has('macro_category')) {
            $query->where('macro_category', $request->macro_category);
        }

        $perPage = min((int) $request->get('per_page', 15), 500);
        $foods = $query->paginate($perPage);

        $foods->getCollection()->transform(function ($food) {
            return $this->transformFood($food);
        });

        return $this->success($foods);
    }

    /**
     * GET /api/v1/foods/{id}
     */
    public function show(int $id): JsonResponse
    {
        $food = Food::find($id);

        if (!$food) {
            return $this->error('Alimento no registrado en el sistema.', null, 404);
        }

        return $this->success($this->transformFood($food));
    }

    /**
     * POST /api/v1/foods
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name'               => 'required|string|max:255|unique:foods,name',
                'calories_per_100g'  => 'required|numeric|min:0',
                'protein_g'          => 'nullable|numeric|min:0',
                'carbs_g'            => 'nullable|numeric|min:0',
                'fat_g'              => 'nullable|numeric|min:0',
                'fiber_g'            => 'nullable|numeric|min:0',
                'image_path'         => 'nullable|string|max:255',
                'macro_category'     => 'nullable|string|in:' . implode(',', array_column(MacroCategory::cases(), 'value')),
            ]);

            $validated['slug'] = Str::slug($validated['name']);

            $macroCategoryService = new MacroCategoryService();
            $validated['macro_category'] = $macroCategoryService->calculate(
                (float) ($validated['protein_g'] ?? 0),
                (float) ($validated['carbs_g'] ?? 0),
                (float) ($validated['fat_g'] ?? 0)
            )->value;

            $food = Food::create($validated);

            return $this->success($this->transformFood($food), 'Alimento creado exitosamente.', 201);

        } catch (ValidationException $e) {
            return $this->error('Error de validación.', $e->errors(), 422);
        }
    }

    /**
     * PUT /api/v1/foods/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $food = Food::find($id);

        if (!$food) {
            return $this->error('Alimento no registrado en el sistema.', null, 404);
        }

        try {
            $validated = $request->validate([
                'name'              => 'sometimes|string|max:255|unique:foods,name,' . $id,
                'calories_per_100g' => 'sometimes|numeric|min:0',
                'protein_g'         => 'nullable|numeric|min:0',
                'carbs_g'           => 'nullable|numeric|min:0',
                'fat_g'             => 'nullable|numeric|min:0',
                'fiber_g'           => 'nullable|numeric|min:0',
                'image_path'        => 'nullable|string|max:255',
                'macro_category'    => 'nullable|string|in:' . implode(',', array_column(MacroCategory::cases(), 'value')),
            ]);

            if (isset($validated['name'])) {
                $validated['slug'] = Str::slug($validated['name']);
            }

            $hasMacroChanges = isset($validated['protein_g']) || isset($validated['carbs_g']) || isset($validated['fat_g']);

            if ($hasMacroChanges && !isset($validated['macro_category'])) {
                $macroCategoryService = new MacroCategoryService();
                $validated['macro_category'] = $macroCategoryService->calculate(
                    (float) ($validated['protein_g'] ?? $food->protein_g ?? 0),
                    (float) ($validated['carbs_g'] ?? $food->carbs_g ?? 0),
                    (float) ($validated['fat_g'] ?? $food->fat_g ?? 0)
                )->value;
            }

            $food->update($validated);

            return $this->success($this->transformFood($food), 'Alimento actualizado exitosamente.');

        } catch (ValidationException $e) {
            return $this->error('Error de validación.', $e->errors(), 422);
        }
    }

    /**
     * DELETE /api/v1/foods/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $food = Food::find($id);

        if (!$food) {
            return $this->error('Alimento no registrado en el sistema.', null, 404);
        }

        $food->delete();

        return $this->success(null, 'Alimento eliminado exitosamente.');
    }

    /**
     * GET /api/v1/foods/{id}/equivalences
     * Retorna los alimentos del mismo grupo de intercambio.
     */
    public function equivalences(int $id): JsonResponse
    {
        $food = Food::find($id);

        if (!$food) {
            return $this->error('Alimento no registrado en el sistema.', null, 404);
        }

        $groups = $food->equivalents->pluck('group_name')->unique();

        $equivalences = [];
        foreach ($groups as $group) {
            $equivalences[$group] = Food::whereHas('equivalents', function ($q) use ($group) {
                $q->where('group_name', $group);
            })->get()->map(fn($f) => $this->transformFood($f));
        }

        return $this->success([
            'food'         => $this->transformFood($food),
            'equivalences' => $equivalences,
        ]);
    }

    /**
     * Transforma el alimento para la respuesta JSON.
     */
    private function transformFood(Food $food): array
    {
        return [
            'id'                => $food->id,
            'name'              => $food->name,
            'slug'              => $food->slug,
            'calories_per_100g' => (float) $food->calories_per_100g,
            'protein_g'         => (float) $food->protein_g,
            'carbs_g'           => (float) $food->carbs_g,
            'fat_g'             => (float) $food->fat_g,
            'fiber_g'           => (float) $food->fiber_g,
            'image_path'        => $food->image_path,
            'macro_category'    => $food->getMacroCategoryInfo(),
            'macro_percentages' => $food->getMacroPercentages(),
            'created_at'        => $food->created_at?->toIso8601String(),
            'updated_at'        => $food->updated_at?->toIso8601String(),
        ];
    }
}
