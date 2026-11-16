<?php

namespace App\Support;

/**
 * Los cálculos de dinero se hacen en céntimos (enteros) para evitar errores de coma flotante.
 * La BD guarda DECIMAL(10,2); aquí se hace la conversión en ambos sentidos.
 */
final class Money
{
    public static function toCents(string|int|float|null $amount): int
    {
        if ($amount === null || $amount === '') {
            return 0;
        }

        return (int) round(((float) $amount) * 100);
    }

    public static function fromCents(int $cents): string
    {
        return number_format($cents / 100, 2, '.', '');
    }
}
