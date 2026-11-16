<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\LoginRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->only('email', 'password');

        // Solo administradores: un usuario sin rol recibe el mismo error genérico (no revela qué cuentas existen).
        // Sin "recordarme": la sesión del panel caduca por inactividad (SESSION_LIFETIME).
        if (! Auth::guard('web')->attempt([...$credentials, 'is_admin' => true])) {
            Log::warning('Login de admin fallido', [
                'email' => $this->maskEmail((string) $request->input('email')),
                'ip' => $request->ip(),
            ]);

            throw ValidationException::withMessages(['email' => 'Correo o contraseña incorrectos.']);
        }

        $request->session()->regenerate();

        return response()->json($this->userPayload($request));
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($this->userPayload($request));
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(null, 204);
    }

    private function userPayload(Request $request): array
    {
        $user = $request->user();

        return ['id' => $user->id, 'name' => $user->name, 'email' => $user->email];
    }

    /** "ana.perez@mail.com" → "an***@mail.com": el log no guarda datos personales completos. */
    private function maskEmail(string $email): string
    {
        [$local, $domain] = array_pad(explode('@', $email, 2), 2, '');

        return mb_substr($local, 0, 2).'***'.($domain !== '' ? '@'.$domain : '');
    }
}
