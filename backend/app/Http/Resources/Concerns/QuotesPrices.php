<?php

namespace App\Http\Resources\Concerns;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Pricing\Contracts\PriceCalculator;

/** Los recursos dependen de la abstracción PriceCalculator (memoizada por petición: 0 consultas extra). */
trait QuotesPrices
{
    protected function quote(Product $product, ?ProductVariant $variant = null): array
    {
        return app(PriceCalculator::class)->quote($product, $variant)->toArray();
    }
}
