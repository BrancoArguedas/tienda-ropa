<?php

namespace App\Http\Resources\Store;

use App\Http\Resources\Concerns\QuotesPrices;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Product */
class ProductSuggestionResource extends JsonResource
{
    use QuotesPrices;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'thumb' => $this->primaryImage?->urlFor(ProductImage::THUMB_WIDTH),
            'price' => $this->quote($this->resource)['final'],
        ];
    }
}
