<?php

namespace App\Pricing\Contracts;

use App\Pricing\ActivePromotion;

interface ActivePromotionProvider
{
    /** @return list<ActivePromotion> */
    public function all(): array;

    /** @return list<ActivePromotion> */
    public function forProduct(int $productId, int $categoryId): array;

    /** Descarta la caché (llamado al crear/editar/eliminar promociones). */
    public function flush(): void;
}
