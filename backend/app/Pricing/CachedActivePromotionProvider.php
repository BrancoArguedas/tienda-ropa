<?php

namespace App\Pricing;

use App\Models\Promotion;
use App\Pricing\Contracts\ActivePromotionProvider;
use App\Services\Catalog\CategoryTree;
use App\Support\CacheKeys;
use Illuminate\Support\Facades\Cache;

/**
 * Carga TODAS las promociones vigentes en 3 consultas (promociones + 2 pivotes) y las memoriza.
 * Resolver el precio de N productos no genera consultas adicionales (sin N+1).
 */
class CachedActivePromotionProvider implements ActivePromotionProvider
{
    /** Las promociones dependen de la hora: TTL corto para respetar inicio/fin. */
    private const TTL_SECONDS = 60;

    /** @var list<ActivePromotion>|null */
    private ?array $promotions = null;

    public function __construct(private readonly CategoryTree $categories) {}

    public function all(): array
    {
        return $this->promotions ??= Cache::remember(CacheKeys::ACTIVE_PROMOTIONS, self::TTL_SECONDS, fn () => Promotion::query()
            ->current()
            ->with(['products:id', 'categories:id'])
            ->orderBy('id')
            ->get()
            ->map(fn (Promotion $p) => new ActivePromotion(
                id: $p->id,
                name: $p->name,
                type: $p->type,
                value: (string) $p->value,
                endsAt: $p->ends_at->toIso8601String(),
                productIds: $p->products->pluck('id')->all(),
                categoryIds: $p->categories->pluck('id')->all(),
            ))
            ->all());
    }

    public function flush(): void
    {
        $this->promotions = null;
        Cache::forget(CacheKeys::ACTIVE_PROMOTIONS);
    }

    public function forProduct(int $productId, int $categoryId): array
    {
        $categoryIds = $this->categories->ancestorIds($categoryId);

        return array_values(array_filter(
            $this->all(),
            fn (ActivePromotion $promo) => $promo->appliesTo($productId, $categoryIds),
        ));
    }
}
