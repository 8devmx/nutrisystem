<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class ValidateExternalJwt
{
    /**
     * Valida el JWT proveniente del Hub externo.
     * El sistema es stateless — no crea sesiones ni usuarios locales.
     */
    public function handle(Request $request, Closure $next): Response
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

            // Inyecta el payload en el request para uso en controllers
            $request->merge(['jwt_payload' => $payload]);
            $request->attributes->set('auth_user_id', $payload['user_id']);
            $request->attributes->set('auth_email', $payload['email']);
            $request->attributes->set('auth_roles', $payload['roles'] ?? []);

        } catch (\Exception $e) {
            return $this->unauthorized('Token malformado: ' . $e->getMessage());
        }

        return $next($request);
    }

    /**
     * Decodifica el JWT sin verificar firma (la verificación la hace el Hub).
     * En producción: instalar firebase/php-jwt y verificar con la clave pública del Hub.
     */
    private function decodeJwt(string $token): array
    {
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            throw new \InvalidArgumentException('Estructura JWT inválida.');
        }

        $payload = base64_decode(strtr($parts[1], '-_', '+/'));
        $decoded  = json_decode($payload, true);

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
