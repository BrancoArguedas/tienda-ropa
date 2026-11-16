<?php

namespace App\Http\Resources\Admin;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Product */
class ProductListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'base_price' => $this->base_price,
            'is_active' => $this->is_active,
            'is_featured' => $this->is_featured,
            'category' => $this->whenLoaded('category', fn () => ['id' => $this->category->id, 'name' => $this->category->name]),
            'thumb' => $this->whenLoaded('primaryImage', fn () => $this->primaryImage?->urlFor(ProductImage::THUMB_WIDTH)),
            'stock_total' => (int) ($this->stock_total ?? 0),
            'variants_count' => (int) ($this->variants_count ?? 0),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
