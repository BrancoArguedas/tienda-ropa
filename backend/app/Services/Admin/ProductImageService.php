<?php

namespace App\Services\Admin;

use App\Models\Product;
use App\Models\ProductImage;
use App\Services\Media\Contracts\ImageStorage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ProductImageService
{
    public const WIDTHS = [ProductImage::THUMB_WIDTH, ProductImage::LARGE_WIDTH];

    public function __construct(private readonly ImageStorage $storage) {}

    /** @param list<UploadedFile> $files */
    public function upload(Product $product, array $files, ?int $colorId): Collection
    {
        $position = (int) $product->images()->max('position');
        $hasPrimary = $product->images()->where('is_primary', true)->exists();

        $stored = [];
        try {
            foreach ($files as $file) {
                $stored[] = $this->storage->store($file, "products/{$product->id}", self::WIDTHS);
            }
        } catch (\Throwable $e) {
            // Si falla una imagen no quedan archivos huérfanos de las anteriores.
            foreach ($stored as $path) {
                $this->storage->delete($path, self::WIDTHS);
            }
            throw $e;
        }

        return DB::transaction(fn () => collect($stored)->map(function (string $path, int $i) use ($product, $colorId, &$position, &$hasPrimary) {
            $image = $product->images()->create([
                'color_id' => $colorId,
                'path' => $path,
                'position' => ++$position,
                'is_primary' => ! $hasPrimary && $i === 0,
            ]);
            $hasPrimary = true;

            return $image;
        }));
    }

    public function update(ProductImage $image, array $data): ProductImage
    {
        return DB::transaction(function () use ($image, $data) {
            if (! empty($data['is_primary'])) {
                ProductImage::query()->where('product_id', $image->product_id)->whereKeyNot($image->id)->update(['is_primary' => false]);
            }
            $image->update(array_intersect_key($data, array_flip(['color_id', 'is_primary'])));

            return $image;
        });
    }

    /** Reordena con un único UPDATE ... CASE. @param list<int> $orderedIds */
    public function reorder(Product $product, array $orderedIds): void
    {
        $ids = $product->images()->whereIn('id', $orderedIds)->pluck('id')->all();
        if ($ids === []) {
            return;
        }

        $ordered = array_values(array_intersect(array_map('intval', $orderedIds), $ids));
        $cases = [];
        $bindings = [];
        foreach ($ordered as $position => $id) {
            $cases[] = 'WHEN ? THEN ?';
            array_push($bindings, $id, $position + 1);
        }

        $placeholders = implode(',', array_fill(0, count($ordered), '?'));
        DB::update(
            'UPDATE product_images SET position = CASE id '.implode(' ', $cases)." END, updated_at = ? WHERE product_id = ? AND id IN ({$placeholders})",
            [...$bindings, now(), $product->id, ...$ordered],
        );
    }

    public function delete(ProductImage $image): void
    {
        DB::transaction(function () use ($image) {
            $image->delete();
            if ($image->is_primary) {
                ProductImage::query()->where('product_id', $image->product_id)->orderBy('position')->limit(1)->update(['is_primary' => true]);
            }
        });
        $this->storage->delete($image->path, self::WIDTHS);
    }
}
