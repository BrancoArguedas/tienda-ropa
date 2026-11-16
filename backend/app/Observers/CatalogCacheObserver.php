<?php

namespace App\Observers;

use App\Services\Catalog\CatalogFilterService;
use App\Services\Catalog\CategoryTree;

/** Invalida las cachés del catálogo cuando cambian categorías, tallas, colores o productos. */
class CatalogCacheObserver
{
    public function __construct(
        private readonly CategoryTree $tree,
        private readonly CatalogFilterService $filters,
    ) {}

    public function saved(): void
    {
        $this->flush();
    }

    public function deleted(): void
    {
        $this->flush();
    }

    public function restored(): void
    {
        $this->flush();
    }

    private function flush(): void
    {
        $this->tree->flush();
        $this->filters->flush();
    }
}
