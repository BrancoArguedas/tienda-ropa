<?php

namespace App\Filters\Product;

use App\Filters\Contracts\QueryFilter;
use App\Pricing\Contracts\ActivePromotionProvider;
use App\Services\Catalog\CategoryTree;
use Illuminate\Database\Eloquent\Builder;

/** Solo productos alcanzados por una promoción vigente (directa o por categoría). */
class OnSaleFilter implements QueryFilter
{
    public function __construct(
        private readonly ActivePromotionProvider $promotions,
        private readonly CategoryTree $tree,
    ) {}

    public function apply(Builder $query, mixed $value): void
    {
        if (! filter_var($value, FILTER_VALIDATE_BOOLEAN)) {
            return;
        }

        $productIds = [];
        $categoryIds = [];
        foreach ($this->promotions->all() as $promotion) {
            array_push($productIds, ...$promotion->productIds);
            foreach ($promotion->categoryIds as $categoryId) {
                array_push($categoryIds, ...$this->tree->descendantIds($categoryId));
            }
        }

        if ($productIds === [] && $categoryIds === []) {
            $query->whereRaw('1 = 0');

            return;
        }

        $query->where(function (Builder $q) use ($productIds, $categoryIds) {
            $q->whereIn('products.id', array_unique($productIds) ?: [0])
                ->orWhereIn('products.category_id', array_unique($categoryIds) ?: [0]);
        });
    }
}
