<?php

namespace App\Pricing;

use App\Enums\PromotionType;
use App\Pricing\Contracts\DiscountStrategy;
use InvalidArgumentException;

class DiscountStrategyResolver
{
    /** @param array<string, DiscountStrategy> $strategies indexado por PromotionType::value */
    public function __construct(private readonly array $strategies) {}

    public function for(PromotionType $type): DiscountStrategy
    {
        return $this->strategies[$type->value]
            ?? throw new InvalidArgumentException("No hay estrategia de descuento para [{$type->value}].");
    }
}
