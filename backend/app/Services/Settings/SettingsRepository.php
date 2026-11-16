<?php

namespace App\Services\Settings;

use App\Models\Setting;
use App\Support\CacheKeys;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/** Ajustes de la tienda (clave/valor) cacheados: una sola consulta mientras no cambien. */
class SettingsRepository
{
    /** Claves permitidas y sus valores por defecto. */
    public const DEFAULTS = [
        'store_name' => 'Diana Store',
        'store_tagline' => 'Moda que te acompaña',
        'whatsapp_number' => '51999999999',
        'currency_code' => 'PEN',
        'locale' => 'es-PE',
        'instagram_url' => '',
        'facebook_url' => '',
        'tiktok_url' => '',
        'address' => '',
        // Titular del banco de datos y proveedor (Ley 29733 / Código del Consumidor).
        'legal_name' => '',
        'ruc' => '',
        'legal_address' => '',
        'privacy_email' => '',
        'claims_email' => '',
        'data_retention_months' => '24',
        'size_guide' => "XS: busto 80-84 cm · cintura 60-64 cm\nS: busto 84-88 cm · cintura 64-68 cm\nM: busto 88-94 cm · cintura 68-74 cm\nL: busto 94-100 cm · cintura 74-80 cm\nXL: busto 100-106 cm · cintura 80-86 cm",
    ];

    private ?array $memo = null;

    /** @return array<string, string> */
    public function all(): array
    {
        return $this->memo ??= array_merge(
            self::DEFAULTS,
            Cache::rememberForever(CacheKeys::SETTINGS, fn () => Setting::query()->pluck('value', 'key')->map(fn ($v) => (string) $v)->all()),
        );
    }

    public function get(string $key): string
    {
        return $this->all()[$key] ?? '';
    }

    /** @param array<string, string|null> $values */
    public function update(array $values): void
    {
        $rows = collect($values)
            ->only(array_keys(self::DEFAULTS))
            ->map(fn ($value, $key) => ['key' => $key, 'value' => (string) $value, 'created_at' => now(), 'updated_at' => now()])
            ->values()
            ->all();

        DB::transaction(fn () => Setting::query()->upsert($rows, ['key'], ['value', 'updated_at']));

        Cache::forget(CacheKeys::SETTINGS);
        $this->memo = null;
    }
}
