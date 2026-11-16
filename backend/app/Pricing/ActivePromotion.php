<?php

namespace App\Pricing;

use App\Enums\PromotionType;

/** Representación inmutable y serializable (cacheable) de una promoción vigente. */
final readonly class ActivePromotion
{
    /**
     * @param list<int> $productIds
     * @param list<int> $categoryIds
     */
    public function __construct(
        public int $id,
        public string $name,
        public PromotionType $type,
        public string $value,
        public string $endsAt,
        public array $productIds,
        public array $categoryIds,
    ) {}

    /** @param list<int> $categoryIds categoría del producto + ancestros */
    public function appliesTo(int $productId, array $categoryIds): bool
    {
        return in_array($productId, $this->productIds, true)
            || array_intersect($categoryIds, $this->categoryIds) !== [];
    }

    public function badge(): string
    {
        return $this->type === PromotionType::Percentage
            ? '-'.rtrim(rtrim($this->value, '0'), '.').'%'
            : 'Oferta';
    }
}
