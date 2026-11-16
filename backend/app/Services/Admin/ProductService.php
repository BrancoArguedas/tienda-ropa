<?php

namespace App\Services\Admin;

use App\Exceptions\DomainRuleException;
use App\Models\Color;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Size;
use App\Services\Support\SlugGenerator;
use App\Support\Money;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/** Alta/edición de productos con su matriz de variantes (talla × color) en una transacción. */
class ProductService
{
    public function __construct(private readonly SlugGenerator $slugs) {}

    public function create(array $data): Product
    {
        return DB::transaction(function () use ($data) {
            $product = Product::query()->create([
                ...$this->productAttributes($data),
                'slug' => $this->slugs->unique(Product::class, $data['slug'] ?? $data['name']),
            ]);

            $this->syncVariants($product, $data['variants'] ?? []);

            return $product;
        });
    }

    public function update(Product $product, array $data): Product
    {
        return DB::transaction(function () use ($product, $data) {
            $attributes = $this->productAttributes($data);
            if (! empty($data['slug']) && $data['slug'] !== $product->slug) {
                $attributes['slug'] = $this->slugs->unique(Product::class, $data['slug'], $product->id);
            }
            $product->update($attributes);

            if (array_key_exists('variants', $data)) {
                $this->syncVariants($product, $data['variants']);
            }

            return $product;
        });
    }

    /** Borrado lógico: los pedidos históricos siguen apuntando a sus variantes. */
    public function delete(Product $product): void
    {
        $product->delete();
    }

    private function productAttributes(array $data): array
    {
        return [
            'category_id' => $data['category_id'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'base_price' => Money::fromCents(Money::toCents($data['base_price'])),
            'is_active' => (bool) ($data['is_active'] ?? true),
            'is_featured' => (bool) ($data['is_featured'] ?? false),
        ];
    }

    /**
     * Sincroniza la matriz completa con un UPSERT masivo y un DELETE.
     * Las variantes que ya figuran en pedidos no se pueden eliminar (integridad del historial).
     *
     * @param list<array{size_id:int,color_id:int,stock:int,price_override?:?string,sku?:?string}> $rows
     */
    private function syncVariants(Product $product, array $rows): void
    {
        $existing = $product->variants()->get(['id', 'size_id', 'color_id', 'sku'])
            ->keyBy(fn (ProductVariant $v) => "{$v->size_id}-{$v->color_id}");

        $incomingKeys = collect($rows)->map(fn (array $r) => "{$r['size_id']}-{$r['color_id']}");
        $toDelete = $existing->except($incomingKeys->all())->pluck('id');

        if ($toDelete->isNotEmpty()) {
            $inOrders = OrderItem::query()->whereIn('product_variant_id', $toDelete)->exists();
            if ($inOrders) {
                throw new DomainRuleException(
                    'No se pueden quitar combinaciones de talla/color que ya tienen pedidos. Deja su stock en 0.',
                    ['variants' => ['Hay variantes con pedidos asociados.']],
                );
            }
            ProductVariant::query()->whereIn('id', $toDelete)->delete();
        }

        if ($rows === []) {
            return;
        }

        $sizes = Size::query()->whereIn('id', collect($rows)->pluck('size_id'))->pluck('name', 'id');
        $colors = Color::query()->whereIn('id', collect($rows)->pluck('color_id'))->pluck('name', 'id');
        $now = now();

        $payload = collect($rows)->map(function (array $row) use ($product, $existing, $sizes, $colors, $now) {
            $key = "{$row['size_id']}-{$row['color_id']}";
            $sku = trim((string) ($row['sku'] ?? '')) ?: ($existing[$key]->sku ?? null)
                ?: Str::upper(Str::slug("P{$product->id}-{$sizes[$row['size_id']]}-".Str::limit($colors[$row['color_id']], 10, '')));

            return [
                'product_id' => $product->id,
                'size_id' => (int) $row['size_id'],
                'color_id' => (int) $row['color_id'],
                'sku' => $sku,
                'stock' => (int) $row['stock'],
                'price_override' => isset($row['price_override']) && $row['price_override'] !== ''
                    ? Money::fromCents(Money::toCents($row['price_override']))
                    : null,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        })->all();

        ProductVariant::query()->upsert(
            $payload,
            ['product_id', 'size_id', 'color_id'],
            ['sku', 'stock', 'price_override', 'updated_at'],
        );
    }
}
