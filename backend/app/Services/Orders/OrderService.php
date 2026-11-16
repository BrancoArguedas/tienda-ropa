<?php

namespace App\Services\Orders;

use App\Enums\OrderStatus;
use App\Exceptions\DomainRuleException;
use App\Messaging\Contracts\OrderChannelLinkBuilder;
use App\Messaging\Contracts\OrderMessageFormatter;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Models\ProductVariant;
use App\Models\User;
use App\Pricing\Contracts\PriceCalculator;
use App\Services\Catalog\CategoryTree;
use App\Support\Money;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Ciclo de vida del pedido: crear (pendiente) → confirmar (descuenta stock) / cancelar (repone si estaba confirmado).
 */
class OrderService
{
    private const MAX_CODE_ATTEMPTS = 5;

    public function __construct(
        private readonly PriceCalculator $prices,
        private readonly OrderMessageFormatter $formatter,
        private readonly OrderChannelLinkBuilder $links,
        private readonly OrderCodeGenerator $codes,
        private readonly CategoryTree $categories,
    ) {}

    /**
     * Crea el pedido "pendiente". No toca stock: solo verifica disponibilidad.
     * Los precios SIEMPRE se recalculan aquí; nunca se confía en los del cliente.
     *
     * @return array{order: Order, whatsapp_url: string}
     */
    public function place(PlaceOrderData $data): array
    {
        $variants = ProductVariant::query()
            ->whereIn('id', array_keys($data->quantities))
            ->with(['product:id,category_id,name,base_price,is_active,deleted_at', 'size:id,name', 'color:id,name'])
            ->get()
            ->keyBy('id');

        $this->assertAvailable($data->quantities, $variants);

        $items = [];
        $subtotal = 0;
        $discountTotal = 0;
        foreach ($data->quantities as $variantId => $quantity) {
            /** @var ProductVariant $variant */
            $variant = $variants[$variantId];
            $quote = $this->prices->quote($variant->product, $variant);

            $subtotal += $quote->originalCents * $quantity;
            $discountTotal += $quote->discountCents * $quantity;

            $items[] = new OrderItem([
                'product_variant_id' => $variant->id,
                'product_name' => $variant->product->name,
                'sku' => $variant->sku,
                'size_name' => $variant->size->name,
                'color_name' => $variant->color->name,
                'unit_price' => Money::fromCents($quote->originalCents),
                'unit_discount' => Money::fromCents($quote->discountCents),
                'quantity' => $quantity,
                'line_total' => Money::fromCents($quote->finalCents() * $quantity),
            ]);
        }

        $order = new Order([
            'customer_name' => $data->customerName,
            'customer_phone' => $data->customerPhone,
            'notes' => $data->notes,
            'status' => OrderStatus::Pending,
            'subtotal' => Money::fromCents($subtotal),
            'discount_total' => Money::fromCents($discountTotal),
            'total' => Money::fromCents($subtotal - $discountTotal),
            // Evidencia del consentimiento (el FormRequest exige privacy_accepted).
            'privacy_accepted_at' => now(),
            'privacy_policy_version' => config('app.privacy_policy_version'),
        ]);
        $order->setRelation('items', new Collection($items));

        $this->persistNewOrder($order);

        return [
            'order' => $order,
            'whatsapp_url' => $this->links->build($order->whatsapp_message),
        ];
    }

    public function confirm(Order $order, User $user, ?string $comment = null): Order
    {
        return DB::transaction(function () use ($order, $user, $comment) {
            $locked = $this->lockOrder($order);
            $this->assertTransition($locked, OrderStatus::Confirmed);

            $quantities = $this->quantitiesByVariant($locked);
            $variants = $this->lockVariants(array_keys($quantities));

            $errors = [];
            foreach ($quantities as $variantId => $quantity) {
                $stock = $variants[$variantId]->stock ?? 0;
                if ($stock < $quantity) {
                    $item = $locked->items->firstWhere('product_variant_id', $variantId);
                    $errors["variant_{$variantId}"] = ["Stock insuficiente para {$item->product_name} ({$item->color_name} / {$item->size_name}): disponible {$stock}, pedido {$quantity}."];
                }
            }
            if ($errors !== []) {
                throw new DomainRuleException('No hay stock suficiente para confirmar la venta.', $errors);
            }

            foreach ($quantities as $variantId => $quantity) {
                ProductVariant::query()->whereKey($variantId)->decrement('stock', $quantity);
            }

            return $this->transition($locked, OrderStatus::Confirmed, $user, $comment, ['confirmed_at' => now()]);
        });
    }

    public function cancel(Order $order, User $user, ?string $comment = null): Order
    {
        return DB::transaction(function () use ($order, $user, $comment) {
            $locked = $this->lockOrder($order);
            $this->assertTransition($locked, OrderStatus::Cancelled);

            // Si la venta ya había descontado stock, se repone.
            if ($locked->status === OrderStatus::Confirmed) {
                $quantities = $this->quantitiesByVariant($locked);
                $this->lockVariants(array_keys($quantities));
                foreach ($quantities as $variantId => $quantity) {
                    ProductVariant::query()->whereKey($variantId)->increment('stock', $quantity);
                }
            }

            return $this->transition($locked, OrderStatus::Cancelled, $user, $comment, ['cancelled_at' => now()]);
        });
    }

    /** @param array<int,int> $quantities */
    private function assertAvailable(array $quantities, Collection $variants): void
    {
        $visibleCategories = $this->categories->visibleIds();
        $errors = [];

        foreach ($quantities as $variantId => $quantity) {
            /** @var ProductVariant|null $variant */
            $variant = $variants[$variantId] ?? null;
            $product = $variant?->product;

            if ($variant === null || $product === null || $product->trashed() || ! $product->is_active
                || ! in_array($product->category_id, $visibleCategories, true)) {
                $errors["items.{$variantId}"] = ['Uno de los productos ya no está disponible.'];

                continue;
            }

            if ($variant->stock < $quantity) {
                $errors["items.{$variantId}"] = [$variant->stock === 0
                    ? "{$product->name} ({$variant->color->name} / {$variant->size->name}) está agotado."
                    : "Solo quedan {$variant->stock} unidades de {$product->name} ({$variant->color->name} / {$variant->size->name})."];
            }
        }

        if ($errors !== []) {
            throw new DomainRuleException('Algunos productos de tu carrito no están disponibles.', $errors);
        }
    }

    /** Guarda pedido + ítems (un solo INSERT masivo) + historial en una transacción. */
    private function persistNewOrder(Order $order): void
    {
        for ($attempt = 1; ; $attempt++) {
            $order->code = $this->codes->generate();
            $order->whatsapp_message = $this->formatter->format($order);

            try {
                DB::transaction(function () use ($order) {
                    $order->save();

                    $now = now();
                    OrderItem::query()->insert($order->items->map(fn (OrderItem $item) => [
                        ...$item->getAttributes(),
                        'order_id' => $order->id,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ])->all());

                    OrderStatusHistory::query()->create([
                        'order_id' => $order->id,
                        'from_status' => null,
                        'to_status' => OrderStatus::Pending,
                    ]);
                });

                return;
            } catch (UniqueConstraintViolationException $e) {
                // Colisión improbable del código aleatorio: se reintenta con otro.
                $order->exists = false;
                $order->id = null;
                if ($attempt >= self::MAX_CODE_ATTEMPTS) {
                    throw $e;
                }
            }
        }
    }

    private function lockOrder(Order $order): Order
    {
        return Order::query()->whereKey($order->id)->lockForUpdate()->with('items')->firstOrFail();
    }

    /** Bloquea filas en orden de id para evitar interbloqueos entre confirmaciones concurrentes. */
    private function lockVariants(array $ids): Collection
    {
        return ProductVariant::query()->whereIn('id', $ids)->orderBy('id')->lockForUpdate()->get(['id', 'stock'])->keyBy('id');
    }

    /** @return array<int,int> */
    private function quantitiesByVariant(Order $order): array
    {
        return $order->items
            ->groupBy('product_variant_id')
            ->map(fn (Collection $items) => (int) $items->sum('quantity'))
            ->all();
    }

    private function assertTransition(Order $order, OrderStatus $next): void
    {
        if (! $order->status->canTransitionTo($next)) {
            throw new DomainRuleException(
                "El pedido {$order->code} está en estado \"{$order->status->label()}\" y no puede pasar a \"{$next->label()}\".",
                ['status' => ['Transición de estado no permitida.']],
            );
        }
    }

    private function transition(Order $order, OrderStatus $next, User $user, ?string $comment, array $extra): Order
    {
        $previous = $order->status;
        $order->fill([...$extra, 'status' => $next, 'handled_by' => $user->id])->save();

        OrderStatusHistory::query()->create([
            'order_id' => $order->id,
            'from_status' => $previous,
            'to_status' => $next,
            'user_id' => $user->id,
            'comment' => $comment,
        ]);

        return $order;
    }
}
