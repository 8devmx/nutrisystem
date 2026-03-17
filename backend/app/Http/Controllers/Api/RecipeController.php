<?php

namespace App\Http\Controllers\Api;

use App\Models\Recipe;
use App\Models\RecipeIngredient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class RecipeController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Recipe::with('ingredientsWithFood');

        if ($request->has('search') && $request->search) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        $perPage = min((int) $request->get('per_page', 15), 500);
        $sortBy  = in_array($request->get('sort_by'), ['title', 'calories']) ? $request->get('sort_by') : 'title';
        $sortDir = $request->get('sort_dir', 'asc') === 'desc' ? 'desc' : 'asc';

        // Ordenamiento por título directo en SQL
        if ($sortBy === 'title') {
            $query->orderBy('title', $sortDir);
        } else {
            $query->orderBy('title', 'asc'); // orden base; se reordena en memoria por calorías
        }

        $recipes = $query->paginate($perPage);

        $enriched = $recipes->map(function ($recipe) {
            $macros = $recipe->calculateMacros();
            return [
                'id'               => $recipe->id,
                'title'            => $recipe->title,
                'description'      => $recipe->description,
                'servings'         => $recipe->servings,
                'prep_time_minutes'=> $recipe->prep_time_minutes,
                'ingredients_count'=> $recipe->ingredients->count(),
                'macros'           => $macros,
                'created_at'       => $recipe->created_at,
                'updated_at'       => $recipe->updated_at,
            ];
        });

        // Reordenar por calorías en memoria cuando aplica
        if ($sortBy === 'calories') {
            $sorted = $sortDir === 'asc'
                ? $enriched->sortBy(fn($r) => $r['macros']['calories'])
                : $enriched->sortByDesc(fn($r) => $r['macros']['calories']);
            $enriched = $sorted->values();
        }

        return $this->success([
            'data' => $enriched,
            'meta' => [
                'current_page' => $recipes->currentPage(),
                'last_page'    => $recipes->lastPage(),
                'per_page'     => $recipes->perPage(),
                'total'        => $recipes->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'servings' => 'nullable|integer|min:1',
                'prep_time_minutes' => 'nullable|integer|min:1',
                'ingredients' => 'required|array|min:1',
                'ingredients.*.food_id' => 'required|exists:foods,id',
                'ingredients.*.unit_id' => 'required|exists:units,id',
                'ingredients.*.quantity' => 'required|numeric|min:0',
            ]);

            $recipe = Recipe::create([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'servings' => $validated['servings'] ?? 1,
                'prep_time_minutes' => $validated['prep_time_minutes'] ?? null,
            ]);

            foreach ($validated['ingredients'] as $ingredient) {
                RecipeIngredient::create([
                    'recipe_id' => $recipe->id,
                    'food_id' => $ingredient['food_id'],
                    'unit_id' => $ingredient['unit_id'],
                    'quantity' => $ingredient['quantity'],
                ]);
            }

            $recipe->load('ingredientsWithFood');
            $macros = $recipe->calculateMacros();

            return $this->success([
                'recipe' => $recipe,
                'macros' => $macros,
            ], 'Receta creada exitosamente.', 201);

        } catch (ValidationException $e) {
            return $this->error('Error de validación.', $e->errors(), 422);
        }
    }

    public function show(int $id): JsonResponse
    {
        $recipe = Recipe::with('ingredientsWithFood')->find($id);

        if (!$recipe) {
            return $this->error('Receta no encontrada.', null, 404);
        }

        $macros = $recipe->calculateMacros();
        $macrosPerServing = $recipe->calculateMacrosPerServing();

        $ingredients = $recipe->ingredients->map(function ($ingredient) {
            return [
                'id' => $ingredient->id,
                'food_id' => $ingredient->food_id,
                'food' => [
                    'id' => $ingredient->food->id,
                    'name' => $ingredient->food->name,
                    'calories_per_100g' => $ingredient->food->calories_per_100g,
                    'protein_g' => $ingredient->food->protein_g,
                    'carbs_g' => $ingredient->food->carbs_g,
                    'fat_g' => $ingredient->food->fat_g,
                ],
                'unit_id' => $ingredient->unit_id,
                'unit' => [
                    'id'                  => $ingredient->unit->id,
                    'name'                => $ingredient->unit->name,
                    'abbreviation'        => $ingredient->unit->abbreviation,
                    'conversion_to_grams' => $ingredient->unit->conversion_to_grams,
                ],
                'quantity' => $ingredient->quantity,
                'grams' => $ingredient->grams,
                'macros' => $ingredient->calculateMacros(),
            ];
        });

        return $this->success([
            'id' => $recipe->id,
            'title' => $recipe->title,
            'description' => $recipe->description,
            'servings' => $recipe->servings,
            'prep_time_minutes' => $recipe->prep_time_minutes,
            'ingredients' => $ingredients,
            'macros' => $macros,
            'macros_per_serving' => $macrosPerServing,
            'created_at' => $recipe->created_at,
            'updated_at' => $recipe->updated_at,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $recipe = Recipe::find($id);

        if (!$recipe) {
            return $this->error('Receta no encontrada.', null, 404);
        }

        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'servings' => 'nullable|integer|min:1',
                'prep_time_minutes' => 'nullable|integer|min:1',
                'ingredients' => 'required|array|min:1',
                'ingredients.*.food_id' => 'required|exists:foods,id',
                'ingredients.*.unit_id' => 'required|exists:units,id',
                'ingredients.*.quantity' => 'required|numeric|min:0',
            ]);

            $recipe->update([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'servings' => $validated['servings'] ?? 1,
                'prep_time_minutes' => $validated['prep_time_minutes'] ?? null,
            ]);

            $recipe->ingredients()->delete();

            foreach ($validated['ingredients'] as $ingredient) {
                RecipeIngredient::create([
                    'recipe_id' => $recipe->id,
                    'food_id' => $ingredient['food_id'],
                    'unit_id' => $ingredient['unit_id'],
                    'quantity' => $ingredient['quantity'],
                ]);
            }

            $recipe->load('ingredientsWithFood');
            $macros = $recipe->calculateMacros();

            return $this->success([
                'recipe' => $recipe,
                'macros' => $macros,
            ], 'Receta actualizada exitosamente.');

        } catch (ValidationException $e) {
            return $this->error('Error de validación.', $e->errors(), 422);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        $recipe = Recipe::find($id);

        if (!$recipe) {
            return $this->error('Receta no encontrada.', null, 404);
        }

        $recipe->delete();

        return $this->success(null, 'Receta eliminada exitosamente.');
    }

    public function search(Request $request): JsonResponse
    {
        $query = $request->get('q', '');

        if (strlen($query) < 2) {
            return $this->success(['data' => []]);
        }

        $recipes = Recipe::where('title', 'like', '%' . $query . '%')
            ->with('ingredientsWithFood')
            ->limit(10)
            ->get()
            ->map(function ($recipe) {
                $macros = $recipe->calculateMacrosPerServing();
                return [
                    'id' => $recipe->id,
                    'type' => 'recipe',
                    'title' => $recipe->title,
                    'macros' => $macros,
                    'servings' => $recipe->servings,
                    'ingredients_count' => $recipe->ingredients->count(),
                ];
            });

        return $this->success(['data' => $recipes]);
    }
}
