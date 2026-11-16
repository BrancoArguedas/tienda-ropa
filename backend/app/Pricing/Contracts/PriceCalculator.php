<?php

namespace App\Pricing\Contracts;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Pricing\PriceQuote;

interface PriceCalculator
{
    public function quote(Product $product, ?ProductVariant $variant = null): PriceQuote;
}
