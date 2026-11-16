<?php

namespace App\Messaging;

use App\Messaging\Contracts\OrderMessageFormatter;
use App\Models\Order;
use App\Models\OrderItem;
use App\Services\Settings\SettingsRepository;

/** Arma el mensaje con formato de WhatsApp (*negrita*, saltos de línea). */
class WhatsAppMessageFormatter implements OrderMessageFormatter
{
    public function __construct(
        private readonly SettingsRepository $settings,
        private readonly MoneyFormatter $money,
    ) {}

    public function format(Order $order): string
    {
        $lines = [
            "¡Hola {$this->settings->get('store_name')}! 👋 Quiero hacer este pedido:",
            '',
            "*Pedido:* {$order->code}",
            "*Nombre:* {$order->customer_name}",
            "*Teléfono:* {$order->customer_phone}",
            '',
        ];

        foreach ($order->items as $item) {
            /** @var OrderItem $item */
            $lines[] = "• {$item->quantity} x {$item->product_name} ({$item->color_name} / Talla {$item->size_name})";
            $unitFinal = (float) $item->unit_price - (float) $item->unit_discount;
            $price = $this->money->format($unitFinal);
            if ((float) $item->unit_discount > 0) {
                $price .= ' (antes '.$this->money->format($item->unit_price).')';
            }
            $lines[] = "   {$price} c/u → {$this->money->format($item->line_total)}";
        }

        $lines[] = '';
        $lines[] = "Subtotal: {$this->money->format($order->subtotal)}";
        if ((float) $order->discount_total > 0) {
            $lines[] = "Descuentos: -{$this->money->format($order->discount_total)}";
        }
        $lines[] = "*Total: {$this->money->format($order->total)}*";

        if ($order->notes) {
            $lines[] = '';
            $lines[] = "*Nota:* {$order->notes}";
        }

        return implode("\n", $lines);
    }
}
