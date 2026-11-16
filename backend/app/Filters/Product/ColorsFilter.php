<?php

namespace App\Filters\Product;

use App\Filters\Contracts\QueryFilter;
use Illuminate\Database\Eloquent\Builder;

class ColorsFilter implements QueryFilter
{
    public function apply(Builder $query, mixed $value): void
    {
        $ids = array_map('intval', (array) $value);

        $query->whereHas('variants', fn (Builder $q) => $q->whereIn('color_id', $ids)->where('stock', '>', 0));
    }
}
