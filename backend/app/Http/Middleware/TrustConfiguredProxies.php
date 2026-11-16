<?php

namespace App\Http\Middleware;

use Illuminate\Http\Middleware\TrustProxies;

/** Proxies de confianza desde config (TRUSTED_PROXIES): IPs separadas por coma o "*". Vacío = ninguno. */
class TrustConfiguredProxies extends TrustProxies
{
    protected function proxies()
    {
        $value = (string) config('app.trusted_proxies', '');

        if ($value === '') {
            return null;
        }

        return $value === '*' ? '*' : array_map('trim', explode(',', $value));
    }
}
