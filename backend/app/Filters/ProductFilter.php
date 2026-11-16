<?php

namespace App\Filters;

use App\Filters\Contracts\QueryFilter;
use App\Filters\Product\CategoryFilter;
use App\Filters\Product\ColorsFilter;
use App\Filters\Product\MaxPriceFilter;
use App\Filters\Product\MinPriceFilter;
use App\Filters\Product\OnSaleFilter;
use App\Filters\Product\SearchFilter;
use App\Filters\Product\SizesFilter;
use Illuminate\Contracts\Container\Container;
use Illuminate\Database\Eloquent\Builder;

/**
 * Aplica los filtros del catálogo. Para agregar un filtro nuevo basta con crear una clase
 * QueryFilter y registrarla en el mapa (OCP), sin tocar el servicio ni el controlador.
 */
class ProductFilter
{
    /** @var array<string, class-string<QueryFilter>> */
    private const FILTERS = [
        'category' => CategoryFilter::class,
        'sizes' => SizesFilter::class,
        'colors' => ColorsFilter::class,
        'min_price' => MinPriceFilter::class,
        'max_price' => MaxPriceFilter::class,
        'q' => SearchFilter::class,
        'on_sale' => OnSaleFilter::class,
    ];

    private const SORTS = ['newest', 'price_asc', 'price_desc', 'name'];

    public function __construct(private readonly Container $container) {}

    public function apply(Builder $query, array $params): Builder
    {
        foreach (self::FILTERS as $key => $filterClass) {
            $value = $params[$key] ?? null;
            if ($value === null || $value === '' || $value === []) {
                continue;
            }
            $this->container->make($filterClass)->apply($query, $value);
        }

        return $this->sort($query, $params['sort'] ?? 'newest');
    }

    public static function sorts(): array
    {
        return self::SORTS;
    }

    private function sort(Builder $query, string $sort): Builder
    {
        return match ($sort) {
            'price_asc' => $query->orderBy('products.base_price')->orderBy('products.id'),
            'price_desc' => $query->orderByDesc('products.base_price')->orderByDesc('products.id'),
            'name' => $query->orderBy('products.name')->orderBy('products.id'),
            default => $query->orderByDesc('products.created_at')->orderByDesc('products.id'),
        };
    }
}
