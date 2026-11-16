<?php

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;

function placeOrder($test, array $items): Order
{
    $test->postJson('/api/orders', orderPayload($items))->assertCreated();

    return Order::query()->latest('id')->firstOrFail();
}

it('protege las rutas del admin', function () {
    $this->getJson('/api/admin/orders')->assertUnauthorized();
    $this->getJson('/api/admin/dashboard')->assertUnauthorized();
});

it('descuenta el stock al confirmar la venta y registra el historial', function () {
    $admin = User::factory()->create();
    $variant = makeVariant(stock: 5);
    $order = placeOrder($this, [['variant_id' => $variant->id, 'quantity' => 2]]);

    $this->actingAs($admin)->patchJson("/api/admin/orders/{$order->id}/confirm", ['comment' => 'Pagó por Yape'])
        ->assertOk()
        ->assertJsonPath('status', 'confirmed')
        ->assertJsonCount(2, 'histories');

    expect($variant->fresh()->stock)->toBe(3)
        ->and($order->fresh()->handled_by)->toBe($admin->id);
});

it('no permite confirmar dos veces el mismo pedido', function () {
    $admin = User::factory()->create();
    $variant = makeVariant(stock: 5);
    $order = placeOrder($this, [['variant_id' => $variant->id, 'quantity' => 2]]);

    $this->actingAs($admin)->patchJson("/api/admin/orders/{$order->id}/confirm")->assertOk();
    $this->actingAs($admin)->patchJson("/api/admin/orders/{$order->id}/confirm")->assertUnprocessable();

    expect($variant->fresh()->stock)->toBe(3);
});

it('no descuenta nada si una de las variantes se quedó sin stock (rollback)', function () {
    $admin = User::factory()->create();
    $a = makeVariant(stock: 5);
    $b = makeVariant(stock: 2);
    $order = placeOrder($this, [
        ['variant_id' => $a->id, 'quantity' => 1],
        ['variant_id' => $b->id, 'quantity' => 2],
    ]);
    $b->update(['stock' => 1]); // otra venta se llevó una unidad mientras tanto

    $this->actingAs($admin)->patchJson("/api/admin/orders/{$order->id}/confirm")
        ->assertUnprocessable()
        ->assertJsonStructure(['errors' => ["variant_{$b->id}"]]);

    expect($a->fresh()->stock)->toBe(5)
        ->and($b->fresh()->stock)->toBe(1)
        ->and($order->fresh()->status)->toBe(OrderStatus::Pending);
});

it('repone el stock al cancelar una venta confirmada', function () {
    $admin = User::factory()->create();
    $variant = makeVariant(stock: 5);
    $order = placeOrder($this, [['variant_id' => $variant->id, 'quantity' => 2]]);

    $this->actingAs($admin)->patchJson("/api/admin/orders/{$order->id}/confirm")->assertOk();
    $this->actingAs($admin)->patchJson("/api/admin/orders/{$order->id}/cancel", ['comment' => 'Devolución'])
        ->assertOk()
        ->assertJsonPath('status', 'cancelled');

    expect($variant->fresh()->stock)->toBe(5);
});

it('cancelar un pedido pendiente no modifica el stock y es definitivo', function () {
    $admin = User::factory()->create();
    $variant = makeVariant(stock: 5);
    $order = placeOrder($this, [['variant_id' => $variant->id, 'quantity' => 2]]);

    $this->actingAs($admin)->patchJson("/api/admin/orders/{$order->id}/cancel")->assertOk();
    $this->actingAs($admin)->patchJson("/api/admin/orders/{$order->id}/confirm")->assertUnprocessable();

    expect($variant->fresh()->stock)->toBe(5);
});

it('lista pedidos con conteos por estado y filtra por teléfono', function () {
    $admin = User::factory()->create();
    $variant = makeVariant(stock: 50);
    placeOrder($this, [['variant_id' => $variant->id, 'quantity' => 1]]);
    $second = placeOrder($this, [['variant_id' => $variant->id, 'quantity' => 1]]);
    $this->actingAs($admin)->patchJson("/api/admin/orders/{$second->id}/confirm")->assertOk();

    $this->actingAs($admin)->getJson('/api/admin/orders?status=pending')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('counts.pending', 1)
        ->assertJsonPath('counts.confirmed', 1);

    // El teléfono está cifrado: se busca por número completo (con o sin +51).
    $this->actingAs($admin)->getJson('/api/admin/orders?q=987654321')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});
