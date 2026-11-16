<?php

namespace App\Http\Resources\Store;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Respuesta al cliente al registrar el pedido: solo lo necesario para abrir WhatsApp. */
class PlacedOrderResource extends JsonResource
{
    /** @param array{order: Order, whatsapp_url: string} $resource */
    public function toArray(Request $request): array
    {
        /** @var Order $order */
        $order = $this->resource['order'];

        return [
            'code' => $order->code,
            'total' => $order->total,
            'whatsapp_url' => $this->resource['whatsapp_url'],
        ];
    }
}
