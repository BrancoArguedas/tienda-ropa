<?php

namespace App\Services\Catalog;

use App\Models\Color;
use App\Models\Product;
use App\Models\Size;
use App\Support\CacheKeys;
use Illuminate\Support\Facades\Cache;

/** Datos para los filtros del catálogo en UNA respuesta cacheada. */
class CatalogFilterService
{
    public function __construct(private readonly CategoryTree $tree) {}

    public function get(): array
    {
        return Cache::rememberForever(CacheKeys::CATALOG_FILTERS, function () {
            $range = Product::query()->active()
                ->selectRaw('MIN(base_price) as min_price, MAX(base_price) as max_price')
                ->toBase()
                ->first();

            return [
                'categories' => $this->tree->activeTree(),
                'sizes' => Size::query()->orderBy('position')->get(['id', 'name'])->toArray(),
                'colors' => Color::query()->orderBy('name')->get(['id', 'name', 'hex'])->toArray(),
                'price_range' => [
                    'min' => (float) ($range->min_price ?? 0),
                    'max' => (float) ($range->max_price ?? 0),
                ],
            ];
        });
    }

    public function flush(): void
    {
        Cache::forget(CacheKeys::CATALOG_FILTERS);
    }
}
