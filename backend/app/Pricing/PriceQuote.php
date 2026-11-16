<?php

namespace App\Pricing;

use App\Support\Money;

final readonly class PriceQuote
{
    public function __construct(
        public int $originalCents,
        public int $discountCents,
        public ?ActivePromotion $promotion = null,
    ) {}

    public function finalCents(): int
    {
        return $this->originalCents - $this->discountCents;
    }

    public function hasDiscount(): bool
    {
        return $this->discountCents > 0;
    }

    public function toArray(): array
    {
        return [
            'original' => Money::fromCents($this->originalCents),
            'final' => Money::fromCents($this->finalCents()),
            'discount' => Money::fromCents($this->discountCents),
            'promotion' => $this->promotion ? [
                'id' => $this->promotion->id,
                'name' => $this->promotion->name,
                'badge' => $this->promotion->badge(),
                'ends_at' => $this->promotion->endsAt,
            ] : null,
        ];
    }
}
