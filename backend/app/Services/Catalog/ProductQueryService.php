<?php

namespace App\Services\Catalog;

use App\Filters\Product\SearchFilter;
use App\Filters\ProductFilter;
use App\Models\Product;
use App\Models\Promotion;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Lecturas del catálogo público. Cada método trae lo necesario con eager loading,
 * así el número de consultas es constante sin importar cuántos productos haya.
 */
class ProductQueryService
{
    private const CARD_COLUMNS = [
        'products.id', 'products.category_id', 'products.name', 'products.slug',
        'products.base_price', 'products.created_at',
    ];

    public function __construct(
        private readonly ProductFilter $filter,
        private readonly CategoryTree $tree,
    ) {}

    public function paginate(array $params, int $perPage = 24): LengthAwarePaginator
    {
        $query = $this->filter->apply($this->cardQuery(), $params);

        return $query->paginate($perPage)->withQueryString();
    }

    /** Autocompletado: pocas columnas, límite bajo, índice FULLTEXT. */
    public function suggest(string $term, int $limit = 6): array
    {
        $booleanQuery = SearchFilter::toBooleanQuery($term);
        if ($booleanQuery === '') {
            return ['products' => [], 'categories' => []];
        }

        $products = Product::query()->active()
            ->whereIn('products.category_id', $this->activeCategoryIds())
            ->whereFullText(['products.name', 'products.description'], $booleanQuery, ['mode' => 'boolean'])
            ->select(['products.id', 'products.category_id', 'products.name', 'products.slug', 'products.base_price'])
            ->with('primaryImage')
            ->limit($limit)
            ->get();

        $needle = mb_strtolower(trim($term));
        $categories = collect($this->tree->nodes())
            ->filter(fn (array $c) => $c['is_active'] && str_contains(mb_strtolower($c['name']), $needle))
            ->take(3)
            ->map(fn (array $c) => ['name' => $c['name'], 'slug' => $c['slug']])
            ->values()
            ->all();

        return ['products' => $products, 'categories' => $categories];
    }

    /** Ficha completa en una sola respuesta: variantes, imágenes, promoción y relacionados. */
    public function findBySlug(string $slug): Product
    {
        $product = Product::query()->active()
            ->where('slug', $slug)
            ->whereIn('category_id', $this->activeCategoryIds())
            ->with([
                'category:id,name,slug',
                'images',
                'variants' => fn (HasMany $q) => $q
                    ->join('sizes', 'sizes.id', '=', 'product_variants.size_id')
                    ->orderBy('sizes.position')
                    ->select('product_variants.*')
                    ->with(['size:id,name,position', 'color:id,name,hex']),
            ])
            ->first() ?? throw (new ModelNotFoundException)->setModel(Product::class, [$slug]);

        $related = $this->cardQuery()
            ->where('products.category_id', $product->category_id)
            ->whereKeyNot($product->id)
            ->inRandomOrder()
            ->limit(8)
            ->get();

        return $product->setRelation('related', $related);
    }

    /** Portada: destacados, novedades y banners en una sola llamada. */
    public function home(): array
    {
        return [
            'featured' => $this->cardQuery()->where('products.is_featured', true)->latest('products.id')->limit(8)->get(),
            'newest' => $this->cardQuery()->latest('products.created_at')->latest('products.id')->limit(8)->get(),
            'promotions' => Promotion::query()->current()->whereNotNull('banner_path')->orderBy('ends_at')->limit(5)->get(),
        ];
    }

    /** Consulta base de las tarjetas del catálogo con todo lo que necesita la tarjeta. */
    private function cardQuery(): Builder
    {
        return Product::query()->active()
            ->whereIn('products.category_id', $this->activeCategoryIds())
            ->select(self::CARD_COLUMNS)
            ->with([
                'primaryImage',
                'variants' => fn (HasMany $q) => $q
                    ->select(['id', 'product_id', 'color_id', 'stock'])
                    ->with('color:id,name,hex'),
            ]);
    }

    /** @return list<int> */
    private function activeCategoryIds(): array
    {
        return $this->tree->visibleIds() ?: [0];
    }
}
