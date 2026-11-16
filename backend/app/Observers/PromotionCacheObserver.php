<?php

namespace App\Observers;

use App\Pricing\Contracts\ActivePromotionProvider;

class PromotionCacheObserver
{
    public function __construct(private readonly ActivePromotionProvider $promotions) {}

    public function saved(): void
    {
        $this->promotions->flush();
    }

    public function deleted(): void
    {
        $this->promotions->flush();
    }
}
