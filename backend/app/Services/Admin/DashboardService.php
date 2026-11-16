<?php

namespace App\Services\Admin;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;

/** Indicadores del panel calculados con agregaciones SQL (sin cargar modelos en memoria). */
class DashboardService
{
    public const LOW_STOCK_THRESHOLD = 3;

    public function summary(): array
    {
        $monthStart = now()->startOfMonth();

        $byStatus = Order::query()
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $month = Order::query()
            ->status(OrderStatus::Confirmed)
            ->where('confirmed_at', '>=', $monthStart)
            ->selectRaw('COUNT(*) as orders, COALESCE(SUM(total), 0) as revenue')
            ->toBase()
            ->first();

        $last30 = Order::query()
            ->status(OrderStatus::Confirmed)
            ->where('confirmed_at', '>=', now()->subDays(29)->startOfDay())
            ->selectRaw('DATE(confirmed_at) as day, COUNT(*) as orders, SUM(total) as revenue')
            ->groupBy('day')
            ->orderBy('day')
            ->toBase()
            ->get();

        $topProducts = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.status', OrderStatus::Confirmed->value)
            ->where('orders.confirmed_at', '>=', $monthStart)
            ->selectRaw('order_items.product_name, SUM(order_items.quantity) as units, SUM(order_items.line_total) as revenue')
            ->groupBy('order_items.product_name')
            ->orderByDesc('units')
            ->limit(5)
            ->get();

        $lowStock = ProductVariant::query()
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->join('sizes', 'sizes.id', '=', 'product_variants.size_id')
            ->join('colors', 'colors.id', '=', 'product_variants.color_id')
            ->whereNull('products.deleted_at')
            ->where('products.is_active', true)
            ->where('product_variants.stock', '<=', self::LOW_STOCK_THRESHOLD)
            ->orderBy('product_variants.stock')
            ->limit(8)
            ->get([
                'product_variants.id', 'product_variants.stock', 'product_variants.sku',
                'products.id as product_id', 'products.name as product_name',
                'sizes.name as size_name', 'colors.name as color_name',
            ]);

        $recent = Order::query()
            ->latest()
            ->limit(6)
            ->get(['id', 'code', 'customer_name', 'status', 'total', 'created_at']);

        return [
            'orders_by_status' => [
                'pending' => (int) ($byStatus[OrderStatus::Pending->value] ?? 0),
                'confirmed' => (int) ($byStatus[OrderStatus::Confirmed->value] ?? 0),
                'cancelled' => (int) ($byStatus[OrderStatus::Cancelled->value] ?? 0),
            ],
            'month' => [
                'orders' => (int) $month->orders,
                'revenue' => number_format((float) $month->revenue, 2, '.', ''),
            ],
            'sales_last_30_days' => $last30->map(fn ($row) => [
                'day' => $row->day,
                'orders' => (int) $row->orders,
                'revenue' => number_format((float) $row->revenue, 2, '.', ''),
            ]),
            'top_products' => $topProducts->map(fn ($row) => [
                'product_name' => $row->product_name,
                'units' => (int) $row->units,
                'revenue' => number_format((float) $row->revenue, 2, '.', ''),
            ]),
            'low_stock' => $lowStock,
            'recent_orders' => $recent->map(fn (Order $o) => [
                'id' => $o->id,
                'code' => $o->code,
                'customer_name' => $o->customer_name,
                'status' => $o->status->value,
                'total' => $o->total,
                'created_at' => $o->created_at->toIso8601String(),
            ]),
        ];
    }
}
