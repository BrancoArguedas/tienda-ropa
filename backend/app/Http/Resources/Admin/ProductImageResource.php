<?php

namespace App\Http\Resources\Admin;

use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ProductImage */
class ProductImageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'color_id' => $this->color_id,
            'position' => $this->position,
            'is_primary' => $this->is_primary,
            'thumb' => $this->urlFor(ProductImage::THUMB_WIDTH),
            'large' => $this->urlFor(ProductImage::LARGE_WIDTH),
        ];
    }
}
