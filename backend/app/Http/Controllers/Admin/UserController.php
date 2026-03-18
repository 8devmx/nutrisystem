<?php

namespace App\Http\Controllers\Admin;

use App\Models\User;
use App\Models\Plan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class UserController extends \App\Http\Controllers\Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
        }

        $users = $query->withCount('plans')->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:8',
                'weight_kg' => 'nullable|numeric|min:0',
                'height_cm' => 'nullable|numeric|min:0',
                'age' => 'nullable|integer|min:0|max:150',
                'sex' => 'nullable|in:male,female',
                'activity_factor' => 'nullable|in:sedentary,light,moderate,active,very_active',
            ]);

            $validated['password'] = bcrypt($validated['password']);

            $user = User::create($validated);

            return response()->json([
                'success' => true,
                'data' => $user,
                'message' => 'Usuario creado exitosamente.',
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación.',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    public function show(int $id): JsonResponse
    {
        $user = User::with('plans')->find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado.',
            ], 404);
        }

        try {
            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|unique:users,email,' . $id,
                'password' => 'sometimes|string|min:8',
                'weight_kg' => 'nullable|numeric|min:0',
                'height_cm' => 'nullable|numeric|min:0',
                'age' => 'nullable|integer|min:0|max:150',
                'sex' => 'nullable|in:male,female',
                'activity_factor' => 'nullable|in:sedentary,light,moderate,active,very_active',
            ]);

            if (isset($validated['password'])) {
                $validated['password'] = bcrypt($validated['password']);
            }

            $user->update($validated);

            return response()->json([
                'success' => true,
                'data' => $user,
                'message' => 'Usuario actualizado exitosamente.',
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación.',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado.',
            ], 404);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Usuario eliminado exitosamente.',
        ]);
    }

    public function plans(Request $request): JsonResponse
    {
        $query = Plan::with('user');

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $plans = $query->withCount('meals')->latest()->paginate(15);

        // Calcular is_complete: un plan está completo si cada día tiene
        // al menos los 3 momentos obligatorios (breakfast, lunch, dinner)
        // con al menos 1 alimento. Las colaciones son opcionales.
        $requiredMoments = ['breakfast', 'lunch', 'dinner'];

        $plans->getCollection()->transform(function ($plan) use ($requiredMoments) {
            $totalDays = match ($plan->duration) {
                'weekly'   => 7,
                'biweekly' => 14,
                'monthly'  => 30,
                default    => 7,
            };

            // Obtener combinaciones día-momento que tienen al menos 1 comida
            $covered = $plan->meals()
                ->selectRaw('day_number, meal_moment')
                ->groupBy('day_number', 'meal_moment')
                ->get()
                ->map(fn($m) => "{$m->day_number}-{$m->meal_moment}")
                ->toArray();

            $isComplete = true;
            for ($day = 1; $day <= $totalDays; $day++) {
                foreach ($requiredMoments as $moment) {
                    if (!in_array("{$day}-{$moment}", $covered)) {
                        $isComplete = false;
                        break 2;
                    }
                }
            }

            $plan->is_complete = $isComplete;
            return $plan;
        });

        return response()->json([
            'success' => true,
            'data' => $plans,
        ]);
    }
}
