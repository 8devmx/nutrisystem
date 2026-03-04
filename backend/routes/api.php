<?php

use App\Http\Controllers\Api\FoodController;
use App\Http\Controllers\Api\PlanController;
use App\Http\Controllers\Api\UserController;
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

    // ── Rutas protegidas por JWT ────────────────────────────────────────
    Route::middleware('auth.jwt')->group(function () {

        // Usuarios — perfil nutricional
        Route::get('/users/{id}/requirements', [UserController::class, 'requirements']);
        Route::put('/users/{id}/profile', [UserController::class, 'updateProfile']);

        // Alimentos
        Route::get('/foods', [FoodController::class, 'index']);
        Route::post('/foods', [FoodController::class, 'store']);
        Route::get('/foods/{id}', [FoodController::class, 'show']);
        Route::put('/foods/{id}', [FoodController::class, 'update']);
        Route::delete('/foods/{id}', [FoodController::class, 'destroy']);
        Route::get('/foods/{id}/equivalences', [FoodController::class, 'equivalences']);

        // Planes nutricionales
        Route::post('/plans', [PlanController::class, 'store']);
        Route::get('/plans/{id}', [PlanController::class, 'show']);
        Route::delete('/plans/{id}', [PlanController::class, 'destroy']);
    });
});
