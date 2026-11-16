<?php

namespace App\Http\Resources\Store;

use App\Http\Resources\Concerns\QuotesPrices;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Product */
class ProductCardResource extends JsonResource
{
    use QuotesPrices;

    public function toArray(Request $request): array
    {
        $variants = $this->whenLoaded('variants', fn () => $this->variants, collect());

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'price' => $this->quote($this->resource),
            'image' => $this->whenLoaded('primaryImage', fn () => $this->primaryImage ? [
                'thumb' => $this->primaryImage->urlFor(ProductImage::THUMB_WIDTH),
                'large' => $this->primaryImage->urlFor(ProductImage::LARGE_WIDTH),
            ] : null),
            'colors' => $variants
                ->filter(fn (ProductVariant $v) => $v->stock > 0 && $v->relationLoaded('color'))
                ->map(fn (ProductVariant $v) => ['id' => $v->color->id, 'name' => $v->color->name, 'hex' => $v->color->hex])
                ->unique('id')
                ->values(),
            'in_stock' => $variants->sum('stock') > 0,
            'is_new' => $this->isNew(),
        ];
    }
}
