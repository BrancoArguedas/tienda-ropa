<?php

namespace App\Http\Resources\Store;

use App\Http\Resources\Concerns\QuotesPrices;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Product */
class ProductDetailResource extends JsonResource
{
    use QuotesPrices;

    public function toArray(Request $request): array
    {
        $variants = $this->variants;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'category' => $this->whenLoaded('category', fn () => [
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ]),
            'price' => $this->quote($this->resource),
            'is_new' => $this->isNew(),
            'images' => $this->images->map(fn (ProductImage $img) => [
                'id' => $img->id,
                'color_id' => $img->color_id,
                'thumb' => $img->urlFor(ProductImage::THUMB_WIDTH),
                'large' => $img->urlFor(ProductImage::LARGE_WIDTH),
            ]),
            'colors' => $variants->map(fn (ProductVariant $v) => [
                'id' => $v->color->id, 'name' => $v->color->name, 'hex' => $v->color->hex,
            ])->unique('id')->values(),
            'sizes' => $variants->map(fn (ProductVariant $v) => [
                'id' => $v->size->id, 'name' => $v->size->name,
            ])->unique('id')->values(),
            'variants' => $variants->map(fn (ProductVariant $v) => [
                'id' => $v->id,
                'size_id' => $v->size_id,
                'color_id' => $v->color_id,
                'stock' => $v->stock,
                'price' => $v->price_override !== null ? $this->quote($this->resource, $v) : null,
            ]),
            'related' => ProductCardResource::collection($this->whenLoaded('related')),
        ];
    }
}
