<?php

namespace App\Http\Resources\Admin;

use App\Models\Promotion;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Promotion */
class PromotionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $now = now();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'type' => $this->type->value,
            'value' => $this->value,
            'starts_at' => $this->starts_at->toIso8601String(),
            'ends_at' => $this->ends_at->toIso8601String(),
            'is_active' => $this->is_active,
            'is_current' => $this->is_active && $this->starts_at->lte($now) && $this->ends_at->gte($now),
            'banner' => $this->bannerUrl(),
            'products_count' => $this->whenCounted('products'),
            'categories_count' => $this->whenCounted('categories'),
            'products' => $this->whenLoaded('products', fn () => $this->products->map(fn ($p) => ['id' => $p->id, 'name' => $p->name])),
            'category_ids' => $this->whenLoaded('categories', fn () => $this->categories->pluck('id')),
        ];
    }
}
