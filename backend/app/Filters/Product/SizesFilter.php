<?php

namespace App\Filters\Product;

use App\Filters\Contracts\QueryFilter;
use Illuminate\Database\Eloquent\Builder;

/** Productos con stock en alguna de las tallas pedidas (subconsulta EXISTS indexada). */
class SizesFilter implements QueryFilter
{
    public function apply(Builder $query, mixed $value): void
    {
        $ids = array_map('intval', (array) $value);

        $query->whereHas('variants', fn (Builder $q) => $q->whereIn('size_id', $ids)->where('stock', '>', 0));
    }
}
