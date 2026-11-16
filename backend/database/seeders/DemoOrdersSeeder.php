<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\User;
use App\Services\Orders\OrderService;
use App\Services\Orders\PlaceOrderData;
use Illuminate\Database\Seeder;

/** Algunos pedidos de ejemplo para que el panel no arranque vacío. */
class DemoOrdersSeeder extends Seeder
{
    public function run(OrderService $orders): void
    {
        if (Order::query()->exists()) {
            return;
        }

        $admin = User::query()->firstOrFail();
        $variantIds = ProductVariant::query()->where('stock', '>=', 3)->inRandomOrder()->limit(20)->pluck('id')->all();
        $customers = [
            ['María López', '51987654321'], ['Lucía Fernández', '51912345678'], ['Carlos Ruiz', '51923456789'],
            ['Ana Torres', '51934567890'], ['Sofía Ramírez', '51945678901'], ['Diego Castro', '51956789012'],
        ];

        foreach ($customers as $i => [$name, $phone]) {
            $items = collect($variantIds)->slice($i * 3, random_int(1, 3))
                ->map(fn (int $id) => ['variant_id' => $id, 'quantity' => random_int(1, 2)])
                ->values()
                ->all();
            if ($items === []) {
                continue;
            }

            $order = $orders->place(PlaceOrderData::fromArray([
                'customer_name' => $name,
                'customer_phone' => $phone,
                'items' => $items,
            ]))['order'];

            match ($i % 3) {
                0 => $orders->confirm($order, $admin, 'Pago recibido por transferencia'),
                1 => null, // queda pendiente
                2 => $i === 2 ? $orders->cancel($order, $admin, 'La clienta no respondió') : null,
            };
        }
    }
}
