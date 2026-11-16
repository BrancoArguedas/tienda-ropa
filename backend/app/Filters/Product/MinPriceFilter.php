<?php

namespace App\Filters\Product;

use App\Filters\Contracts\QueryFilter;
use Illuminate\Database\Eloquent\Builder;

class MinPriceFilter implements QueryFilter
{
    public function apply(Builder $query, mixed $value): void
    {
        $query->where('products.base_price', '>=', (float) $value);
    }
}
