<?php

namespace App\Http\Resources\Store;

use App\Models\Promotion;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Promotion */
class PromotionBannerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'banner' => $this->bannerUrl(),
            'ends_at' => $this->ends_at->toIso8601String(),
        ];
    }
}
