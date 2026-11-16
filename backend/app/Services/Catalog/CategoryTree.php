<?php

namespace App\Services\Catalog;

use App\Models\Category;
use App\Support\CacheKeys;
use Illuminate\Support\Facades\Cache;

/**
 * Árbol de categorías en memoria (cacheado). Evita consultas recursivas
 * para resolver descendientes (filtros) y ancestros (promociones por categoría).
 */
class CategoryTree
{
    /** @var array<int, array{id:int,parent_id:?int,name:string,slug:string,position:int,is_active:bool}>|null */
    private ?array $nodes = null;

    /** @return array<int, array{id:int,parent_id:?int,name:string,slug:string,position:int,is_active:bool}> */
    public function nodes(): array
    {
        return $this->nodes ??= Cache::rememberForever(CacheKeys::CATEGORY_TREE, fn () => Category::query()
            ->orderBy('position')
            ->orderBy('name')
            ->get(['id', 'parent_id', 'name', 'slug', 'position', 'is_active'])
            ->mapWithKeys(fn (Category $c) => [$c->id => [
                'id' => $c->id,
                'parent_id' => $c->parent_id,
                'name' => $c->name,
                'slug' => $c->slug,
                'position' => $c->position,
                'is_active' => $c->is_active,
            ]])
            ->all());
    }

    public function flush(): void
    {
        $this->nodes = null;
        Cache::forget(CacheKeys::CATEGORY_TREE);
    }

    public function findBySlug(string $slug): ?array
    {
        foreach ($this->nodes() as $node) {
            if ($node['slug'] === $slug) {
                return $node;
            }
        }

        return null;
    }

    /** IDs de la categoría y todos sus descendientes. @return list<int> */
    public function descendantIds(int $id): array
    {
        $ids = [$id];
        foreach ($this->nodes() as $node) {
            if ($node['parent_id'] === $id) {
                array_push($ids, ...$this->descendantIds($node['id']));
            }
        }

        return $ids;
    }

    /** IDs de la categoría y todos sus ancestros. @return list<int> */
    public function ancestorIds(int $id): array
    {
        $ids = [];
        $nodes = $this->nodes();
        $current = $nodes[$id] ?? null;
        while ($current !== null && ! in_array($current['id'], $ids, true)) {
            $ids[] = $current['id'];
            $current = $current['parent_id'] !== null ? ($nodes[$current['parent_id']] ?? null) : null;
        }

        return $ids;
    }

    /** IDs de categorías visibles: activas y con todos sus ancestros activos. @return list<int> */
    public function visibleIds(): array
    {
        $nodes = $this->nodes();
        $visible = [];
        foreach ($nodes as $node) {
            $isVisible = true;
            foreach ($this->ancestorIds($node['id']) as $ancestorId) {
                $isVisible = $isVisible && ($nodes[$ancestorId]['is_active'] ?? false);
            }
            if ($isVisible) {
                $visible[] = $node['id'];
            }
        }

        return $visible;
    }

    /** Árbol anidado (solo categorías activas). */
    public function activeTree(?int $parentId = null): array
    {
        $branch = [];
        foreach ($this->nodes() as $node) {
            if ($node['parent_id'] === $parentId && $node['is_active']) {
                $branch[] = [
                    'id' => $node['id'],
                    'name' => $node['name'],
                    'slug' => $node['slug'],
                    'children' => $this->activeTree($node['id']),
                ];
            }
        }

        return $branch;
    }
}
