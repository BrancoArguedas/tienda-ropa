<?php

namespace App\Http\Resources\Admin;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Order */
class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'customer_name' => $this->customer_name,
            'customer_phone' => $this->customer_phone,
            'notes' => $this->notes,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'subtotal' => $this->subtotal,
            'discount_total' => $this->discount_total,
            'total' => $this->total,
            'items_count' => $this->whenCounted('items'),
            'whatsapp_message' => $this->when($this->relationLoaded('items'), $this->whatsapp_message),
            'confirmed_at' => $this->confirmed_at?->toIso8601String(),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'anonymized_at' => $this->anonymized_at?->toIso8601String(),
            'privacy_accepted_at' => $this->privacy_accepted_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
            'handler' => $this->whenLoaded('handler', fn () => $this->handler ? ['id' => $this->handler->id, 'name' => $this->handler->name] : null),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn (OrderItem $item) => [
                'id' => $item->id,
                'product_variant_id' => $item->product_variant_id,
                'product_name' => $item->product_name,
                'sku' => $item->sku,
                'size_name' => $item->size_name,
                'color_name' => $item->color_name,
                'unit_price' => $item->unit_price,
                'unit_discount' => $item->unit_discount,
                'quantity' => $item->quantity,
                'line_total' => $item->line_total,
            ])),
            'histories' => $this->whenLoaded('histories', fn () => $this->histories->map(fn (OrderStatusHistory $h) => [
                'id' => $h->id,
                'from_status' => $h->from_status?->value,
                'to_status' => $h->to_status->value,
                'to_label' => $h->to_status->label(),
                'comment' => $h->comment,
                'user' => $h->relationLoaded('user') && $h->user ? $h->user->name : null,
                'created_at' => $h->created_at?->toIso8601String(),
            ])),
        ];
    }
}
