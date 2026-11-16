<?php

namespace App\Services\Orders;

class OrderCodeGenerator
{
    /** Sin caracteres ambiguos (0/O, 1/I/L) para dictarlo fácil por teléfono. */
    private const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

    public function generate(): string
    {
        $code = '';
        for ($i = 0; $i < 6; $i++) {
            $code .= self::ALPHABET[random_int(0, strlen(self::ALPHABET) - 1)];
        }

        return 'PD-'.$code;
    }
}
