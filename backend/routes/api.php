<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FoodController;
use App\Http\Controllers\Api\PlanController;
use App\Http\Controllers\Api\PlanMealController;
use App\Http\Controllers\Api\RecipeController;
use App\Http\Controllers\Api\UnitController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Nutrisystem v1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // ── Rutas públicas ──────────────────────────────────────────────────
    Route::get('/health', fn () => response()->json([
        'success' => true,
        'message' => 'Nutrisystem API funcionando.',
        'version' => '1.0.0',
    ]));

    // ── Autenticación ─────────────────────────────────────────────────
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/register', [AuthController::class, 'register']);

    // ── Rutas protegidas ──────────────────────────────────────────────
    Route::middleware('auth.api')->group(function () {
        
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::put('/auth/profile', [AuthController::class, 'updateProfile']);

        // Usuarios — perfil nutricional
        Route::get('/users/{id}/requirements', [UserController::class, 'requirements']);
        Route::put('/users/{id}/profile', [UserController::class, 'updateProfile']);

        // Unidades
        Route::get('/units', [UnitController::class, 'index']);

        // Alimentos
        Route::get('/foods', [FoodController::class, 'index']);
        Route::post('/foods', [FoodController::class, 'store']);
        Route::get('/foods/{id}', [FoodController::class, 'show']);
        Route::put('/foods/{id}', [FoodController::class, 'update']);
        Route::delete('/foods/{id}', [FoodController::class, 'destroy']);
        Route::get('/foods/{id}/equivalences', [FoodController::class, 'equivalences']);

        // Recetas
        Route::get('/recipes', [RecipeController::class, 'index']);
        Route::post('/recipes', [RecipeController::class, 'store']);
        Route::get('/recipes/search', [RecipeController::class, 'search']);
        Route::get('/recipes/{id}', [RecipeController::class, 'show']);
        Route::put('/recipes/{id}', [RecipeController::class, 'update']);
        Route::delete('/recipes/{id}', [RecipeController::class, 'destroy']);

        // Planes nutricionales
        Route::post('/plans', [PlanController::class, 'store']);
        Route::get('/plans/{id}', [PlanController::class, 'show']);
        Route::delete('/plans/{id}', [PlanController::class, 'destroy']);

        // Comidas de un plan
        Route::post('/plans/{planId}/meals', [PlanMealController::class, 'store']);
        Route::put('/plans/{planId}/meals/{mealId}', [PlanMealController::class, 'update']);
        Route::delete('/plans/{planId}/meals/{mealId}', [PlanMealController::class, 'destroy']);

        // ── Admin ───────────────────────────────────────────────────────
        Route::prefix('admin')->group(function () {
            // Usuarios
            Route::get('/users', [AdminUserController::class, 'index']);
            Route::post('/users', [AdminUserController::class, 'store']);
            Route::get('/users/{id}', [AdminUserController::class, 'show']);
            Route::put('/users/{id}', [AdminUserController::class, 'update']);
            Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);

            // Planes
            Route::get('/plans', [AdminUserController::class, 'plans']);
        });
    });
});
