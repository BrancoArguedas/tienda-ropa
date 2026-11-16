<?php

namespace App\Pricing\Strategies;

use App\Pricing\Contracts\DiscountStrategy;

class PercentageDiscount implements DiscountStrategy
{
    public function discountCents(int $priceCents, string $value): int
    {
        $percent = max(0.0, min(100.0, (float) $value));

        return (int) min($priceCents, round($priceCents * $percent / 100));
    }
}
