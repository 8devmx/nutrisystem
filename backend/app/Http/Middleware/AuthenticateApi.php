<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApi
{
    /**
     * Maneja la autenticación para el API.
     * Soporta dos modos:
     * - 'local': Usa tokens de API propios (base de datos)
     * - 'hub': Usa JWT del Hub externo
     * 
     * Configuración: AUTH_MODE=local|hub en .env
     */
    public function handle(Request $request, Closure $next): Response
    {
        $authMode = config('app.auth_mode', 'local');

        if ($authMode === 'hub') {
            return $this->handleHubAuth($request, $next);
        }

        return $this->handleLocalAuth($request, $next);
    }

    private function handleLocalAuth(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (!$token) {
            return $this->unauthorized('Token no proporcionado.');
        }

        $user = \App\Models\User::where('api_token', $token)->first();

        if (!$user) {
            return $this->unauthorized('Token inválido.');
        }

        // Usa el guard de API para establecer el usuario
        auth('api')->setUser($user);

        return $next($request);
    }

    private function handleHubAuth(Request $request, Closure $next): Response
    {
        $authHeader = $request->header('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return $this->unauthorized('Token no proporcionado.');
        }

        $token = substr($authHeader, 7);

        try {
            $payload = $this->decodeJwt($token);

            if (!isset($payload['user_id'], $payload['email'])) {
                return $this->unauthorized('Token inválido: faltan campos requeridos.');
            }

            if (isset($payload['exp']) && $payload['exp'] < time()) {
                return $this->unauthorized('Token expirado.');
            }

            $request->merge(['jwt_payload' => $payload]);
            $request->attributes->set('auth_user_id', $payload['user_id']);
            $request->attributes->set('auth_email', $payload['email']);
            $request->attributes->set('auth_roles', $payload['roles'] ?? []);
            $request->attributes->set('is_hub_auth', true);

        } catch (\Exception $e) {
            return $this->unauthorized('Token malformado: ' . $e->getMessage());
        }

        return $next($request);
    }

    private function decodeJwt(string $token): array
    {
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            throw new \InvalidArgumentException('Estructura JWT inválida.');
        }

        $payload = base64_decode(strtr($parts[1], '-_', '+/'));
        $decoded = json_decode($payload, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \InvalidArgumentException('Payload JWT no es JSON válido.');
        }

        return $decoded;
    }

    private function unauthorized(string $message): JsonResponse
    {
        return response()->json([
            'success' => false,
            'data'    => null,
            'message' => $message,
            'errors'  => ['auth' => $message],
        ], 401);
    }
}
