<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends BaseApiController
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        $token = $user->createApiToken();

        return $this->success([
            'user' => $user,
            'token' => $token,
        ], 'Login exitoso');
    }

    public function logout(Request $request)
    {
        $request->user()->deleteApiToken();

        return $this->success(null, 'Sesión cerrada correctamente');
    }

    public function me(Request $request)
    {
        return $this->success($request->user());
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => 'sometimes|string|min:8',
            'weight_kg' => 'sometimes|numeric|min:0',
            'height_cm' => 'sometimes|numeric|min:0',
            'age' => 'sometimes|integer|min:0',
            'sex' => 'sometimes|in:male,female',
            'activity_factor' => 'sometimes|in:sedentary,light,moderate,active,very_active',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return $this->success($user, 'Perfil actualizado correctamente');
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        
        $user = User::create($validated);
        $token = $user->createApiToken();

        return $this->success([
            'user' => $user,
            'token' => $token,
        ], 'Usuario registrado correctamente', 201);
    }
}
