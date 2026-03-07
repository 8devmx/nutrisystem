<?php

namespace App\Http\Controllers\Api;

use App\Models\Food;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class FoodController extends BaseApiController
{
    /**
     * GET /api/v1/foods
     * Lista alimentos con paginación y búsqueda opcional.
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

        $perPage = min((int) $request->get('per_page', 15), 500);
        $foods = $query->with('equivalents.unit')->paginate($perPage);

        return $this->success($foods);
    }

    /**
     * GET /api/v1/foods/{id}
     */
    public function show(int $id): JsonResponse
    {
        $food = Food::with('equivalents.unit')->find($id);

        if (!$food) {
            return $this->error('Alimento no registrado en el sistema.', null, 404);
        }

        return $this->success($food);
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
            ]);

            $validated['slug'] = Str::slug($validated['name']);

            $food = Food::create($validated);

            return $this->success($food, 'Alimento creado exitosamente.', 201);

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
            ]);

            if (isset($validated['name'])) {
                $validated['slug'] = Str::slug($validated['name']);
            }

            $food->update($validated);

            return $this->success($food, 'Alimento actualizado exitosamente.');

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
        $food = Food::with('equivalents.unit')->find($id);

        if (!$food) {
            return $this->error('Alimento no registrado en el sistema.', null, 404);
        }

        $groups = $food->equivalents->pluck('group_name')->unique();

        $equivalences = [];
        foreach ($groups as $group) {
            $equivalences[$group] = Food::whereHas('equivalents', function ($q) use ($group) {
                $q->where('group_name', $group);
            })->with(['equivalents' => function ($q) use ($group) {
                $q->where('group_name', $group)->with('unit');
            }])->get();
        }

        return $this->success([
            'food'         => $food,
            'equivalences' => $equivalences,
        ]);
    }
}
