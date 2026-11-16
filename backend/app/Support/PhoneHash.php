<?php

namespace App\Support;

/**
 * Hash determinista (HMAC con APP_KEY) del teléfono normalizado.
 * Permite buscar pedidos por teléfono sin guardar el número en claro.
 */
final class PhoneHash
{
    public static function normalize(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        // Celular peruano sin código de país (9 dígitos que empiezan en 9) → +51.
        return strlen($digits) === 9 && $digits[0] === '9' ? '51'.$digits : $digits;
    }

    public static function make(string $phone): string
    {
        return hash_hmac('sha256', self::normalize($phone), (string) config('app.key'));
    }
}
