<?php

namespace App\Pricing\Strategies;

use App\Pricing\Contracts\DiscountStrategy;
use App\Support\Money;

class FixedAmountDiscount implements DiscountStrategy
{
    public function discountCents(int $priceCents, string $value): int
    {
        return max(0, min($priceCents, Money::toCents($value)));
    }
}
