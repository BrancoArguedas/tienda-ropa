<?php

namespace App\Filters\Product;

use App\Filters\Contracts\QueryFilter;
use App\Services\Catalog\CategoryTree;
use Illuminate\Database\Eloquent\Builder;

/** Filtra por categoría incluyendo sus subcategorías (resuelto en memoria, sin consultas extra). */
class CategoryFilter implements QueryFilter
{
    public function __construct(private readonly CategoryTree $tree) {}

    public function apply(Builder $query, mixed $value): void
    {
        $category = $this->tree->findBySlug((string) $value);

        $category === null
            ? $query->whereRaw('1 = 0')
            : $query->whereIn('products.category_id', $this->tree->descendantIds($category['id']));
    }
}
