<?php

namespace App\Pricing;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Pricing\Contracts\ActivePromotionProvider;
use App\Pricing\Contracts\PriceCalculator;
use App\Support\Money;

/** Calcula el precio final aplicando la promoción vigente que más descuento otorga. */
class PromotionPriceCalculator implements PriceCalculator
{
    public function __construct(
        private readonly ActivePromotionProvider $promotions,
        private readonly DiscountStrategyResolver $strategies,
    ) {}

    public function quote(Product $product, ?ProductVariant $variant = null): PriceQuote
    {
        $price = $variant?->basePriceCents($product) ?? Money::toCents($product->base_price);

        $best = new PriceQuote($price, 0);
        foreach ($this->promotions->forProduct($product->id, $product->category_id) as $promotion) {
            $discount = $this->strategies->for($promotion->type)->discountCents($price, $promotion->value);
            if ($discount > $best->discountCents) {
                $best = new PriceQuote($price, $discount, $promotion);
            }
        }

        return $best;
    }
}
